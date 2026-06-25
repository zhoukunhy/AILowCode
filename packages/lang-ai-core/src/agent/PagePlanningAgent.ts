/**
 * 页面规划 Agent
 * 基于 LangGraph 的多节点规划 Agent，实现智能页面结构生成
 * 通过需求分析、知识检索、Schema 生成和验证四个阶段完成页面规划
 */
import { AgentState, PageSchema } from './types'
import { LangGraphExecutor } from './LangGraphExecutor'
import { createRequirementAnalysisNode } from './nodes/RequirementAnalysisNode'
import { createRAGRetrievalNode } from './nodes/RAGRetrievalNode'
import { createSchemaGenerationNode } from './nodes/SchemaGenerationNode'
import { createValidationNode } from './nodes/ValidationNode'
import type { ChromaConfig, RAGConfig, LLMConfig } from '@ai-lowcode/shared-types'

/**
 * 页面规划配置接口
 * 定义页面规划 Agent 的初始化配置
 */
export interface PagePlanningConfig {
  llmConfig: LLMConfig                          // LLM 配置（用于文本理解和生成）
  chromaConfig: ChromaConfig                   // 向量数据库配置（用于知识检索）
  ragConfig: RAGConfig                         // RAG 配置（检索增强生成）
  knowledgeBaseIds: number[]                   // 知识库 ID 列表
  defaultPageSize?: { width: number; height: number } // 默认页面尺寸
  componentLibrary?: string[]                  // 可用组件库
  strictValidation?: boolean                   // 是否启用严格验证模式
}

/**
 * 页面规划 Agent 类
 * 实现基于 LangGraph 的智能页面规划流程
 * 通过多节点协作完成从用户需求到页面 Schema 的转换
 */
export class PagePlanningAgent {
  private executor: LangGraphExecutor  // LangGraph 执行器
  private config: PagePlanningConfig   // Agent 配置

  /**
   * 构造函数
   * @param config - 页面规划配置
   */
  constructor(config: PagePlanningConfig) {
    this.config = config
    this.executor = this.buildGraph()
  }

  /**
   * 构建 LangGraph 执行图
   * 创建四个核心节点并建立执行流程
   * @returns 配置好的 LangGraph 执行器
   */
  private buildGraph(): LangGraphExecutor {
    // 创建四个核心节点
    const nodes = [
      // 1. 需求分析节点：解析用户需求，提取关键信息
      createRequirementAnalysisNode({
        llmConfig: this.config.llmConfig,
      }),
      // 2. RAG 检索节点：从知识库检索相关组件和最佳实践
      createRAGRetrievalNode({
        chromaConfig: this.config.chromaConfig,
        ragConfig: this.config.ragConfig,
        knowledgeBaseIds: this.config.knowledgeBaseIds,
        topK: 5,
        threshold: 0.6,
      }),
      // 3. Schema 生成节点：基于需求分析和检索结果生成页面 Schema
      createSchemaGenerationNode({
        llmConfig: this.config.llmConfig,
        defaultPageSize: this.config.defaultPageSize || { width: 1920, height: 1080 },
        componentLibrary: this.config.componentLibrary,
      }),
      // 4. 验证节点：验证生成的 Schema 是否符合规范
      createValidationNode({
        strictMode: this.config.strictValidation !== false,
        allowedComponents: this.config.componentLibrary,
      }),
    ]

    // 创建节点间的执行边，定义执行流程
    const edges = [
      { source: 'requirement_analysis' as const, target: 'rag_retrieval' as const },
      { source: 'rag_retrieval' as const, target: 'schema_generation' as const },
      { source: 'schema_generation' as const, target: 'validation' as const },
      { source: 'validation' as const, target: 'end' as const },
    ]

    return new LangGraphExecutor(nodes, edges, 'requirement_analysis')
  }

  /**
   * 执行页面规划
   * 从用户需求出发，执行完整的规划流程
   * @param userInput - 用户的自然语言需求描述
   * @param sessionId - 可选的会话 ID，用于状态追踪
   * @returns 规划结果，包含成功状态、生成的 Schema 和执行日志
   */
  async plan(
    userInput: string,
    sessionId?: string
  ): Promise<{
    success: boolean
    schema?: PageSchema
    error?: string
    logs: any[]
    state: AgentState
  }> {
    console.log(`[PagePlanningAgent] 开始规划: ${userInput}`)

    // 初始化状态
    const initialState: AgentState = {
      sessionId,
      userInput,
      currentNode: 'requirement_analysis',
      status: 'running',
      logs: [],
    }

    try {
      // 执行图
      const finalState = await this.executor.execute(initialState)

      // 返回结果
      if (finalState.status === 'completed' && finalState.finalSchema) {
        console.log(`[PagePlanningAgent] 规划完成，生成 ${finalState.finalSchema.children?.length || 0} 个组件`)
        
        return {
          success: true,
          schema: finalState.finalSchema,
          logs: finalState.logs,
          state: finalState,
        }
      } else {
        console.error(`[PagePlanningAgent] 规划失败: ${finalState.error}`)
        
        return {
          success: false,
          error: finalState.error || '规划失败',
          logs: finalState.logs,
          state: finalState,
        }
      }
    } catch (error: any) {
      console.error(`[PagePlanningAgent] 执行异常:`, error)
      
      return {
        success: false,
        error: error.message,
        logs: [],
        state: initialState,
      }
    }
  }

  /**
   * 获取图结构信息
   */
  getGraphInfo(): {
    nodes: string[]
    structure: string
  } {
    return {
      nodes: this.executor.getNodeNames(),
      structure: this.executor.visualize(),
    }
  }
}

/**
 * 工厂函数
 */
export function createPagePlanningAgent(config: PagePlanningConfig): PagePlanningAgent {
  return new PagePlanningAgent(config)
}

/**
 * 页面规划 Agent
 * 基于 LangGraph 的多节点规划 Agent
 */
import { AgentState, AgentNodeName, PageSchema, PlanningAgentConfig } from './types'
import { LangGraphExecutor } from './LangGraphExecutor'
import { createRequirementAnalysisNode } from './nodes/RequirementAnalysisNode'
import { createRAGRetrievalNode } from './nodes/RAGRetrievalNode'
import { createSchemaGenerationNode } from './nodes/SchemaGenerationNode'
import { createValidationNode } from './nodes/ValidationNode'
import type { ChromaConfig, RAGConfig, LLMConfig } from '@ai-lowcode/shared-types'

export interface PagePlanningConfig {
  llmConfig: LLMConfig
  chromaConfig: ChromaConfig
  ragConfig: RAGConfig
  knowledgeBaseIds: number[]
  defaultPageSize?: { width: number; height: number }
  componentLibrary?: string[]
  strictValidation?: boolean
}

/**
 * 页面规划 Agent
 */
export class PagePlanningAgent {
  private executor: LangGraphExecutor
  private config: PagePlanningConfig

  constructor(config: PagePlanningConfig) {
    this.config = config
    this.executor = this.buildGraph()
  }

  /**
   * 构建 LangGraph
   */
  private buildGraph(): LangGraphExecutor {
    // 创建节点
    const nodes = [
      createRequirementAnalysisNode({
        llmConfig: this.config.llmConfig,
      }),
      createRAGRetrievalNode({
        chromaConfig: this.config.chromaConfig,
        ragConfig: this.config.ragConfig,
        knowledgeBaseIds: this.config.knowledgeBaseIds,
        topK: 5,
        threshold: 0.6,
      }),
      createSchemaGenerationNode({
        llmConfig: this.config.llmConfig,
        defaultPageSize: this.config.defaultPageSize || { width: 1920, height: 1080 },
        componentLibrary: this.config.componentLibrary,
      }),
      createValidationNode({
        strictMode: this.config.strictValidation !== false,
        allowedComponents: this.config.componentLibrary,
      }),
    ]

    // 创建边
    const edges = [
      { source: 'requirement_analysis' as const, target: 'rag_retrieval' as const },
      { source: 'rag_retrieval' as const, target: 'schema_generation' as const },
      { source: 'schema_generation' as const, target: 'validation' as const },
      { source: 'validation' as const, target: 'end' as const },
    ]

    return new LangGraphExecutor(nodes, edges, 'requirement_analysis')
  }

  /**
   * 执行规划
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

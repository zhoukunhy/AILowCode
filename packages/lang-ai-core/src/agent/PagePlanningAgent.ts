/**
 * 页面规划 Agent
 * 基于 LangGraph 的多节点规划 Agent，支持条件路由和自动循环修正
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
  maxRetries?: number
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
   * 构建 LangGraph（支持条件路由和循环修正）
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

    // 创建边（包含条件路由）
    const edges = [
      { source: 'requirement_analysis' as const, target: 'rag_retrieval' as const },
      { source: 'rag_retrieval' as const, target: 'schema_generation' as const },
      { source: 'schema_generation' as const, target: 'validation' as const },
      
      // 条件路由：校验失败时返回重新生成，成功时结束
      { 
        source: 'validation' as const, 
        target: 'schema_generation' as const,
        condition: this.shouldRetryGeneration,
      },
      { 
        source: 'validation' as const, 
        target: 'end' as const,
      },
    ]

    return new LangGraphExecutor(nodes, edges, 'requirement_analysis', this.config.maxRetries || 3)
  }

  /**
   * 条件路由：判断是否需要重新生成 Schema
   * 如果校验失败且有可修复的错误，返回 schema_generation 重新生成
   * 如果校验通过或无法修复，返回 end
   */
  private shouldRetryGeneration(state: AgentState): AgentNodeName | 'end' {
    const validationResult = state.validationResult
    
    if (!validationResult) {
      return 'end'
    }

    // 如果校验通过，直接结束
    if (validationResult.isValid) {
      return 'end'
    }

    // 如果有错误，检查是否可以通过重试修复
    const hasCriticalErrors = validationResult.errors.some(
      (error) => error.message.includes('Schema 不能为空') || 
                 error.message.includes('根节点类型') ||
                 error.message.includes('children 必须为数组')
    )

    // 如果有严重错误，尝试重新生成
    if (hasCriticalErrors) {
      console.log('[PagePlanningAgent] 检测到严重校验错误，重新生成 Schema')
      return 'schema_generation'
    }

    // 默认结束
    return 'end'
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
        const componentCount = finalState.finalSchema.children?.length || 0
        console.log(`[PagePlanningAgent] 规划完成，生成 ${componentCount} 个组件`)
        
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
   * 流式执行规划（返回中间结果）
   */
  async *planStream(
    userInput: string,
    sessionId?: string
  ): AsyncGenerator<{
    type: 'step' | 'complete' | 'error'
    node?: AgentNodeName
    message?: string
    schema?: PageSchema
    logs?: any[]
  }> {
    console.log(`[PagePlanningAgent] 开始流式规划: ${userInput}`)

    const initialState: AgentState = {
      sessionId,
      userInput,
      currentNode: 'requirement_analysis',
      status: 'running',
      logs: [],
    }

    try {
      yield { type: 'step', node: 'requirement_analysis', message: '正在解析用户需求...' }
      
      // 模拟分步执行
      const executor = this.buildGraph()
      const finalState = await executor.execute(initialState)

      // 输出中间步骤
      for (const log of finalState.logs) {
        if (log.node !== 'end') {
          yield { 
            type: 'step', 
            node: log.node, 
            message: log.error 
              ? `步骤 ${log.node} 失败: ${log.error}`
              : `步骤 ${log.node} 完成 (${log.duration}ms)`
          }
        }
      }

      if (finalState.status === 'completed' && finalState.finalSchema) {
        yield { 
          type: 'complete', 
          schema: finalState.finalSchema, 
          logs: finalState.logs,
          message: `规划完成，生成 ${finalState.finalSchema.children?.length || 0} 个组件`
        }
      } else {
        yield { 
          type: 'error', 
          message: finalState.error || '规划失败' 
        }
      }
    } catch (error: any) {
      yield { type: 'error', message: error.message }
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

  /**
   * 获取执行统计
   */
  getExecutionStats(state: AgentState): {
    totalSteps: number
    totalDuration: number
    nodeDurations: Record<string, number>
  } {
    const nodeDurations: Record<string, number> = {}
    let totalDuration = 0

    for (const log of state.logs) {
      if (log.duration) {
        nodeDurations[log.node] = (nodeDurations[log.node] || 0) + log.duration
        totalDuration += log.duration
      }
    }

    return {
      totalSteps: state.logs.length,
      totalDuration,
      nodeDurations,
    }
  }
}

/**
 * 工厂函数
 */
export function createPagePlanningAgent(config: PagePlanningConfig): PagePlanningAgent {
  return new PagePlanningAgent(config)
}
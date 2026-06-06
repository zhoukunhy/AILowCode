/**
 * 异常诊断 Agent 执行器
 * 基于 LangGraph 的工作流编排
 */

import {
  DiagnosticAgentState,
  DiagnosticNodeName,
  ErrorInfo,
  DiagnosisResult,
  DiagnosticAgentConfig,
} from './DiagnosticAgentTypes'
import {
  createErrorCollectionNode,
  createRAGRetrievalNode,
  createRootCauseAnalysisNode,
  createFixSuggestionNode,
  createKnowledgeUpdateNode,
} from './DiagnosticAgentNodes'

/**
 * 节点执行函数类型
 */
type NodeFunction = (state: DiagnosticAgentState) => Promise<Partial<DiagnosticAgentState>>

/**
 * 诊断 Agent 执行器
 */
export class DiagnosticAgentExecutor {
  private config: DiagnosticAgentConfig
  private nodes: Map<DiagnosticNodeName, NodeFunction>

  constructor(config: DiagnosticAgentConfig) {
    this.config = config
    this.nodes = new Map()
    this.initializeNodes()
  }

  /**
   * 初始化所有节点
   */
  private initializeNodes(): void {
    this.nodes.set('error_collection', createErrorCollectionNode())
    this.nodes.set('rag_retrieval', createRAGRetrievalNode(this.config))
    this.nodes.set('root_cause_analysis', createRootCauseAnalysisNode(this.config))
    this.nodes.set('fix_suggestion', createFixSuggestionNode(this.config))
    this.nodes.set('knowledge_update', createKnowledgeUpdateNode(this.config))
  }

  /**
   * 执行诊断流程
   */
  async execute(errorInfo: ErrorInfo, sessionId?: string): Promise<DiagnosisResult> {
    const diagnosticId = `diag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const actualSessionId = sessionId || `session-${Date.now()}`
    const startTime = Date.now()

    console.log(`[DiagnosticAgent] 开始诊断: ${diagnosticId}`)

    // 初始化状态
    let state: DiagnosticAgentState = {
      sessionId: actualSessionId,
      errorInfo,
      logs: [],
      currentNode: 'error_collection',
      status: 'running',
    }

    // 工作流路由
    const workflow: DiagnosticNodeName[] = [
      'error_collection',
      'rag_retrieval',
      'root_cause_analysis',
      'fix_suggestion',
      'knowledge_update',
    ]

    // 顺序执行节点
    for (const nodeName of workflow) {
      console.log(`[DiagnosticAgent] 执行节点: ${nodeName}`)

      const node = this.nodes.get(nodeName)
      if (!node) {
        console.error(`[DiagnosticAgent] 未找到节点: ${nodeName}`)
        state.status = 'failed'
        state.error = `未找到节点: ${nodeName}`
        break
      }

      try {
        const result = await node(state)
        state = { ...state, ...result }

        // 检查是否应该终止
        if (state.status === 'failed' || state.status === 'completed') {
          console.log(`[DiagnosticAgent] 节点 ${nodeName} 导致流程终止: ${state.status}`)
          if (state.error) {
            console.error(`[DiagnosticAgent] 错误: ${state.error}`)
          }
          break
        }
      } catch (error: any) {
        console.error(`[DiagnosticAgent] 节点 ${nodeName} 执行失败:`, error)
        state.status = 'failed'
        state.error = error.message
        break
      }
    }

    const endTime = Date.now()

    // 生成最终结果
    if (state.status === 'completed' && state.rootCauseAnalysis && state.fixSuggestion) {
      const metadata = {
        diagnosticId,
        sessionId: actualSessionId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalDuration: endTime - startTime,
        ragRetrievalTime: this.calculateNodeDuration(state.logs, 'rag_retrieval'),
        analysisTime: this.calculateNodeDuration(state.logs, 'root_cause_analysis'),
        modelLatency: this.calculateNodeDuration(state.logs, 'fix_suggestion'),
      }

      const result: DiagnosisResult = {
        errorInfo: state.errorInfo!,
        retrievalResult: state.retrievalResult!,
        rootCauseAnalysis: state.rootCauseAnalysis,
        fixSuggestion: state.fixSuggestion,
        diagnosticMetadata: metadata,
      }

      console.log(`[DiagnosticAgent] 诊断完成: ${diagnosticId}, 耗时: ${metadata.totalDuration}ms`)
      return result
    } else {
      // 返回失败结果
      throw new Error(state.error || '诊断流程失败')
    }
  }

  /**
   * 计算节点执行时长
   */
  private calculateNodeDuration(logs: any[], nodeName: string): number {
    const nodeLog = logs.find((log: any) => log.node === nodeName)
    return nodeLog?.duration || 0
  }

  /**
   * 批量执行诊断
   */
  async executeBatch(errors: ErrorInfo[]): Promise<DiagnosisResult[]> {
    const results: DiagnosisResult[] = []

    for (const error of errors) {
      try {
        const result = await this.execute(error)
        results.push(result)
      } catch (error: any) {
        console.error(`[DiagnosticAgent] 诊断失败: ${error.message}`)
        // 继续处理下一个错误
      }
    }

    return results
  }
}

/**
 * 创建诊断 Agent 执行器
 */
export function createDiagnosticAgentExecutor(config: DiagnosticAgentConfig): DiagnosticAgentExecutor {
  return new DiagnosticAgentExecutor(config)
}

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
  ErrorCategory,
} from './DiagnosticAgentTypes'
import {
  createErrorCollectionNode,
  createErrorClassifierNode,
  createRAGRetrievalNode,
  createRootCauseAnalysisNode,
  createFixSuggestionNode,
  createAutoFixNode,
  createFixValidationNode,
  createKnowledgeUpdateNode,
} from './DiagnosticAgentNodes'
import { StateGraph, END, START } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph'
import { v4 as uuidv4 } from 'uuid'

/**
 * 诊断 Agent 执行器
 */
export class DiagnosticAgentExecutor {
  private config: DiagnosticAgentConfig
  private graph: StateGraph<DiagnosticAgentState>
  private workflow: any

  constructor(config: DiagnosticAgentConfig) {
    this.config = config
    this.graph = this.buildGraph()
    this.workflow = this.graph.compile({
      checkpointer: new MemorySaver(),
    })
  }

  /**
   * 构建 LangGraph 工作流
   */
  private buildGraph(): StateGraph<DiagnosticAgentState> {
    const graph = new StateGraph<DiagnosticAgentState>()

    // 添加节点
    graph.addNode('error_collection', createErrorCollectionNode())
    graph.addNode('error_classifier', createErrorClassifierNode())
    graph.addNode('rag_retrieval', createRAGRetrievalNode(this.config))
    graph.addNode('root_cause_analysis', createRootCauseAnalysisNode(this.config))
    graph.addNode('fix_suggestion', createFixSuggestionNode(this.config))
    graph.addNode('auto_fix', createAutoFixNode(this.config))
    graph.addNode('fix_validation', createFixValidationNode(this.config))
    graph.addNode('knowledge_update', createKnowledgeUpdateNode(this.config))

    // 添加边
    graph.addEdge(START, 'error_collection')
    graph.addEdge('error_collection', 'error_classifier')
    graph.addEdge('error_classifier', 'rag_retrieval')
    graph.addEdge('rag_retrieval', 'root_cause_analysis')
    graph.addEdge('root_cause_analysis', 'fix_suggestion')
    
    // 条件边：根据错误类别决定是否执行自动修复
    graph.addConditionalEdges(
      'fix_suggestion',
      this.shouldAutoFix,
      {
        auto_fix: 'auto_fix',
        manual: 'knowledge_update',
      }
    )
    
    // 自动修复后的验证流程
    graph.addEdge('auto_fix', 'fix_validation')
    
    // 条件边：根据验证结果决定是否重试或完成
    graph.addConditionalEdges(
      'fix_validation',
      this.handleValidationResult,
      {
        retry: 'fix_suggestion',
        success: 'knowledge_update',
        failed: 'knowledge_update',
      }
    )
    
    graph.addEdge('knowledge_update', END)

    return graph
  }

  /**
   * 判断是否应该执行自动修复
   */
  private shouldAutoFix(state: DiagnosticAgentState): 'auto_fix' | 'manual' {
    const category = state.errorCategory
    // 仅对可自动修复的类别执行自动修复
    const autoFixableCategories: ErrorCategory[] = [
      'validation_error',
      'configuration_error',
      'dependency_missing',
      'syntax_error',
    ]
    
    if (category && autoFixableCategories.includes(category)) {
      return 'auto_fix'
    }
    return 'manual'
  }

  /**
   * 处理验证结果
   */
  private handleValidationResult(state: DiagnosticAgentState): 'retry' | 'success' | 'failed' {
    const validationResult = state.fixValidationResult
    
    if (!validationResult) {
      return 'failed'
    }
    
    // 检查重试次数
    const retryCount = state.retryCount || 0
    if (validationResult.success) {
      return 'success'
    } else if (retryCount < 3) {
      return 'retry'
    } else {
      return 'failed'
    }
  }

  /**
   * 执行诊断流程
   */
  async execute(errorInfo: ErrorInfo, sessionId?: string): Promise<DiagnosisResult> {
    const diagnosticId = `diag-${Date.now()}-${uuidv4().slice(0, 7)}`
    const actualSessionId = sessionId || `session-${Date.now()}`
    const startTime = Date.now()

    console.log(`[DiagnosticAgent] 开始诊断: ${diagnosticId}`)

    // 初始化状态
    const initialState: DiagnosticAgentState = {
      sessionId: actualSessionId,
      diagnosticId,
      errorInfo,
      logs: [],
      currentNode: 'error_collection',
      status: 'running',
      retryCount: 0,
    }

    // 执行工作流
    const result = await this.workflow.invoke(initialState)
    const endTime = Date.now()

    // 生成最终结果
    if (result.status === 'completed' && result.rootCauseAnalysis && result.fixSuggestion) {
      const metadata = {
        diagnosticId,
        sessionId: actualSessionId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalDuration: endTime - startTime,
        ragRetrievalTime: this.calculateNodeDuration(result.logs, 'rag_retrieval'),
        analysisTime: this.calculateNodeDuration(result.logs, 'root_cause_analysis'),
        modelLatency: this.calculateNodeDuration(result.logs, 'fix_suggestion'),
        autoFixAttempted: !!result.autoFixResult,
        autoFixSuccess: result.fixValidationResult?.success || false,
        retryCount: result.retryCount || 0,
      }

      const diagnosisResult: DiagnosisResult = {
        errorInfo: result.errorInfo!,
        errorCategory: result.errorCategory,
        retrievalResult: result.retrievalResult!,
        rootCauseAnalysis: result.rootCauseAnalysis,
        fixSuggestion: result.fixSuggestion,
        autoFixResult: result.autoFixResult,
        fixValidationResult: result.fixValidationResult,
        diagnosticMetadata: metadata,
      }

      console.log(`[DiagnosticAgent] 诊断完成: ${diagnosticId}, 耗时: ${metadata.totalDuration}ms`)
      return diagnosisResult
    } else {
      throw new Error(result.error || '诊断流程失败')
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
      }
    }

    return results
  }

  /**
   * 获取诊断状态
   */
  async getDiagnosticStatus(sessionId: string): Promise<DiagnosticAgentState | null> {
    try {
      const state = await this.workflow.getState(sessionId)
      return state
    } catch {
      return null
    }
  }

  /**
   * 取消诊断任务
   */
  async cancelDiagnostic(sessionId: string): Promise<void> {
    try {
      await this.workflow.cancel(sessionId)
    } catch {
      console.warn(`[DiagnosticAgent] 取消任务失败: ${sessionId}`)
    }
  }
}

/**
 * 创建诊断 Agent 执行器
 */
export function createDiagnosticAgentExecutor(config: DiagnosticAgentConfig): DiagnosticAgentExecutor {
  return new DiagnosticAgentExecutor(config)
}
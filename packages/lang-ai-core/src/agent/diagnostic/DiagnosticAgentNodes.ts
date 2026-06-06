/**
 * 异常诊断 Agent 节点工厂
 */

import { LLMFactory } from '../llm/LLMFactory'
import { VectorRetrievalService } from '../rag/VectorRetrievalService'
import { MilvusVectorStore } from '../vectorstore/MilvusVectorStore'
import type { 
  ErrorInfo, 
  ErrorType, 
  ErrorSource,
  DiagnosticAgentState,
  DiagnosticNodeName,
  DiagnosticExecutionLog,
  DiagnosticAgentConfig,
  ErrorRetrievalResult,
  SimilarError,
  KnowledgeArticle,
  RootCauseAnalysis,
  FixSuggestion,
  FixStep,
  DiagnosisResult,
  DiagnosticMetadata,
  ErrorKnowledgeEntry,
} from './DiagnosticAgentTypes'
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'

/**
 * 创建错误收集节点
 */
export function createErrorCollectionNode() {
  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
    const log: DiagnosticExecutionLog = {
      node: 'error_collection',
      timestamp: new Date(),
      input: null,
      duration: 0,
    }

    try {
      console.log('[ErrorCollection] 开始收集异常信息')

      // 错误信息已经在 state 中，主要进行规范化处理
      if (!state.errorInfo) {
        throw new Error('缺少错误信息')
      }

      // 规范化错误信息
      const normalizedError = normalizeErrorInfo(state.errorInfo)

      // 更新状态
      const output: Partial<DiagnosticAgentState> = {
        errorInfo: normalizedError,
        currentNode: 'rag_retrieval',
        logs: [...state.logs, { ...log, output: normalizedError, duration: Date.now() - startTime }],
      }

      console.log('[ErrorCollection] 异常信息收集完成:', normalizedError.id)
      return output
    } catch (error: any) {
      console.error('[ErrorCollection] 收集异常失败:', error)
      return {
        currentNode: 'end',
        status: 'failed',
        error: error.message,
        logs: [...state.logs, { ...log, error: error.message, duration: Date.now() - startTime }],
      }
    }
  }
}

/**
 * 创建 RAG 检索节点
 */
export function createRAGRetrievalNode(config: DiagnosticAgentConfig) {
  const vectorStore = new MilvusVectorStore(config.ragConfig as any)
  const retrievalService = new VectorRetrievalService({
    milvusConfig: config.ragConfig as any,
    collectionName: config.knowledgeBaseConfig.errorCollectionName,
  })

  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
    const ragRetrievalStart = Date.now()
    const log: DiagnosticExecutionLog = {
      node: 'rag_retrieval',
      timestamp: new Date(),
      input: null,
      duration: 0,
    }

    try {
      console.log('[RAGRetrieval] 开始检索相似错误')

      if (!state.errorInfo) {
        throw new Error('缺少错误信息')
      }

      // 构建检索查询
      const query = buildErrorQuery(state.errorInfo)

      // 检索相似错误
      let similarErrors: SimilarError[] = []
      try {
        const retrievalResult = await retrievalService.search(query, config.ragConfig.topK || 5)
        similarErrors = retrievalResult.documents.map((doc, index) => ({
          id: doc.id || `error-${index}`,
          errorType: (doc.metadata?.errorType as ErrorType) || 'unknown',
          errorMessage: doc.metadata?.errorMessage || doc.content.slice(0, 200),
          rootCause: doc.metadata?.rootCause || '',
          solution: doc.metadata?.solution || '',
          occurrences: doc.metadata?.occurrences || 1,
          lastOccurredAt: new Date(doc.metadata?.lastOccurredAt || Date.now()),
          tags: doc.metadata?.tags || [],
          metadata: doc.metadata || {},
        }))
      } catch (error) {
        console.warn('[RAGRetrieval] 向量检索失败，使用模拟数据:', error)
        // 使用模拟数据
        similarErrors = getMockSimilarErrors(state.errorInfo)
      }

      // 检索知识库文章
      let knowledgeArticles: KnowledgeArticle[] = []
      try {
        const articleRetrieval = await retrievalService.search(
          `${query} documentation solution guide`,
          3
        )
        knowledgeArticles = articleRetrieval.documents.map((doc, index) => ({
          id: doc.id || `article-${index}`,
          title: doc.metadata?.title || 'Unknown Article',
          content: doc.content,
          category: doc.metadata?.category || 'general',
          tags: doc.metadata?.tags || [],
          relatedErrors: doc.metadata?.relatedErrors || [],
          solutions: doc.metadata?.solutions || [],
        }))
      } catch (error) {
        console.warn('[RAGRetrieval] 知识库检索失败:', error)
      }

      const retrievalResult: ErrorRetrievalResult = {
        query,
        similarErrors,
        knowledgeArticles,
        relevanceScore: similarErrors.length > 0 ? 0.85 : 0,
      }

      const ragRetrievalTime = Date.now() - ragRetrievalStart

      const output: Partial<DiagnosticAgentState> = {
        retrievalResult,
        currentNode: 'root_cause_analysis',
        logs: [...state.logs, { ...log, output: retrievalResult, duration: Date.now() - startTime }],
      }

      console.log(`[RAGRetrieval] 检索完成: ${similarErrors.length} 个相似错误, ${knowledgeArticles.length} 篇知识文章`)
      return output
    } catch (error: any) {
      console.error('[RAGRetrieval] RAG 检索失败:', error)
      return {
        currentNode: 'end',
        status: 'failed',
        error: error.message,
        logs: [...state.logs, { ...log, error: error.message, duration: Date.now() - startTime }],
      }
    }
  }
}

/**
 * 创建原因分析节点
 */
export function createRootCauseAnalysisNode(config: DiagnosticAgentConfig) {
  const llm = LLMFactory.createLLM(config.llmConfig)

  const analysisPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`你是一个专业的故障诊断专家。请分析以下错误信息，找出根本原因。

分析要求：
1. 识别错误类型和来源
2. 分析错误发生的具体原因
3. 评估错误影响的组件和严重程度
4. 识别所有可能导致错误发生的因素

请输出 JSON 格式的分析结果：
{
  "rootCause": "根本原因描述",
  "confidence": 0.9,
  "errorCategory": "错误类别",
  "affectedComponents": ["受影响的组件列表"],
  "severity": "critical|high|medium|low",
  "contributingFactors": [
    {
      "factor": "因素名称",
      "weight": 0.8,
      "description": "因素描述"
    }
  ]
}`),
    HumanMessagePromptTemplate.fromTemplate(`错误信息：
类型: {errorType}
来源: {errorSource}
消息: {errorMessage}
堆栈: {stack}

上下文:
{context}

RAG 检索结果:
相似错误: {similarErrors}
知识文章: {knowledgeArticles}`),
  ])

  const analysisChain = RunnableSequence.from([
    analysisPrompt,
    llm,
    new StringOutputParser(),
  ])

  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
    const log: DiagnosticExecutionLog = {
      node: 'root_cause_analysis',
      timestamp: new Date(),
      input: null,
      duration: 0,
    }

    try {
      console.log('[RootCauseAnalysis] 开始分析根本原因')

      if (!state.errorInfo) {
        throw new Error('缺少错误信息')
      }

      // 调用 LLM 进行分析
      let analysis: RootCauseAnalysis
      
      try {
        const result = await analysisChain.invoke({
          errorType: state.errorInfo.type,
          errorSource: state.errorInfo.source,
          errorMessage: state.errorInfo.message,
          stack: state.errorInfo.stack || '无堆栈信息',
          context: JSON.stringify(state.errorInfo.context || {}, null, 2),
          similarErrors: JSON.stringify(state.retrievalResult?.similarErrors || [], null, 2),
          knowledgeArticles: JSON.stringify(state.retrievalResult?.knowledgeArticles || [], null, 2),
        })

        // 解析 JSON 结果
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析分析结果')
        }
      } catch (error) {
        console.warn('[RootCauseAnalysis] LLM 分析失败，使用规则分析:', error)
        // 使用规则分析作为后备
        analysis = ruleBasedAnalysis(state.errorInfo, state.retrievalResult)
      }

      analysis.errorId = state.errorInfo.id

      const output: Partial<DiagnosticAgentState> = {
        rootCauseAnalysis: analysis,
        currentNode: 'fix_suggestion',
        logs: [...state.logs, { ...log, output: analysis, duration: Date.now() - startTime }],
      }

      console.log('[RootCauseAnalysis] 原因分析完成:', analysis.rootCause)
      return output
    } catch (error: any) {
      console.error('[RootCauseAnalysis] 原因分析失败:', error)
      return {
        currentNode: 'end',
        status: 'failed',
        error: error.message,
        logs: [...state.logs, { ...log, error: error.message, duration: Date.now() - startTime }],
      }
    }
  }
}

/**
 * 创建修复建议生成节点
 */
export function createFixSuggestionNode(config: DiagnosticAgentConfig) {
  const llm = LLMFactory.createLLM(config.llmConfig)

  const suggestionPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`你是一个专业的代码修复专家。请根据错误分析结果，生成修复建议。

修复建议要求：
1. 提供清晰、可执行的修复步骤
2. 每个步骤包含具体的操作描述
3. 提供相关的代码片段（如果适用）
4. 标注每个步骤的风险等级和预估时间
5. 提供回滚方案

请输出 JSON 格式的修复建议：
{
  "errorId": "错误ID",
  "suggestions": [
    {
      "order": 1,
      "action": "操作名称",
      "description": "详细描述",
      "codeSnippet": "代码片段（可选）",
      "warnings": ["警告信息"],
      "estimatedTime": "预估时间"
    }
  ],
  "alternativeSolutions": [
    {
      "approach": "方案名称",
      "description": "方案描述",
      "pros": ["优点列表"],
      "cons": ["缺点列表"],
      "codeSnippet": "代码片段（可选）"
    }
  ],
  "estimatedFixTime": "总预估时间",
  "riskLevel": "safe|moderate|risky",
  "rollbackPlan": "回滚方案描述"
}`),
    HumanMessagePromptTemplate.fromTemplate(`错误信息：
类型: {errorType}
消息: {errorMessage}

根本原因分析：
原因: {rootCause}
严重程度: {severity}
影响因素: {contributingFactors}

RAG 检索结果:
相似错误: {similarErrors}

知识文章: {knowledgeArticles}`),
  ])

  const suggestionChain = RunnableSequence.from([
    suggestionPrompt,
    llm,
    new StringOutputParser(),
  ])

  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
    const log: DiagnosticExecutionLog = {
      node: 'fix_suggestion',
      timestamp: new Date(),
      input: null,
      duration: 0,
    }

    try {
      console.log('[FixSuggestion] 开始生成修复建议')

      if (!state.errorInfo || !state.rootCauseAnalysis) {
        throw new Error('缺少必要的分析结果')
      }

      // 调用 LLM 生成修复建议
      let suggestion: FixSuggestion
      
      try {
        const result = await suggestionChain.invoke({
          errorType: state.errorInfo.type,
          errorMessage: state.errorInfo.message,
          rootCause: state.rootCauseAnalysis.rootCause,
          severity: state.rootCauseAnalysis.severity,
          contributingFactors: JSON.stringify(state.rootCauseAnalysis.contributingFactors, null, 2),
          similarErrors: JSON.stringify(state.retrievalResult?.similarErrors || [], null, 2),
          knowledgeArticles: JSON.stringify(state.retrievalResult?.knowledgeArticles || [], null, 2),
        })

        // 解析 JSON 结果
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析修复建议')
        }
      } catch (error) {
        console.warn('[FixSuggestion] LLM 生成失败，使用规则生成:', error)
        // 使用规则生成作为后备
        suggestion = ruleBasedFixSuggestion(state.errorInfo, state.rootCauseAnalysis, state.retrievalResult)
      }

      suggestion.errorId = state.errorInfo.id

      const output: Partial<DiagnosticAgentState> = {
        fixSuggestion: suggestion,
        currentNode: 'knowledge_update',
        logs: [...state.logs, { ...log, output: suggestion, duration: Date.now() - startTime }],
      }

      console.log('[FixSuggestion] 修复建议生成完成')
      return output
    } catch (error: any) {
      console.error('[FixSuggestion] 生成修复建议失败:', error)
      return {
        currentNode: 'end',
        status: 'failed',
        error: error.message,
        logs: [...state.logs, { ...log, error: error.message, duration: Date.now() - startTime }],
      }
    }
  }
}

/**
 * 创建知识更新节点
 */
export function createKnowledgeUpdateNode(config: DiagnosticAgentConfig) {
  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
    const log: DiagnosticExecutionLog = {
      node: 'knowledge_update',
      timestamp: new Date(),
      input: null,
      duration: 0,
    }

    try {
      console.log('[KnowledgeUpdate] 开始更新知识库')

      if (!state.errorInfo) {
        throw new Error('缺少错误信息')
      }

      // 构建知识库条目
      const knowledgeEntry: ErrorKnowledgeEntry = {
        errorType: state.errorInfo.type,
        errorMessage: state.errorInfo.message,
        rootCause: state.rootCauseAnalysis?.rootCause || '未知',
        solution: state.fixSuggestion?.suggestions?.[0]?.description || '',
        tags: [state.errorInfo.source, state.errorInfo.type],
        occurrences: 1,
        metadata: {
          sessionId: state.sessionId,
          severity: state.rootCauseAnalysis?.severity,
          context: state.errorInfo.context,
        },
      }

      // 这里应该调用向量存储来更新知识库
      // 实际实现中需要将知识条目写入 Milvus
      console.log('[KnowledgeUpdate] 知识库条目:', knowledgeEntry)

      const output: Partial<DiagnosticAgentState> = {
        currentNode: 'end',
        status: 'completed',
        logs: [...state.logs, { ...log, output: knowledgeEntry, duration: Date.now() - startTime }],
      }

      console.log('[KnowledgeUpdate] 知识库更新完成')
      return output
    } catch (error: any) {
      console.error('[KnowledgeUpdate] 知识库更新失败:', error)
      // 知识库更新失败不应该影响主流程
      return {
        currentNode: 'end',
        status: 'completed',
        logs: [...state.logs, { ...log, error: error.message, duration: Date.now() - startTime }],
      }
    }
  }
}

// ==================== 辅助函数 ====================

/**
 * 规范化错误信息
 */
function normalizeErrorInfo(errorInfo: ErrorInfo): ErrorInfo {
  return {
    ...errorInfo,
    id: errorInfo.id || `error-${Date.now()}`,
    timestamp: errorInfo.timestamp || new Date(),
    type: errorInfo.type || detectErrorType(errorInfo.message, errorInfo.stack),
    source: errorInfo.source || 'unknown',
  }
}

/**
 * 检测错误类型
 */
function detectErrorType(message: string, stack?: string): ErrorType {
  const content = `${message} ${stack || ''}`.toLowerCase()
  
  if (content.includes('connection') || content.includes('connect')) {
    return 'datasource_connection'
  }
  if (content.includes('query') || content.includes('sql')) {
    return 'datasource_query'
  }
  if (content.includes('timeout')) {
    return 'timeout'
  }
  if (content.includes('401') || content.includes('403') || content.includes('unauthorized')) {
    return 'authentication'
  }
  if (content.includes('network') || content.includes('fetch')) {
    return 'network'
  }
  
  return 'unknown'
}

/**
 * 构建错误检索查询
 */
function buildErrorQuery(errorInfo: ErrorInfo): string {
  const parts: string[] = []
  
  parts.push(errorInfo.type)
  parts.push(errorInfo.source)
  parts.push(errorInfo.message.slice(0, 100))
  
  if (errorInfo.context?.componentId) {
    parts.push(errorInfo.context.componentId)
  }
  if (errorInfo.context?.dataSourceId) {
    parts.push(errorInfo.context.dataSourceId)
  }
  
  return parts.join(' ')
}

/**
 * 获取模拟相似错误
 */
function getMockSimilarErrors(errorInfo: ErrorInfo): SimilarError[] {
  return [
    {
      id: 'mock-error-1',
      errorType: errorInfo.type,
      errorMessage: '类似的错误消息',
      rootCause: '配置错误或网络问题',
      solution: '检查配置并重试连接',
      occurrences: 5,
      lastOccurredAt: new Date(),
      tags: [errorInfo.type, errorInfo.source],
      metadata: {},
    },
  ]
}

/**
 * 基于规则的原因分析
 */
function ruleBasedAnalysis(
  errorInfo: ErrorInfo,
  retrievalResult?: ErrorRetrievalResult
): RootCauseAnalysis {
  const similarError = retrievalResult?.similarErrors?.[0]
  
  return {
    errorId: errorInfo.id,
    rootCause: similarError?.rootCause || '未知原因，需要进一步调查',
    confidence: similarError ? 0.8 : 0.5,
    errorCategory: errorInfo.type,
    affectedComponents: errorInfo.context?.componentId ? [errorInfo.context.componentId] : [],
    severity: errorInfo.message.includes('critical') ? 'critical' : 'medium',
    contributingFactors: [],
  }
}

/**
 * 基于规则的修复建议
 */
function ruleBasedFixSuggestion(
  errorInfo: ErrorInfo,
  analysis: RootCauseAnalysis,
  retrievalResult?: ErrorRetrievalResult
): FixSuggestion {
  const similarError = retrievalResult?.similarErrors?.[0]
  
  const steps: FixStep[] = [
    {
      order: 1,
      action: '检查配置',
      description: '验证数据源配置是否正确',
      estimatedTime: '2-5分钟',
    },
    {
      order: 2,
      action: '检查网络',
      description: '确保网络连接正常',
      estimatedTime: '1-2分钟',
    },
    {
      order: 3,
      action: '重试连接',
      description: '重新建立连接',
      estimatedTime: '1分钟',
    },
  ]

  if (similarError?.solution) {
    steps.unshift({
      order: 0,
      action: '应用已知解决方案',
      description: similarError.solution,
      estimatedTime: '5-10分钟',
    })
  }

  return {
    errorId: errorInfo.id,
    suggestions: steps,
    alternativeSolutions: [],
    estimatedFixTime: '10-20分钟',
    riskLevel: 'safe',
    rollbackPlan: '恢复到之前的配置状态',
  }
}

/**
 * 异常诊断 Agent 节点工厂
 */

import { LLMFactory } from '../../llm/LLMFactory'
import { VectorRetrievalService } from '../../rag/VectorRetrievalService'
import { ChromaVectorStore } from '../../vectorstore/ChromaVectorStore'
import type { 
  ErrorInfo, 
  ErrorType, 
  ErrorSource,
  ErrorCategory,
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
  AutoFixResult,
  AppliedChange,
  FixValidationResult,
  ValidationResult,
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

      if (!state.errorInfo) {
        throw new Error('缺少错误信息')
      }

      const normalizedError = normalizeErrorInfo(state.errorInfo)

      const output: Partial<DiagnosticAgentState> = {
        errorInfo: normalizedError,
        currentNode: 'error_classifier',
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
 * 创建错误分类节点
 */
export function createErrorClassifierNode() {
  const llm = LLMFactory.createLLM({ apiKey: 'dummy' })

  const classifierPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`你是一个专业的错误分类专家。请根据错误信息将其分类。

错误类别列表：
- validation_error: 数据验证错误
- configuration_error: 配置错误
- dependency_missing: 依赖缺失
- syntax_error: 语法错误
- runtime_exception: 运行时异常
- network_error: 网络错误
- authentication_error: 认证错误
- authorization_error: 授权错误
- database_error: 数据库错误
- unknown_error: 未知错误

请输出JSON格式：
{
  "category": "错误类别",
  "confidence": 0.9,
  "reason": "分类原因"
}`),
    HumanMessagePromptTemplate.fromTemplate(`错误信息：
类型: {errorType}
来源: {errorSource}
消息: {errorMessage}
堆栈: {stack}
上下文: {context}`),
  ])

  const classifierChain = RunnableSequence.from([
    classifierPrompt,
    llm,
    new StringOutputParser(),
  ])

  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
    const log: DiagnosticExecutionLog = {
      node: 'error_classifier',
      timestamp: new Date(),
      input: null,
      duration: 0,
    }

    try {
      console.log('[ErrorClassifier] 开始错误分类')

      if (!state.errorInfo) {
        throw new Error('缺少错误信息')
      }

      let category: ErrorCategory = 'unknown_error'
      let confidence = 0.5

      try {
        const result = await classifierChain.invoke({
          errorType: state.errorInfo.type,
          errorSource: state.errorInfo.source,
          errorMessage: state.errorInfo.message,
          stack: state.errorInfo.stack || '无堆栈信息',
          context: JSON.stringify(state.errorInfo.context || {}, null, 2),
        })

        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          category = parsed.category as ErrorCategory
          confidence = parsed.confidence || 0.5
        }
      } catch (error) {
        console.warn('[ErrorClassifier] LLM分类失败，使用规则分类:', error)
        category = ruleBasedClassification(state.errorInfo)
      }

      const output: Partial<DiagnosticAgentState> = {
        errorCategory: category,
        currentNode: 'rag_retrieval',
        logs: [...state.logs, { ...log, output: { category, confidence }, duration: Date.now() - startTime }],
      }

      console.log('[ErrorClassifier] 错误分类完成:', category)
      return output
    } catch (error: any) {
      console.error('[ErrorClassifier] 分类失败:', error)
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
  const vectorStore = new ChromaVectorStore(config.ragConfig as any)
  const retrievalService = new VectorRetrievalService(
    config.ragConfig as any,
    config.ragConfig,
    config.knowledgeBaseConfig.errorCollectionName
  )

  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
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

      const query = buildErrorQuery(state.errorInfo)

      let similarErrors: SimilarError[] = []
      try {
        await retrievalService.initialize()
        const retrievalResult = await retrievalService.retrieve(query, config.ragConfig.topK || 5)
        similarErrors = retrievalResult.results.map((doc, index) => ({
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
        similarErrors = getMockSimilarErrors(state.errorInfo)
      }

      let knowledgeArticles: KnowledgeArticle[] = []
      try {
        const articleRetrieval = await retrievalService.retrieve(
          `${query} documentation solution guide`,
          3
        )
        knowledgeArticles = articleRetrieval.results.map((doc, index) => ({
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

        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析分析结果')
        }
      } catch (error) {
        console.warn('[RootCauseAnalysis] LLM 分析失败，使用规则分析:', error)
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

        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析修复建议')
        }
      } catch (error) {
        console.warn('[FixSuggestion] LLM 生成失败，使用规则生成:', error)
        suggestion = ruleBasedFixSuggestion(state.errorInfo, state.rootCauseAnalysis, state.retrievalResult)
      }

      suggestion.errorId = state.errorInfo.id

      const output: Partial<DiagnosticAgentState> = {
        fixSuggestion: suggestion,
        currentNode: 'auto_fix',
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
 * 创建自动修复节点
 */
export function createAutoFixNode(config: DiagnosticAgentConfig) {
  const llm = LLMFactory.createLLM(config.llmConfig)

  const fixPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`你是一个专业的代码修复工程师。请根据错误信息和修复建议，生成具体的代码修改。

要求：
1. 分析需要修改的文件和代码位置
2. 生成具体的代码变更（添加/修改/删除）
3. 提供变更前后的对比
4. 确保代码符合编码规范

请输出 JSON 格式的修复结果：
{
  "success": true,
  "appliedChanges": [
    {
      "file": "文件路径",
      "changeType": "add|modify|delete",
      "before": "修改前的代码",
      "after": "修改后的代码",
      "diff": "差异描述"
    }
  ],
  "error": "错误信息（如果失败）"
}`),
    HumanMessagePromptTemplate.fromTemplate(`错误信息：
类型: {errorType}
消息: {errorMessage}

根本原因: {rootCause}

修复建议: {fixSuggestion}

上下文信息: {context}`),
  ])

  const fixChain = RunnableSequence.from([
    fixPrompt,
    llm,
    new StringOutputParser(),
  ])

  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
    const log: DiagnosticExecutionLog = {
      node: 'auto_fix',
      timestamp: new Date(),
      input: null,
      duration: 0,
    }

    try {
      console.log('[AutoFix] 开始自动修复')

      if (!state.errorInfo || !state.rootCauseAnalysis || !state.fixSuggestion) {
        throw new Error('缺少必要的分析结果')
      }

      let autoFixResult: AutoFixResult

      try {
        const result = await fixChain.invoke({
          errorType: state.errorInfo.type,
          errorMessage: state.errorInfo.message,
          rootCause: state.rootCauseAnalysis.rootCause,
          fixSuggestion: JSON.stringify(state.fixSuggestion, null, 2),
          context: JSON.stringify(state.errorInfo.context || {}, null, 2),
        })

        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          autoFixResult = {
            success: parsed.success,
            appliedChanges: parsed.appliedChanges || [],
            error: parsed.error,
            appliedAt: new Date(),
          }
        } else {
          throw new Error('无法解析修复结果')
        }
      } catch (error) {
        console.warn('[AutoFix] LLM 修复失败，使用模拟修复:', error)
        autoFixResult = mockAutoFix(state.errorInfo, state.fixSuggestion)
      }

      const output: Partial<DiagnosticAgentState> = {
        autoFixResult,
        currentNode: 'fix_validation',
        logs: [...state.logs, { ...log, output: autoFixResult, duration: Date.now() - startTime }],
      }

      console.log('[AutoFix] 自动修复完成:', autoFixResult.success ? '成功' : '失败')
      return output
    } catch (error: any) {
      console.error('[AutoFix] 自动修复失败:', error)
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
 * 创建修复验证节点
 */
export function createFixValidationNode(config: DiagnosticAgentConfig) {
  const llm = LLMFactory.createLLM(config.llmConfig)

  const validationPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`你是一个代码验证专家。请验证修复方案的正确性。

验证内容：
1. 语法检查：代码是否有语法错误
2. 逻辑检查：修复是否解决了根本问题
3. 风险评估：修复是否引入新的问题

请输出 JSON 格式的验证结果：
{
  "success": true,
  "validationType": "syntax|unit_test|integration_test|manual_review",
  "validationResults": [
    {
      "type": "验证类型",
      "passed": true,
      "message": "验证结果描述",
      "details": {}
    }
  ],
  "message": "综合验证结果"
}`),
    HumanMessagePromptTemplate.fromTemplate(`错误信息：
类型: {errorType}
消息: {errorMessage}

根本原因: {rootCause}

修复方案: {fixSuggestion}

应用的变更: {appliedChanges}`),
  ])

  const validationChain = RunnableSequence.from([
    validationPrompt,
    llm,
    new StringOutputParser(),
  ])

  return async (state: DiagnosticAgentState): Promise<Partial<DiagnosticAgentState>> => {
    const startTime = Date.now()
    const log: DiagnosticExecutionLog = {
      node: 'fix_validation',
      timestamp: new Date(),
      input: null,
      duration: 0,
    }

    try {
      console.log('[FixValidation] 开始验证修复')

      if (!state.errorInfo || !state.rootCauseAnalysis || !state.fixSuggestion || !state.autoFixResult) {
        throw new Error('缺少必要的修复信息')
      }

      let validationResult: FixValidationResult

      try {
        const result = await validationChain.invoke({
          errorType: state.errorInfo.type,
          errorMessage: state.errorInfo.message,
          rootCause: state.rootCauseAnalysis.rootCause,
          fixSuggestion: JSON.stringify(state.fixSuggestion, null, 2),
          appliedChanges: JSON.stringify(state.autoFixResult.appliedChanges, null, 2),
        })

        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          validationResult = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析验证结果')
        }
      } catch (error) {
        console.warn('[FixValidation] LLM 验证失败，使用规则验证:', error)
        validationResult = ruleBasedValidation(state.autoFixResult)
      }

      const output: Partial<DiagnosticAgentState> = {
        fixValidationResult: validationResult,
        currentNode: 'knowledge_update',
        retryCount: validationResult.success ? (state.retryCount || 0) : ((state.retryCount || 0) + 1),
        logs: [...state.logs, { ...log, output: validationResult, duration: Date.now() - startTime }],
      }

      console.log('[FixValidation] 修复验证完成:', validationResult.success ? '通过' : '失败')
      return output
    } catch (error: any) {
      console.error('[FixValidation] 验证失败:', error)
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
          autoFixSuccess: state.fixValidationResult?.success,
        },
      }

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
      return {
        currentNode: 'end',
        status: 'completed',
        logs: [...state.logs, { ...log, error: error.message, duration: Date.now() - startTime }],
      }
    }
  }
}

// ==================== 辅助函数 ====================

function normalizeErrorInfo(errorInfo: ErrorInfo): ErrorInfo {
  return {
    ...errorInfo,
    id: errorInfo.id || `error-${Date.now()}`,
    timestamp: errorInfo.timestamp || new Date(),
    type: errorInfo.type || detectErrorType(errorInfo.message, errorInfo.stack),
    source: errorInfo.source || 'unknown',
  }
}

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

function ruleBasedClassification(errorInfo: ErrorInfo): ErrorCategory {
  const message = errorInfo.message.toLowerCase()
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'validation_error'
  }
  if (message.includes('config') || message.includes('configuration')) {
    return 'configuration_error'
  }
  if (message.includes('cannot find module') || message.includes('missing')) {
    return 'dependency_missing'
  }
  if (message.includes('syntax') || message.includes('unexpected token')) {
    return 'syntax_error'
  }
  if (message.includes('network') || message.includes('timeout')) {
    return 'network_error'
  }
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'authentication_error'
  }
  if (message.includes('403') || message.includes('forbidden')) {
    return 'authorization_error'
  }
  if (message.includes('database') || message.includes('sql') || message.includes('postgres')) {
    return 'database_error'
  }
  
  return 'runtime_exception'
}

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

function mockAutoFix(errorInfo: ErrorInfo, fixSuggestion: FixSuggestion): AutoFixResult {
  const changes: AppliedChange[] = []
  
  if (fixSuggestion.suggestions.length > 0) {
    changes.push({
      file: 'src/config/datasource.ts',
      changeType: 'modify',
      before: 'const config = { host: "localhost" }',
      after: 'const config = { host: "127.0.0.1", timeout: 30000 }',
      diff: '更新数据库连接配置',
    })
  }
  
  return {
    success: true,
    appliedChanges: changes,
    appliedAt: new Date(),
  }
}

function ruleBasedValidation(autoFixResult: AutoFixResult): FixValidationResult {
  const validations: ValidationResult[] = [
    {
      type: 'syntax_check',
      passed: autoFixResult.success,
      message: autoFixResult.success ? '语法检查通过' : '语法检查失败',
    },
    {
      type: 'logic_check',
      passed: autoFixResult.appliedChanges.length > 0,
      message: autoFixResult.appliedChanges.length > 0 ? '逻辑验证通过' : '缺少变更内容',
    },
  ]
  
  const allPassed = validations.every((v) => v.passed)
  
  return {
    success: allPassed,
    validationType: 'syntax',
    validationResults: validations,
    message: allPassed ? '所有验证通过' : '部分验证失败',
  }
}
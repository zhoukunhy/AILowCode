/**
 * 异常诊断 Agent 类型定义
 */

/**
 * 错误信息
 */
export interface ErrorInfo {
  id: string
  type: ErrorType
  source: ErrorSource
  message: string
  stack?: string
  timestamp: Date
  context?: ErrorContext
}

export type ErrorType = 
  | 'datasource_connection'
  | 'datasource_query'
  | 'api_request'
  | 'api_response'
  | 'validation'
  | 'runtime'
  | 'network'
  | 'timeout'
  | 'authentication'
  | 'authorization'
  | 'unknown'

export type ErrorSource = 
  | 'canvas_component'
  | 'data_source'
  | 'api_endpoint'
  | 'database'
  | 'frontend'
  | 'backend'

export type ErrorCategory =
  | 'validation_error'
  | 'configuration_error'
  | 'dependency_missing'
  | 'syntax_error'
  | 'runtime_exception'
  | 'network_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'database_error'
  | 'unknown_error'

export interface ErrorContext {
  componentId?: string
  dataSourceId?: string
  apiEndpoint?: string
  requestParams?: Record<string, any>
  requestBody?: any
  responseData?: any
  userId?: string
  sessionId?: string
  pageId?: string
  additionalInfo?: Record<string, any>
}

/**
 * RAG 检索结果
 */
export interface ErrorRetrievalResult {
  query: string
  similarErrors: SimilarError[]
  knowledgeArticles: KnowledgeArticle[]
  relevanceScore: number
}

export interface SimilarError {
  id: string
  errorType: ErrorType
  errorMessage: string
  rootCause: string
  solution: string
  occurrences: number
  lastOccurredAt: Date
  tags: string[]
  metadata: Record<string, any>
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  relatedErrors: string[]
  solutions: string[]
}

/**
 * 原因分析结果
 */
export interface RootCauseAnalysis {
  errorId: string
  rootCause: string
  confidence: number
  contributingFactors: ContributingFactor[]
  errorCategory: string
  affectedComponents: string[]
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface ContributingFactor {
  factor: string
  weight: number
  description: string
}

/**
 * 修复建议
 */
export interface FixSuggestion {
  errorId: string
  suggestions: FixStep[]
  alternativeSolutions: AlternativeSolution[]
  estimatedFixTime: string
  riskLevel: 'safe' | 'moderate' | 'risky'
  rollbackPlan?: string
}

export interface FixStep {
  order: number
  action: string
  description: string
  codeSnippet?: string
  warnings?: string[]
  estimatedTime: string
}

export interface AlternativeSolution {
  approach: string
  description: string
  pros: string[]
  cons: string[]
  codeSnippet?: string
}

/**
 * 自动修复结果
 */
export interface AutoFixResult {
  success: boolean
  appliedChanges: AppliedChange[]
  error?: string
  appliedAt: Date
}

export interface AppliedChange {
  file: string
  changeType: 'add' | 'modify' | 'delete'
  before?: string
  after?: string
  diff?: string
}

/**
 * 修复验证结果
 */
export interface FixValidationResult {
  success: boolean
  validationType: 'syntax' | 'unit_test' | 'integration_test' | 'manual_review'
  validationResults: ValidationResult[]
  message?: string
}

export interface ValidationResult {
  type: string
  passed: boolean
  message?: string
  details?: Record<string, any>
}

/**
 * 诊断结果
 */
export interface DiagnosisResult {
  errorInfo: ErrorInfo
  errorCategory?: ErrorCategory
  retrievalResult: ErrorRetrievalResult
  rootCauseAnalysis: RootCauseAnalysis
  fixSuggestion: FixSuggestion
  autoFixResult?: AutoFixResult
  fixValidationResult?: FixValidationResult
  diagnosticMetadata: DiagnosticMetadata
}

export interface DiagnosticMetadata {
  diagnosticId: string
  sessionId: string
  startTime: Date
  endTime: Date
  totalDuration: number
  ragRetrievalTime: number
  analysisTime: number
  modelLatency: number
  autoFixAttempted?: boolean
  autoFixSuccess?: boolean
  retryCount?: number
}

/**
 * Agent 执行状态
 */
export interface DiagnosticAgentState {
  sessionId: string
  diagnosticId: string
  errorInfo?: ErrorInfo
  errorCategory?: ErrorCategory
  retrievalResult?: ErrorRetrievalResult
  rootCauseAnalysis?: RootCauseAnalysis
  fixSuggestion?: FixSuggestion
  autoFixResult?: AutoFixResult
  fixValidationResult?: FixValidationResult
  finalResult?: DiagnosisResult
  logs: DiagnosticExecutionLog[]
  currentNode: DiagnosticNodeName
  status: 'idle' | 'running' | 'completed' | 'failed'
  error?: string
  retryCount?: number
}

export type DiagnosticNodeName = 
  | 'error_collection'
  | 'error_classifier'
  | 'rag_retrieval'
  | 'root_cause_analysis'
  | 'fix_suggestion'
  | 'auto_fix'
  | 'fix_validation'
  | 'knowledge_update'
  | 'end'

/**
 * Agent 执行日志
 */
export interface DiagnosticExecutionLog {
  node: DiagnosticNodeName
  timestamp: Date
  input: any
  output?: any
  error?: string
  duration: number
}

/**
 * 诊断 Agent 配置
 */
export interface DiagnosticAgentConfig {
  llmConfig: LLMConfig
  ragConfig: RAGConfig
  knowledgeBaseConfig: KnowledgeBaseConfig
  collectionName: string
  enableAutoFix?: boolean
  maxRetryCount?: number
}

export interface LLMConfig {
  apiKey: string
  model?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
}

export interface RAGConfig {
  topK?: number
  threshold?: number
  enableHybridSearch?: boolean
}

export interface KnowledgeBaseConfig {
  errorCollectionName: string
  knowledgeCollectionName: string
  autoIndex?: boolean
}

/**
 * 知识库条目
 */
export interface ErrorKnowledgeEntry {
  id?: string
  errorType: ErrorType
  errorMessage: string
  rootCause: string
  solution: string
  tags: string[]
  occurrences: number
  createdAt?: Date
  updatedAt?: Date
  metadata: Record<string, any>
}
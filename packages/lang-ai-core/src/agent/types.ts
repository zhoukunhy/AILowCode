/**
 * 页面规划 Agent 类型定义
 */

/**
 * 画布页面 Schema 接口
 */
export interface PageSchema {
  id?: string
  name: string
  type: 'page'
  children: ComponentSchema[]
  config?: PageConfig
}

export interface PageConfig {
  title?: string
  background?: string
  width?: number
  height?: number
  [key: string]: any
}

export interface ComponentSchema {
  id: string
  type: string
  props?: Record<string, any>
  children?: ComponentSchema[]
  style?: Record<string, any>
  events?: Record<string, any>
  [key: string]: any
}

/**
 * 需求解析结果
 */
export interface RequirementAnalysis {
  rawInput: string
  parsedIntent: string
  extractedEntities: ExtractedEntity[]
  subTasks: SubTask[]
  confidence: number
}

export interface ExtractedEntity {
  name: string
  type: 'component' | 'page' | 'feature' | 'style'
  value: string
  confidence: number
}

export interface SubTask {
  id: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'completed' | 'failed'
}

/**
 * RAG 召回结果
 */
export interface RAGRetrievalResult {
  query: string
  retrievedDocs: RetrievedDocument[]
  knowledgeBaseIds: number[]
  relevanceScore: number
}

export interface RetrievedDocument {
  id: string
  content: string
  source: string
  sourceType: 'page' | 'component' | 'spec'
  score: number
  metadata: Record<string, any>
}

/**
 * Schema 生成结果
 */
export interface SchemaGenerationResult {
  pageSchema: PageSchema
  referencedComponents: string[]
  reasoning: string
  alternatives?: PageSchema[]
}

/**
 * 校验结果
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  correctedSchema?: PageSchema
}

export interface ValidationError {
  path: string
  message: string
  severity: 'error'
}

export interface ValidationWarning {
  path: string
  message: string
  severity: 'warning'
}

/**
 * Agent 执行状态
 */
export interface AgentState {
  sessionId?: string
  userInput: string
  requirementAnalysis?: RequirementAnalysis
  ragResults?: RAGRetrievalResult
  schemaResult?: SchemaGenerationResult
  validationResult?: ValidationResult
  finalSchema?: PageSchema
  error?: string
  logs: AgentExecutionLog[]
  currentNode: AgentNodeName
  status: 'idle' | 'running' | 'completed' | 'failed'
}

export type AgentNodeName = 
  | 'requirement_analysis'
  | 'rag_retrieval'
  | 'schema_generation'
  | 'validation'
  | 'end'

/**
 * Agent 执行日志
 */
export interface AgentExecutionLog {
  node: AgentNodeName
  timestamp: Date
  input: any
  output?: any
  error?: string
  duration: number
}

/**
 * 规划 Agent 配置
 */
export interface PlanningAgentConfig {
  llmConfig: {
    apiKey: string
    model?: string
    baseUrl?: string
    temperature?: number
  }
  ragConfig: {
    knowledgeBaseIds: number[]
    topK?: number
    threshold?: number
  }
  schemaConfig: {
    defaultPageSize?: { width: number; height: number }
    componentLibrary?: string[]
  }
}

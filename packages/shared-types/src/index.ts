// 组件类型定义
export interface ComponentType {
  id: string
  type: string
  name: string
  icon: string
  category: string
  props: ComponentProps
  schema?: ComponentSchema
}

export interface ComponentProps {
  [key: string]: PropDefinition
}

export interface PropDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function'
  label: string
  default?: any
  required?: boolean
  options?: Array<{ label: string; value: any }>
}

export interface ComponentSchema {
  width: number
  height: number
  x: number
  y: number
  rotation?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
}

// 项目类型定义
export interface Project {
  id: string
  name: string
  description?: string
  schema: ProjectSchema
  status: 'draft' | 'published' | 'archived'
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectSchema {
  version: string
  pages: Page[]
  globalConfig: GlobalConfig
}

export interface Page {
  id: string
  name: string
  path: string
  components: CanvasComponent[]
  style?: PageStyle
}

export interface CanvasComponent {
  id: string
  type: string
  props: Record<string, any>
  schema: ComponentSchema
  children?: CanvasComponent[]
}

export interface PageStyle {
  backgroundColor?: string
  backgroundImage?: string
  width?: number
  height?: number
}

export interface GlobalConfig {
  title?: string
  description?: string
  theme?: ThemeConfig
}

export interface ThemeConfig {
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
}

// 用户类型定义
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

// 模板类型定义
export interface Template {
  id: string
  name: string
  description?: string
  category: string
  schema: ProjectSchema
  downloads: number
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 分页类型
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==================== AI 相关类型定义 ====================

/**
 * LLM 提供商类型
 */
export type LLMProvider = 'deepseek' | 'qwen' | 'openai'

/**
 * LLM 配置
 */
export interface LLMConfig {
  provider: LLMProvider
  model?: string
  apiKey: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

/**
 * Milvus 向量库配置
 */
export interface MilvusConfig {
  address: string
  username?: string
  password?: string
  ssl?: boolean
  database?: string
}

/**
 * RAG 文档类型
 */
export interface RAGDocument {
  id: string
  content: string
  embedding: number[]
  metadata?: Record<string, any>
}

/**
 * RAG 配置
 */
export interface RAGConfig {
  embeddingApiKey: string
  embeddingModel?: string
  embeddingBaseUrl?: string
  chunkSize?: number
  chunkOverlap?: number
}

/**
 * Agent 输入参数
 */
export interface AgentInput {
  query: string
  context?: Record<string, any>
  tools?: ToolDescription[]
  conversationId?: string
}

/**
 * Agent 输出结果
 */
export interface AgentOutput {
  response: string
  toolCalls?: ToolCallResult[]
  metadata?: Record<string, any>
}

/**
 * 工具描述
 */
export interface ToolDescription {
  name: string
  description: string
  parameters: ToolParameter[]
}

/**
 * 工具参数
 */
export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required?: boolean
  default?: any
}

/**
 * 工具调用结果
 */
export interface ToolCallResult {
  toolName: string
  input: Record<string, any>
  output: any
  success: boolean
  error?: string
}

/**
 * 知识库文档
 */
export interface KnowledgeDocument {
  id: number
  name: string
  content: string
  type: string
  size?: number
  vectorStatus: 'pending' | 'processing' | 'completed' | 'failed'
  chunkCount?: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * Agent 会话记录
 */
export interface AgentConversation {
  id: number
  agentId: string
  userId: number
  messages: ConversationMessage[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * 会话消息
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCallResult[]
  timestamp: Date
}

/**
 * 工具调用日志
 */
export interface ToolCallLog {
  id: number
  conversationId: number
  toolName: string
  input: Record<string, any>
  output: any
  success: boolean
  error?: string
  duration: number
  createdAt: Date
}

/**
 * AI 配置
 */
export interface AIConfig {
  llm: LLMConfig
  milvus: MilvusConfig
  rag: RAGConfig
}


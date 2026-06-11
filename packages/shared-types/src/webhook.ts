/**
 * Webhook 事件类型定义
 */

/**
 * Webhook 事件类型枚举
 */
export enum WebhookEventType {
  // 项目事件
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  
  // 页面事件
  PAGE_CREATED = 'page.created',
  PAGE_UPDATED = 'page.updated',
  PAGE_DELETED = 'page.deleted',
  PAGE_PUBLISHED = 'page.published',
  PAGE_VERSION_CREATED = 'page.version.created',
  
  // 工作流事件
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',
  WORKFLOW_NODE_COMPLETED = 'workflow.node.completed',
  
  // 用户事件
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGGED_IN = 'user.logged_in',
  
  // 数据源事件
  DATASOURCE_CONNECTED = 'datasource.connected',
  DATASOURCE_DISCONNECTED = 'datasource.disconnected',
  DATASOURCE_QUERIED = 'datasource.queried',
  
  // AI事件
  AI_GENERATION_COMPLETED = 'ai.generation.completed',
  AI_GENERATION_FAILED = 'ai.generation.failed',
  
  // 代码生成事件
  CODE_GENERATED = 'code.generated',
  CODE_DEPLOYED = 'code.deployed',
  
  // 知识库事件
  KNOWLEDGE_ADDED = 'knowledge.added',
  KNOWLEDGE_DELETED = 'knowledge.deleted',
  KNOWLEDGE_VECTORIZED = 'knowledge.vectorized',
}

/**
 * Webhook 状态枚举
 */
export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
}

/**
 * Webhook 触发方式
 */
export enum WebhookTriggerType {
  SYNC = 'sync',
  ASYNC = 'async',
}

/**
 * Webhook 签名算法
 */
export enum WebhookSignatureAlgorithm {
  HMAC_SHA256 = 'hmac_sha256',
  HMAC_SHA512 = 'hmac_sha512',
}

/**
 * Webhook 重试策略
 */
export interface WebhookRetryConfig {
  maxRetries: number
  delayMs: number
  backoffMultiplier: number
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: WebhookRetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
}

/**
 * Webhook 配置接口
 */
export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: WebhookEventType[]
  status: WebhookStatus
  triggerType: WebhookTriggerType
  signatureAlgorithm?: WebhookSignatureAlgorithm
  secret?: string
  headers?: Record<string, string>
  retryConfig?: WebhookRetryConfig
  projectId?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Webhook 事件负载接口
 */
export interface WebhookEventPayload {
  eventId: string
  eventType: WebhookEventType
  timestamp: number
  data: Record<string, unknown>
  metadata: {
    projectId?: string
    userId?: string
    source: string
  }
}

/**
 * Webhook 日志状态
 */
export enum WebhookLogStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * Webhook 日志接口
 */
export interface WebhookLog {
  id: string
  webhookId: string
  eventType: WebhookEventType
  payload: WebhookEventPayload
  responseStatus?: number
  responseBody?: string
  status: WebhookLogStatus
  retryCount: number
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Webhook 事件分组
 */
export const WEBHOOK_EVENT_GROUPS: Record<string, WebhookEventType[]> = {
  project: [
    WebhookEventType.PROJECT_CREATED,
    WebhookEventType.PROJECT_UPDATED,
    WebhookEventType.PROJECT_DELETED,
  ],
  page: [
    WebhookEventType.PAGE_CREATED,
    WebhookEventType.PAGE_UPDATED,
    WebhookEventType.PAGE_DELETED,
    WebhookEventType.PAGE_PUBLISHED,
    WebhookEventType.PAGE_VERSION_CREATED,
  ],
  workflow: [
    WebhookEventType.WORKFLOW_STARTED,
    WebhookEventType.WORKFLOW_COMPLETED,
    WebhookEventType.WORKFLOW_FAILED,
    WebhookEventType.WORKFLOW_NODE_COMPLETED,
  ],
  user: [
    WebhookEventType.USER_CREATED,
    WebhookEventType.USER_UPDATED,
    WebhookEventType.USER_DELETED,
    WebhookEventType.USER_LOGGED_IN,
  ],
  datasource: [
    WebhookEventType.DATASOURCE_CONNECTED,
    WebhookEventType.DATASOURCE_DISCONNECTED,
    WebhookEventType.DATASOURCE_QUERIED,
  ],
  ai: [
    WebhookEventType.AI_GENERATION_COMPLETED,
    WebhookEventType.AI_GENERATION_FAILED,
  ],
  codegen: [
    WebhookEventType.CODE_GENERATED,
    WebhookEventType.CODE_DEPLOYED,
  ],
  knowledge: [
    WebhookEventType.KNOWLEDGE_ADDED,
    WebhookEventType.KNOWLEDGE_DELETED,
    WebhookEventType.KNOWLEDGE_VECTORIZED,
  ],
}

/**
 * 获取事件组名称
 */
export function getEventGroupName(eventType: WebhookEventType): string {
  for (const [groupName, events] of Object.entries(WEBHOOK_EVENT_GROUPS)) {
    if (events.includes(eventType)) {
      return groupName
    }
  }
  return 'other'
}
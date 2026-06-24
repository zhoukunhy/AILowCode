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

// 自定义组件相关类型
export interface CustomComponentDefinition {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  icon: string
  version: string
  author: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'published' | 'deprecated'
  // 组件模板配置
  template: CustomComponentTemplate
  // 属性定义
  propsSchema: CustomPropSchema
  // 事件定义
  events?: CustomEventDefinition[]
  // 数据源配置
  dataSource?: CustomDataSourceConfig
  // 依赖的其他组件
  dependencies?: string[]
  // 标签
  tags?: string[]
}

export interface CustomComponentTemplate {
  // 模板类型：visual（可视化组合）、code（代码定义）
  type: 'visual' | 'code'
  // 可视化模板：子组件配置
  visualConfig?: VisualTemplateConfig
  // 代码模板：渲染函数代码
  codeConfig?: CodeTemplateConfig
}

export interface VisualTemplateConfig {
  // 子组件列表
  children: CanvasComponent[]
  // 布局配置
  layout: {
    type: 'flex' | 'grid' | 'absolute'
    direction?: 'row' | 'column'
    gap?: number
    alignItems?: string
    justifyContent?: string
  }
  // 容器样式
  containerStyle?: Record<string, any>
}

export interface CodeTemplateConfig {
  // 渲染函数代码（JavaScript/TypeScript）
  renderCode: string
  // 样式代码（CSS）
  styleCode?: string
  // 逻辑代码
  logicCode?: string
  // 入口文件
  entryFile?: string
}

export interface CustomPropSchema {
  // 属性定义列表
  properties: Record<string, CustomPropDefinition>
  // 必填属性
  required?: string[]
}

export interface CustomPropDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'color' | 'select' | 'date'
  title: string
  description?: string
  default?: any
  // 对于 select 类型
  enum?: Array<{ label: string; value: any }>
  // 对于 object/array 类型
  properties?: Record<string, CustomPropDefinition>
  items?: CustomPropDefinition
  // 验证规则
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
  }
  // 是否支持数据绑定
  bindable?: boolean
  // 是否在属性面板显示
  visible?: boolean
  // 属性分组
  group?: string
}

export interface CustomEventDefinition {
  name: string
  title: string
  description?: string
  // 事件参数
  params?: Array<{
    name: string
    type: string
    description?: string
  }>
}

export interface CustomDataSourceConfig {
  // 支持的数据源类型
  types: Array<'api' | 'database' | 'static' | 'websocket'>
  // 默认数据源配置
  defaultConfig?: {
    type: string
    url?: string
    method?: string
    params?: Record<string, any>
  }
  // 数据映射配置
  mapping?: Record<string, string>
}

// 自定义组件实例（在画布中使用）
export interface CustomComponentInstance {
  id: string
  customComponentId: string
  version: string
  props: Record<string, any>
  eventBindings?: Record<string, string>
  dataSourceBinding?: {
    type: string
    sourceId: string
    fieldMapping?: Record<string, string>
  }
}

// 自定义组件模板库
export interface CustomComponentTemplateLibrary {
  id: string
  name: string
  description: string
  category: string
  template: CustomComponentDefinition
  usageCount: number
  rating: number
  tags: string[]
  author: string
  createdAt: Date
}

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

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

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

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

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

export type LLMProvider = 'deepseek' | 'qwen' | 'openai'

export interface LLMConfig {
  provider: LLMProvider
  model?: string
  apiKey: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

export interface ChromaConfig {
  url: string
  apiKey?: string
  collectionName?: string
}

export interface RAGDocument {
  id: string
  content: string
  embedding: number[]
  metadata?: Record<string, any>
}

export interface RAGConfig {
  embeddingApiKey: string
  embeddingModel?: string
  embeddingBaseUrl?: string
  chunkSize?: number
  chunkOverlap?: number
}

export interface AgentInput {
  query: string
  context?: Record<string, any>
  tools?: ToolDescription[]
  conversationId?: string
}

export interface AgentOutput {
  response: string
  toolCalls?: ToolCallResult[]
  metadata?: Record<string, any>
}

export interface ToolDescription {
  name: string
  description: string
  parameters: ToolParameter[]
}

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required?: boolean
  default?: any
}

export interface ToolCallResult {
  toolName: string
  input: Record<string, any>
  output: any
  success: boolean
  error?: string
}

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

export interface AgentConversation {
  id: number
  agentId: string
  userId: number
  messages: ConversationMessage[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCallResult[]
  timestamp: Date
}

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

export interface AIConfig {
  llm: LLMConfig
  chroma: ChromaConfig
  rag: RAGConfig
}

export type ProcessStatus = 'draft' | 'active' | 'inactive'

export type NodeType = 'start' | 'approve' | 'condition' | 'fork' | 'join' | 'end' | 'action'

export interface ProcessNode {
  id: string
  type: NodeType
  name: string
  description?: string
  x: number
  y: number
  width: number
  height: number
  config?: Record<string, any>
  zIndex: number
  processDefinitionId: string
}

export interface ProcessCondition {
  type: 'expression' | 'script' | 'data'
  value: string
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in'
  compareValue?: any
}

export interface ProcessTransition {
  id: string
  sourceNodeId: string
  targetNodeId: string
  label?: string
  condition?: ProcessCondition
  points?: { x: number; y: number }[]
  zIndex: number
}

export interface ProcessDefinition {
  id: string
  name: string
  description?: string
  status: ProcessStatus
  startNodeId?: string
  metadata?: Record<string, any>
  creatorId: string
  createdAt: Date
  updatedAt: Date
  nodes?: ProcessNode[]
  transitions?: ProcessTransition[]
}

export interface SaveProcessDto {
  id?: string
  name: string
  description?: string
  status?: ProcessStatus
  startNodeId?: string
  metadata?: Record<string, any>
  creatorId: string
  nodes: ProcessNode[]
  transitions: ProcessTransition[]
}

export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: string[]
  isSystem?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  id: string
  name: string
  code: string
  type: 'menu' | 'button' | 'api'
  parentId?: number
  path?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description?: string
}

export interface MenuItem {
  id: string
  name: string
  path?: string
  icon?: string
  parentId?: string
  order: number
  permissions: string[]
  children?: MenuItem[]
}

export interface UserRole {
  userId: string
  roleId: string
  assignedAt: Date
  assignedBy?: string
}

export interface RolePermission {
  roleId: string
  permissionId: string
  grantedAt: Date
  grantedBy?: string
}

export const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '超级管理员',
    code: 'super_admin',
    description: '拥有系统所有权限',
    permissions: ['*'],
    isSystem: true,
  },
  {
    name: '管理员',
    code: 'admin',
    description: '拥有大部分管理权限',
    permissions: [
      'user:read', 'user:write', 'user:delete',
      'role:read', 'role:write',
      'project:read', 'project:write', 'project:delete',
      'page:read', 'page:write', 'page:delete',
      'knowledge:read', 'knowledge:write',
      'ai:config',
    ],
    isSystem: true,
  },
  {
    name: '普通用户',
    code: 'user',
    description: '基础用户权限',
    permissions: [
      'project:read', 'project:write',
      'page:read', 'page:write',
      'knowledge:read',
    ],
    isSystem: true,
  },
  {
    name: '访客',
    code: 'guest',
    description: '只读权限',
    permissions: [
      'project:read',
      'page:read',
    ],
    isSystem: true,
  },
]

export const DEFAULT_PERMISSIONS: Omit<Permission, 'id'>[] = [
  { name: '查看用户', code: 'user:read', type: 'button' },
  { name: '编辑用户', code: 'user:write', type: 'button' },
  { name: '删除用户', code: 'user:delete', type: 'button' },
  { name: '查看角色', code: 'role:read', type: 'button' },
  { name: '编辑角色', code: 'role:write', type: 'button' },
  { name: '查看项目', code: 'project:read', type: 'button' },
  { name: '编辑项目', code: 'project:write', type: 'button' },
  { name: '删除项目', code: 'project:delete', type: 'button' },
  { name: '查看页面', code: 'page:read', type: 'button' },
  { name: '编辑页面', code: 'page:write', type: 'button' },
  { name: '删除页面', code: 'page:delete', type: 'button' },
  { name: '查看知识库', code: 'knowledge:read', type: 'button' },
  { name: '编辑知识库', code: 'knowledge:write', type: 'button' },
  { name: 'AI 配置', code: 'ai:config', type: 'button' },
]

export const DEFAULT_MENUS: Omit<MenuItem, 'id'>[] = [
  {
    name: '仪表盘',
    path: '/dashboard',
    icon: 'dashboard',
    order: 1,
    permissions: ['project:read'],
  },
  {
    name: '项目管理',
    path: '/projects',
    icon: 'folder',
    order: 2,
    permissions: ['project:read', 'project:write'],
    children: [
      { id: 'project-list', name: '项目列表', path: '/projects/list', order: 1, permissions: ['project:read'] },
      { id: 'project-create', name: '创建项目', path: '/projects/create', order: 2, permissions: ['project:write'] },
    ] as MenuItem[],
  },
  {
    name: '画布编辑',
    path: '/canvas',
    icon: 'edit',
    order: 3,
    permissions: ['page:read', 'page:write'],
  },
  {
    name: '知识库',
    path: '/knowledge',
    icon: 'book',
    order: 4,
    permissions: ['knowledge:read', 'knowledge:write'],
  },
  {
    name: 'AI 助手',
    path: '/ai-assistant',
    icon: 'robot',
    order: 5,
    permissions: ['*'],
  },
  {
    name: '系统管理',
    path: '/admin',
    icon: 'settings',
    order: 6,
    permissions: ['user:read', 'role:read'],
    children: [
      { id: 'admin-users', name: '用户管理', path: '/admin/users', order: 1, permissions: ['user:read', 'user:write'] },
      { id: 'admin-roles', name: '角色管理', path: '/admin/roles', order: 2, permissions: ['role:read', 'role:write'] },
      { id: 'admin-ai-config', name: 'AI 配置', path: '/admin/ai-config', order: 3, permissions: ['ai:config'] },
    ] as MenuItem[],
  },
]

export class PermissionService {
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (userPermissions.includes('*')) {
      return true
    }
    return userPermissions.includes(requiredPermission)
  }

  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(p => this.hasPermission(userPermissions, p))
  }

  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(p => this.hasPermission(userPermissions, p))
  }

  getAccessibleMenus(menus: MenuItem[], userPermissions: string[]): MenuItem[] {
    const result: MenuItem[] = []

    for (const menu of menus) {
      const accessibleChildren = menu.children
        ? this.getAccessibleMenus(menu.children, userPermissions)
        : []

      if (menu.children) {
        if (accessibleChildren.length > 0) {
          result.push({
            ...menu,
            children: accessibleChildren,
          })
        }
      } else {
        if (this.hasAnyPermission(userPermissions, menu.permissions)) {
          result.push(menu)
        }
      }
    }

    return result
  }

  filterMenuPermissions(menus: MenuItem[], userPermissions: string[]): string[] {
    const accessibleMenus = this.getAccessibleMenus(menus, userPermissions)
    const permissions: string[] = []

    const extractPermissions = (items: MenuItem[]) => {
      for (const item of items) {
        permissions.push(...item.permissions)
        if (item.children) {
          extractPermissions(item.children)
        }
      }
    }

    extractPermissions(accessibleMenus)
    return [...new Set(permissions)]
  }
}

export function createPermissionService(): PermissionService {
  return new PermissionService()
}

export enum WebhookEventType {
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  PAGE_CREATED = 'page.created',
  PAGE_UPDATED = 'page.updated',
  PAGE_DELETED = 'page.deleted',
  PAGE_PUBLISHED = 'page.published',
  PAGE_VERSION_CREATED = 'page.version.created',
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',
  WORKFLOW_NODE_COMPLETED = 'workflow.node.completed',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGGED_IN = 'user.logged_in',
  DATASOURCE_CONNECTED = 'datasource.connected',
  DATASOURCE_DISCONNECTED = 'datasource.disconnected',
  DATASOURCE_QUERIED = 'datasource.queried',
  AI_GENERATION_COMPLETED = 'ai.generation.completed',
  AI_GENERATION_FAILED = 'ai.generation.failed',
  CODE_GENERATED = 'code.generated',
  CODE_DEPLOYED = 'code.deployed',
  KNOWLEDGE_ADDED = 'knowledge.added',
  KNOWLEDGE_DELETED = 'knowledge.deleted',
  KNOWLEDGE_VECTORIZED = 'knowledge.vectorized',
}

export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
}

export enum WebhookTriggerType {
  SYNC = 'sync',
  ASYNC = 'async',
}

export enum WebhookSignatureAlgorithm {
  HMAC_SHA256 = 'hmac_sha256',
  HMAC_SHA512 = 'hmac_sha512',
}

export interface WebhookRetryConfig {
  maxRetries: number
  delayMs: number
  backoffMultiplier: number
}

export const DEFAULT_RETRY_CONFIG: WebhookRetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
}

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

export enum WebhookLogStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

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

export function getEventGroupName(eventType: WebhookEventType): string {
  for (const [groupName, events] of Object.entries(WEBHOOK_EVENT_GROUPS)) {
    if (events.includes(eventType)) {
      return groupName
    }
  }
  return 'other'
}
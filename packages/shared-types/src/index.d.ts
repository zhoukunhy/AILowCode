export interface ComponentType {
    id: string;
    type: string;
    name: string;
    icon: string;
    category: string;
    props: ComponentProps;
    schema?: ComponentSchema;
}
export interface ComponentProps {
    [key: string]: PropDefinition;
}
export interface PropDefinition {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
    label: string;
    default?: any;
    required?: boolean;
    options?: Array<{
        label: string;
        value: any;
    }>;
}
export interface ComponentSchema {
    width: number;
    height: number;
    x: number;
    y: number;
    rotation?: number;
    opacity?: number;
    visible?: boolean;
    locked?: boolean;
}
export interface CustomComponentDefinition {
    id: string;
    name: string;
    displayName: string;
    description: string;
    category: string;
    icon: string;
    version: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    status: 'draft' | 'published' | 'deprecated';
    template: CustomComponentTemplate;
    propsSchema: CustomPropSchema;
    events?: CustomEventDefinition[];
    dataSource?: CustomDataSourceConfig;
    dependencies?: string[];
    tags?: string[];
}
export interface CustomComponentTemplate {
    type: 'visual' | 'code';
    visualConfig?: VisualTemplateConfig;
    codeConfig?: CodeTemplateConfig;
}
export interface VisualTemplateConfig {
    children: CanvasComponent[];
    layout: {
        type: 'flex' | 'grid' | 'absolute';
        direction?: 'row' | 'column';
        gap?: number;
        alignItems?: string;
        justifyContent?: string;
    };
    containerStyle?: Record<string, any>;
}
export interface CodeTemplateConfig {
    renderCode: string;
    styleCode?: string;
    logicCode?: string;
    entryFile?: string;
}
export interface CustomPropSchema {
    properties: Record<string, CustomPropDefinition>;
    required?: string[];
}
export interface CustomPropDefinition {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'color' | 'select' | 'date';
    title: string;
    description?: string;
    default?: any;
    enum?: Array<{
        label: string;
        value: any;
    }>;
    properties?: Record<string, CustomPropDefinition>;
    items?: CustomPropDefinition;
    validation?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
    };
    bindable?: boolean;
    visible?: boolean;
    group?: string;
}
export interface CustomEventDefinition {
    name: string;
    title: string;
    description?: string;
    params?: Array<{
        name: string;
        type: string;
        description?: string;
    }>;
    childComponentId?: string;
    childEventName?: string;
}
export interface CustomDataSourceConfig {
    types: Array<'api' | 'database' | 'static' | 'websocket'>;
    defaultConfig?: {
        type: string;
        url?: string;
        method?: string;
        params?: Record<string, any>;
    };
    mapping?: Record<string, string>;
}
export interface CustomComponentInstance {
    id: string;
    customComponentId: string;
    version: string;
    props: Record<string, any>;
    eventBindings?: Record<string, string>;
    dataSourceBinding?: {
        type: string;
        sourceId: string;
        fieldMapping?: Record<string, string>;
    };
}
export interface CustomComponentTemplateLibrary {
    id: string;
    name: string;
    description: string;
    category: string;
    template: CustomComponentDefinition;
    usageCount: number;
    rating: number;
    tags: string[];
    author: string;
    createdAt: Date;
}
export interface Project {
    id: string;
    name: string;
    description?: string;
    schema: ProjectSchema;
    status: 'draft' | 'published' | 'archived';
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProjectSchema {
    version: string;
    pages: Page[];
    globalConfig: GlobalConfig;
}
export interface Page {
    id: string;
    name: string;
    path: string;
    components: CanvasComponent[];
    style?: PageStyle;
}
export interface CanvasComponent {
    id: string;
    type: string;
    props: Record<string, any>;
    schema: ComponentSchema;
    children?: CanvasComponent[];
}
export interface PageStyle {
    backgroundColor?: string;
    backgroundImage?: string;
    width?: number;
    height?: number;
}
export interface GlobalConfig {
    title?: string;
    description?: string;
    theme?: ThemeConfig;
}
export interface ThemeConfig {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
}
export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}
export interface Template {
    id: string;
    name: string;
    description?: string;
    category: string;
    schema: ProjectSchema;
    downloads: number;
    status: 'draft' | 'published';
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}
export interface PaginationParams {
    page: number;
    pageSize: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export type LLMProvider = 'deepseek' | 'qwen' | 'openai';
export interface LLMConfig {
    provider: LLMProvider;
    model?: string;
    apiKey: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}
export interface ChromaConfig {
    url: string;
    apiKey?: string;
    collectionName?: string;
}
export interface RAGDocument {
    id: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, any>;
}
export interface RAGConfig {
    embeddingApiKey: string;
    embeddingModel?: string;
    embeddingBaseUrl?: string;
    chunkSize?: number;
    chunkOverlap?: number;
}
export interface AgentInput {
    query: string;
    context?: Record<string, any>;
    tools?: ToolDescription[];
    conversationId?: string;
}
export interface AgentOutput {
    response: string;
    toolCalls?: ToolCallResult[];
    metadata?: Record<string, any>;
}
export interface ToolDescription {
    name: string;
    description: string;
    parameters: ToolParameter[];
}
export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    default?: any;
}
export interface ToolCallResult {
    toolName: string;
    input: Record<string, any>;
    output: any;
    success: boolean;
    error?: string;
}
export interface KnowledgeDocument {
    id: number;
    name: string;
    content: string;
    type: string;
    size?: number;
    vectorStatus: 'pending' | 'processing' | 'completed' | 'failed';
    chunkCount?: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface AgentConversation {
    id: number;
    agentId: string;
    userId: number;
    messages: ConversationMessage[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolCalls?: ToolCallResult[];
    timestamp: Date;
}
export interface ToolCallLog {
    id: number;
    conversationId: number;
    toolName: string;
    input: Record<string, any>;
    output: any;
    success: boolean;
    error?: string;
    duration: number;
    createdAt: Date;
}
export interface AIConfig {
    llm: LLMConfig;
    chroma: ChromaConfig;
    rag: RAGConfig;
}
export type ProcessStatus = 'draft' | 'active' | 'inactive';
export type NodeType = 'start' | 'approve' | 'condition' | 'fork' | 'join' | 'end' | 'action';
export interface ProcessNode {
    id: string;
    type: NodeType;
    name: string;
    description?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    config?: Record<string, any>;
    zIndex: number;
    processDefinitionId: string;
}
export interface ProcessCondition {
    type: 'expression' | 'script' | 'data';
    value: string;
    operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
    compareValue?: any;
}
export interface ProcessTransition {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    label?: string;
    condition?: ProcessCondition;
    points?: {
        x: number;
        y: number;
    }[];
    zIndex: number;
}
export interface ProcessDefinition {
    id: string;
    name: string;
    description?: string;
    status: ProcessStatus;
    startNodeId?: string;
    metadata?: Record<string, any>;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
    nodes?: ProcessNode[];
    transitions?: ProcessTransition[];
}
export interface SaveProcessDto {
    id?: string;
    name: string;
    description?: string;
    status?: ProcessStatus;
    startNodeId?: string;
    metadata?: Record<string, any>;
    creatorId: string;
    nodes: ProcessNode[];
    transitions: ProcessTransition[];
}
export interface Role {
    id: string;
    name: string;
    code: string;
    description?: string;
    permissions: string[];
    isSystem?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Permission {
    id: string;
    name: string;
    code: string;
    type: 'menu' | 'button' | 'api';
    parentId?: number;
    path?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description?: string;
}
export interface MenuItem {
    id: string;
    name: string;
    path?: string;
    icon?: string;
    parentId?: string;
    order: number;
    permissions: string[];
    children?: MenuItem[];
}
export interface UserRole {
    userId: string;
    roleId: string;
    assignedAt: Date;
    assignedBy?: string;
}
export interface RolePermission {
    roleId: string;
    permissionId: string;
    grantedAt: Date;
    grantedBy?: string;
}
export declare const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[];
export declare const DEFAULT_PERMISSIONS: Omit<Permission, 'id'>[];
export declare const DEFAULT_MENUS: Omit<MenuItem, 'id'>[];
export declare class PermissionService {
    hasPermission(userPermissions: string[], requiredPermission: string): boolean;
    hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean;
    hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean;
    getAccessibleMenus(menus: MenuItem[], userPermissions: string[]): MenuItem[];
    filterMenuPermissions(menus: MenuItem[], userPermissions: string[]): string[];
}
export declare function createPermissionService(): PermissionService;
export declare enum WebhookEventType {
    PROJECT_CREATED = "project.created",
    PROJECT_UPDATED = "project.updated",
    PROJECT_DELETED = "project.deleted",
    PAGE_CREATED = "page.created",
    PAGE_UPDATED = "page.updated",
    PAGE_DELETED = "page.deleted",
    PAGE_PUBLISHED = "page.published",
    PAGE_VERSION_CREATED = "page.version.created",
    WORKFLOW_STARTED = "workflow.started",
    WORKFLOW_COMPLETED = "workflow.completed",
    WORKFLOW_FAILED = "workflow.failed",
    WORKFLOW_NODE_COMPLETED = "workflow.node.completed",
    USER_CREATED = "user.created",
    USER_UPDATED = "user.updated",
    USER_DELETED = "user.deleted",
    USER_LOGGED_IN = "user.logged_in",
    DATASOURCE_CONNECTED = "datasource.connected",
    DATASOURCE_DISCONNECTED = "datasource.disconnected",
    DATASOURCE_QUERIED = "datasource.queried",
    AI_GENERATION_COMPLETED = "ai.generation.completed",
    AI_GENERATION_FAILED = "ai.generation.failed",
    CODE_GENERATED = "code.generated",
    CODE_DEPLOYED = "code.deployed",
    KNOWLEDGE_ADDED = "knowledge.added",
    KNOWLEDGE_DELETED = "knowledge.deleted",
    KNOWLEDGE_VECTORIZED = "knowledge.vectorized"
}
export declare enum WebhookStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    DISABLED = "disabled"
}
export declare enum WebhookTriggerType {
    SYNC = "sync",
    ASYNC = "async"
}
export declare enum WebhookSignatureAlgorithm {
    HMAC_SHA256 = "hmac_sha256",
    HMAC_SHA512 = "hmac_sha512"
}
export interface WebhookRetryConfig {
    maxRetries: number;
    delayMs: number;
    backoffMultiplier: number;
}
export declare const DEFAULT_RETRY_CONFIG: WebhookRetryConfig;
export interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    events: WebhookEventType[];
    status: WebhookStatus;
    triggerType: WebhookTriggerType;
    signatureAlgorithm?: WebhookSignatureAlgorithm;
    secret?: string;
    headers?: Record<string, string>;
    retryConfig?: WebhookRetryConfig;
    projectId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface WebhookEventPayload {
    eventId: string;
    eventType: WebhookEventType;
    timestamp: number;
    data: Record<string, unknown>;
    metadata: {
        projectId?: string;
        userId?: string;
        source: string;
    };
}
export declare enum WebhookLogStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    RETRYING = "retrying"
}
export interface WebhookLog {
    id: string;
    webhookId: string;
    eventType: WebhookEventType;
    payload: WebhookEventPayload;
    responseStatus?: number;
    responseBody?: string;
    status: WebhookLogStatus;
    retryCount: number;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WEBHOOK_EVENT_GROUPS: Record<string, WebhookEventType[]>;
export declare function getEventGroupName(eventType: WebhookEventType): string;
//# sourceMappingURL=index.d.ts.map
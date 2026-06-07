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
export interface MilvusConfig {
    address: string;
    username?: string;
    password?: string;
    ssl?: boolean;
    database?: string;
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
    milvus: MilvusConfig;
    rag: RAGConfig;
}
//# sourceMappingURL=index.d.ts.map
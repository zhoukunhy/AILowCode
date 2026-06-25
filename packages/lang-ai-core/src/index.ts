/**
 * @ai-lowcode/lang-ai-core
 * AI Language Model Core Package
 *
 * 集成 LangChain、LangGraph、Chroma 向量库
 * 提供 LLM 工厂、RAG 处理、向量存储等功能
 */

// LLM 相关
export { LLMFactory } from './llm/LLMFactory'

// 向量存储相关
export { ChromaVectorStore } from './vectorstore/ChromaVectorStore'

// RAG 相关
export { RAGProcessor } from './rag/RAGProcessor'
export { DocumentLoaderFactory, TextLoader, MarkdownLoader, ApiDocLoader, RequirementDocLoader } from './rag/DocumentLoader'
export { VectorRetrievalService } from './rag/VectorRetrievalService'
export { RAGPipelineService } from './rag/RAGPipelineService'

// Agent 相关
export { PagePlanningAgent, createPagePlanningAgent } from './agent/PagePlanningAgent'
export { LangGraphExecutor } from './agent/LangGraphExecutor'
export { createRequirementAnalysisNode } from './agent/nodes/RequirementAnalysisNode'
export { createRAGRetrievalNode } from './agent/nodes/RAGRetrievalNode'
export { createSchemaGenerationNode } from './agent/nodes/SchemaGenerationNode'
export { createValidationNode } from './agent/nodes/ValidationNode'

// 类型定义
export type {
  LLMConfig,
  LLMProvider,
  ChromaConfig,
  RAGDocument,
  RAGConfig,
} from '@ai-lowcode/shared-types'

export type {
  RetrievalResult,
  RetrievalContext,
} from './rag/VectorRetrievalService'

export type {
  RAGPipelineConfig,
  VectorizationLog,
} from './rag/RAGPipelineService'

// Agent 类型定义
export type {
  PageSchema,
  PageConfig,
  ComponentSchema,
  RequirementAnalysis,
  ExtractedEntity,
  SubTask,
  RAGRetrievalResult,
  RetrievedDocument,
  SchemaGenerationResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  AgentState,
  AgentNodeName,
  AgentExecutionLog,
  PlanningAgentConfig,
} from './agent/types'

export type {
  StateUpdate,
  RouteFunction,
  GraphNode,
  GraphEdge,
  LangGraphDefinition,
} from './agent/LangGraphState'

// 异常诊断 Agent
export {
  DiagnosticService,
  createDiagnosticService,
} from './agent/diagnostic/DiagnosticService'

export {
  DiagnosticAgentExecutor,
  createDiagnosticAgentExecutor,
} from './agent/diagnostic/DiagnosticAgentExecutor'

export {
  createErrorCollectionNode,
  createErrorClassifierNode,
  createRAGRetrievalNode as createDiagnosticRAGRetrievalNode,
  createRootCauseAnalysisNode,
  createFixSuggestionNode,
  createAutoFixNode,
  createFixValidationNode,
  createKnowledgeUpdateNode,
} from './agent/diagnostic/DiagnosticAgentNodes'

// 异常诊断 API
export {
  createDiagnosticRouter,
  createDiagnosticApp,
} from './agent/diagnostic/DiagnosticController'

// 异常诊断类型定义
export type {
  ErrorInfo,
  ErrorType,
  ErrorSource,
  ErrorContext,
  ErrorCategory,
  ErrorRetrievalResult,
  SimilarError,
  KnowledgeArticle,
  RootCauseAnalysis,
  ContributingFactor,
  FixSuggestion,
  FixStep,
  AlternativeSolution,
  AutoFixResult,
  AppliedChange,
  FixValidationResult,
  ValidationResult,
  DiagnosisResult,
  DiagnosticMetadata,
  DiagnosticAgentState,
  DiagnosticNodeName,
  DiagnosticExecutionLog,
  DiagnosticAgentConfig,
  LLMConfig as DiagnosticLLMConfig,
  RAGConfig as DiagnosticRAGConfig,
  KnowledgeBaseConfig,
  ErrorKnowledgeEntry,
} from './agent/diagnostic/DiagnosticAgentTypes'

export type {
  DiagnosticServiceConfig,
  ErrorStatistics,
} from './agent/diagnostic/DiagnosticService'

// OpenAPI Agent
export {
  OpenAPIParser,
  createOpenAPIParser,
} from './agent/openapi/OpenAPIParser'

export {
  OpenAPIAgentExecutor,
  createOpenAPIAgentExecutor,
} from './agent/openapi/OpenAPIAgentExecutor'

export {
  VersionCompareService,
  createVersionCompareService,
} from './agent/openapi/VersionCompareService'

// OpenAPI 类型定义
export type {
  OpenAPIDocument,
  OpenAPIVersion,
  ParsedEndpoint,
  ParsedParameter,
  ParsedRequestBody,
  ParsedResponse,
  DataSourceConfig,
  GeneratedPageConfig,
  GeneratedComponent,
  ComponentBinding,
  OpenAPIImportResult,
  VersionComparison,
  VersionDifference,
  VersionSuggestion,
  VersionAnalysis,
  PageVersionSnapshot,
  VersionMetadata,
  AIOptimizationSuggestion,
} from './agent/openapi/OpenAPITypes'

export type {
  OpenAPIAgentState,
  OpenAPIAgentConfig,
} from './agent/openapi/OpenAPIAgentExecutor'

// 工具调用 Agent (AI3)
export {
  SQLDDLTool,
  createSQLDDLTool,
  NestCrudTool,
  createNestCrudTool,
  HttpTestTool,
  createHttpTestTool,
  ToolCallingAgent,
  createToolCallingAgent,
} from './agent/tools'

export type {
  SQLDDLInput,
  SQLDDLOutput,
  NestCrudInput,
  NestCrudOutput,
  HttpTestInput,
  HttpTestOutput,
  Tool,
  ToolExecutionResult,
  ToolCallDecision,
  EntityDefinition,
  ColumnDefinition,
  ToolOutput,
  ToolCallingAgentState,
  ToolCallingAgentConfig,
} from './agent/tools'

// MCP 相关
export { MCPAgent } from './mcp'
export { ToolManager } from './mcp'
export { PromptStore } from './mcp'
export { ContextStore } from './mcp'
export { SSETransport, getSSETransport, resetSSETransport } from './mcp'
export type { SSEClient, SSEConnectionState, SSEMessage, SSETransportConfig } from './mcp'

export type {
  MCPRequest,
  MCPResponse,
  MCPError,
  MCPMethod,
  ToolRegistration,
  PromptTemplate,
  PromptVariable,
  ChatMessage,
  ConversationContext,
  MCPAgentConfig,
} from './mcp'

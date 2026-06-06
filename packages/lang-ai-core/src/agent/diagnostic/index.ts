/**
 * 异常诊断 Agent 模块
 * 提供错误诊断、RAG 检索、修复建议生成等功能
 */

// 类型导出
export type {
  // 错误信息
  ErrorInfo,
  ErrorType,
  ErrorSource,
  ErrorContext,
  
  // RAG 检索结果
  ErrorRetrievalResult,
  SimilarError,
  KnowledgeArticle,
  
  // 原因分析
  RootCauseAnalysis,
  ContributingFactor,
  
  // 修复建议
  FixSuggestion,
  FixStep,
  AlternativeSolution,
  
  // 诊断结果
  DiagnosisResult,
  DiagnosticMetadata,
  
  // Agent 状态
  DiagnosticAgentState,
  DiagnosticNodeName,
  DiagnosticExecutionLog,
  
  // 配置
  DiagnosticAgentConfig,
  LLMConfig,
  RAGConfig,
  KnowledgeBaseConfig,
  
  // 知识库
  ErrorKnowledgeEntry,
} from './DiagnosticAgentTypes'

// 节点工厂导出
export {
  createErrorCollectionNode,
  createRAGRetrievalNode,
  createRootCauseAnalysisNode,
  createFixSuggestionNode,
  createKnowledgeUpdateNode,
} from './DiagnosticAgentNodes'

// 执行器导出
export {
  DiagnosticAgentExecutor,
  createDiagnosticAgentExecutor,
} from './DiagnosticAgentExecutor'

// 服务导出
export {
  DiagnosticService,
  DiagnosticServiceConfig,
  ErrorStatistics,
  createDiagnosticService,
} from './DiagnosticService'

// API 控制器导出
export {
  createDiagnosticRouter,
  createDiagnosticApp,
} from './DiagnosticController'

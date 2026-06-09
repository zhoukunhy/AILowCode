/**
 * 代码生成引擎主入口
 * 集成 RAG 检索和 LangChain 优化功能
 */
import type { PageSchema, LLMConfig } from '@ai-lowcode/lang-ai-core'
import { GeneratedFile, GeneratedProject, GenerateOptions } from './types'
import { FrontendGenerator } from './FrontendGenerator'
import { BackendGenerator } from './BackendGenerator'
import { RAGContextRetriever, RAGContext, RAGContextConfig } from './RAGContextRetriever'
import { LangChainCodeOptimizer, OptimizationResult } from './LangChainCodeOptimizer'
import { AIRefactorService } from './AIRefactorService'

/**
 * 增强的生成选项
 */
export interface EnhancedGenerateOptions extends GenerateOptions {
  enableRAG?: boolean           // 启用 RAG 检索
  enableOptimization?: boolean  // 启用代码优化
  ragConfig?: RAGContextConfig  // RAG 配置
  llmConfig?: LLMConfig         // LLM 配置
}

/**
 * 增强的生成结果
 */
export interface EnhancedGenerateResult extends GeneratedProject {
  ragContext?: RAGContext
  optimizationResults?: Map<string, OptimizationResult>
  metadata: {
    generationTime: number
    ragRetrievalTime: number
    optimizationTime: number
    totalFiles: number
    optimizedFiles: number
  }
}

/**
 * 代码生成器
 */
export class CodeGenerator {
  private schema: PageSchema
  private options: EnhancedGenerateOptions
  private ragRetriever?: RAGContextRetriever
  private codeOptimizer?: LangChainCodeOptimizer

  constructor(schema: PageSchema, options?: Partial<EnhancedGenerateOptions>) {
    this.schema = schema
    this.options = {
      framework: options?.framework || 'react',
      language: options?.language || 'typescript',
      style: options?.style || 'css',
      enableRAG: options?.enableRAG ?? true,
      enableOptimization: options?.enableOptimization ?? true,
      ragConfig: options?.ragConfig,
      llmConfig: options?.llmConfig,
    }

    // 初始化 RAG 检索器
    if (this.options.enableRAG && this.options.ragConfig) {
      this.ragRetriever = new RAGContextRetriever(this.options.ragConfig)
    }

    // 初始化代码优化器
    if (this.options.enableOptimization && this.options.llmConfig) {
      this.codeOptimizer = new LangChainCodeOptimizer({
        llmConfig: this.options.llmConfig,
        maxRetries: 3,
        timeout: 60000,
      })
    }
  }

  /**
   * 生成完整的全栈项目（带 RAG 和优化）
   */
  async generateFullStackEnhanced(): Promise<EnhancedGenerateResult> {
    const startTime = Date.now()
    const metadata = {
      generationTime: 0,
      ragRetrievalTime: 0,
      optimizationTime: 0,
      totalFiles: 0,
      optimizedFiles: 0,
    }

    // 1. RAG 检索上下文
    let ragContext: RAGContext | undefined
    if (this.ragRetriever) {
      const ragStartTime = Date.now()
      ragContext = await this.ragRetriever.retrieveContext(
        `${this.schema.name} ${this.options.framework} component`,
        'frontend'
      )
      metadata.ragRetrievalTime = Date.now() - ragStartTime
    }

    // 2. 生成前端代码
    const frontendFiles = await this.generateFrontendEnhanced(ragContext)

    // 3. RAG 检索后端上下文
    let backendRagContext: RAGContext | undefined
    if (this.ragRetriever) {
      backendRagContext = await this.ragRetriever.retrieveContext(
        `${this.schema.name} NestJS service`,
        'backend'
      )
    }

    // 4. 生成后端代码
    const backendFiles = await this.generateBackendEnhanced(backendRagContext)

    // 5. 合并文件
    const files = [...frontendFiles, ...backendFiles]
    metadata.totalFiles = files.length

    // 6. 代码优化
    const optimizationResults = new Map<string, OptimizationResult>()
    if (this.codeOptimizer && this.options.enableOptimization) {
      const optStartTime = Date.now()
      
      for (const file of files) {
        if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
          const language = file.path.endsWith('.tsx') ? 'typescript' : 'typescript'
          const result = await this.codeOptimizer.optimizeCode(
            file.content,
            language,
            ragContext || { codingStandards: [], codeSnippets: [], relevantDocs: [], suggestions: [] },
            {}
          )
          
          if (result.score > 70) {
            file.content = result.optimizedCode
            optimizationResults.set(file.path, result)
            metadata.optimizedFiles++
          }
        }
      }
      
      metadata.optimizationTime = Date.now() - optStartTime
    }

    metadata.generationTime = Date.now() - startTime

    return {
      name: this.schema.name || 'generated-project',
      type: 'fullstack',
      files,
      ragContext,
      optimizationResults,
      metadata,
    }
  }

  /**
   * 生成前端项目（带 RAG 和优化）
   */
  async generateFrontendEnhanced(ragContext?: RAGContext): Promise<GeneratedFile[]> {
    // 生成基础代码
    const generator = new FrontendGenerator(this.schema)
    let files = generator.generate()

    // 应用 RAG 上下文优化
    if (ragContext && this.codeOptimizer) {
      const optimizedFiles: GeneratedFile[] = []
      
      for (const file of files) {
        if (file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
          const result = await this.codeOptimizer.optimizeCode(
            file.content,
            'typescript',
            ragContext,
            { addComments: true, addErrorHandling: true }
          )
          
          optimizedFiles.push({
            ...file,
            content: result.optimizedCode,
          })
        } else {
          optimizedFiles.push(file)
        }
      }
      
      files = optimizedFiles
    }

    return files
  }

  /**
   * 生成后端项目（带 RAG 和优化）
   */
  async generateBackendEnhanced(ragContext?: RAGContext): Promise<GeneratedFile[]> {
    // 生成基础代码
    const generator = new BackendGenerator(this.schema)
    let files = generator.generate()

    // 应用 RAG 上下文优化
    if (ragContext && this.codeOptimizer) {
      const optimizedFiles: GeneratedFile[] = []
      
      for (const file of files) {
        if (file.path.endsWith('.ts')) {
          const result = await this.codeOptimizer.optimizeCode(
            file.content,
            'typescript',
            ragContext,
            { addComments: true, addErrorHandling: true, addValidation: true }
          )
          
          optimizedFiles.push({
            ...file,
            content: result.optimizedCode,
          })
        } else {
          optimizedFiles.push(file)
        }
      }
      
      files = optimizedFiles
    }

    return files
  }

  /**
   * 生成完整的全栈项目（同步版本，保持向后兼容）
   */
  generateFullStack(): GeneratedProject {
    const frontendFiles = this.generateFrontend()
    const backendFiles = this.generateBackend()

    return {
      name: this.schema.name || 'generated-project',
      type: 'fullstack',
      files: [...frontendFiles, ...backendFiles],
    }
  }

  /**
   * 仅生成前端项目
   */
  generateFrontend(): GeneratedFile[] {
    const generator = new FrontendGenerator(this.schema)
    return generator.generate()
  }

  /**
   * 仅生成后端项目
   */
  generateBackend(): GeneratedFile[] {
    const generator = new BackendGenerator(this.schema)
    return generator.generate()
  }

  /**
   * 根据类型生成项目
   */
  generate(type: 'frontend' | 'backend' | 'fullstack'): GeneratedProject {
    let files: GeneratedFile[] = []
    
    if (type === 'frontend' || type === 'fullstack') {
      files = [...files, ...this.generateFrontend()]
    }
    
    if (type === 'backend' || type === 'fullstack') {
      files = [...files, ...this.generateBackend()]
    }

    return {
      name: this.schema.name || 'generated-project',
      type,
      files,
    }
  }

  /**
   * 根据类型生成项目（增强版，带 RAG 和优化）
   */
  async generateEnhanced(type: 'frontend' | 'backend' | 'fullstack'): Promise<EnhancedGenerateResult> {
    const startTime = Date.now()
    const metadata = {
      generationTime: 0,
      ragRetrievalTime: 0,
      optimizationTime: 0,
      totalFiles: 0,
      optimizedFiles: 0,
    }

    // RAG 检索
    let ragContext: RAGContext | undefined
    if (this.ragRetriever) {
      const ragStartTime = Date.now()
      ragContext = await this.ragRetriever.retrieveContext(
        `${this.schema.name} ${type}`,
        type === 'frontend' ? 'frontend' : 'backend'
      )
      metadata.ragRetrievalTime = Date.now() - ragStartTime
    }

    // 生成代码
    let files: GeneratedFile[] = []
    
    if (type === 'frontend' || type === 'fullstack') {
      files = [...files, ...await this.generateFrontendEnhanced(ragContext)]
    }
    
    if (type === 'backend' || type === 'fullstack') {
      files = [...files, ...await this.generateBackendEnhanced(ragContext)]
    }

    metadata.totalFiles = files.length
    metadata.generationTime = Date.now() - startTime

    return {
      name: this.schema.name || 'generated-project',
      type,
      files,
      ragContext,
      metadata,
    }
  }

  /**
   * 获取生成的文件数量
   */
  getFileCount(type: 'frontend' | 'backend' | 'fullstack'): number {
    const project = this.generate(type)
    return project.files.length
  }

  /**
   * 获取项目结构预览
   */
  getProjectStructure(type: 'frontend' | 'backend' | 'fullstack'): string[] {
    const project = this.generate(type)
    return project.files.map(f => f.path)
  }
}

/**
 * 创建代码生成器
 */
export function createCodeGenerator(
  schema: PageSchema,
  options?: Partial<EnhancedGenerateOptions>
): CodeGenerator {
  return new CodeGenerator(schema, options)
}

// ==================== AI 重构服务工厂 ====================

/**
 * 创建 AI 重构服务
 */
export function createAIRefactor(
  llmConfig: LLMConfig,
  ragConfig: RAGContextConfig
): AIRefactorService {
  const ragRetriever = new RAGContextRetriever(ragConfig)
  const codeOptimizer = new LangChainCodeOptimizer({
    llmConfig,
    maxRetries: 3,
    timeout: 60000,
  })

  return new AIRefactorService({
    llmConfig,
    ragRetriever,
    codeOptimizer,
  })
}

// 导出所有子模块
export { FrontendGenerator, createFrontendGenerator } from './FrontendGenerator'
export { BackendGenerator, createBackendGenerator } from './BackendGenerator'
export { ASTParser, createASTParser } from './ASTParser'

// 导出新增模块
export { RAGContextRetriever, createRAGContextRetriever } from './RAGContextRetriever'
export { LangChainCodeOptimizer, createCodeOptimizer } from './LangChainCodeOptimizer'
export { AIRefactorService, createAIRefactorService } from './AIRefactorService'

// 导出类型定义
export type {
  GenerateOptions,
  DataSourceBinding,
  ASTNode,
  ASTNodeType,
  GeneratedFile,
  GeneratedProject,
  TableDefinition,
  ColumnDefinition,
  ConstraintDefinition,
  ApiEndpoint,
  ReactComponentConfig,
  ComponentProp,
  ComponentState,
  ImportStatement,
  HookUsage,
} from './types'

// 导出新增类型
export type {
  RAGContext,
  RAGContextConfig,
  CodingStandard,
  CodeSnippet,
} from './RAGContextRetriever'

export type {
  OptimizationOptions,
  OptimizationResult,
  CodeChange,
  CodeOptimizerConfig,
} from './LangChainCodeOptimizer'

export type {
  RefactorOptions,
  RefactorResult,
  RefactorChange,
  RefactorSummary,
  SourceAnalysis,
  ComponentInfo,
  ServiceInfo,
  CodeIssue,
  AIRefactorConfig,
} from './AIRefactorService'

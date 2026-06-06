/**
 * RAG 上下文检索服务
 * 用于检索项目编码规范、历史优质代码片段作为参考上下文
 */

import { VectorRetrievalService, MilvusVectorStore } from '@ai-lowcode/lang-ai-core'
import type { MilvusConfig, RAGConfig } from '@ai-lowcode/shared-types'

/**
 * 编码规范文档
 */
export interface CodingStandard {
  id: string
  category: 'frontend' | 'backend' | 'general'
  name: string
  description: string
  rules: CodingRule[]
  examples: CodeExample[]
}

/**
 * 编码规则
 */
export interface CodingRule {
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  pattern?: string
}

/**
 * 代码示例
 */
export interface CodeExample {
  title: string
  good: string
  bad?: string
  explanation: string
}

/**
 * 历史代码片段
 */
export interface CodeSnippet {
  id: string
  name: string
  type: 'component' | 'service' | 'controller' | 'entity' | 'dto' | 'util'
  framework: 'react' | 'nest' | 'general'
  content: string
  tags: string[]
  rating: number // 1-5 评分
  usageCount: number
  metadata: Record<string, any>
}

/**
 * RAG 检索上下文
 */
export interface RAGContext {
  codingStandards: CodingStandard[]
  codeSnippets: CodeSnippet[]
  relevantDocs: string[]
  suggestions: string[]
}

/**
 * RAG 上下文检索配置
 */
export interface RAGContextConfig {
  milvusConfig: MilvusConfig
  collectionName: string
  maxResults: number
  minScore: number
}

/**
 * RAG 上下文检索服务
 */
export class RAGContextRetriever {
  private vectorStore: MilvusVectorStore
  private retrievalService: VectorRetrievalService
  private config: RAGContextConfig
  private initialized: boolean = false

  // 预定义的编码规范
  private codingStandards: Map<string, CodingStandard> = new Map()

  // 历史代码片段缓存
  private snippetCache: Map<string, CodeSnippet> = new Map()

  constructor(config: RAGContextConfig) {
    this.config = config
    this.vectorStore = new MilvusVectorStore(config.milvusConfig)
    this.retrievalService = new VectorRetrievalService({
      milvusConfig: config.milvusConfig,
      collectionName: config.collectionName,
    })
    
    this.initializeCodingStandards()
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      await this.vectorStore.connect()
      this.initialized = true
      console.log('[RAGContext] 服务初始化成功')
    } catch (error) {
      console.error('[RAGContext] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化预定义编码规范
   */
  private initializeCodingStandards(): void {
    // React 前端编码规范
    this.codingStandards.set('react-component', {
      id: 'react-component',
      category: 'frontend',
      name: 'React 组件规范',
      description: 'React 组件开发最佳实践',
      rules: [
        { name: '组件命名', description: '组件名使用 PascalCase', severity: 'error' },
        { name: 'Props 类型', description: '必须定义 TypeScript 接口', severity: 'error' },
        { name: '状态管理', description: '使用 useState/useReducer 管理状态', severity: 'warning' },
        { name: '副作用', description: '副作用必须在 useEffect 中处理', severity: 'error' },
        { name: '性能优化', description: '使用 React.memo/useMemo/useCallback', severity: 'info' },
      ],
      examples: [
        {
          title: '组件结构',
          good: `interface Props {
  title: string
  onClick: () => void
}

export const MyComponent: React.FC<Props> = ({ title, onClick }) => {
  const [state, setState] = useState<string>('')
  
  useEffect(() => {
    // 副作用处理
  }, [])
  
  return <div onClick={onClick}>{title}</div>
}`,
          explanation: '组件应该有清晰的类型定义和结构',
        },
      ],
    })

    // NestJS 后端编码规范
    this.codingStandards.set('nest-service', {
      id: 'nest-service',
      category: 'backend',
      name: 'NestJS 服务规范',
      description: 'NestJS 服务开发最佳实践',
      rules: [
        { name: '依赖注入', description: '使用构造函数注入依赖', severity: 'error' },
        { name: '异常处理', description: '使用 Nest 内置异常类', severity: 'error' },
        { name: 'DTO 验证', description: '使用 class-validator 验证 DTO', severity: 'error' },
        { name: '事务处理', description: '使用 @Transaction 装饰器', severity: 'warning' },
        { name: '日志记录', description: '使用 Logger 服务记录日志', severity: 'info' },
      ],
      examples: [
        {
          title: '服务结构',
          good: `@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user
  }
}`,
          explanation: '服务应该有完善的异常处理和日志记录',
        },
      ],
    })

    // 通用编码规范
    this.codingStandards.set('general', {
      id: 'general',
      category: 'general',
      name: '通用编码规范',
      description: '适用于所有代码的通用规范',
      rules: [
        { name: '命名规范', description: '变量/函数使用 camelCase，类/接口使用 PascalCase', severity: 'error' },
        { name: '注释规范', description: '公共方法必须有 JSDoc 注释', severity: 'warning' },
        { name: '错误处理', description: '所有异步操作必须有 try-catch', severity: 'error' },
        { name: '类型安全', description: '禁止使用 any 类型', severity: 'warning' },
        { name: '代码复用', description: '重复代码超过 3 次应提取为函数', severity: 'info' },
      ],
      examples: [],
    })
  }

  /**
   * 检索代码生成上下文
   * @param query 查询描述
   * @param type 代码类型（frontend/backend）
   * @returns RAG 上下文
   */
  async retrieveContext(query: string, type: 'frontend' | 'backend'): Promise<RAGContext> {
    await this.ensureInitialized()

    const context: RAGContext = {
      codingStandards: [],
      codeSnippets: [],
      relevantDocs: [],
      suggestions: [],
    }

    try {
      // 1. 检索相关编码规范
      context.codingStandards = this.retrieveCodingStandards(type)

      // 2. 从向量库检索相关代码片段
      const snippets = await this.retrieveCodeSnippets(query, type)
      context.codeSnippets = snippets

      // 3. 检索相关文档
      const docs = await this.retrieveRelevantDocs(query)
      context.relevantDocs = docs

      // 4. 生成建议
      context.suggestions = this.generateSuggestions(query, context)

      console.log(`[RAGContext] 检索完成: ${context.codingStandards.length} 规范, ${context.codeSnippets.length} 代码片段`)
      
      return context
    } catch (error) {
      console.error('[RAGContext] 检索失败:', error)
      return context
    }
  }

  /**
   * 检索编码规范
   */
  private retrieveCodingStandards(type: 'frontend' | 'backend'): CodingStandard[] {
    const standards: CodingStandard[] = []

    // 添加通用规范
    const general = this.codingStandards.get('general')
    if (general) standards.push(general)

    // 添加特定类型规范
    if (type === 'frontend') {
      const reactStandard = this.codingStandards.get('react-component')
      if (reactStandard) standards.push(reactStandard)
    } else {
      const nestStandard = this.codingStandards.get('nest-service')
      if (nestStandard) standards.push(nestStandard)
    }

    return standards
  }

  /**
   * 从向量库检索代码片段
   */
  private async retrieveCodeSnippets(query: string, type: 'frontend' | 'backend'): Promise<CodeSnippet[]> {
    try {
      const results = await this.retrievalService.search(
        `${query} ${type === 'frontend' ? 'React component' : 'NestJS service'}`,
        this.config.maxResults
      )

      return results.documents.map((doc, index) => ({
        id: doc.id || `snippet-${index}`,
        name: doc.metadata?.name || 'Unknown',
        type: doc.metadata?.type || 'component',
        framework: doc.metadata?.framework || (type === 'frontend' ? 'react' : 'nest'),
        content: doc.content,
        tags: doc.metadata?.tags || [],
        rating: doc.metadata?.rating || 3,
        usageCount: doc.metadata?.usageCount || 0,
        metadata: doc.metadata || {},
      }))
    } catch (error) {
      console.error('[RAGContext] 代码片段检索失败:', error)
      return []
    }
  }

  /**
   * 检索相关文档
   */
  private async retrieveRelevantDocs(query: string): Promise<string[]> {
    try {
      const results = await this.retrievalService.search(
        `documentation ${query}`,
        3
      )

      return results.documents.map(doc => doc.content)
    } catch (error) {
      console.error('[RAGContext] 文档检索失败:', error)
      return []
    }
  }

  /**
   * 生成代码建议
   */
  private generateSuggestions(query: string, context: RAGContext): string[] {
    const suggestions: string[] = []

    // 基于编码规范生成建议
    for (const standard of context.codingStandards) {
      for (const rule of standard.rules) {
        if (rule.severity === 'error') {
          suggestions.push(`[${standard.name}] ${rule.name}: ${rule.description}`)
        }
      }
    }

    // 基于历史代码片段生成建议
    if (context.codeSnippets.length > 0) {
      const topSnippet = context.codeSnippets[0]
      if (topSnippet.rating >= 4) {
        suggestions.push(`参考高分代码片段: ${topSnippet.name} (评分: ${topSnippet.rating})`)
      }
    }

    return suggestions
  }

  /**
   * 添加代码片段到知识库
   */
  async addCodeSnippet(snippet: CodeSnippet): Promise<void> {
    await this.ensureInitialized()

    try {
      // 存储到向量库
      await this.vectorStore.insertDocuments(this.config.collectionName, [
        {
          id: snippet.id,
          content: snippet.content,
          embedding: [], // 需要生成 embedding
          metadata: {
            name: snippet.name,
            type: snippet.type,
            framework: snippet.framework,
            tags: snippet.tags,
            rating: snippet.rating,
            usageCount: snippet.usageCount,
            ...snippet.metadata,
          },
        },
      ])

      // 更新缓存
      this.snippetCache.set(snippet.id, snippet)
      
      console.log(`[RAGContext] 代码片段已添加: ${snippet.name}`)
    } catch (error) {
      console.error('[RAGContext] 添加代码片段失败:', error)
      throw error
    }
  }

  /**
   * 更新编码规范
   */
  updateCodingStandard(standard: CodingStandard): void {
    this.codingStandards.set(standard.id, standard)
    console.log(`[RAGContext] 编码规范已更新: ${standard.name}`)
  }

  /**
   * 获取所有编码规范
   */
  getAllCodingStandards(): CodingStandard[] {
    return Array.from(this.codingStandards.values())
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  /**
   * 关闭服务
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await this.vectorStore.close()
      this.initialized = false
      console.log('[RAGContext] 服务已关闭')
    }
  }
}

/**
 * 创建 RAG 上下文检索服务
 */
export function createRAGContextRetriever(config: RAGContextConfig): RAGContextRetriever {
  return new RAGContextRetriever(config)
}

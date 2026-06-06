/**
 * AI 重构服务
 * 支持一键重构已有页面源码，输出优化后 React+Nest 代码包
 */

import { LLMFactory, type LLMConfig } from '@ai-lowcode/lang-ai-core'
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { RAGContextRetriever, type RAGContext } from './RAGContextRetriever'
import { LangChainCodeOptimizer, type OptimizationOptions } from './LangChainCodeOptimizer'
import type { GeneratedFile } from './types'

/**
 * 重构选项
 */
export interface RefactorOptions {
  targetFramework: 'react' | 'vue' | 'angular'
  targetBackend: 'nest' | 'express' | 'fastify'
  language: 'typescript' | 'javascript'
  preserveLogic: boolean        // 保留业务逻辑
  modernize: boolean            // 现代化改造
  addTests: boolean             // 添加测试
  optimizeImports: boolean      // 优化导入
  splitComponents: boolean      // 拆分组件
}

/**
 * 重构结果
 */
export interface RefactorResult {
  frontend: {
    files: GeneratedFile[]
    changes: RefactorChange[]
  }
  backend: {
    files: GeneratedFile[]
    changes: RefactorChange[]
  }
  summary: RefactorSummary
}

/**
 * 重构变更
 */
export interface RefactorChange {
  file: string
  type: 'created' | 'modified' | 'deleted'
  description: string
  impact: 'high' | 'medium' | 'low'
}

/**
 * 重构摘要
 */
export interface RefactorSummary {
  totalFiles: number
  createdFiles: number
  modifiedFiles: number
  deletedFiles: number
  improvements: string[]
  warnings: string[]
  estimatedEffort: string
}

/**
 * 源码分析结果
 */
export interface SourceAnalysis {
  components: ComponentInfo[]
  services: ServiceInfo[]
  dependencies: string[]
  patterns: string[]
  issues: CodeIssue[]
}

/**
 * 组件信息
 */
export interface ComponentInfo {
  name: string
  type: 'functional' | 'class'
  props: string[]
  state: string[]
  hooks: string[]
  lines: number
}

/**
 * 服务信息
 */
export interface ServiceInfo {
  name: string
  methods: string[]
  dependencies: string[]
  lines: number
}

/**
 * 代码问题
 */
export interface CodeIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  line?: number
  suggestion?: string
}

/**
 * AI 重构服务配置
 */
export interface AIRefactorConfig {
  llmConfig: LLMConfig
  ragRetriever: RAGContextRetriever
  codeOptimizer: LangChainCodeOptimizer
}

/**
 * AI 重构服务
 */
export class AIRefactorService {
  private llm: any
  private ragRetriever: RAGContextRetriever
  private codeOptimizer: LangChainCodeOptimizer
  private analysisChain: any
  private refactorChain: any

  private readonly ANALYSIS_PROMPT = `你是一个代码分析专家。请分析给定的源代码，提取关键信息。

请输出以下 JSON 格式的分析结果：
{
  "components": [
    {
      "name": "组件名称",
      "type": "functional 或 class",
      "props": ["prop1", "prop2"],
      "state": ["state1", "state2"],
      "hooks": ["useState", "useEffect"],
      "lines": 代码行数
    }
  ],
  "services": [
    {
      "name": "服务名称",
      "methods": ["method1", "method2"],
      "dependencies": ["dep1", "dep2"],
      "lines": 代码行数
    }
  ],
  "dependencies": ["依赖列表"],
  "patterns": ["使用的设计模式"],
  "issues": [
    {
      "type": "error/warning/info",
      "message": "问题描述",
      "line": 行号,
      "suggestion": "改进建议"
    }
  ]
}`

  private readonly REFACTOR_PROMPT = `你是一个代码重构专家。请根据分析结果和最佳实践重构代码。

重构规则：
1. 保持原有业务逻辑不变
2. 使用现代 React Hooks（如果是函数组件）
3. 添加 TypeScript 类型定义
4. 优化组件结构和性能
5. 添加必要的错误处理
6. 遵循编码规范

请输出重构后的完整代码。`

  constructor(config: AIRefactorConfig) {
    this.llm = LLMFactory.createLLM(config.llmConfig)
    this.ragRetriever = config.ragRetriever
    this.codeOptimizer = config.codeOptimizer
    this.initializeChains()
  }

  /**
   * 初始化处理链
   */
  private initializeChains(): void {
    // 分析链
    const analysisPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(this.ANALYSIS_PROMPT),
      HumanMessagePromptTemplate.fromTemplate('请分析以下代码：\n\n```\n{code}\n```'),
    ])

    this.analysisChain = RunnableSequence.from([
      analysisPrompt,
      this.llm,
      new StringOutputParser(),
    ])

    // 重构链
    const refactorPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(this.REFACTOR_PROMPT),
      HumanMessagePromptTemplate.fromTemplate(`分析结果：
{analysis}

编码规范参考：
{standards}

请重构以下代码：
\`\`\`{language}
{code}
\`\`\`

重构要求：
{requirements}`),
    ])

    this.refactorChain = RunnableSequence.from([
      refactorPrompt,
      this.llm,
      new StringOutputParser(),
    ])
  }

  /**
   * 一键重构页面源码
   * @param sourceCode 源代码
   * @param options 重构选项
   * @returns 重构结果
   */
  async refactorPage(
    sourceCode: string,
    options: Partial<RefactorOptions> = {}
  ): Promise<RefactorResult> {
    const opts: RefactorOptions = {
      targetFramework: 'react',
      targetBackend: 'nest',
      language: 'typescript',
      preserveLogic: true,
      modernize: true,
      addTests: false,
      optimizeImports: true,
      splitComponents: true,
      ...options,
    }

    console.log('[AIRefactor] 开始重构页面...')

    // 1. 分析源代码
    const analysis = await this.analyzeSourceCode(sourceCode)

    // 2. 检索 RAG 上下文
    const frontendContext = await this.ragRetriever.retrieveContext(
      `${analysis.components.map(c => c.name).join(', ')} React component`,
      'frontend'
    )
    const backendContext = await this.ragRetriever.retrieveContext(
      `${analysis.services.map(s => s.name).join(', ')} NestJS service`,
      'backend'
    )

    // 3. 重构前端代码
    const frontendResult = await this.refactorFrontend(
      sourceCode,
      analysis,
      frontendContext,
      opts
    )

    // 4. 重构后端代码
    const backendResult = await this.refactorBackend(
      sourceCode,
      analysis,
      backendContext,
      opts
    )

    // 5. 生成摘要
    const summary = this.generateSummary(frontendResult, backendResult, analysis)

    console.log(`[AIRefactor] 重构完成: ${summary.totalFiles} 个文件`)

    return {
      frontend: frontendResult,
      backend: backendResult,
      summary,
    }
  }

  /**
   * 分析源代码
   */
  private async analyzeSourceCode(sourceCode: string): Promise<SourceAnalysis> {
    try {
      const result = await this.analysisChain.invoke({ code: sourceCode })
      
      // 解析 JSON 结果
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // 返回默认分析结果
      return this.defaultAnalysis(sourceCode)
    } catch (error) {
      console.error('[AIRefactor] 分析失败:', error)
      return this.defaultAnalysis(sourceCode)
    }
  }

  /**
   * 默认分析结果
   */
  private defaultAnalysis(sourceCode: string): SourceAnalysis {
    return {
      components: [{
        name: 'MainComponent',
        type: 'functional',
        props: [],
        state: [],
        hooks: [],
        lines: sourceCode.split('\n').length,
      }],
      services: [],
      dependencies: [],
      patterns: [],
      issues: [],
    }
  }

  /**
   * 重构前端代码
   */
  private async refactorFrontend(
    sourceCode: string,
    analysis: SourceAnalysis,
    context: RAGContext,
    options: RefactorOptions
  ): Promise<{ files: GeneratedFile[]; changes: RefactorChange[] }> {
    const files: GeneratedFile[] = []
    const changes: RefactorChange[] = []

    // 构建重构要求
    const requirements = this.buildFrontendRequirements(options)

    // 获取编码规范
    const standards = context.codingStandards
      .map(s => `${s.name}: ${s.rules.map(r => r.description).join(', ')}`)
      .join('\n')

    // 重构主组件
    const refactoredCode = await this.refactorChain.invoke({
      analysis: JSON.stringify(analysis, null, 2),
      standards,
      code: sourceCode,
      language: options.language,
      requirements,
    })

    // 提取代码块
    const codeBlock = this.extractCodeBlock(refactoredCode)
    
    files.push({
      path: `src/components/MainComponent.${options.language === 'typescript' ? 'tsx' : 'jsx'}`,
      content: codeBlock,
    })

    changes.push({
      file: 'MainComponent',
      type: 'modified',
      description: '重构主组件，优化结构和性能',
      impact: 'high',
    })

    // 如果需要拆分组件
    if (options.splitComponents && analysis.components.length > 1) {
      for (const component of analysis.components.slice(1)) {
        const componentCode = await this.generateComponentCode(component, context, options)
        files.push({
          path: `src/components/${component.name}.${options.language === 'typescript' ? 'tsx' : 'jsx'}`,
          content: componentCode,
        })
        changes.push({
          file: component.name,
          type: 'created',
          description: `拆分组件 ${component.name}`,
          impact: 'medium',
        })
      }
    }

    // 生成 package.json
    files.push({
      path: 'package.json',
      content: this.generatePackageJson(options, analysis.dependencies),
    })

    // 生成入口文件
    files.push({
      path: `src/index.${options.language === 'typescript' ? 'tsx' : 'jsx'}`,
      content: this.generateEntryFile(options),
    })

    return { files, changes }
  }

  /**
   * 重构后端代码
   */
  private async refactorBackend(
    sourceCode: string,
    analysis: SourceAnalysis,
    context: RAGContext,
    options: RefactorOptions
  ): Promise<{ files: GeneratedFile[]; changes: RefactorChange[] }> {
    const files: GeneratedFile[] = []
    const changes: RefactorChange[] = []

    // 为每个服务生成代码
    for (const service of analysis.services) {
      const serviceCode = await this.generateServiceCode(service, context, options)
      
      files.push({
        path: `src/modules/${service.name.toLowerCase()}/${service.name.toLowerCase()}.service.ts`,
        content: serviceCode,
      })

      files.push({
        path: `src/modules/${service.name.toLowerCase()}/${service.name.toLowerCase()}.controller.ts`,
        content: this.generateControllerCode(service, options),
      })

      files.push({
        path: `src/modules/${service.name.toLowerCase()}/${service.name.toLowerCase()}.module.ts`,
        content: this.generateModuleCode(service),
      })

      changes.push({
        file: service.name,
        type: 'created',
        description: `生成 ${service.name} 模块（Service + Controller + Module）`,
        impact: 'high',
      })
    }

    // 生成主模块
    files.push({
      path: 'src/app.module.ts',
      content: this.generateAppModule(analysis.services),
    })

    // 生成入口文件
    files.push({
      path: 'src/main.ts',
      content: this.generateMainFile(),
    })

    // 生成 package.json
    files.push({
      path: 'package.json',
      content: this.generateBackendPackageJson(options),
    })

    return { files, changes }
  }

  /**
   * 构建前端重构要求
   */
  private buildFrontendRequirements(options: RefactorOptions): string {
    const requirements: string[] = []
    
    if (options.preserveLogic) {
      requirements.push('- 保持原有业务逻辑不变')
    }
    if (options.modernize) {
      requirements.push('- 使用现代 React Hooks 和最佳实践')
    }
    if (options.optimizeImports) {
      requirements.push('- 优化导入语句，移除未使用的导入')
    }
    if (options.splitComponents) {
      requirements.push('- 合理拆分组件，提高可复用性')
    }
    requirements.push('- 添加 TypeScript 类型定义')
    requirements.push('- 添加错误处理和边界检查')

    return requirements.join('\n')
  }

  /**
   * 提取代码块
   */
  private extractCodeBlock(text: string): string {
    const codeBlockMatch = text.match(/```[\w]*\n([\s\S]*?)```/)
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim()
    }
    return text
  }

  /**
   * 生成组件代码
   */
  private async generateComponentCode(
    component: ComponentInfo,
    context: RAGContext,
    options: RefactorOptions
  ): Promise<string> {
    const prompt = `生成一个 React ${options.language === 'typescript' ? 'TypeScript ' : ''}组件：
组件名: ${component.name}
Props: ${component.props.join(', ')}
State: ${component.state.join(', ')}
Hooks: ${component.hooks.join(', ')}

请遵循编码规范并添加必要的类型定义和注释。`

    try {
      const result = await this.refactorChain.invoke({
        analysis: JSON.stringify(component, null, 2),
        standards: context.codingStandards.map(s => s.name).join(', '),
        code: `// ${component.name} component`,
        language: options.language,
        requirements: prompt,
      })
      
      return this.extractCodeBlock(result)
    } catch (error) {
      console.error('[AIRefactor] 生成组件失败:', error)
      return `// ${component.name} component\nexport const ${component.name} = () => null`
    }
  }

  /**
   * 生成服务代码
   */
  private async generateServiceCode(
    service: ServiceInfo,
    context: RAGContext,
    options: RefactorOptions
  ): Promise<string> {
    return `/**
 * ${service.name} 服务
 */
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class ${service.name}Service {
  private readonly logger = new Logger(${service.name}Service.name)

  ${service.methods.map(method => `
  /**
   * ${method} 方法
   */
  async ${method}(): Promise<any> {
    try {
      this.logger.log('执行 ${method}')
      // TODO: 实现业务逻辑
    } catch (error) {
      this.logger.error('${method} 执行失败', error)
      throw error
    }
  }
  `).join('\n')}
}
`
  }

  /**
   * 生成控制器代码
   */
  private generateControllerCode(service: ServiceInfo, options: RefactorOptions): string {
    return `/**
 * ${service.name} 控制器
 */
import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { ${service.name}Service } from './${service.name.toLowerCase()}.service'

@Controller('${service.name.toLowerCase()}')
export class ${service.name}Controller {
  constructor(private readonly ${service.name.toLowerCase()}Service: ${service.name}Service) {}

  ${service.methods.map(method => `
  @${method.startsWith('get') || method.startsWith('find') ? 'Get' : 'Post'}('/${method}')
  async ${method}() {
    return this.${service.name.toLowerCase()}Service.${method}()
  }
  `).join('\n')}
}
`
  }

  /**
   * 生成模块代码
   */
  private generateModuleCode(service: ServiceInfo): string {
    return `/**
 * ${service.name} 模块
 */
import { Module } from '@nestjs/common'
import { ${service.name}Controller } from './${service.name.toLowerCase()}.controller'
import { ${service.name}Service } from './${service.name.toLowerCase()}.service'

@Module({
  controllers: [${service.name}Controller],
  providers: [${service.name}Service],
  exports: [${service.name}Service],
})
export class ${service.name}Module {}
`
  }

  /**
   * 生成 App 模块
   */
  private generateAppModule(services: ServiceInfo[]): string {
    const imports = services.map(s => `${s.name}Module`).join(',\n    ')
    
    return `/**
 * 应用主模块
 */
import { Module } from '@nestjs/common'
import { ${imports} }

@Module({
  imports: [
    ${imports}
  ],
})
export class AppModule {}
`
  }

  /**
   * 生成入口文件
   */
  private generateMainFile(): string {
    return `/**
 * 应用入口
 */
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  await app.listen(3000)
  console.log('Application is running on: http://localhost:3000')
}
bootstrap()
`
  }

  /**
   * 生成前端 package.json
   */
  private generatePackageJson(options: RefactorOptions, dependencies: string[]): string {
    const pkg = {
      name: 'refactored-frontend',
      version: '1.0.0',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.0.0',
        typescript: '^5.3.0',
        vite: '^5.0.0',
      },
    }

    return JSON.stringify(pkg, null, 2)
  }

  /**
   * 生成后端 package.json
   */
  private generateBackendPackageJson(options: RefactorOptions): string {
    const pkg = {
      name: 'refactored-backend',
      version: '1.0.0',
      scripts: {
        build: 'nest build',
        start: 'nest start',
        dev: 'nest start --watch',
      },
      dependencies: {
        '@nestjs/common': '^10.3.0',
        '@nestjs/core': '^10.3.0',
        '@nestjs/platform-express': '^10.3.0',
        'reflect-metadata': '^0.2.0',
        rxjs: '^7.8.0',
      },
      devDependencies: {
        '@nestjs/cli': '^10.3.0',
        typescript: '^5.3.0',
      },
    }

    return JSON.stringify(pkg, null, 2)
  }

  /**
   * 生成前端入口文件
   */
  private generateEntryFile(options: RefactorOptions): string {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import { MainComponent } from './components/MainComponent'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainComponent />
  </React.StrictMode>,
)
`
  }

  /**
   * 生成重构摘要
   */
  private generateSummary(
    frontendResult: { files: GeneratedFile[]; changes: RefactorChange[] },
    backendResult: { files: GeneratedFile[]; changes: RefactorChange[] },
    analysis: SourceAnalysis
  ): RefactorSummary {
    const allFiles = [...frontendResult.files, ...backendResult.files]
    const allChanges = [...frontendResult.changes, ...backendResult.changes]

    return {
      totalFiles: allFiles.length,
      createdFiles: allChanges.filter(c => c.type === 'created').length,
      modifiedFiles: allChanges.filter(c => c.type === 'modified').length,
      deletedFiles: allChanges.filter(c => c.type === 'deleted').length,
      improvements: [
        '代码结构优化',
        '添加类型定义',
        '优化错误处理',
        '遵循编码规范',
      ],
      warnings: analysis.issues
        .filter(i => i.type === 'warning')
        .map(i => i.message),
      estimatedEffort: allFiles.length > 10 ? '高' : allFiles.length > 5 ? '中' : '低',
    }
  }
}

/**
 * 创建 AI 重构服务
 */
export function createAIRefactorService(config: AIRefactorConfig): AIRefactorService {
  return new AIRefactorService(config)
}

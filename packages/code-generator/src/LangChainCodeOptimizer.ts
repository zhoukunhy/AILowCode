/**
 * LangChain 代码优化器
 * 使用 LangChain 自动优化代码结构、异常处理、参数校验
 */

import { LLMFactory, type LLMConfig } from '@ai-lowcode/lang-ai-core'
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import type { RAGContext } from './RAGContextRetriever'

/**
 * 优化选项
 */
export interface OptimizationOptions {
  optimizeStructure: boolean      // 优化代码结构
  addErrorHandling: boolean       // 添加异常处理
  addValidation: boolean          // 添加参数校验
  addComments: boolean            // 添加注释
  optimizePerformance: boolean    // 性能优化
  followStandards: boolean        // 遵循编码规范
}

/**
 * 优化结果
 */
export interface OptimizationResult {
  originalCode: string
  optimizedCode: string
  changes: CodeChange[]
  score: number // 优化评分 1-100
  suggestions: string[]
}

/**
 * 代码变更
 */
export interface CodeChange {
  type: 'structure' | 'error-handling' | 'validation' | 'performance' | 'style' | 'comment'
  description: string
  lineStart?: number
  lineEnd?: number
  severity: 'info' | 'warning' | 'error'
}

/**
 * 代码优化器配置
 */
export interface CodeOptimizerConfig {
  llmConfig: LLMConfig
  maxRetries: number
  timeout: number
}

/**
 * LangChain 代码优化器
 */
export class LangChainCodeOptimizer {
  private llm: any
  private optimizationChain: any

  // 系统提示模板
  private readonly SYSTEM_PROMPT = `你是一个专业的代码优化专家。你的任务是优化给定的代码，使其更加健壮、可维护和高效。

优化规则：
1. 代码结构优化：
   - 提取重复代码为独立函数
   - 合理的函数拆分和命名
   - 清晰的代码层次结构

2. 异常处理：
   - 所有异步操作必须有 try-catch
   - 使用合适的错误类型
   - 提供有意义的错误信息

3. 参数校验：
   - 函数参数必须有类型定义
   - 关键参数需要运行时校验
   - 提供默认值处理

4. 性能优化：
   - 避免不必要的计算
   - 合理使用缓存
   - 优化循环和递归

5. 代码风格：
   - 遵循 TypeScript 最佳实践
   - 添加必要的注释
   - 保持代码整洁

请严格按照以上规则优化代码，并输出优化后的代码。`

  constructor(config: CodeOptimizerConfig) {
    this.llm = LLMFactory.createLLM(config.llmConfig)
    this.initializeChain()
  }

  /**
   * 初始化优化链
   */
  private initializeChain(): void {
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(this.SYSTEM_PROMPT),
      HumanMessagePromptTemplate.fromTemplate(`{context}

请优化以下代码：

\`\`\`{language}
{code}
\`\`\`

优化要求：
{requirements}

请输出优化后的完整代码，并在代码末尾用注释说明主要优化点。`),
    ])

    this.optimizationChain = RunnableSequence.from([
      prompt,
      this.llm,
      new StringOutputParser(),
    ])
  }

  /**
   * 优化代码
   * @param code 原始代码
   * @param language 语言类型
   * @param context RAG 上下文
   * @param options 优化选项
   * @returns 优化结果
   */
  async optimizeCode(
    code: string,
    language: 'typescript' | 'javascript',
    context: RAGContext,
    options: Partial<OptimizationOptions> = {}
  ): Promise<OptimizationResult> {
    const opts: OptimizationOptions = {
      optimizeStructure: true,
      addErrorHandling: true,
      addValidation: true,
      addComments: true,
      optimizePerformance: false,
      followStandards: true,
      ...options,
    }

    try {
      // 构建上下文
      const contextStr = this.buildContextString(context, opts)
      
      // 构建优化要求
      const requirements = this.buildRequirements(opts)

      // 调用 LLM 优化
      const optimizedCode = await this.optimizationChain.invoke({
        context: contextStr,
        code,
        language,
        requirements,
      })

      // 分析变更
      const changes = this.analyzeChanges(code, optimizedCode, opts)
      
      // 计算优化评分
      const score = this.calculateScore(changes)
      
      // 生成建议
      const suggestions = this.generateSuggestions(changes)

      return {
        originalCode: code,
        optimizedCode,
        changes,
        score,
        suggestions,
      }
    } catch (error) {
      console.error('[CodeOptimizer] 优化失败:', error)
      
      return {
        originalCode: code,
        optimizedCode: code,
        changes: [],
        score: 0,
        suggestions: ['优化失败，请检查代码格式'],
      }
    }
  }

  /**
   * 构建上下文字符串
   */
  private buildContextString(context: RAGContext, options: OptimizationOptions): string {
    const parts: string[] = []

    // 添加编码规范
    if (options.followStandards && context.codingStandards.length > 0) {
      parts.push('## 编码规范参考')
      for (const standard of context.codingStandards) {
        parts.push(`### ${standard.name}`)
        for (const rule of standard.rules) {
          parts.push(`- [${rule.severity}] ${rule.name}: ${rule.description}`)
        }
      }
    }

    // 添加代码片段参考
    if (context.codeSnippets.length > 0) {
      parts.push('\n## 优质代码片段参考')
      for (const snippet of context.codeSnippets.slice(0, 2)) {
        parts.push(`### ${snippet.name} (评分: ${snippet.rating})`)
        parts.push(`\`\`\`\n${snippet.content.slice(0, 500)}...\n\`\`\``)
      }
    }

    // 添加建议
    if (context.suggestions.length > 0) {
      parts.push('\n## 优化建议')
      for (const suggestion of context.suggestions) {
        parts.push(`- ${suggestion}`)
      }
    }

    return parts.join('\n')
  }

  /**
   * 构建优化要求
   */
  private buildRequirements(options: OptimizationOptions): string {
    const requirements: string[] = []

    if (options.optimizeStructure) {
      requirements.push('- 优化代码结构，提取重复代码，合理拆分函数')
    }
    if (options.addErrorHandling) {
      requirements.push('- 添加完善的异常处理，所有异步操作使用 try-catch')
    }
    if (options.addValidation) {
      requirements.push('- 添加参数校验，确保类型安全')
    }
    if (options.addComments) {
      requirements.push('- 添加必要的注释，特别是公共方法')
    }
    if (options.optimizePerformance) {
      requirements.push('- 进行性能优化，避免不必要的计算')
    }
    if (options.followStandards) {
      requirements.push('- 遵循编码规范，保持代码风格一致')
    }

    return requirements.join('\n')
  }

  /**
   * 分析代码变更
   */
  private analyzeChanges(
    originalCode: string,
    optimizedCode: string,
    options: OptimizationOptions
  ): CodeChange[] {
    const changes: CodeChange[] = []

    // 检测异常处理变更
    if (options.addErrorHandling) {
      const tryCatchCount = (optimizedCode.match(/try\s*{/g) || []).length
      const originalTryCatchCount = (originalCode.match(/try\s*{/g) || []).length
      
      if (tryCatchCount > originalTryCatchCount) {
        changes.push({
          type: 'error-handling',
          description: `添加了 ${tryCatchCount - originalTryCatchCount} 个 try-catch 异常处理`,
          severity: 'info',
        })
      }
    }

    // 检测参数校验变更
    if (options.addValidation) {
      if (optimizedCode.includes('class-validator') || optimizedCode.includes('@Is')) {
        changes.push({
          type: 'validation',
          description: '添加了参数校验装饰器',
          severity: 'info',
        })
      }
    }

    // 检测注释变更
    if (options.addComments) {
      const commentCount = (optimizedCode.match(/\/\*\*[\s\S]*?\*\//g) || []).length
      const originalCommentCount = (originalCode.match(/\/\*\*[\s\S]*?\*\//g) || []).length
      
      if (commentCount > originalCommentCount) {
        changes.push({
          type: 'comment',
          description: `添加了 ${commentCount - originalCommentCount} 个 JSDoc 注释`,
          severity: 'info',
        })
      }
    }

    // 检测结构变更
    if (options.optimizeStructure) {
      const functionCount = (optimizedCode.match(/(async\s+)?function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(/g) || []).length
      const originalFunctionCount = (originalCode.match(/(async\s+)?function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(/g) || []).length
      
      if (functionCount > originalFunctionCount) {
        changes.push({
          type: 'structure',
          description: '提取了重复代码为独立函数',
          severity: 'info',
        })
      }
    }

    return changes
  }

  /**
   * 计算优化评分
   */
  private calculateScore(changes: CodeChange[]): number {
    let score = 60 // 基础分

    // 根据变更类型加分
    for (const change of changes) {
      switch (change.type) {
        case 'error-handling':
          score += 10
          break
        case 'validation':
          score += 8
          break
        case 'structure':
          score += 7
          break
        case 'comment':
          score += 5
          break
        case 'performance':
          score += 10
          break
      }
    }

    // 确保分数在 0-100 之间
    return Math.min(100, Math.max(0, score))
  }

  /**
   * 生成优化建议
   */
  private generateSuggestions(changes: CodeChange[]): string[] {
    const suggestions: string[] = []

    for (const change of changes) {
      suggestions.push(`✓ ${change.description}`)
    }

    // 添加通用建议
    if (!changes.some(c => c.type === 'error-handling')) {
      suggestions.push('建议：考虑添加更多的异常处理逻辑')
    }
    if (!changes.some(c => c.type === 'validation')) {
      suggestions.push('建议：考虑添加参数校验以提高健壮性')
    }

    return suggestions
  }

  /**
   * 批量优化多个文件
   */
  async optimizeFiles(
    files: Array<{ path: string; content: string }>,
    context: RAGContext,
    options: Partial<OptimizationOptions> = {}
  ): Promise<Array<{ path: string; result: OptimizationResult }>> {
    const results: Array<{ path: string; result: OptimizationResult }> = []

    for (const file of files) {
      const language = file.path.endsWith('.ts') || file.path.endsWith('.tsx') 
        ? 'typescript' 
        : 'javascript'
      
      const result = await this.optimizeCode(file.content, language, context, options)
      results.push({ path: file.path, result })
    }

    return results
  }
}

/**
 * 创建代码优化器
 */
export function createCodeOptimizer(config: CodeOptimizerConfig): LangChainCodeOptimizer {
  return new LangChainCodeOptimizer(config)
}

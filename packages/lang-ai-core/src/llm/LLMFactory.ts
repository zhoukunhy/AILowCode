/**
 * LLM 工厂类
 * 统一封装多种大语言模型，支持 DeepSeek、通义千问、OpenAI
 */

import { ChatOpenAI } from '@langchain/openai'
import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { LLMConfig, LLMProvider } from '@ai-lowcode/shared-types'

/**
 * LLM 工厂类
 * 用于创建和管理不同的大语言模型实例
 */
export class LLMFactory {
  private static instances: Map<string, BaseChatModel> = new Map()

  /**
   * 创建 LLM 实例
   * @param config LLM 配置
   * @returns LLM 实例
   */
  static createLLM(config: LLMConfig): BaseChatModel {
    const cacheKey = `${config.provider}-${config.model}`

    // 如果已存在实例且配置相同，直接返回
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!
    }

    let llm: BaseChatModel

    switch (config.provider) {
      case 'deepseek':
        llm = this.createDeepSeek(config)
        break
      case 'qwen':
        llm = this.createQwen(config)
        break
      case 'openai':
        llm = this.createOpenAI(config)
        break
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`)
    }

    this.instances.set(cacheKey, llm)
    return llm
  }

  /**
   * 创建 DeepSeek 模型实例
   * DeepSeek API 兼容 OpenAI 格式
   */
  private static createDeepSeek(config: LLMConfig): ChatOpenAI {
    return new ChatOpenAI({
      modelName: config.model || 'deepseek-chat',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      openAIApiKey: config.apiKey,
      configuration: {
        baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
      },
    })
  }

  /**
   * 创建通义千问模型实例
   */
  private static createQwen(config: LLMConfig): ChatAlibabaTongyi {
    return new ChatAlibabaTongyi({
      model: config.model || 'qwen-plus',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      alibabaApiKey: config.apiKey,
    })
  }

  /**
   * 创建 OpenAI 模型实例
   */
  private static createOpenAI(config: LLMConfig): ChatOpenAI {
    return new ChatOpenAI({
      modelName: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      openAIApiKey: config.apiKey,
      configuration: {
        baseURL: config.baseUrl,
      },
    })
  }

  /**
   * 清除缓存的实例
   */
  static clearCache(): void {
    this.instances.clear()
  }

  /**
   * 获取支持的模型列表
   */
  static getSupportedModels(): Record<LLMProvider, string[]> {
    return {
      deepseek: [
        'deepseek-chat',
        'deepseek-coder',
      ],
      qwen: [
        'qwen-turbo',
        'qwen-plus',
        'qwen-max',
        'qwen-max-longcontext',
      ],
      openai: [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-4o',
        'gpt-4o-mini',
      ],
    }
  }
}

export default LLMFactory

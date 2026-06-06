export interface AIConfig {
  apiKey: string
  baseURL?: string
  model?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class AIService {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    // 这里是AI调用的抽象实现
    // 实际项目中可以对接OpenAI、Claude等AI服务
    try {
      const response = await fetch(`${this.config.baseURL || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          messages,
        }),
      })

      const data = await response.json()
      
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      }
    } catch (error) {
      throw new Error(`AI调用失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async generateComponent(description: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是一个前端组件生成助手，根据用户描述生成React组件代码。',
      },
      {
        role: 'user',
        content: `请根据以下描述生成一个React组件：\n${description}`,
      },
    ]

    const response = await this.chat(messages)
    return response.content
  }

  async generatePage(description: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是一个前端页面生成助手，根据用户描述生成完整的页面代码。',
      },
      {
        role: 'user',
        content: `请根据以下描述生成一个完整的页面：\n${description}`,
      },
    ]

    const response = await this.chat(messages)
    return response.content
  }
}

export function createAIService(config: AIConfig): AIService {
  return new AIService(config)
}

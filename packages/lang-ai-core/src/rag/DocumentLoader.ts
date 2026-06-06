/**
 * 文档加载器
 * 支持多种文档格式的加载
 */

import type { Document } from '@langchain/core/documents'

/**
 * 文档加载器接口
 */
export interface DocumentLoader {
  load(): Promise<Document[]>
}

/**
 * 文本文档加载器
 */
export class TextLoader implements DocumentLoader {
  constructor(private content: string, private metadata: Record<string, any> = {}) {}

  async load(): Promise<Document[]> {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('文档内容为空')
    }

    return [
      {
        pageContent: this.content,
        metadata: {
          ...this.metadata,
          source: 'text',
          loadedAt: new Date().toISOString(),
        },
      },
    ]
  }
}

/**
 * Markdown 文档加载器
 */
export class MarkdownLoader implements DocumentLoader {
  constructor(private content: string, private metadata: Record<string, any> = {}) {}

  async load(): Promise<Document[]> {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Markdown 文档内容为空')
    }

    // 提取 Markdown 标题作为元数据
    const headers = this.extractHeaders(this.content)

    return [
      {
        pageContent: this.content,
        metadata: {
          ...this.metadata,
          source: 'markdown',
          headers,
          loadedAt: new Date().toISOString(),
        },
      },
    ]
  }

  /**
   * 提取 Markdown 标题
   */
  private extractHeaders(content: string): string[] {
    const headerRegex = /^(#{1,6})\s+(.+)$/gm
    const headers: string[] = []
    let match

    while ((match = headerRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      headers.push(`${'#'.repeat(level)} ${text}`)
    }

    return headers
  }
}

/**
 * API 文档加载器
 */
export class ApiDocLoader implements DocumentLoader {
  constructor(private content: string, private metadata: Record<string, any> = {}) {}

  async load(): Promise<Document[]> {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('API 文档内容为空')
    }

    // 尝试解析 API 文档结构
    const apiInfo = this.parseApiDoc(this.content)

    return [
      {
        pageContent: this.content,
        metadata: {
          ...this.metadata,
          source: 'api',
          apiInfo,
          loadedAt: new Date().toISOString(),
        },
      },
    ]
  }

  /**
   * 解析 API 文档
   */
  private parseApiDoc(content: string): Record<string, any> {
    const apiInfo: Record<string, any> = {
      endpoints: [],
      methods: [],
    }

    // 提取 HTTP 方法
    const methodRegex = /\b(GET|POST|PUT|DELETE|PATCH)\b/gi
    let match
    while ((match = methodRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase()
      if (!apiInfo.methods.includes(method)) {
        apiInfo.methods.push(method)
      }
    }

    // 提取端点路径
    const endpointRegex = /\/[a-zA-Z0-9_\-\/]+/g
    while ((match = endpointRegex.exec(content)) !== null) {
      const endpoint = match[0]
      if (!apiInfo.endpoints.includes(endpoint)) {
        apiInfo.endpoints.push(endpoint)
      }
    }

    return apiInfo
  }
}

/**
 * 需求文档加载器
 */
export class RequirementDocLoader implements DocumentLoader {
  constructor(private content: string, private metadata: Record<string, any> = {}) {}

  async load(): Promise<Document[]> {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('需求文档内容为空')
    }

    // 提取需求编号和标题
    const requirements = this.extractRequirements(this.content)

    return [
      {
        pageContent: this.content,
        metadata: {
          ...this.metadata,
          source: 'requirement',
          requirements,
          loadedAt: new Date().toISOString(),
        },
      },
    ]
  }

  /**
   * 提取需求条目
   */
  private extractRequirements(content: string): string[] {
    const reqRegex = /(?:需求|REQ|Requirement)\s*[:#]?\s*([^\n]+)/gi
    const requirements: string[] = []
    let match

    while ((match = reqRegex.exec(content)) !== null) {
      requirements.push(match[1].trim())
    }

    return requirements
  }
}

/**
 * 文档加载器工厂
 */
export class DocumentLoaderFactory {
  /**
   * 根据类型创建文档加载器
   */
  static createLoader(
    type: 'text' | 'md' | 'api' | 'requirement',
    content: string,
    metadata: Record<string, any> = {}
  ): DocumentLoader {
    switch (type) {
      case 'md':
        return new MarkdownLoader(content, metadata)
      case 'api':
        return new ApiDocLoader(content, metadata)
      case 'requirement':
        return new RequirementDocLoader(content, metadata)
      case 'text':
      default:
        return new TextLoader(content, metadata)
    }
  }
}

export default DocumentLoaderFactory
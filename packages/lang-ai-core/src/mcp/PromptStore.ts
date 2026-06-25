/**
 * 提示词变量接口
 * 定义提示词模板中变量的类型和约束
 */
export interface PromptVariable {
  name: string               // 变量名称
  description: string        // 变量描述
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' // 变量类型
  required: boolean         // 是否为必填项
  defaultValue?: any        // 默认值
}

/**
 * 提示词模板接口
 * 定义完整的提示词模板结构
 */
export interface PromptTemplate {
  id: string               // 模板唯一标识符
  name: string             // 模板名称
  description: string      // 模板描述
  content: string          // 模板内容（支持 {{变量}} 语法）
  variables: string[]      // 模板中使用的变量名列表
  category: string         // 模板分类
  version: string          // 模板版本号
  createdAt: Date          // 模板创建时间
  updatedAt: Date          // 模板最后更新时间
}

/**
 * 提示词存储管理器
 * 负责提示词模板的创建、查询、更新、删除和渲染
 * 支持变量替换和模板管理
 */
export class PromptStore {
  private prompts: Map<string, PromptTemplate> = new Map() // 提示词模板存储

  /**
   * 创建新的提示词模板
   * @param template - 模板内容（不含 id、createdAt、updatedAt）
   * @returns 新创建的提示词模板（包含自动生成的 id 和时间戳）
   */
  createPrompt(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): PromptTemplate {
    const now = new Date()
    const prompt: PromptTemplate = {
      ...template,
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一ID
      createdAt: now,
      updatedAt: now,
    }
    this.prompts.set(prompt.id, prompt)
    return prompt
  }

  /**
   * 获取指定ID的提示词模板
   * @param id - 模板ID
   * @returns 提示词模板或 undefined
   */
  getPrompt(id: string): PromptTemplate | undefined {
    return this.prompts.get(id)
  }

  /**
   * 更新指定的提示词模板
   * @param id - 模板ID
   * @param updates - 要更新的字段
   * @returns 更新后的模板或 undefined（当模板不存在时）
   */
  updatePrompt(id: string, updates: Partial<Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>>): PromptTemplate | undefined {
    const existing = this.prompts.get(id)
    if (!existing) return undefined

    const updated: PromptTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date(), // 自动更新修改时间
    }
    this.prompts.set(id, updated)
    return updated
  }

  /**
   * 列出所有提示词模板
   * @param category - 可选的分类过滤器
   * @returns 提示词模板数组
   */
  listPrompts(category?: string): PromptTemplate[] {
    const all = Array.from(this.prompts.values())
    return category ? all.filter(p => p.category === category) : all
  }

  /**
   * 渲染提示词模板（变量替换）
   * @param id - 模板ID
   * @param variables - 变量值字典
   * @returns 渲染后的提示词文本
   * @throws Error 当模板不存在时抛出异常
   */
  renderPrompt(id: string, variables: Record<string, any>): string {
    const prompt = this.prompts.get(id)
    if (!prompt) throw new Error(`Prompt not found: ${id}`)

    let content = prompt.content
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }
    return content
  }

  /**
   * 删除指定的提示词模板
   * @param id - 模板ID
   * @returns 是否成功删除
   */
  deletePrompt(id: string): boolean {
    return this.prompts.delete(id)
  }

  /**
   * 检查指定模板是否存在
   * @param id - 模板ID
   * @returns 是否存在该模板
   */
  hasPrompt(id: string): boolean {
    return this.prompts.has(id)
  }
}
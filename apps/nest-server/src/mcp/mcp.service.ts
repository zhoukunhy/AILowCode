/**
 * MCP 服务类（持久化版）
 * NestJS 服务层，为 MCP 系统提供业务逻辑处理
 * 基于 TypeORM 实现数据持久化，替代原有内存存储
 */
import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { MCPAgent } from '@ai-lowcode/lang-ai-core'
import type { MCPRequest, ToolRegistration } from '@ai-lowcode/lang-ai-core'
import { McpPromptTemplateEntity } from './entities/mcp-prompt-template.entity'
import { McpContextSessionEntity, ChatMessageRecord } from './entities/mcp-context-session.entity'
import { McpToolRegistryEntity } from './entities/mcp-tool-registry.entity'

/**
 * MCP 服务类
 * 整合 TypeORM 数据持久化与 MCPAgent 核心能力
 * 实现提示词管理、会话上下文管理和工具调用的持久化存储
 */
@Injectable()
export class MCPService implements OnModuleInit {
  private mcpAgent: MCPAgent // MCP 核心代理实例，负责内置工具调用和 RPC 处理

  /**
   * 构造函数，注入 Repository 依赖
   */
  constructor(
    @InjectRepository(McpPromptTemplateEntity)
    private promptRepo: Repository<McpPromptTemplateEntity>,
    @InjectRepository(McpContextSessionEntity)
    private contextRepo: Repository<McpContextSessionEntity>,
    @InjectRepository(McpToolRegistryEntity)
    private toolRepo: Repository<McpToolRegistryEntity>
  ) {
    this.mcpAgent = new MCPAgent()
  }

  /**
   * 模块初始化钩子
   * 检查数据库是否为空，自动插入默认提示词模板
   */
  async onModuleInit(): Promise<void> {
    await this.initializeDefaultPrompts()
  }

  /**
   * 初始化默认提示词模板
   * 当数据库中无任何提示词时，自动插入平台预设模板
   */
  private async initializeDefaultPrompts(): Promise<void> {
    const count = await this.promptRepo.count()
    if (count > 0) return

    const defaults: Partial<McpPromptTemplateEntity>[] = [
      {
        name: 'page_planning',
        description: '用于根据用户需求生成页面规划的提示词',
        content: '你是一个专业的低代码页面规划专家。请根据以下需求，生成一个合理的页面结构规划：\n\n需求：{{user_input}}\n\n请输出 JSON 格式的页面规划。',
        variables: ['user_input'],
        category: 'planning',
        version: '1.0.0',
        tags: '页面规划,需求分析',
        stats: { useCount: 0 },
      },
      {
        name: 'code_generation',
        description: '用于生成后端代码的提示词',
        content: '你是一个专业的 NestJS 开发专家。请根据以下 Schema 生成对应的 NestJS 模块代码：\n\nSchema：{{schema}}\n\n要求：{{requirements}}',
        variables: ['schema', 'requirements'],
        category: 'codegen',
        version: '1.0.0',
        tags: '代码生成,NestJS',
        stats: { useCount: 0 },
      },
      {
        name: 'component_design',
        description: '用于设计 React 组件的提示词',
        content: '你是一个 React 组件设计专家。请根据以下需求设计组件：\n\n组件类型：{{component_type}}\n属性：{{props}}\n\n请输出组件代码。',
        variables: ['component_type', 'props'],
        category: 'codegen',
        version: '1.0.0',
        tags: '组件设计,React',
        stats: { useCount: 0 },
      },
    ]

    for (const data of defaults) {
      await this.promptRepo.save(this.promptRepo.create(data))
    }
  }

  // ==================== 工具管理 ====================

  /**
   * 列出所有可用工具（内置 + 数据库自定义）
   * @returns 工具注册信息数组
   */
  async listTools(): Promise<ToolRegistration[]> {
    const builtin = this.mcpAgent.toolManager.listTools()
    const custom = await this.toolRepo.find({ where: { isActive: true } })
    const customTools: ToolRegistration[] = custom.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      version: t.version,
      author: t.author ?? undefined,
    }))
    return [...builtin, ...customTools]
  }

  /**
   * 获取指定工具的详细信息
   * 优先查询内置工具，未找到则查询数据库
   * @param name - 工具名称
   * @returns 工具注册信息或 undefined
   */
  async describeTool(name: string): Promise<ToolRegistration | undefined> {
    const builtin = this.mcpAgent.toolManager.describeTool(name)
    if (builtin) return builtin

    const custom = await this.toolRepo.findOne({ where: { name, isActive: true } })
    if (!custom) return undefined

    return {
      name: custom.name,
      description: custom.description,
      inputSchema: custom.inputSchema,
      version: custom.version,
      author: custom.author ?? undefined,
    }
  }

  /**
   * 调用指定工具执行操作
   * 内置工具通过 MCPAgent 执行，自定义工具根据配置执行
   * @param name - 工具名称
   * @param input - 工具输入参数
   * @returns 工具执行结果
   */
  async callTool(name: string, input: any): Promise<any> {
    const builtin = this.mcpAgent.toolManager.describeTool(name)
    if (builtin) {
      return this.mcpAgent.toolManager.callTool(name, input)
    }

    const custom = await this.toolRepo.findOne({ where: { name, isActive: true } })
    if (!custom) {
      throw new Error(`工具不存在: ${name}`)
    }

    // 更新使用统计
    const stats = custom.stats ?? { callCount: 0 }
    stats.callCount += 1
    stats.lastCalledAt = new Date()
    await this.toolRepo.update(custom.id, { stats })

    // 自定义工具根据 implementation 配置执行
    // 简单实现：如果 implementation 以 http:// 或 https:// 开头，发起 HTTP 请求
    if (custom.implementation?.startsWith('http')) {
      const res = await fetch(custom.implementation, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      return res.json()
    }

    // 如果无 implementation，仅返回配置描述
    return { success: true, message: '自定义工具已触发', tool: name, input }
  }

  /**
   * 注册自定义工具到数据库
   * @param tool - 工具注册信息
   * @returns 创建的实体
   */
  async registerTool(tool: Omit<McpToolRegistryEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<McpToolRegistryEntity> {
    const entity = this.toolRepo.create(tool)
    return this.toolRepo.save(entity)
  }

  // ==================== 提示词管理 ====================

  /**
   * 列出所有提示词模板
   * 支持按分类过滤和分页
   * @param category - 可选的分类过滤器
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页大小
   * @returns 提示词模板数组及总数
   */
  async listPrompts(
    category?: string,
    page?: number,
    pageSize?: number
  ): Promise<{ items: McpPromptTemplateEntity[]; total: number }> {
    const where: any = { isActive: true }
    if (category) where.category = category

    const [items, total] = await this.promptRepo.findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip: page && pageSize ? (page - 1) * pageSize : undefined,
      take: pageSize ?? undefined,
    })
    return { items, total }
  }

  /**
   * 搜索提示词模板（按名称模糊匹配）
   * @param keyword - 搜索关键词
   * @returns 匹配的提示词模板列表
   */
  async searchPrompts(keyword: string): Promise<McpPromptTemplateEntity[]> {
    return this.promptRepo.find({
      where: [
        { name: Like(`%${keyword}%`), isActive: true },
        { description: Like(`%${keyword}%`), isActive: true },
      ],
      order: { updatedAt: 'DESC' },
    })
  }

  /**
   * 获取指定ID的提示词模板
   * @param id - 模板ID
   * @returns 提示词模板或 null
   */
  async getPrompt(id: string): Promise<McpPromptTemplateEntity | null> {
    return this.promptRepo.findOne({ where: { id } })
  }

  /**
   * 按名称获取提示词模板
   * @param name - 模板名称
   * @returns 提示词模板或 null
   */
  async getPromptByName(name: string): Promise<McpPromptTemplateEntity | null> {
    return this.promptRepo.findOne({ where: { name } })
  }

  /**
   * 创建新的提示词模板
   * @param prompt - 模板内容
   * @returns 新创建的提示词模板
   */
  async createPrompt(prompt: Partial<McpPromptTemplateEntity>): Promise<McpPromptTemplateEntity> {
    const entity = this.promptRepo.create(prompt)
    return this.promptRepo.save(entity)
  }

  /**
   * 更新指定的提示词模板
   * @param id - 模板ID
   * @param updates - 要更新的字段
   * @returns 更新后的模板或 null
   */
  async updatePrompt(id: string, updates: Partial<McpPromptTemplateEntity>): Promise<McpPromptTemplateEntity | null> {
    const exists = await this.promptRepo.findOne({ where: { id } })
    if (!exists) return null
    await this.promptRepo.update(id, updates)
    return this.promptRepo.findOne({ where: { id } })
  }

  /**
   * 删除指定的提示词模板（软删除：标记为禁用）
   * @param id - 模板ID
   * @returns 是否成功删除
   */
  async deletePrompt(id: string): Promise<boolean> {
    const res = await this.promptRepo.update(id, { isActive: false })
    return res.affected !== undefined && res.affected > 0
  }

  /**
   * 渲染提示词模板（变量替换）
   * 同时更新模板的使用统计
   * @param id - 模板ID
   * @param variables - 变量值字典
   * @returns 渲染后的提示词文本
   */
  async renderPrompt(id: string, variables: Record<string, any>): Promise<string> {
    const template = await this.promptRepo.findOne({ where: { id, isActive: true } })
    if (!template) {
      throw new Error(`提示词模板不存在: ${id}`)
    }

    let rendered = template.content
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }

    // 更新使用统计
    const stats = template.stats ?? { useCount: 0 }
    stats.useCount += 1
    stats.lastUsedAt = new Date()
    await this.promptRepo.update(id, { stats })

    return rendered
  }

  // ==================== 上下文管理 ====================

  /**
   * 获取或创建指定会话的上下文
   * @param sessionId - 会话ID
   * @returns 会话上下文实体
   */
  async getOrCreateContext(sessionId: string): Promise<McpContextSessionEntity> {
    let session = await this.contextRepo.findOne({ where: { sessionId } })
    if (!session) {
      session = this.contextRepo.create({ sessionId, messages: [] })
      session = await this.contextRepo.save(session)
    }
    return session
  }

  /**
   * 获取指定会话的上下文
   * @param sessionId - 会话ID
   * @returns 会话上下文或 null
   */
  async getContext(sessionId: string): Promise<McpContextSessionEntity | null> {
    return this.contextRepo.findOne({ where: { sessionId } })
  }

  /**
   * 向会话添加上下文消息
   * 自动更新最后活动时间
   * @param sessionId - 会话ID
   * @param message - 消息内容
   * @returns 更新后的会话实体
   */
  async addMessage(
    sessionId: string,
    message: Omit<ChatMessageRecord, 'timestamp'>
  ): Promise<McpContextSessionEntity> {
    const session = await this.getOrCreateContext(sessionId)
    const record: ChatMessageRecord = {
      ...message,
      timestamp: new Date().toISOString(),
    }
    session.messages = [...(session.messages || []), record]
    session.lastActivityAt = new Date()
    return this.contextRepo.save(session)
  }

  /**
   * 更新会话元数据
   * @param sessionId - 会话ID
   * @param metadata - 元数据对象
   * @returns 更新后的会话实体
   */
  async setMetadata(sessionId: string, metadata: Record<string, any>): Promise<McpContextSessionEntity> {
    const session = await this.getOrCreateContext(sessionId)
    session.metadata = { ...(session.metadata || {}), ...metadata }
    session.lastActivityAt = new Date()
    return this.contextRepo.save(session)
  }

  /**
   * 清除指定会话的所有消息（保留会话记录）
   * @param sessionId - 会话ID
   */
  async clearContext(sessionId: string): Promise<void> {
    await this.contextRepo.update({ sessionId }, { messages: [] })
  }

  /**
   * 获取指定会话的消息历史
   * @param sessionId - 会话ID
   * @param limit - 限制返回的消息数量
   * @returns 消息列表
   */
  async getMessages(sessionId: string, limit?: number): Promise<ChatMessageRecord[]> {
    const session = await this.contextRepo.findOne({ where: { sessionId } })
    if (!session) return []
    const messages = session.messages || []
    return limit ? messages.slice(-limit) : messages
  }

  // ==================== MCP RPC ====================

  /**
   * 执行 MCP RPC 请求
   * 通过 MCPAgent 处理标准化 JSON-RPC 请求
   * @param request - MCP 请求对象
   * @returns MCP 响应结果
   */
  async executeRPC(request: MCPRequest): Promise<any> {
    return this.mcpAgent.processRequest(request)
  }
}

/**
 * 聊天消息接口
 * 表示对话中的单条消息
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool' // 消息发送者角色
  content: string                                  // 消息内容
  timestamp: Date                                  // 消息时间戳
  toolCallId?: string                             // 工具调用ID（当role为tool时）
}

/**
 * 会话上下文接口
 * 表示一个完整的对话会话及其相关信息
 */
export interface ConversationContext {
  sessionId: string                      // 会话唯一标识符
  messages: ChatMessage[]               // 历史消息列表
  metadata: Record<string, any>         // 会话元数据
  createdAt: Date                       // 会话创建时间
  lastUpdatedAt: Date                   // 会话最后更新时间
}

/**
 * 上下文存储管理器
 * 负责管理所有会话的上下文信息，包括消息历史和元数据
 * 支持上下文的创建、查询、更新和清理
 */
export class ContextStore {
  private contexts: Map<string, ConversationContext> = new Map() // 会话上下文存储

  /**
   * 创建新的会话上下文
   * @param sessionId - 会话唯一标识符
   * @returns 新创建的会话上下文
   */
  createContext(sessionId: string): ConversationContext {
    const now = new Date()
    const context: ConversationContext = {
      sessionId,
      messages: [],
      metadata: {},
      createdAt: now,
      lastUpdatedAt: now,
    }
    this.contexts.set(sessionId, context)
    return context
  }

  /**
   * 获取指定会话的上下文
   * @param sessionId - 会话唯一标识符
   * @returns 会话上下文或 undefined
   */
  getContext(sessionId: string): ConversationContext | undefined {
    return this.contexts.get(sessionId)
  }

  /**
   * 向指定会话添加新消息
   * @param sessionId - 会话唯一标识符
   * @param message - 消息内容（不含时间戳，自动生成）
   * @throws Error 当会话不存在时抛出异常
   */
  addMessage(sessionId: string, message: Omit<ChatMessage, 'timestamp'>): void {
    const context = this.contexts.get(sessionId)
    if (!context) throw new Error(`Context not found: ${sessionId}`)

    context.messages.push({ ...message, timestamp: new Date() })
    context.lastUpdatedAt = new Date()
  }

  /**
   * 设置会话的元数据
   * @param sessionId - 会话唯一标识符
   * @param metadata - 要设置的元数据（与现有元数据合并）
   * @throws Error 当会话不存在时抛出异常
   */
  setMetadata(sessionId: string, metadata: Record<string, any>): void {
    const context = this.contexts.get(sessionId)
    if (!context) throw new Error(`Context not found: ${sessionId}`)

    context.metadata = { ...context.metadata, ...metadata }
    context.lastUpdatedAt = new Date()
  }

  /**
   * 清除指定会话的上下文
   * @param sessionId - 会话唯一标识符
   */
  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId)
  }

  /**
   * 清理超过指定时间的老会话上下文
   * @param maxAgeMinutes - 最大保留时间（分钟），默认60分钟
   */
  pruneOldContexts(maxAgeMinutes: number = 60): void {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000)
    for (const [sessionId, context] of this.contexts) {
      if (context.lastUpdatedAt < cutoff) {
        this.contexts.delete(sessionId)
      }
    }
  }

  /**
   * 检查指定会话是否存在
   * @param sessionId - 会话唯一标识符
   * @returns 是否存在该会话
   */
  hasContext(sessionId: string): boolean {
    return this.contexts.has(sessionId)
  }

  /**
   * 获取当前存储的会话总数
   * @returns 会话数量
   */
  getContextCount(): number {
    return this.contexts.size
  }
}
/**
 * MCP SSE 传输层
 * 基于 Server-Sent Events 实现 MCP 协议的双向通信
 * 支持 Claude Desktop 等 MCP 客户端的对接
 */

import { EventEmitter } from 'events'
import type { MCPRequest, MCPResponse } from './MCPProtocol'

/**
 * SSE 消息类型
 */
export interface SSEMessage {
  event: string
  data: string
  id?: string
  retry?: number
}

/**
 * SSE 连接状态
 */
export type SSEConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'

/**
 * SSE 客户端连接信息
 */
export interface SSEClient {
  id: string
  lastEventId?: string
  state: SSEConnectionState
  createdAt: Date
  onMessage: (message: MCPRequest) => void
  onError: (error: Error) => void
}

/**
 * SSE 传输层配置
 */
export interface SSETransportConfig {
  heartbeatInterval?: number    // 心跳间隔（毫秒）
  reconnectAttempts?: number    // 最大重连次数
  reconnectDelay?: number       // 重连延迟（毫秒）
  maxConnections?: number       // 最大连接数
}

/**
 * SSE 传输层类
 * 实现 MCP 协议的 SSE 传输机制
 * 支持服务端推送和客户端事件接收
 */
export class SSETransport extends EventEmitter {
  private clients: Map<string, SSEClient> = new Map()
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map()
  private config: Required<SSETransportConfig>

  constructor(config?: SSETransportConfig) {
    super()
    this.config = {
      heartbeatInterval: config?.heartbeatInterval || 30000,
      reconnectAttempts: config?.reconnectAttempts || 5,
      reconnectDelay: config?.reconnectDelay || 1000,
      maxConnections: config?.maxConnections || 100,
    }
  }

  /**
   * 创建新的 SSE 连接
   * @param clientId - 客户端唯一标识
   * @param lastEventId - 上次接收到的事件 ID（用于断线重连）
   * @returns SSE 连接信息
   */
  connect(clientId: string, lastEventId?: string): SSEClient {
    if (this.clients.size >= this.config.maxConnections) {
      throw new Error(`最大连接数 ${this.config.maxConnections} 已达到`)
    }

    if (this.clients.has(clientId)) {
      return this.clients.get(clientId)!
    }

    const client: SSEClient = {
      id: clientId,
      lastEventId,
      state: 'connected',
      createdAt: new Date(),
      onMessage: () => {},
      onError: () => {},
    }

    this.clients.set(clientId, client)
    this.startHeartbeat(clientId)

    this.emit('connection', client)
    this.emit('client_connected', clientId)

    return client
  }

  /**
   * 断开 SSE 连接
   * @param clientId - 客户端唯一标识
   */
  disconnect(clientId: string): void {
    const client = this.clients.get(clientId)
    if (!client) return

    client.state = 'disconnected'
    this.stopHeartbeat(clientId)
    this.clients.delete(clientId)

    this.emit('disconnection', client)
    this.emit('client_disconnected', clientId)
  }

  /**
   * 向指定客户端发送 SSE 消息
   * @param clientId - 客户端唯一标识
   * @param event - 事件类型
   * @param data - 消息数据
   * @param eventId - 事件 ID（用于追踪）
   */
  send(clientId: string, event: string, data: any, eventId?: string): void {
    const client = this.clients.get(clientId)
    if (!client || client.state !== 'connected') {
      console.warn(`SSE: Client ${clientId} not connected, message dropped`)
      return
    }

    const message: SSEMessage = {
      event,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      id: eventId || this.generateEventId(),
    }

    this.emit('message', { clientId, message })
  }

  /**
   * 广播消息到所有已连接的客户端
   * @param event - 事件类型
   * @param data - 消息数据
   */
  broadcast(event: string, data: any): void {
    for (const [clientId] of this.clients) {
      this.send(clientId, event, data)
    }
  }

  /**
   * 向指定客户端发送 MCP 响应
   * @param clientId - 客户端唯一标识
   * @param response - MCP 响应数据
   */
  sendResponse(clientId: string, response: MCPResponse): void {
    this.send(clientId, 'mcp_response', response)
  }

  /**
   * 向指定客户端发送 MCP 错误
   * @param clientId - 客户端唯一标识
   * @param error - 错误信息
   * @param requestId - 关联的请求 ID
   */
  sendError(clientId: string, error: { code: number; message: string }, requestId?: string): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: requestId || 'unknown',
      error: {
        code: error.code,
        message: error.message,
      },
    }
    this.send(clientId, 'mcp_error', response)
  }

  /**
   * 向指定客户端发送工具列表变更通知
   * @param clientId - 客户端唯一标识
   */
  notifyToolsChanged(clientId: string): void {
    this.send(clientId, 'notification', {
      method: 'notifications/tools_changed',
      params: {},
    })
  }

  /**
   * 向指定客户端发送提示词列表变更通知
   * @param clientId - 客户端唯一标识
   */
  notifyPromptsChanged(clientId: string): void {
    this.send(clientId, 'notification', {
      method: 'notifications/prompts_changed',
      params: {},
    })
  }

  /**
   * 处理来自客户端的消息
   * @param clientId - 客户端唯一标识
   * @param message - 接收到的消息
   */
  handleMessage(clientId: string, message: string): void {
    const client = this.clients.get(clientId)
    if (!client) {
      console.warn(`SSE: Message from unknown client ${clientId}`)
      return
    }

    try {
      const data = JSON.parse(message)
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: data.id || this.generateEventId(),
        method: data.method,
        params: data.params,
      }

      client.lastEventId = data.id

      // 触发回调并发出事件，确保消息处理流程完整
      client.onMessage(request)
      this.emit('client_message', { clientId, request })
    } catch (error: any) {
      client.onError(error)
      this.sendError(clientId, { code: -32700, message: `解析错误: ${error.message}` })
    }
  }

  /**
   * 获取所有已连接的客户端
   */
  getClients(): SSEClient[] {
    return Array.from(this.clients.values())
  }

  /**
   * 获取已连接客户端数量
   */
  getClientCount(): number {
    return this.clients.size
  }

  /**
   * 检查指定客户端是否已连接
   */
  isConnected(clientId: string): boolean {
    const client = this.clients.get(clientId)
    return client?.state === 'connected'
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(clientId: string): void {
    this.stopHeartbeat(clientId)

    const interval = setInterval(() => {
      const client = this.clients.get(clientId)
      if (client?.state === 'connected') {
        this.send(clientId, 'heartbeat', { timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)

    this.heartbeatIntervals.set(clientId, interval)
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(clientId: string): void {
    const interval = this.heartbeatIntervals.get(clientId)
    if (interval) {
      clearInterval(interval)
      this.heartbeatIntervals.delete(clientId)
    }
  }

  /**
   * 生成唯一事件 ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理所有资源
   */
  destroy(): void {
    for (const [clientId] of this.heartbeatIntervals) {
      this.stopHeartbeat(clientId)
    }
    for (const [clientId] of this.clients) {
      this.disconnect(clientId)
    }
    this.removeAllListeners()
  }
}

/**
 * SSE 传输层单例（用于 NestJS 依赖注入）
 */
let sseTransportInstance: SSETransport | null = null

export function getSSETransport(): SSETransport {
  if (!sseTransportInstance) {
    sseTransportInstance = new SSETransport()
  }
  return sseTransportInstance
}

export function resetSSETransport(): void {
  if (sseTransportInstance) {
    sseTransportInstance.destroy()
    sseTransportInstance = null
  }
}

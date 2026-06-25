/**
 * MCP 控制器类（持久化版）
 * 提供 MCP 系统的 RESTful API 接口
 * 支持 JWT 认证，所有接口都需要认证才能访问
 * 适配持久化后的 Service 层，支持分页、搜索等高级查询
 * 新增 SSE 传输层支持，可对接 Claude Desktop 等 MCP 客户端
 */
import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, Res,
  HttpCode, HttpStatus, Req,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Response, Request } from 'express'
import { MCPService } from './mcp.service'
import type { MCPRequest } from '@ai-lowcode/lang-ai-core'
import { McpPromptTemplateEntity } from './entities/mcp-prompt-template.entity'
import { McpToolRegistryEntity } from './entities/mcp-tool-registry.entity'
import { SSETransport } from '@ai-lowcode/lang-ai-core'

/**
 * MCP 控制器类
 */
@ApiTags('MCP')
@ApiBearerAuth('JWT-auth')
@Controller('api/mcp')
export class MCPController {
  private readonly sseTransport: SSETransport

  constructor(
    private readonly mcpService: MCPService,
  ) {
    this.sseTransport = new SSETransport({
      heartbeatInterval: 30000,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      maxConnections: 100,
    })

    this.setupSSEEventHandlers()
  }

  /**
   * 设置 SSE 事件处理器
   */
  private setupSSEEventHandlers(): void {
    this.sseTransport.on('client_message', async (event: { clientId: string; request: MCPRequest }) => {
      try {
        const response = await this.mcpService.executeRPC(event.request)
        this.sseTransport.sendResponse(event.clientId, {
          jsonrpc: '2.0',
          id: event.request.id,
          result: response,
        })
      } catch (error: any) {
        this.sseTransport.sendError(event.clientId, {
          code: -32603,
          message: error.message,
        }, event.request.id)
      }
    })
  }

  // ==================== 工具管理 ====================

  /**
   * 获取所有可用工具列表（内置 + 自定义）
   * @returns 工具注册信息数组
   */
  @Get('tools')
  @ApiOperation({ summary: '获取工具列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async listTools(): Promise<any[]> {
    return this.mcpService.listTools()
  }

  /**
   * 获取指定工具的详细信息
   * @param name - 工具名称
   * @returns 工具注册信息或 undefined
   */
  @Get('tools/:name')
  @ApiOperation({ summary: '获取工具详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '工具不存在' })
  async describeTool(@Param('name') name: string): Promise<any> {
    const tool = await this.mcpService.describeTool(name)
    if (!tool) return { success: false, message: '工具不存在' }
    return tool
  }

  /**
   * 调用指定工具执行操作
   * @param name - 工具名称
   * @param input - 工具输入参数
   * @returns 工具执行结果
   */
  @Post('tools/:name/call')
  @ApiOperation({ summary: '调用工具' })
  @ApiResponse({ status: 200, description: '调用成功' })
  @ApiResponse({ status: 400, description: '调用失败' })
  async callTool(@Param('name') name: string, @Body() input: any): Promise<any> {
    return this.mcpService.callTool(name, input)
  }

  /**
   * 注册自定义工具
   * @param tool - 工具注册信息
   * @returns 创建的工具实体
   */
  @Post('tools')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '注册自定义工具' })
  @ApiResponse({ status: 201, description: '注册成功' })
  async registerTool(@Body() tool: Partial<McpToolRegistryEntity>): Promise<McpToolRegistryEntity> {
    return this.mcpService.registerTool(tool as any)
  }

  // ==================== 提示词管理 ====================

  /**
   * 获取提示词模板列表（支持分页和分类过滤）
   * @param category - 可选的分类过滤器
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页大小
   * @returns 提示词模板数组及总数
   */
  @Get('prompts')
  @ApiOperation({ summary: '获取提示词列表（支持分页）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async listPrompts(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<{ items: McpPromptTemplateEntity[]; total: number }> {
    return this.mcpService.listPrompts(
      category,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    )
  }

  /**
   * 搜索提示词模板（按名称或描述模糊匹配）
   * @param keyword - 搜索关键词
   * @returns 匹配的提示词模板列表
   */
  @Get('prompts/search')
  @ApiOperation({ summary: '搜索提示词' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchPrompts(@Query('keyword') keyword: string): Promise<McpPromptTemplateEntity[]> {
    return this.mcpService.searchPrompts(keyword)
  }

  /**
   * 获取指定ID的提示词模板详情
   * @param id - 模板ID
   * @returns 提示词模板或 null
   */
  @Get('prompts/:id')
  @ApiOperation({ summary: '获取提示词详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  async getPrompt(@Param('id') id: string): Promise<any> {
    const prompt = await this.mcpService.getPrompt(id)
    if (!prompt) return { success: false, message: '提示词不存在' }
    return prompt
  }

  /**
   * 创建新的提示词模板
   * @param prompt - 模板内容
   * @returns 新创建的提示词模板
   */
  @Post('prompts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建提示词' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '创建失败' })
  async createPrompt(@Body() prompt: Partial<McpPromptTemplateEntity>): Promise<McpPromptTemplateEntity> {
    return this.mcpService.createPrompt(prompt)
  }

  /**
   * 更新指定的提示词模板
   * @param id - 模板ID
   * @param updates - 要更新的字段
   * @returns 更新后的模板或 null
   */
  @Put('prompts/:id')
  @ApiOperation({ summary: '更新提示词' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  async updatePrompt(
    @Param('id') id: string,
    @Body() updates: Partial<McpPromptTemplateEntity>,
  ): Promise<any> {
    const result = await this.mcpService.updatePrompt(id, updates)
    if (!result) return { success: false, message: '提示词不存在' }
    return result
  }

  /**
   * 删除指定的提示词模板（软删除）
   * @param id - 模板ID
   * @returns 操作结果
   */
  @Delete('prompts/:id')
  @ApiOperation({ summary: '删除提示词' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  async deletePrompt(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.mcpService.deletePrompt(id)
    return { success }
  }

  /**
   * 渲染提示词模板（变量替换）
   * @param id - 模板ID
   * @param body - 包含变量值字典的请求体
   * @returns 渲染后的提示词内容
   */
  @Post('prompts/:id/render')
  @ApiOperation({ summary: '渲染提示词' })
  @ApiResponse({ status: 200, description: '渲染成功' })
  @ApiResponse({ status: 400, description: '渲染失败' })
  async renderPrompt(
    @Param('id') id: string,
    @Body() body: { variables: Record<string, any> },
  ): Promise<{ content: string }> {
    const content = await this.mcpService.renderPrompt(id, body.variables)
    return { content }
  }

  // ==================== 上下文管理 ====================

  /**
   * 获取指定会话的上下文
   * @param sessionId - 会话ID
   * @returns 会话上下文信息
   */
  @Get('context/:sessionId')
  @ApiOperation({ summary: '获取会话上下文' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getContext(@Param('sessionId') sessionId: string): Promise<any> {
    const ctx = await this.mcpService.getContext(sessionId)
    if (!ctx) return { success: false, message: '会话不存在' }
    return ctx
  }

  /**
   * 获取指定会话的消息历史
   * @param sessionId - 会话ID
   * @param limit - 限制返回的消息数量
   * @returns 消息列表
   */
  @Get('context/:sessionId/messages')
  @ApiOperation({ summary: '获取会话消息历史' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getMessages(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    return this.mcpService.getMessages(
      sessionId,
      limit ? parseInt(limit, 10) : undefined,
    )
  }

  /**
   * 向会话添加上下文消息
   * @param sessionId - 会话ID
   * @param body - 消息内容
   * @returns 更新后的会话实体
   */
  @Post('context/:sessionId/messages')
  @ApiOperation({ summary: '添加会话消息' })
  @ApiResponse({ status: 200, description: '添加成功' })
  async addMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: { role: 'user' | 'assistant' | 'system' | 'tool'; content: string; toolCallId?: string },
  ): Promise<any> {
    return this.mcpService.addMessage(sessionId, body)
  }

  /**
   * 更新会话元数据
   * @param sessionId - 会话ID
   * @param body - 元数据对象
   * @returns 更新后的会话实体
   */
  @Post('context/:sessionId/metadata')
  @ApiOperation({ summary: '更新会话元数据' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async setMetadata(
    @Param('sessionId') sessionId: string,
    @Body() body: Record<string, any>,
  ): Promise<any> {
    return this.mcpService.setMetadata(sessionId, body)
  }

  /**
   * 清除指定会话的所有消息（保留会话记录）
   * @param sessionId - 会话ID
   * @returns 操作结果
   */
  @Delete('context/:sessionId')
  @ApiOperation({ summary: '清除会话上下文' })
  @ApiResponse({ status: 200, description: '清除成功' })
  async clearContext(@Param('sessionId') sessionId: string): Promise<{ success: boolean }> {
    await this.mcpService.clearContext(sessionId)
    return { success: true }
  }

  // ==================== SSE 传输层 ====================

  /**
   * SSE 连接端点
   * 用于 Claude Desktop 等 MCP 客户端的长连接
   * 支持服务端推送和客户端请求
   */
  @Get('sse')
  @ApiOperation({ summary: 'SSE 连接端点（用于 MCP 客户端）' })
  @ApiResponse({ status: 200, description: 'SSE 连接成功' })
  async sseConnect(@Req() req: Request, @Res() res: Response): Promise<void> {
    const clientId = req.headers['x-client-id'] as string || `client_${Date.now()}`
    const lastEventId = req.headers['last-event-id'] as string

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    this.sseTransport.connect(clientId, lastEventId)

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    sendEvent('connected', { clientId, message: 'MCP SSE 连接成功' })
    sendEvent('message', { method: 'initialize', params: {} })

    const heartbeatInterval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeatInterval)
        return
      }
      res.write(`: heartbeat\n\n`)
    }, 15000)

    req.on('close', () => {
      clearInterval(heartbeatInterval)
      this.sseTransport.disconnect(clientId)
    })
  }

  /**
   * SSE 消息接收端点
   * 接收来自 MCP 客户端的 JSON-RPC 请求
   */
  @Post('sse/message')
  @ApiOperation({ summary: 'SSE 消息接收端点' })
  @ApiResponse({ status: 200, description: '消息已接收' })
  async sseMessage(
    @Body() body: { clientId: string; message: string },
  ): Promise<{ success: boolean }> {
    this.sseTransport.handleMessage(body.clientId, body.message)
    return { success: true }
  }

  /**
   * 获取 SSE 连接状态
   */
  @Get('sse/status')
  @ApiOperation({ summary: '获取 SSE 连接状态' })
  @ApiResponse({ status: 200, description: '状态查询成功' })
  async sseStatus(): Promise<{ clientCount: number; clients: string[] }> {
    const clients = this.sseTransport.getClients()
    return {
      clientCount: this.sseTransport.getClientCount(),
      clients: clients.map((c: { id: string }) => c.id),
    }
  }

  // ==================== MCP RPC ====================

  /**
   * 执行 MCP RPC 请求
   * @param request - MCP 请求对象
   * @returns MCP 响应结果
   */
  @Post('rpc')
  @ApiOperation({ summary: '执行 MCP RPC 请求' })
  @ApiResponse({ status: 200, description: '执行成功' })
  @ApiResponse({ status: 400, description: '执行失败' })
  async executeRPC(@Body() request: MCPRequest): Promise<any> {
    return this.mcpService.executeRPC(request)
  }
}

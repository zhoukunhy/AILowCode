/**
 * Agent 服务（MCP 集成版）
 * 提供 AI 生成页面的业务逻辑
 * 集成 MCP 提示词模板渲染和上下文持久化能力
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { AgentSessionEntity, AgentLogEntry } from './entities/agent-session.entity'
import {
  GeneratePageDto,
  QuerySessionsDto,
  GeneratePageResponseDto,
} from './dto/agent.dto'
import { PagePlanningAgent } from '@ai-lowcode/lang-ai-core'
import type { ChromaConfig, RAGConfig, LLMConfig } from '@ai-lowcode/shared-types'
import { MCPService } from '../../mcp/mcp.service'

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)
  private readonly agents = new Map<string, InstanceType<typeof PagePlanningAgent>>()

  constructor(
    @InjectRepository(AgentSessionEntity)
    private sessionRepository: Repository<AgentSessionEntity>,
    private readonly mcpService: MCPService,
  ) {}

  /**
   * 生成页面
   * 集成 MCP 提示词模板和上下文管理：
   * 1. 从 MCP 数据库获取并渲染页面规划提示词
   * 2. 将系统提示词注入 MCP 上下文存储
   * 3. 执行 AI 规划流程
   * 4. 将结果保存到 MCP 上下文存储，实现全链路可追溯
   */
  async generatePage(dto: GeneratePageDto): Promise<GeneratePageResponseDto> {
    const sessionId = dto.sessionId || uuidv4()
    const startTime = Date.now()

    // 创建会话记录
    const session = this.sessionRepository.create({
      sessionId,
      agentType: 'page_planning',
      userInput: dto.requirement,
      status: 'pending',
      startTime: new Date(startTime),
      metadata: dto.metadata,
    })
    await this.sessionRepository.save(session)

    this.logger.log(`开始生成页面，会话: ${sessionId}`)

    try {
      // 更新状态
      session.status = 'running'
      await this.sessionRepository.save(session)

      // ==================== MCP 集成：提示词渲染 ====================
      let systemPrompt = ''
      try {
        // 从 MCP 数据库获取页面规划提示词模板并渲染
        const promptTemplate = await this.mcpService.getPromptByName('page_planning')
        if (promptTemplate) {
          systemPrompt = await this.mcpService.renderPrompt(promptTemplate.id, {
            user_input: dto.requirement,
          })
          this.logger.log(`已渲染 MCP 提示词模板，会话: ${sessionId}`)
        } else {
          // 回退到默认提示词
          systemPrompt = `你是一个专业的低代码页面规划专家。请根据以下需求生成页面结构：\n\n需求：${dto.requirement}`
          this.logger.warn(`未找到 MCP 提示词模板 'page_planning'，使用默认提示词`)
        }
      } catch (promptError: any) {
        this.logger.warn(`渲染 MCP 提示词失败: ${promptError.message}，使用默认提示词`)
        systemPrompt = `你是一个专业的低代码页面规划专家。请根据以下需求生成页面结构：\n\n需求：${dto.requirement}`
      }

      // 将系统提示词存入 MCP 上下文存储
      await this.mcpService.addMessage(sessionId, {
        role: 'system',
        content: systemPrompt,
      })

      // 将用户需求存入 MCP 上下文
      await this.mcpService.addMessage(sessionId, {
        role: 'user',
        content: dto.requirement,
      })
      // ===========================================================

      // 获取或创建 Agent
      const agent = this.getOrCreateAgent(dto.knowledgeBaseIds)

      // 执行规划
      const result = await agent.plan(dto.requirement, sessionId)

      // ==================== MCP 集成：保存结果到上下文 ====================
      if (result.success && result.schema) {
        await this.mcpService.addMessage(sessionId, {
          role: 'assistant',
          content: `页面规划完成，生成 ${result.schema.children?.length || 0} 个组件。`,
        })
        await this.mcpService.setMetadata(sessionId, {
          agentResult: result.schema,
          duration: Date.now() - startTime,
          ragDocCount: result.state.ragResults?.retrievedDocs?.length || 0,
        })
      } else {
        await this.mcpService.addMessage(sessionId, {
          role: 'assistant',
          content: `页面规划失败: ${result.error || '未知错误'}`,
        })
      }
      // ================================================================

      // 处理结果
      if (result.success && result.schema) {
        // 保存执行日志
        const logs: AgentLogEntry[] = result.logs.map((log: any) => ({
          node: log.node,
          timestamp: log.timestamp?.toISOString?.() || new Date().toISOString(),
          input: log.input,
          output: log.output,
          error: log.error,
          duration: log.duration,
        }))

        // 计算 RAG 统计
        const ragResult = result.state.ragResults
        const schemaResult = result.state.schemaResult

        // 更新会话
        session.status = 'completed'
        session.parsedIntent = result.state.requirementAnalysis?.parsedIntent
        session.ragDocCount = ragResult?.retrievedDocs.length || 0
        session.ragRelevanceScore = ragResult?.relevanceScore || 0
        session.componentCount = schemaResult?.pageSchema.children?.length || 0
        session.generatedSchema = JSON.stringify(schemaResult?.pageSchema)
        session.finalSchema = JSON.stringify(result.schema)
        session.executionLogs = logs
        session.endTime = new Date()
        session.duration = Date.now() - startTime

        await this.sessionRepository.save(session)

        this.logger.log(
          `页面生成成功: ${sessionId}, 组件数: ${session.componentCount}, ` +
          `RAG召回: ${session.ragDocCount}, 时长: ${session.duration}ms`
        )

        return {
          sessionId,
          success: true,
          schema: result.schema,
          logs,
          duration: session.duration,
        }
      } else {
        // 保存失败结果
        session.status = 'failed'
        session.errorMessage = result.error
        session.executionLogs = result.logs.map((log: any) => ({
          node: log.node,
          timestamp: log.timestamp?.toISOString?.() || new Date().toISOString(),
          input: log.input,
          output: log.output,
          error: log.error,
          duration: log.duration,
        }))
        session.endTime = new Date()
        session.duration = Date.now() - startTime

        await this.sessionRepository.save(session)

        this.logger.error(`页面生成失败: ${sessionId}, 错误: ${result.error}`)

        return {
          sessionId,
          success: false,
          error: result.error,
          logs: session.executionLogs || [],
          duration: session.duration,
        }
      }
    } catch (error: any) {
      // 保存异常结果
      session.status = 'failed'
      session.errorMessage = error.message
      session.endTime = new Date()
      session.duration = Date.now() - startTime

      await this.sessionRepository.save(session)

      // MCP 上下文记录异常
      await this.mcpService.addMessage(sessionId, {
        role: 'system',
        content: `执行异常: ${error.message}`,
      }).catch((e) => this.logger.warn(`MCP 上下文记录异常失败: ${e.message}`))

      this.logger.error(`页面生成异常: ${sessionId}`, error)

      throw new BadRequestException(`页面生成失败: ${error.message}`)
    }
  }

  /**
   * 获取会话详情
   * 同时返回 MCP 上下文中的消息历史
   */
  async getSession(sessionId: string): Promise<AgentSessionEntity & { mcpMessages?: any[] }> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
    })

    if (!session) {
      throw new BadRequestException('会话不存在')
    }

    // 从 MCP 获取消息历史
    const mcpMessages = await this.mcpService.getMessages(sessionId).catch(() => [])

    return { ...session, mcpMessages }
  }

  /**
   * 查询会话列表
   */
  async querySessions(dto: QuerySessionsDto): Promise<{
    sessions: AgentSessionEntity[]
    total: number
  }> {
    const where: any = {}

    if (dto.sessionId) {
      where.sessionId = dto.sessionId
    }
    if (dto.status) {
      where.status = dto.status
    }
    if (dto.agentType) {
      where.agentType = dto.agentType
    }

    const page = dto.page || 1
    const pageSize = dto.pageSize || 10
    const skip = (page - 1) * pageSize

    const [sessions, total] = await this.sessionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    })

    return { sessions, total }
  }

  /**
   * 流式生成页面
   * 模拟流式输出，在关键节点触发回调事件
   * 集成 MCP 提示词和上下文管理
   */
  async generatePageWithStream(
    dto: GeneratePageDto,
    callbacks: {
      onStep: (step: { name: string; message: string; progress: number }) => void
      onProgress: (progress: { current: number; total: number; message: string }) => void
      onSchema: (schema: any) => void
      onComplete: (result: GeneratePageResponseDto) => void
      onError: (error: { message: string }) => void
    }
  ): Promise<void> {
    try {
      callbacks.onStep({ name: 'start', message: '开始页面生成', progress: 0 })
      callbacks.onProgress({ current: 1, total: 5, message: '初始化生成任务...' })

      // 调用标准生成流程（内部已集成 MCP）
      const result = await this.generatePage(dto)

      callbacks.onProgress({ current: 4, total: 5, message: '处理生成结果...' })

      if (result.success && result.schema) {
        callbacks.onSchema(result.schema)
        callbacks.onProgress({ current: 5, total: 5, message: '生成完成' })
        callbacks.onStep({ name: 'complete', message: '页面生成成功', progress: 100 })
        callbacks.onComplete(result)
      } else {
        callbacks.onError({ message: result.error || '生成失败' })
      }
    } catch (error: any) {
      callbacks.onError({ message: error.message })
    }
  }

  /**
   * 删除会话
   * 同时清理 MCP 上下文数据
   */
  async deleteSession(sessionId: string): Promise<void> {
    const result = await this.sessionRepository.delete({ sessionId })
    if (result.affected === 0) {
      throw new BadRequestException('会话不存在')
    }

    // 清理 MCP 上下文
    await this.mcpService.clearContext(sessionId).catch((e) => {
      this.logger.warn(`清理 MCP 上下文失败: ${e.message}`)
    })
  }

  /**
   * 获取或创建 PagePlanningAgent 实例
   */
  private getOrCreateAgent(knowledgeBaseIds?: number[]): InstanceType<typeof PagePlanningAgent> {
    const cacheKey = knowledgeBaseIds?.join(',') || 'default'

    if (!this.agents.has(cacheKey)) {
      const llmConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY || '',
      }

      const chromaConfig: ChromaConfig = {
        url: process.env.CHROMA_URL || 'http://localhost:8000',
        collectionName: 'ai_lowcode_kb',
      }

      const ragConfig: RAGConfig = {
        embeddingApiKey: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || '',
      }

      const agent = new PagePlanningAgent({
        llmConfig,
        chromaConfig,
        ragConfig,
        knowledgeBaseIds: knowledgeBaseIds || [],
        defaultPageSize: { width: 1920, height: 1080 },
        componentLibrary: ['Button', 'Input', 'Table', 'Form', 'Chart', 'Card', 'Modal'],
        strictValidation: true,
      })

      this.agents.set(cacheKey, agent)
    }

    return this.agents.get(cacheKey)!
  }
}

/**
 * Agent 服务
 * 提供 AI 生成页面的业务逻辑
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { AgentSessionEntity, AgentLogEntry } from './entities/agent-session.entity'
import { 
  GeneratePageDto, 
  QuerySessionsDto, 
  GeneratePageResponseDto 
} from './dto/agent.dto'
import { PagePlanningAgent } from '@ai-lowcode/lang-ai-core'
import type { MilvusConfig, RAGConfig, LLMConfig } from '@ai-lowcode/shared-types'

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)
  private agents: Map<string, PagePlanningAgent> = new Map()

  constructor(
    @InjectRepository(AgentSessionEntity)
    private sessionRepository: Repository<AgentSessionEntity>,
  ) {}

  /**
   * 生成页面
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

      // 获取或创建 Agent
      const agent = this.getOrCreateAgent(dto.knowledgeBaseIds)

      // 执行规划
      const result = await agent.plan(dto.requirement, sessionId)

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
          logs: session.executionLogs,
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

      this.logger.error(`页面生成异常: ${sessionId}`, error)

      throw new BadRequestException(`页面生成失败: ${error.message}`)
    }
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string): Promise<AgentSessionEntity> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
    })

    if (!session) {
      throw new BadRequestException('会话不存在')
    }

    return session
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
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    await this.sessionRepository.remove(session)
    this.logger.log(`删除会话: ${sessionId}`)
  }

  /**
   * 获取或创建 Agent 实例
   */
  private getOrCreateAgent(knowledgeBaseIds: number[]): PagePlanningAgent {
    const key = knowledgeBaseIds.sort().join(',')
    
    if (this.agents.has(key)) {
      return this.agents.get(key)!
    }

    // 构建配置
    const llmConfig: LLMConfig = {
      apiKey: process.env.LLM_API_KEY || '',
      model: process.env.LLM_MODEL || 'gpt-4',
      baseUrl: process.env.LLM_BASE_URL,
      temperature: 0.7,
    }

    const milvusConfig: MilvusConfig = {
      address: process.env.MILVUS_ADDRESS || 'localhost:19530',
      username: process.env.MILVUS_USERNAME || 'root',
      password: process.env.MILVUS_PASSWORD || 'Milvus',
      database: process.env.MILVUS_DATABASE || 'default',
    }

    const ragConfig: RAGConfig = {
      embeddingApiKey: process.env.EMBEDDING_API_KEY || '',
      embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      embeddingBaseUrl: process.env.EMBEDDING_BASE_URL,
      chunkSize: 1000,
      chunkOverlap: 200,
    }

    const agent = new PagePlanningAgent({
      llmConfig,
      milvusConfig,
      ragConfig,
      knowledgeBaseIds,
      defaultPageSize: { width: 1920, height: 1080 },
      componentLibrary: [
        'Button',
        'Input',
        'Select',
        'Text',
        'Image',
        'Card',
        'Container',
        'List',
        'Table',
        'Form',
        'Modal',
        'Navigation',
        'Header',
        'Footer',
        'Sidebar',
        'Tabs',
        'Pagination',
        'Search',
        'Checkbox',
        'Radio',
        'DatePicker',
        'Switch',
        'Avatar',
        'Badge',
        'Tag',
        'Divider',
        'Alert',
        'Loading',
      ],
      strictValidation: true,
    })

    this.agents.set(key, agent)
    return agent
  }
}

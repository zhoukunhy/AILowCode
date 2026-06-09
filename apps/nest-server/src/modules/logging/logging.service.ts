/**
 * 日志服务
 * 提供统一的 AI 日志记录接口
 */
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { LlmCallLogEntity, LlmProvider, LlmModel } from './entities/llm-call-log.entity'
import { RagRetrievalLogEntity } from './entities/rag-retrieval-log.entity'
import { AgentSessionEntity } from '../agent/entities/agent-session.entity'

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name)

  constructor(
    @InjectRepository(LlmCallLogEntity)
    private llmCallLogRepo: Repository<LlmCallLogEntity>,
    @InjectRepository(RagRetrievalLogEntity)
    private ragRetrievalLogRepo: Repository<RagRetrievalLogEntity>,
    @InjectRepository(AgentSessionEntity)
    private agentSessionRepo: Repository<AgentSessionEntity>,
  ) {}

  // ==================== LLM 调用日志 ====================

  /**
   * 创建 LLM 调用日志
   */
  async createLlmCallLog(data: Partial<LlmCallLogEntity>): Promise<LlmCallLogEntity> {
    const log = this.llmCallLogRepo.create({
      status: 'running',
      startTime: new Date(),
      ...data,
    })
    return this.llmCallLogRepo.save(log)
  }

  /**
   * 更新 LLM 调用日志（完成）
   */
  async completeLlmCallLog(
    id: number,
    data: Partial<Pick<LlmCallLogEntity, 'response' | 'status' | 'errorMessage' | 'promptTokens' | 'completionTokens' | 'totalTokens' | 'cost'>>
  ): Promise<void> {
    await this.llmCallLogRepo.update(id, {
      ...data,
      endTime: new Date(),
      duration: data.status === 'completed' ? undefined : undefined,
    })
  }

  /**
   * 更新 LLM 调用日志（记录时长）
   */
  async updateLlmCallDuration(id: number, startTime: Date): Promise<void> {
    const duration = Date.now() - startTime.getTime()
    await this.llmCallLogRepo.update(id, {
      duration,
      endTime: new Date(),
    })
  }

  /**
   * 查询 LLM 调用日志
   */
  async findLlmCallLogs(filter: {
    sessionId?: string
    provider?: LlmProvider
    model?: LlmModel
    status?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }): Promise<{ logs: LlmCallLogEntity[]; total: number }> {
    const query = this.llmCallLogRepo.createQueryBuilder('log')

    if (filter.sessionId) {
      query.where('log.sessionId = :sessionId', { sessionId: filter.sessionId })
    }
    if (filter.provider) {
      query.andWhere('log.provider = :provider', { provider: filter.provider })
    }
    if (filter.model) {
      query.andWhere('log.model = :model', { model: filter.model })
    }
    if (filter.status) {
      query.andWhere('log.status = :status', { status: filter.status })
    }
    if (filter.startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate: filter.startDate })
    }
    if (filter.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: filter.endDate })
    }

    query.orderBy('log.createdAt', 'DESC')

    const page = filter.page || 1
    const limit = filter.limit || 20
    query.skip((page - 1) * limit).take(limit)

    const [logs, total] = await query.getManyAndCount()

    return { logs, total }
  }

  /**
   * 获取 LLM 调用统计
   */
  async getLlmCallStatistics(filter: {
    startDate?: Date
    endDate?: Date
  }): Promise<{
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    totalTokens: number
    totalCost: number
    avgDuration: number
    callsByProvider: Record<string, number>
    callsByModel: Record<string, number>
  }> {
    const query = this.llmCallLogRepo.createQueryBuilder('log')

    if (filter.startDate) {
      query.where('log.createdAt >= :startDate', { startDate: filter.startDate })
    }
    if (filter.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: filter.endDate })
    }

    const [logs, total] = await query.getManyAndCount()

    const successfulCalls = logs.filter(l => l.status === 'completed').length
    const failedCalls = logs.filter(l => l.status === 'failed').length
    const totalTokens = logs.reduce((sum, l) => sum + (l.totalTokens || 0), 0)
    const totalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0)
    const avgDuration = total > 0 ? logs.reduce((sum, l) => sum + (l.duration || 0), 0) / total : 0

    const callsByProvider: Record<string, number> = {}
    const callsByModel: Record<string, number> = {}

    for (const log of logs) {
      callsByProvider[log.provider] = (callsByProvider[log.provider] || 0) + 1
      callsByModel[log.model] = (callsByModel[log.model] || 0) + 1
    }

    return {
      totalCalls: total,
      successfulCalls,
      failedCalls,
      totalTokens,
      totalCost,
      avgDuration: Math.round(avgDuration),
      callsByProvider,
      callsByModel,
    }
  }

  // ==================== RAG 检索日志 ====================

  /**
   * 创建 RAG 检索日志
   */
  async createRagRetrievalLog(data: Partial<RagRetrievalLogEntity>): Promise<RagRetrievalLogEntity> {
    const log = this.ragRetrievalLogRepo.create({
      status: 'running',
      startTime: new Date(),
      ...data,
    })
    return this.ragRetrievalLogRepo.save(log)
  }

  /**
   * 更新 RAG 检索日志（完成）
   */
  async completeRagRetrievalLog(
    id: number,
    data: Partial<Pick<RagRetrievalLogEntity, 'documents' | 'status' | 'errorMessage' | 'retrievedCount' | 'hitCount' | 'maxScore' | 'avgScore'>>
  ): Promise<void> {
    await this.ragRetrievalLogRepo.update(id, {
      ...data,
      endTime: new Date(),
    })
  }

  /**
   * 查询 RAG 检索日志
   */
  async findRagRetrievalLogs(filter: {
    sessionId?: string
    knowledgeBaseId?: string
    status?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }): Promise<{ logs: RagRetrievalLogEntity[]; total: number }> {
    const query = this.ragRetrievalLogRepo.createQueryBuilder('log')

    if (filter.sessionId) {
      query.where('log.sessionId = :sessionId', { sessionId: filter.sessionId })
    }
    if (filter.knowledgeBaseId) {
      query.andWhere('log.knowledgeBaseId = :knowledgeBaseId', { knowledgeBaseId: filter.knowledgeBaseId })
    }
    if (filter.status) {
      query.andWhere('log.status = :status', { status: filter.status })
    }
    if (filter.startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate: filter.startDate })
    }
    if (filter.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: filter.endDate })
    }

    query.orderBy('log.createdAt', 'DESC')

    const page = filter.page || 1
    const limit = filter.limit || 20
    query.skip((page - 1) * limit).take(limit)

    const [logs, total] = await query.getManyAndCount()

    return { logs, total }
  }

  /**
   * 获取 RAG 检索统计
   */
  async getRagRetrievalStatistics(filter: {
    startDate?: Date
    endDate?: Date
  }): Promise<{
    totalRetrievals: number
    successfulRetrievals: number
    avgHitCount: number
    avgMaxScore: number
    avgDuration: number
    retrievalsByKnowledgeBase: Record<string, number>
  }> {
    const query = this.ragRetrievalLogRepo.createQueryBuilder('log')

    if (filter.startDate) {
      query.where('log.createdAt >= :startDate', { startDate: filter.startDate })
    }
    if (filter.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: filter.endDate })
    }

    const [logs, total] = await query.getManyAndCount()

    const successfulRetrievals = logs.filter(l => l.status === 'completed').length
    const avgHitCount = total > 0 ? logs.reduce((sum, l) => sum + (l.hitCount || 0), 0) / total : 0
    const avgMaxScore = total > 0 ? logs.reduce((sum, l) => sum + (l.maxScore || 0), 0) / total : 0
    const avgDuration = total > 0 ? logs.reduce((sum, l) => sum + (l.duration || 0), 0) / total : 0

    const retrievalsByKnowledgeBase: Record<string, number> = {}
    for (const log of logs) {
      const key = log.knowledgeBaseName || log.knowledgeBaseId || 'unknown'
      retrievalsByKnowledgeBase[key] = (retrievalsByKnowledgeBase[key] || 0) + 1
    }

    return {
      totalRetrievals: total,
      successfulRetrievals,
      avgHitCount: Math.round(avgHitCount),
      avgMaxScore: Math.round(avgMaxScore * 1000) / 1000,
      avgDuration: Math.round(avgDuration),
      retrievalsByKnowledgeBase,
    }
  }

  // ==================== Agent 会话日志 ====================

  /**
   * 创建 Agent 会话日志
   */
  async createAgentSession(data: Partial<AgentSessionEntity>): Promise<AgentSessionEntity> {
    const session = this.agentSessionRepo.create({
      status: 'running',
      startTime: new Date(),
      ...data,
    })
    return this.agentSessionRepo.save(session)
  }

  /**
   * 更新 Agent 会话日志
   */
  async updateAgentSession(
    sessionId: string,
    data: Partial<AgentSessionEntity>
  ): Promise<void> {
    await this.agentSessionRepo.update({ sessionId }, data)
  }

  /**
   * 完成 Agent 会话日志
   */
  async completeAgentSession(
    sessionId: string,
    data: Partial<Pick<AgentSessionEntity, 'status' | 'errorMessage' | 'finalSchema' | 'componentCount'>>
  ): Promise<void> {
    await this.agentSessionRepo.update({ sessionId }, {
      ...data,
      endTime: new Date(),
    })
  }

  /**
   * 查询 Agent 会话日志
   */
  async findAgentSessions(filter: {
    sessionId?: string
    agentType?: string
    status?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }): Promise<{ sessions: AgentSessionEntity[]; total: number }> {
    const query = this.agentSessionRepo.createQueryBuilder('session')

    if (filter.sessionId) {
      query.where('session.sessionId = :sessionId', { sessionId: filter.sessionId })
    }
    if (filter.agentType) {
      query.andWhere('session.agentType = :agentType', { agentType: filter.agentType })
    }
    if (filter.status) {
      query.andWhere('session.status = :status', { status: filter.status })
    }
    if (filter.startDate) {
      query.andWhere('session.createdAt >= :startDate', { startDate: filter.startDate })
    }
    if (filter.endDate) {
      query.andWhere('session.createdAt <= :endDate', { endDate: filter.endDate })
    }

    query.orderBy('session.createdAt', 'DESC')

    const page = filter.page || 1
    const limit = filter.limit || 20
    query.skip((page - 1) * limit).take(limit)

    const [sessions, total] = await query.getManyAndCount()

    return { sessions, total }
  }

  /**
   * 获取 Agent 会话统计
   */
  async getAgentSessionStatistics(filter: {
    startDate?: Date
    endDate?: Date
  }): Promise<{
    totalSessions: number
    completedSessions: number
    failedSessions: number
    avgDuration: number
    avgComponentCount: number
    sessionsByAgentType: Record<string, number>
  }> {
    const query = this.agentSessionRepo.createQueryBuilder('session')

    if (filter.startDate) {
      query.where('session.createdAt >= :startDate', { startDate: filter.startDate })
    }
    if (filter.endDate) {
      query.andWhere('session.createdAt <= :endDate', { endDate: filter.endDate })
    }

    const [sessions, total] = await query.getManyAndCount()

    const completedSessions = sessions.filter(s => s.status === 'completed').length
    const failedSessions = sessions.filter(s => s.status === 'failed').length
    const avgDuration = total > 0 ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / total : 0
    const avgComponentCount = total > 0 ? sessions.reduce((sum, s) => sum + (s.componentCount || 0), 0) / total : 0

    const sessionsByAgentType: Record<string, number> = {}
    for (const session of sessions) {
      sessionsByAgentType[session.agentType] = (sessionsByAgentType[session.agentType] || 0) + 1
    }

    return {
      totalSessions: total,
      completedSessions,
      failedSessions,
      avgDuration: Math.round(avgDuration),
      avgComponentCount: Math.round(avgComponentCount),
      sessionsByAgentType,
    }
  }

  // ==================== 综合统计 ====================

  /**
   * 获取综合统计数据（仪表盘）
   */
  async getDashboardStatistics(filter: {
    startDate?: Date
    endDate?: Date
  }): Promise<{
    llm: ReturnType<LoggingService['getLlmCallStatistics']> extends Promise<infer T> ? T : never
    rag: ReturnType<LoggingService['getRagRetrievalStatistics']> extends Promise<infer T> ? T : never
    agent: ReturnType<LoggingService['getAgentSessionStatistics']> extends Promise<infer T> ? T : never
  }> {
    const [llm, rag, agent] = await Promise.all([
      this.getLlmCallStatistics(filter),
      this.getRagRetrievalStatistics(filter),
      this.getAgentSessionStatistics(filter),
    ])

    return { llm, rag, agent }
  }

  // ==================== 日志清理 ====================

  /**
   * 清理过期日志
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<{
    llmLogsDeleted: number
    ragLogsDeleted: number
    agentSessionsDeleted: number
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const llmResult = await this.llmCallLogRepo.delete({ createdAt: LessThan(cutoffDate) })
    const ragResult = await this.ragRetrievalLogRepo.delete({ createdAt: LessThan(cutoffDate) })
    const agentResult = await this.agentSessionRepo.delete({ createdAt: LessThan(cutoffDate) })

    this.logger.log(`清理了 ${llmResult.affected} 条 LLM 日志, ${ragResult.affected} 条 RAG 日志, ${agentResult.affected} 条 Agent 会话`)

    return {
      llmLogsDeleted: llmResult.affected || 0,
      ragLogsDeleted: ragResult.affected || 0,
      agentSessionsDeleted: agentResult.affected || 0,
    }
  }
}
/**
 * 日志控制器
 * 提供日志查询和统计接口
 */
import { Controller, Get, Query, Delete } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { LoggingService } from './logging.service'
import { LlmProvider, LlmModel } from './entities/llm-call-log.entity'

@Controller('logging')
@ApiTags('日志管理')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  // ==================== LLM 调用日志 ====================

  @Get('llm-calls')
  @ApiOperation({ summary: '查询 LLM 调用日志' })
  async getLlmCallLogs(
    @Query('sessionId') sessionId?: string,
    @Query('provider') provider?: LlmProvider,
    @Query('model') model?: LlmModel,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter = {
      sessionId,
      provider: provider ? (provider as LlmProvider) : undefined,
      model: model ? (model as LlmModel) : undefined,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    }
    return this.loggingService.findLlmCallLogs(filter)
  }

  @Get('llm-calls/statistics')
  @ApiOperation({ summary: '获取 LLM 调用统计' })
  async getLlmCallStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }
    return this.loggingService.getLlmCallStatistics(filter)
  }

  // ==================== RAG 检索日志 ====================

  @Get('rag-retrievals')
  @ApiOperation({ summary: '查询 RAG 检索日志' })
  async getRagRetrievalLogs(
    @Query('sessionId') sessionId?: string,
    @Query('knowledgeBaseId') knowledgeBaseId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter = {
      sessionId,
      knowledgeBaseId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    }
    return this.loggingService.findRagRetrievalLogs(filter)
  }

  @Get('rag-retrievals/statistics')
  @ApiOperation({ summary: '获取 RAG 检索统计' })
  async getRagRetrievalStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }
    return this.loggingService.getRagRetrievalStatistics(filter)
  }

  // ==================== Agent 会话日志 ====================

  @Get('agent-sessions')
  @ApiOperation({ summary: '查询 Agent 会话日志' })
  async getAgentSessions(
    @Query('sessionId') sessionId?: string,
    @Query('agentType') agentType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter = {
      sessionId,
      agentType,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    }
    return this.loggingService.findAgentSessions(filter)
  }

  @Get('agent-sessions/statistics')
  @ApiOperation({ summary: '获取 Agent 会话统计' })
  async getAgentSessionStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }
    return this.loggingService.getAgentSessionStatistics(filter)
  }

  // ==================== 综合仪表盘 ====================

  @Get('dashboard')
  @ApiOperation({ summary: '获取综合统计数据（仪表盘）' })
  async getDashboardStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }
    return this.loggingService.getDashboardStatistics(filter)
  }

  // ==================== 日志清理 ====================

  @Delete('cleanup')
  @ApiOperation({ summary: '清理过期日志' })
  @ApiResponse({ status: 200, description: '清理成功' })
  async cleanupOldLogs(@Query('days') days?: string) {
    const daysToKeep = days ? parseInt(days) : 30
    return this.loggingService.cleanupOldLogs(daysToKeep)
  }
}
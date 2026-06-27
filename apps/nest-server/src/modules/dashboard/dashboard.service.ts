/**
 * Dashboard 统计服务
 * 提供系统统计数据和 AI 活动记录
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { PageEntity } from '../page/entities/page.entity'
import { UserEntity } from '../user/entities/user.entity'
import { KnowledgeEntity } from '../knowledge/entities/knowledge.entity'
import { LlmCallLogEntity } from '../logging/entities/llm-call-log.entity'
import { CodeGenerationLogEntity } from '../codegen/entities/code-generation-log.entity'
import { GetStatsResponseDto, AIActivityDto } from './dto/dashboard.dto'

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PageEntity)
    private readonly pageRepository: Repository<PageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(KnowledgeEntity)
    private readonly knowledgeRepository: Repository<KnowledgeEntity>,
    @InjectRepository(LlmCallLogEntity)
    private readonly llmLogRepository: Repository<LlmCallLogEntity>,
    @InjectRepository(CodeGenerationLogEntity)
    private readonly codegenLogRepository: Repository<CodeGenerationLogEntity>,
  ) {}

  /**
   * 获取系统统计数据
   */
  async getStats(): Promise<GetStatsResponseDto> {
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 获取当前统计数据
    const [canvasCount, userCount, knowledgeCount, aiGenerationCount] = await Promise.all([
      this.pageRepository.count(),
      this.userRepository.count(),
      this.knowledgeRepository.count(),
      this.codegenLogRepository.count({ where: { status: 'completed' } }),
    ])

    // 获取上周统计数据（用于计算变化）
    const [lastWeekCanvasCount, lastWeekUserCount, lastWeekKnowledgeCount, lastWeekAiCount] =
      await Promise.all([
        this.pageRepository.count({ where: { createdAt: LessThan(lastWeek) } }),
        this.userRepository.count({ where: { createdAt: LessThan(lastWeek) } }),
        this.knowledgeRepository.count({ where: { createdAt: LessThan(lastWeek) } }),
        this.codegenLogRepository.count({
          where: {
            status: 'completed',
            startTime: LessThan(lastWeek),
          },
        }),
      ])

    // 计算变化百分比
    const calcChange = (current: number, last: number) => {
      if (last === 0) return '+100%'
      const change = ((current - last) / last) * 100
      return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`
    }

    return {
      canvasCount,
      activeUsers: userCount,
      aiGenerationCount,
      knowledgeDocCount: knowledgeCount,
      canvasChange: calcChange(canvasCount, lastWeekCanvasCount),
      usersChange: calcChange(userCount, lastWeekUserCount),
      aiChange: calcChange(aiGenerationCount, lastWeekAiCount),
      knowledgeChange: calcChange(knowledgeCount, lastWeekKnowledgeCount),
    }
  }

  /**
   * 获取 AI 活动记录
   */
  async getActivities(limit: number = 10): Promise<AIActivityDto[]> {
    // 获取最近的 LLM 调用记录
    const llmLogs = await this.llmLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    })

    // 获取最近的代码生成记录
    const codegenLogs = await this.codegenLogRepository.find({
      order: { startTime: 'DESC' },
      take: limit,
    })

    // 合并并按时间排序
    const activities: AIActivityDto[] = []

    llmLogs.forEach((log) => {
      activities.push({
        id: `llm-${log.id}`,
        action: this.getActionDescription(log.callType || 'llm'),
        model: log.model || 'GPT-4',
        duration: `${((log.duration || 0) / 1000).toFixed(1)}s`,
        timestamp: log.createdAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      })
    })

    codegenLogs.forEach((log) => {
      activities.push({
        id: `codegen-${log.id}`,
        action: this.getCodegenActionDescription(log.generationType || 'full-stack'),
        model: log.model || 'GPT-4',
        duration: `${((log.duration || 0) / 1000).toFixed(1)}s`,
        timestamp: log.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      })
    })

    // 按时间倒序排列并限制数量
    return activities
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit)
  }

  private getActionDescription(callType: string): string {
    const descriptions: Record<string, string> = {
      llm: 'LLM 调用',
      chat: '对话生成',
      completion: '文本补全',
      embedding: '向量嵌入',
      'page-generation': '页面生成',
      'code-generation': '代码生成',
      'diagnostic': '异常诊断',
      'schema-generation': 'Schema 生成',
    }
    return descriptions[callType] || callType
  }

  private getCodegenActionDescription(generationType: string): string {
    const descriptions: Record<string, string> = {
      'full-stack': '生成全栈代码',
      frontend: '生成前端代码',
      backend: '生成后端代码',
      component: '生成组件',
      api: '生成 API',
      database: '生成数据库模型',
    }
    return descriptions[generationType] || generationType
  }
}

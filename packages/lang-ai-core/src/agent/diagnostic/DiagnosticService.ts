/**
 * 异常诊断服务
 * 提供异常诊断相关的业务逻辑
 */

import { DiagnosticAgentExecutor, createDiagnosticAgentExecutor } from './DiagnosticAgentExecutor'
import type { 
  ErrorInfo, 
  DiagnosisResult, 
  DiagnosticAgentConfig,
  ErrorKnowledgeEntry,
  ErrorRetrievalResult,
  DiagnosticAgentState,
} from './DiagnosticAgentTypes'

/**
 * 诊断服务配置
 */
export interface DiagnosticServiceConfig extends DiagnosticAgentConfig {
  enableAutoUpdate?: boolean
  maxConcurrent?: number
}

/**
 * 异常诊断服务
 */
export class DiagnosticService {
  private executor: DiagnosticAgentExecutor
  private config: DiagnosticServiceConfig
  private knowledgeBase: Map<string, ErrorKnowledgeEntry>

  constructor(config: DiagnosticServiceConfig) {
    this.config = config
    this.executor = createDiagnosticAgentExecutor(config)
    this.knowledgeBase = new Map()
  }

  /**
   * 诊断单个错误
   */
  async diagnose(errorInfo: ErrorInfo, sessionId?: string): Promise<DiagnosisResult> {
    return await this.executor.execute(errorInfo, sessionId)
  }

  /**
   * 批量诊断错误
   */
  async diagnoseBatch(errors: ErrorInfo[]): Promise<DiagnosisResult[]> {
    return await this.executor.executeBatch(errors)
  }

  /**
   * 获取诊断状态
   */
  async getDiagnosticStatus(sessionId: string): Promise<DiagnosticAgentState | null> {
    return await this.executor.getDiagnosticStatus(sessionId)
  }

  /**
   * 取消诊断任务
   */
  async cancelDiagnostic(sessionId: string): Promise<void> {
    await this.executor.cancelDiagnostic(sessionId)
  }

  /**
   * 添加错误到知识库
   */
  async addToKnowledgeBase(entry: ErrorKnowledgeEntry): Promise<string> {
    const id = entry.id || `entry-${Date.now()}`
    this.knowledgeBase.set(id, {
      ...entry,
      id,
      occurrences: entry.occurrences || 1,
      createdAt: entry.createdAt || new Date(),
      updatedAt: new Date(),
    })
    return id
  }

  /**
   * 更新知识库条目
   */
  async updateKnowledgeEntry(id: string, updates: Partial<ErrorKnowledgeEntry>): Promise<void> {
    const entry = this.knowledgeBase.get(id)
    if (!entry) {
      throw new Error(`知识库条目不存在: ${id}`)
    }
    
    this.knowledgeBase.set(id, {
      ...entry,
      ...updates,
      id,
      updatedAt: new Date(),
    })
  }

  /**
   * 获取知识库条目
   */
  getKnowledgeEntry(id: string): ErrorKnowledgeEntry | undefined {
    return this.knowledgeBase.get(id)
  }

  /**
   * 获取所有知识库条目
   */
  getAllKnowledgeEntries(): ErrorKnowledgeEntry[] {
    return Array.from(this.knowledgeBase.values())
  }

  /**
   * 搜索知识库
   */
  searchKnowledgeBase(query: string): ErrorKnowledgeEntry[] {
    const queryLower = query.toLowerCase()
    return Array.from(this.knowledgeBase.values()).filter((entry) => {
      return (
        entry.errorMessage.toLowerCase().includes(queryLower) ||
        entry.rootCause.toLowerCase().includes(queryLower) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(queryLower))
      )
    })
  }

  /**
   * 删除知识库条目
   */
  deleteKnowledgeEntry(id: string): void {
    this.knowledgeBase.delete(id)
  }

  /**
   * 获取错误统计
   */
  getErrorStatistics(): ErrorStatistics {
    const entries = Array.from(this.knowledgeBase.values())
    
    const typeCount: Record<string, number> = {}
    const tagCount: Record<string, number> = {}
    let totalOccurrences = 0

    for (const entry of entries) {
      typeCount[entry.errorType] = (typeCount[entry.errorType] || 0) + entry.occurrences
      totalOccurrences += entry.occurrences
      
      for (const tag of entry.tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      }
    }

    return {
      totalErrors: entries.length,
      totalOccurrences,
      typeDistribution: typeCount,
      tagDistribution: tagCount,
      topTags: Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
    }
  }
}

export interface ErrorStatistics {
  totalErrors: number
  totalOccurrences: number
  typeDistribution: Record<string, number>
  tagDistribution: Record<string, number>
  topTags: Array<{ tag: string; count: number }>
}

/**
 * 创建诊断服务
 */
export function createDiagnosticService(config: DiagnosticServiceConfig): DiagnosticService {
  return new DiagnosticService(config)
}
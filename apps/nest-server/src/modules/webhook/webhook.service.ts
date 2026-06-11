import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import * as crypto from 'crypto'
import { Webhook } from './entities/webhook.entity'
import { WebhookLog } from './entities/webhook-log.entity'
import { CreateWebhookDto, UpdateWebhookDto, TriggerWebhookDto } from './dto/webhook.dto'
import {
  WebhookEventType,
  WebhookStatus,
  WebhookTriggerType,
  WebhookSignatureAlgorithm,
  DEFAULT_RETRY_CONFIG,
  WebhookLogStatus,
} from '@ai-lowcode/shared-types'

/**
 * Webhook 服务
 * 提供Webhook注册、触发、重试等功能
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)
  private readonly retryQueue = new Map<number, NodeJS.Timeout>()

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
  ) {}

  /**
   * 创建Webhook
   */
  async createWebhook(createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    const existing = await this.webhookRepository.findOne({
      where: { url: createWebhookDto.url, projectId: createWebhookDto.projectId },
    })
    if (existing) {
      throw new ConflictException('该URL已在同一项目下注册')
    }

    const webhook = this.webhookRepository.create({
      ...createWebhookDto,
      status: WebhookStatus.ACTIVE,
    })

    return this.webhookRepository.save(webhook)
  }

  /**
   * 获取所有Webhook
   */
  async getAllWebhooks(projectId?: number): Promise<Webhook[]> {
    const query = this.webhookRepository.createQueryBuilder('webhook')

    if (projectId !== undefined) {
      query.where('webhook.project_id = :projectId OR webhook.project_id IS NULL', { projectId })
    }

    return query.getMany()
  }

  /**
   * 获取单个Webhook
   */
  async getWebhookById(id: number): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } })
    if (!webhook) {
      throw new NotFoundException('Webhook不存在')
    }
    return webhook
  }

  /**
   * 更新Webhook
   */
  async updateWebhook(id: number, updateWebhookDto: UpdateWebhookDto): Promise<Webhook> {
    const webhook = await this.getWebhookById(id)

    if (webhook.isSystem && updateWebhookDto.name) {
      throw new ConflictException('系统Webhook名称不可修改')
    }

    Object.assign(webhook, updateWebhookDto)
    return this.webhookRepository.save(webhook)
  }

  /**
   * 删除Webhook
   */
  async deleteWebhook(id: number): Promise<{ message: string }> {
    const webhook = await this.getWebhookById(id)

    if (webhook.isSystem) {
      throw new ConflictException('系统Webhook不可删除')
    }

    await this.webhookRepository.remove(webhook)
    return { message: '删除成功' }
  }

  /**
   * 启用/禁用Webhook
   */
  async toggleWebhook(id: number, enabled: boolean): Promise<Webhook> {
    const webhook = await this.getWebhookById(id)
    webhook.status = enabled ? WebhookStatus.ACTIVE : WebhookStatus.INACTIVE
    return this.webhookRepository.save(webhook)
  }

  /**
   * 触发Webhook事件
   */
  async triggerEvent(triggerDto: TriggerWebhookDto): Promise<void> {
    const { eventType, data, projectId, userId } = triggerDto

    const webhooks = await this.webhookRepository.find({
      where: {
        status: WebhookStatus.ACTIVE,
        events: Like(`%${eventType}%`) as any,
      },
    })

    const filteredWebhooks = webhooks.filter(webhook => {
      return !webhook.projectId || webhook.projectId === projectId
    })

    if (filteredWebhooks.length === 0) {
      this.logger.debug(`No webhooks found for event ${eventType}`)
      return
    }

    const payload = this.createEventPayload(eventType, data, projectId, userId)

    for (const webhook of filteredWebhooks) {
      if (webhook.triggerType === WebhookTriggerType.SYNC) {
        await this.sendWebhook(webhook, payload)
      } else {
        process.nextTick(() => {
          this.sendWebhook(webhook, payload).catch((err: Error) => {
            this.logger.error(`Failed to send webhook ${webhook.id}: ${err.message}`, err.stack)
          })
        })
      }
    }
  }

  /**
   * 创建事件负载
   */
  private createEventPayload(
    eventType: WebhookEventType,
    data: object,
    projectId?: number,
    userId?: number,
  ): Record<string, unknown> {
    return {
      eventId: crypto.randomUUID(),
      eventType,
      timestamp: Date.now(),
      data,
      metadata: {
        projectId,
        userId,
        source: 'ai-lowcode-platform',
      },
    }
  }

  /**
   * 发送Webhook请求
   */
  private async sendWebhook(webhook: Webhook, payload: Record<string, unknown>): Promise<void> {
    const log = await this.createLog(webhook.id, payload as any)
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 10000)

    try {
      const requestOptions = await this.buildRequestOptions(webhook, payload)

      const response = await fetch(webhook.url, {
        ...requestOptions,
        signal: abortController.signal,
      })

      await this.updateLog(log.id, {
        status: response.ok ? WebhookLogStatus.SUCCESS : WebhookLogStatus.FAILED,
        responseStatus: response.status,
        responseBody: await response.text(),
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Failed to send webhook ${webhook.id}: ${errorMessage}`)
      await this.handleWebhookFailure(log.id, webhook, error instanceof Error ? error : new Error(errorMessage))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 构建请求选项
   */
  private async buildRequestOptions(
    webhook: Webhook,
    payload: Record<string, unknown>,
  ): Promise<Omit<RequestInit, 'signal'>> {
    const body = JSON.stringify(payload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': payload.eventType as string,
      'X-Webhook-Delivery': payload.eventId as string,
      ...(webhook.headers || {}),
    }

    if (webhook.secret && webhook.signatureAlgorithm) {
      const signature = this.generateSignature(body, webhook.secret, webhook.signatureAlgorithm)
      headers['X-Signature'] = signature
    }

    return {
      method: 'POST',
      headers,
      body,
    }
  }

  /**
   * 生成签名
   */
  private generateSignature(
    payload: string,
    secret: string,
    algorithm: WebhookSignatureAlgorithm,
  ): string {
    const hmac = crypto.createHmac(
      algorithm === WebhookSignatureAlgorithm.HMAC_SHA512 ? 'sha512' : 'sha256',
      secret,
    )
    return `${algorithm}=${hmac.update(payload).digest('hex')}`
  }

  /**
   * 创建日志
   */
  private async createLog(webhookId: number, payload: { eventType: WebhookEventType }): Promise<WebhookLog> {
    const log = this.webhookLogRepository.create({
      webhookId,
      eventType: payload.eventType,
      payload: payload as Record<string, unknown>,
      status: WebhookLogStatus.PENDING,
      retryCount: 0,
    })
    return this.webhookLogRepository.save(log)
  }

  /**
   * 更新日志
   */
  private async updateLog(
    logId: number,
    updates: {
      status?: WebhookLogStatus
      responseStatus?: number
      responseBody?: string
      retryCount?: number
      errorMessage?: string
      nextRetryAt?: Date
    },
  ): Promise<void> {
    await this.webhookLogRepository.update(logId, updates)
  }

  /**
   * 处理Webhook失败
   */
  private async handleWebhookFailure(logId: number, webhook: Webhook, error: Error): Promise<void> {
    const log = await this.webhookLogRepository.findOne({ where: { id: logId } })
    if (!log) return

    const retryConfig = webhook.retryConfig || DEFAULT_RETRY_CONFIG

    if (log.retryCount < retryConfig.maxRetries) {
      const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, log.retryCount)
      const nextRetryAt = new Date(Date.now() + delay)

      await this.updateLog(logId, {
        status: WebhookLogStatus.RETRYING,
        retryCount: log.retryCount + 1,
        errorMessage: error.message,
        nextRetryAt,
      })

      const timer = setTimeout(async () => {
        this.retryQueue.delete(logId)
        await this.retryWebhook(logId)
      }, delay)

      this.retryQueue.set(logId, timer)
    } else {
      await this.updateLog(logId, {
        status: WebhookLogStatus.FAILED,
        retryCount: log.retryCount + 1,
        errorMessage: error.message,
      })

      this.logger.error(`Webhook ${webhook.id} failed after ${retryConfig.maxRetries} retries`)
    }
  }

  /**
   * 重试Webhook
   */
  private async retryWebhook(logId: number): Promise<void> {
    const log = await this.webhookLogRepository.findOne({
      where: { id: logId },
      relations: ['webhook'],
    })

    if (!log || !log.webhook) {
      this.logger.error(`Failed to find log or webhook for retry: ${logId}`)
      return
    }

    const webhook = log.webhook

    if (webhook.status !== WebhookStatus.ACTIVE) {
      this.logger.debug(`Webhook ${webhook.id} is no longer active, skipping retry`)
      return
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 10000)

    try {
      const requestOptions = await this.buildRequestOptions(webhook, log.payload)
      const response = await fetch(webhook.url, {
        ...requestOptions,
        signal: abortController.signal,
      })

      await this.updateLog(logId, {
        status: response.ok ? WebhookLogStatus.SUCCESS : WebhookLogStatus.FAILED,
        responseStatus: response.status,
        responseBody: await response.text(),
      })

      if (!response.ok) {
        throw new Error(`Retry failed with status ${response.status}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Retry failed for webhook ${webhook.id}: ${errorMessage}`)
      await this.handleWebhookFailure(logId, webhook, error instanceof Error ? error : new Error(errorMessage))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 获取Webhook日志
   */
  async getWebhookLogs(webhookId?: number, status?: WebhookLogStatus): Promise<WebhookLog[]> {
    const query = this.webhookLogRepository.createQueryBuilder('log')

    if (webhookId) {
      query.where('log.webhook_id = :webhookId', { webhookId })
    }

    if (status) {
      query.andWhere('log.status = :status', { status })
    }

    query.orderBy('log.created_at', 'DESC')

    return query.getMany()
  }

  /**
   * 获取单个日志详情
   */
  async getLogById(id: number): Promise<WebhookLog> {
    const log = await this.webhookLogRepository.findOne({
      where: { id },
      relations: ['webhook'],
    })
    if (!log) {
      throw new NotFoundException('日志不存在')
    }
    return log
  }

  /**
   * 测试Webhook
   */
  async testWebhook(id: number, testData?: Record<string, unknown>): Promise<{ success: boolean; response?: any }> {
    const webhook = await this.getWebhookById(id)
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 10000)

    const testPayload = this.createEventPayload(
      WebhookEventType.PROJECT_CREATED,
      testData || { test: 'data' },
    )

    try {
      const requestOptions = await this.buildRequestOptions(webhook, testPayload)
      const response = await fetch(webhook.url, {
        ...requestOptions,
        signal: abortController.signal,
      })

      return {
        success: response.ok,
        response: {
          status: response.status,
          body: await response.text(),
        },
      }
    } catch (error: unknown) {
      return {
        success: false,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 获取事件类型列表
   */
  getEventTypes(): { type: WebhookEventType; label: string; group: string }[] {
    const eventLabels: Record<WebhookEventType, string> = {
      [WebhookEventType.PROJECT_CREATED]: '项目创建',
      [WebhookEventType.PROJECT_UPDATED]: '项目更新',
      [WebhookEventType.PROJECT_DELETED]: '项目删除',
      [WebhookEventType.PAGE_CREATED]: '页面创建',
      [WebhookEventType.PAGE_UPDATED]: '页面更新',
      [WebhookEventType.PAGE_DELETED]: '页面删除',
      [WebhookEventType.PAGE_PUBLISHED]: '页面发布',
      [WebhookEventType.PAGE_VERSION_CREATED]: '页面版本创建',
      [WebhookEventType.WORKFLOW_STARTED]: '工作流启动',
      [WebhookEventType.WORKFLOW_COMPLETED]: '工作流完成',
      [WebhookEventType.WORKFLOW_FAILED]: '工作流失败',
      [WebhookEventType.WORKFLOW_NODE_COMPLETED]: '工作流节点完成',
      [WebhookEventType.USER_CREATED]: '用户创建',
      [WebhookEventType.USER_UPDATED]: '用户更新',
      [WebhookEventType.USER_DELETED]: '用户删除',
      [WebhookEventType.USER_LOGGED_IN]: '用户登录',
      [WebhookEventType.DATASOURCE_CONNECTED]: '数据源连接',
      [WebhookEventType.DATASOURCE_DISCONNECTED]: '数据源断开',
      [WebhookEventType.DATASOURCE_QUERIED]: '数据源查询',
      [WebhookEventType.AI_GENERATION_COMPLETED]: 'AI生成完成',
      [WebhookEventType.AI_GENERATION_FAILED]: 'AI生成失败',
      [WebhookEventType.CODE_GENERATED]: '代码生成',
      [WebhookEventType.CODE_DEPLOYED]: '代码部署',
      [WebhookEventType.KNOWLEDGE_ADDED]: '知识库添加',
      [WebhookEventType.KNOWLEDGE_DELETED]: '知识库删除',
      [WebhookEventType.KNOWLEDGE_VECTORIZED]: '知识库向量化',
    }

    return Object.values(WebhookEventType).map((type) => ({
      type,
      label: eventLabels[type],
      group: this.getEventGroup(type),
    }))
  }

  /**
   * 获取事件分组名称
   */
  private getEventGroup(eventType: WebhookEventType): string {
    if (eventType.startsWith('project.')) return 'project'
    if (eventType.startsWith('page.')) return 'page'
    if (eventType.startsWith('workflow.')) return 'workflow'
    if (eventType.startsWith('user.')) return 'user'
    if (eventType.startsWith('datasource.')) return 'datasource'
    if (eventType.startsWith('ai.')) return 'ai'
    if (eventType.startsWith('code.')) return 'codegen'
    if (eventType.startsWith('knowledge.')) return 'knowledge'
    return 'other'
  }

  /**
   * 清理过期重试任务
   */
  cleanupExpiredRetries(): void {
    for (const [logId, timer] of this.retryQueue.entries()) {
      clearTimeout(timer)
      this.retryQueue.delete(logId)
    }
  }
}
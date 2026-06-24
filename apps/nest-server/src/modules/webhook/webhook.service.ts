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

  async createWebhook(createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    const existing = await this.webhookRepository.findOne({
      where: { url: createWebhookDto.url, projectId: createWebhookDto.projectId },
    })
    if (existing) {
      throw new ConflictException('URL already registered for this project')
    }

    const webhook = this.webhookRepository.create({
      ...createWebhookDto,
      status: WebhookStatus.ACTIVE,
    })

    return this.webhookRepository.save(webhook)
  }

  async getAllWebhooks(projectId?: number): Promise<Webhook[]> {
    const query = this.webhookRepository.createQueryBuilder('webhook')

    if (projectId !== undefined) {
      query.where('webhook.project_id = :projectId OR webhook.project_id IS NULL', { projectId })
    }

    return query.getMany()
  }

  async getWebhookById(id: number): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } })
    if (!webhook) {
      throw new NotFoundException('Webhook not found')
    }
    return webhook
  }

  async updateWebhook(id: number, updateWebhookDto: UpdateWebhookDto): Promise<Webhook> {
    const webhook = await this.getWebhookById(id)

    if (webhook.isSystem && updateWebhookDto.name) {
      throw new ConflictException('System webhook name cannot be modified')
    }

    Object.assign(webhook, updateWebhookDto)
    return this.webhookRepository.save(webhook)
  }

  async deleteWebhook(id: number): Promise<{ message: string }> {
    const webhook = await this.getWebhookById(id)

    if (webhook.isSystem) {
      throw new ConflictException('System webhook cannot be deleted')
    }

    await this.webhookRepository.remove(webhook)
    return { message: 'Webhook deleted successfully' }
  }

  async toggleWebhook(id: number, enabled: boolean): Promise<Webhook> {
    const webhook = await this.getWebhookById(id)
    webhook.status = enabled ? WebhookStatus.ACTIVE : WebhookStatus.INACTIVE
    return this.webhookRepository.save(webhook)
  }

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

  async getLogById(id: number): Promise<WebhookLog> {
    const log = await this.webhookLogRepository.findOne({
      where: { id },
      relations: ['webhook'],
    })
    if (!log) {
      throw new NotFoundException('Log not found')
    }
    return log
  }

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

  getEventTypes(): { type: WebhookEventType; label: string; group: string }[] {
    const eventLabels: Record<WebhookEventType, string> = {
      [WebhookEventType.PROJECT_CREATED]: 'Project Created',
      [WebhookEventType.PROJECT_UPDATED]: 'Project Updated',
      [WebhookEventType.PROJECT_DELETED]: 'Project Deleted',
      [WebhookEventType.PAGE_CREATED]: 'Page Created',
      [WebhookEventType.PAGE_UPDATED]: 'Page Updated',
      [WebhookEventType.PAGE_DELETED]: 'Page Deleted',
      [WebhookEventType.PAGE_PUBLISHED]: 'Page Published',
      [WebhookEventType.PAGE_VERSION_CREATED]: 'Page Version Created',
      [WebhookEventType.WORKFLOW_STARTED]: 'Workflow Started',
      [WebhookEventType.WORKFLOW_COMPLETED]: 'Workflow Completed',
      [WebhookEventType.WORKFLOW_FAILED]: 'Workflow Failed',
      [WebhookEventType.WORKFLOW_NODE_COMPLETED]: 'Workflow Node Completed',
      [WebhookEventType.USER_CREATED]: 'User Created',
      [WebhookEventType.USER_UPDATED]: 'User Updated',
      [WebhookEventType.USER_DELETED]: 'User Deleted',
      [WebhookEventType.USER_LOGGED_IN]: 'User Logged In',
      [WebhookEventType.DATASOURCE_CONNECTED]: 'Datasource Connected',
      [WebhookEventType.DATASOURCE_DISCONNECTED]: 'Datasource Disconnected',
      [WebhookEventType.DATASOURCE_QUERIED]: 'Datasource Queried',
      [WebhookEventType.AI_GENERATION_COMPLETED]: 'AI Generation Completed',
      [WebhookEventType.AI_GENERATION_FAILED]: 'AI Generation Failed',
      [WebhookEventType.CODE_GENERATED]: 'Code Generated',
      [WebhookEventType.CODE_DEPLOYED]: 'Code Deployed',
      [WebhookEventType.KNOWLEDGE_ADDED]: 'Knowledge Added',
      [WebhookEventType.KNOWLEDGE_DELETED]: 'Knowledge Deleted',
      [WebhookEventType.KNOWLEDGE_VECTORIZED]: 'Knowledge Vectorized',
    }

    return Object.values(WebhookEventType).map((type) => ({
      type,
      label: eventLabels[type] || type,
      group: this.getEventGroup(type),
    }))
  }

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

  cleanupExpiredRetries(): void {
    for (const [logId, timer] of this.retryQueue.entries()) {
      clearTimeout(timer)
      this.retryQueue.delete(logId)
    }
  }
}
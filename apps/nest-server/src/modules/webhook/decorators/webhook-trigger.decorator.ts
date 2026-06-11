import { SetMetadata } from '@nestjs/common'
import { WebhookEventType } from '@ai-lowcode/shared-types'

/**
 * Webhook触发器元数据键
 */
export const WEBHOOK_EVENT_KEY = 'webhook_event'

/**
 * Webhook触发器装饰器
 * 用于标记方法触发Webhook事件
 * @example
 * @WebhookTrigger(WebhookEventType.PROJECT_CREATED)
 * async createProject() { ... }
 */
export const WebhookTrigger = (eventType: WebhookEventType) => 
  SetMetadata(WEBHOOK_EVENT_KEY, eventType)
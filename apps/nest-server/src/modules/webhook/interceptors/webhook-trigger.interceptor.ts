import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { WEBHOOK_EVENT_KEY } from '../decorators/webhook-trigger.decorator'
import { WebhookEventType } from '@ai-lowcode/shared-types'
import { WebhookService } from '../webhook.service'

/**
 * Webhook触发器拦截器
 * 自动触发Webhook事件
 */
@Injectable()
export class WebhookTriggerInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private webhookService: WebhookService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const eventType = this.reflector.get<WebhookEventType>(
      WEBHOOK_EVENT_KEY,
      context.getHandler(),
    )

    if (!eventType) {
      return next.handle()
    }

    return next.handle().pipe(
      tap((result) => {
        // 提取请求信息
        const request = context.switchToHttp().getRequest()
        
        // 获取项目ID和用户ID
        const projectId = request.body?.projectId || request.params?.projectId
        const userId = request.user?.id

        // 触发Webhook事件
        this.webhookService.triggerEvent({
          eventType,
          data: result,
          projectId: typeof projectId === 'number' ? projectId : undefined,
          userId: typeof userId === 'number' ? userId : undefined,
        }).catch((error) => {
          console.error('Failed to trigger webhook:', error)
        })
      }),
    )
  }
}
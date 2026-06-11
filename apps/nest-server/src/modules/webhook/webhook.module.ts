import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WebhookController } from './webhook.controller'
import { WebhookService } from './webhook.service'
import { Webhook } from './entities/webhook.entity'
import { WebhookLog } from './entities/webhook-log.entity'
import { WebhookTriggerInterceptor } from './interceptors/webhook-trigger.interceptor'

@Module({
  imports: [TypeOrmModule.forFeature([Webhook, WebhookLog])],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookTriggerInterceptor],
  exports: [WebhookService, WebhookTriggerInterceptor],
})
export class WebhookModule {}
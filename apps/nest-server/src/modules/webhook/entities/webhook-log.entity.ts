import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Webhook } from './webhook.entity'
import { WebhookEventType, WebhookLogStatus } from '@ai-lowcode/shared-types'

/**
 * Webhook 日志实体
 */
@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'webhook_id' })
  webhookId!: number

  @ManyToOne(() => Webhook)
  @JoinColumn({ name: 'webhook_id' })
  webhook?: Webhook

  @Column({
    type: 'varchar',
    length: 50,
  })
  eventType!: WebhookEventType

  @Column({ type: 'json' })
  payload!: Record<string, unknown>

  @Column({ name: 'response_status', nullable: true })
  responseStatus?: number

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody?: string

  @Column({
    type: 'varchar',
    length: 20,
    default: WebhookLogStatus.PENDING,
  })
  status!: WebhookLogStatus

  @Column({ name: 'retry_count', default: 0 })
  retryCount!: number

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string

  @Column({ name: 'next_retry_at', nullable: true })
  nextRetryAt?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
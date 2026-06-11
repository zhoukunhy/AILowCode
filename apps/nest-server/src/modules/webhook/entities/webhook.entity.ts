import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { WebhookStatus, WebhookTriggerType, WebhookSignatureAlgorithm, WebhookEventType } from '@ai-lowcode/shared-types'

/**
 * Webhook 配置实体
 */
@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column()
  url!: string

  @Column({ type: 'simple-array' })
  events!: WebhookEventType[]

  @Column({
    type: 'varchar',
    length: 20,
    default: WebhookStatus.ACTIVE,
  })
  status!: WebhookStatus

  @Column({
    type: 'varchar',
    length: 20,
    default: WebhookTriggerType.ASYNC,
  })
  triggerType!: WebhookTriggerType

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  signatureAlgorithm?: WebhookSignatureAlgorithm

  @Column({ nullable: true })
  secret?: string

  @Column({ type: 'json', nullable: true })
  headers?: Record<string, string>

  @Column({ type: 'json', nullable: true })
  retryConfig?: {
    maxRetries: number
    delayMs: number
    backoffMultiplier: number
  }

  @Column({ name: 'project_id', nullable: true })
  projectId?: number

  @Column({ default: false })
  isSystem?: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
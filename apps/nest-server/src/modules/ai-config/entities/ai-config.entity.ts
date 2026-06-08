import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

/**
 * AI 配置实体
 * 用于存储 LLM、向量库等 AI 相关配置
 */
@Entity('ai_configs')
export class AIConfigEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '配置名称' })
  name!: string

  @Column({ length: 50, comment: '提供商：deepseek, qwen, openai' })
  provider!: string

  @Column({ length: 100, nullable: true, comment: '模型名称' })
  model?: string

  @Column({ type: 'text', comment: 'API密钥（加密存储）' })
  apiKey!: string

  @Column({ length: 255, nullable: true, comment: 'API基础URL' })
  baseUrl?: string

  @Column({ type: 'simple-json', nullable: true, comment: '其他配置（JSON格式）' })
  config?: Record<string, any>

  @Column({ default: true, comment: '是否启用' })
  isActive!: boolean

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date

  @DeleteDateColumn({ comment: '删除时间' })
  deletedAt?: Date
}

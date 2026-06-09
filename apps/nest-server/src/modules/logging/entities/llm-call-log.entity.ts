/**
 * LLM 调用日志实体
 * 记录所有 LLM API 调用
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

export enum LlmProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  QIANFAN = 'qianfan',
  DOUBAO = 'doubao',
  CUSTOM = 'custom',
}

export enum LlmModel {
  GPT_4O = 'gpt-4o',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  CLAUDE_3_SONNET = 'claude-3-sonnet',
  CLAUDE_3_OPUS = 'claude-3-opus',
  QIANFAN_TURBO = 'qianfan-turbo',
  DOUBAO_PRO = 'doubao-pro',
  CUSTOM = 'custom',
}

@Entity('llm_call_logs')
export class LlmCallLogEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '会话ID' })
  @Index()
  sessionId!: string

  @Column({ length: 50, comment: 'LLM 提供商' })
  provider!: string

  @Column({ length: 100, comment: '模型名称' })
  model!: string

  @Column({ type: 'text', comment: '请求内容（Prompt）' })
  prompt!: string

  @Column({ type: 'text', nullable: true, comment: '响应内容' })
  response?: string

  @Column({ type: 'integer', default: 0, comment: '输入 Token 数' })
  promptTokens!: number

  @Column({ type: 'integer', default: 0, comment: '输出 Token 数' })
  completionTokens!: number

  @Column({ type: 'integer', default: 0, comment: '总 Token 数' })
  totalTokens!: number

  @Column({ length: 20, default: 'pending', comment: '状态：pending/running/completed/failed' })
  status!: string

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage?: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '费用（元）' })
  cost?: number

  @Column({ type: 'integer', nullable: true, comment: '执行时长（毫秒）' })
  duration?: number

  @Column({ type: 'datetime', nullable: true, comment: '开始时间' })
  startTime?: Date

  @Column({ type: 'datetime', nullable: true, comment: '结束时间' })
  endTime?: Date

  @Column({ type: 'simple-json', nullable: true, comment: '请求参数' })
  requestParams?: Record<string, any>

  @Column({ type: 'simple-json', nullable: true, comment: '响应头部' })
  responseHeaders?: Record<string, any>

  @Column({ length: 50, nullable: true, comment: '调用来源（哪个 Agent/模块）' })
  source?: string

  @Column({ type: 'simple-json', nullable: true, comment: '元数据' })
  metadata?: Record<string, any>

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date
}
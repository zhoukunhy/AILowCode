/**
 * Agent 会话实体
 * 存储 AI 生成页面的会话记录和全链路日志
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('agent_sessions')
export class AgentSessionEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '会话ID（UUID）' })
  sessionId!: string

  @Column({ length: 50, comment: 'Agent 类型' })
  agentType!: string

  @Column({ type: 'text', comment: '用户输入' })
  userInput!: string

  @Column({ type: 'text', nullable: true, comment: '解析的意图' })
  parsedIntent?: string

  @Column({ type: 'int', default: 0, comment: 'RAG 召回文档数' })
  ragDocCount!: number

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, comment: 'RAG 召回相关性分数' })
  ragRelevanceScore?: number

  @Column({ type: 'int', default: 0, comment: '生成的组件数量' })
  componentCount!: number

  @Column({ type: 'text', nullable: true, comment: '生成的页面 Schema' })
  generatedSchema?: string

  @Column({ type: 'text', nullable: true, comment: '最终页面 Schema' })
  finalSchema?: string

  @Column({ length: 20, default: 'pending', comment: '状态：pending, running, completed, failed' })
  status!: string

  @Column({ type: 'simple-json', nullable: true, comment: '执行日志（JSON 数组）' })
  executionLogs?: AgentLogEntry[]

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage?: string

  @Column({ type: 'integer', nullable: true, comment: '执行时长（毫秒）' })
  duration?: number

  @Column({ type: 'datetime', nullable: true, comment: '开始时间' })
  startTime?: Date

  @Column({ type: 'datetime', nullable: true, comment: '结束时间' })
  endTime?: Date

  @Column({ type: 'simple-json', nullable: true, comment: '元数据' })
  metadata?: Record<string, any>

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date
}

export interface AgentLogEntry {
  node: string
  timestamp: string
  input?: any
  output?: any
  error?: string
  duration: number
}

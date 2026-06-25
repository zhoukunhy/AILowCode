/**
 * MCP 会话上下文实体
 * 存储 AI 对话会话的历史消息和元数据
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

export interface ChatMessageRecord {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: string
  toolCallId?: string
}

@Entity('mcp_context_sessions')
export class McpContextSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 200, unique: true, comment: '会话唯一标识符' })
  @Index()
  sessionId!: string

  @Column({ type: 'simple-json', default: '[]', comment: '历史消息列表' })
  messages!: ChatMessageRecord[]

  @Column({ type: 'simple-json', nullable: true, comment: '会话元数据' })
  metadata?: Record<string, any>

  @Column({ type: 'datetime', nullable: true, comment: '最后活动时间' })
  @Index()
  lastActivityAt?: Date

  @Column({ default: false, comment: '是否归档' })
  isArchived!: boolean

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date
}

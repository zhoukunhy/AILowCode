/**
 * RAG 检索日志实体
 * 记录所有 RAG 知识库检索操作
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity('rag_retrieval_logs')
export class RagRetrievalLogEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '会话ID' })
  @Index()
  sessionId!: string

  @Column({ type: 'text', comment: '检索查询词' })
  query!: string

  @Column({ type: 'integer', default: 0, comment: '召回文档数' })
  retrievedCount!: number

  @Column({ type: 'integer', default: 0, comment: '命中文档数' })
  hitCount!: number

  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true, comment: '最高相关性分数' })
  maxScore?: number

  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true, comment: '平均相关性分数' })
  avgScore?: number

  @Column({ type: 'simple-json', nullable: true, comment: '召回文档列表' })
  documents?: Array<{
    id: string
    content: string
    score: number
    metadata?: Record<string, any>
  }>

  @Column({ type: 'text', nullable: true, comment: '知识库名称/ID' })
  knowledgeBaseId?: string

  @Column({ type: 'text', nullable: true, comment: '知识库名称' })
  knowledgeBaseName?: string

  @Column({ length: 20, default: 'pending', comment: '状态：pending/running/completed/failed' })
  status!: string

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage?: string

  @Column({ type: 'integer', nullable: true, comment: '执行时长（毫秒）' })
  duration?: number

  @Column({ type: 'datetime', nullable: true, comment: '开始时间' })
  startTime?: Date

  @Column({ type: 'datetime', nullable: true, comment: '结束时间' })
  endTime?: Date

  @Column({ type: 'simple-json', nullable: true, comment: '检索参数' })
  retrievalParams?: Record<string, any>

  @Column({ length: 50, nullable: true, comment: '调用来源' })
  source?: string

  @Column({ type: 'simple-json', nullable: true, comment: '元数据' })
  metadata?: Record<string, any>

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date
}
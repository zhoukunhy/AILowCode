import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'

/**
 * 向量化日志实体
 */
@Entity('vectorization_logs')
export class VectorizationLogEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ comment: '文档ID' })
  documentId!: string

  @Column({ length: 255, comment: '文档名称' })
  documentName!: string

  @Column({ length: 50, comment: '文档类型' })
  documentType!: string

  @Column({
    type: 'varchar',
    length: 20,
    comment: '状态：pending, processing, completed, failed'
  })
  status!: string

  @Column({ length: 100, comment: '处理阶段' })
  stage!: string

  @Column({ type: 'timestamp', comment: '开始时间' })
  startTime!: Date

  @Column({ type: 'timestamp', nullable: true, comment: '结束时间' })
  endTime?: Date

  @Column({ type: 'integer', nullable: true, comment: '持续时间（毫秒）' })
  duration?: number

  @Column({ type: 'integer', default: 0, comment: '分块数量' })
  chunkCount!: number

  @Column({ type: 'integer', default: 0, comment: '向量数量' })
  vectorCount!: number

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  error?: string

  @Column({ type: 'jsonb', nullable: true, comment: '元数据' })
  metadata?: Record<string, any>

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date
}
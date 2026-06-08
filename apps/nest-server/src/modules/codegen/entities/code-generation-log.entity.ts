/**
 * 代码生成模块实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('code_generation_logs')
export class CodeGenerationLogEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '会话ID' })
  sessionId!: string

  @Column({ length: 50, comment: '生成类型：frontend/backend/fullstack' })
  generationType!: string

  @Column({ type: 'text', comment: '原始 Schema' })
  schema!: string

  @Column({ type: 'integer', comment: '生成文件数量' })
  fileCount!: number

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

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date
}

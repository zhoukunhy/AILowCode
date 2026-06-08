/**
 * 数据源实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('data_sources')
export class DataSourceEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '数据源名称' })
  name!: string

  @Column({ length: 20, comment: '数据源类型' })
  type!: string

  @Column({ type: 'simple-json', comment: '数据源配置' })
  config!: Record<string, any>

  @Column({ type: 'simple-json', nullable: true, comment: '连接状态' })
  status?: Record<string, any>

  @Column({ length: 20, default: 'pending', comment: '状态' })
  connectionStatus!: string

  @Column({ type: 'text', nullable: true, comment: '描述' })
  description?: string

  @Column({ type: 'simple-json', nullable: true, comment: '元数据' })
  metadata?: Record<string, any>

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date
}

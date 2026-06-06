import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

/**
 * 向量库配置实体
 * 用于存储 Milvus 向量库连接配置
 */
@Entity('vector_store_configs')
export class VectorStoreConfigEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '配置名称' })
  name!: string

  @Column({ length: 255, comment: 'Milvus地址' })
  address!: string

  @Column({ length: 100, nullable: true, comment: '用户名' })
  username?: string

  @Column({ type: 'text', nullable: true, comment: '密码（加密存储）' })
  password?: string

  @Column({ length: 100, default: 'default', comment: '数据库名称' })
  database!: string

  @Column({ default: false, comment: '是否启用SSL' })
  ssl!: boolean

  @Column({ type: 'jsonb', nullable: true, comment: '其他配置（JSON格式）' })
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

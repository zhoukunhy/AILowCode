import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

/**
 * 向量库配置实体
 * 用于存储 Chroma 向量库连接配置
 */
@Entity('vector_store_configs')
export class VectorStoreConfigEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '配置名称' })
  name!: string

  @Column({ length: 255, comment: 'Chroma地址' })
  url!: string

  @Column({ length: 100, nullable: true, comment: 'API密钥' })
  apiKey?: string

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

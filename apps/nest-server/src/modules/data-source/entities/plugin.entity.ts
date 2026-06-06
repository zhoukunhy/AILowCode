/**
 * 插件实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('plugins')
export class PluginEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: '插件名称' })
  name!: string

  @Column({ length: 50, comment: '插件版本' })
  version!: string

  @Column({ length: 20, comment: '插件类型' })
  type!: string

  @Column({ type: 'text', comment: '插件描述' })
  description!: string

  @Column({ length: 255, comment: '插件文件路径' })
  filePath!: string

  @Column({ type: 'jsonb', comment: '插件元数据' })
  metadata!: Record<string, any>

  @Column({ length: 20, default: 'pending', comment: '状态' })
  status!: string

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage?: string

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date
}

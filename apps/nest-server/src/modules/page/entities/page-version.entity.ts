import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Page } from './page.entity'

/**
 * 页面版本快照实体
 * 每次保存画布时自动生成版本快照，支持历史版本回滚和对比
 */
@Entity('page_versions')
export class PageVersion {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'page_id' })
  pageId!: number

  @Column({ length: 50 })
  version!: string

  @Column({ name: 'version_number', default: 1 })
  versionNumber!: number

  @Column({ name: 'canvas_json', type: 'simple-json', nullable: true })
  canvasJson!: any

  @Column({ name: 'page_config', type: 'simple-json', nullable: true })
  pageConfig!: any

  @Column({ length: 255, nullable: true })
  description?: string

  @Column({ name: 'change_summary', type: 'simple-json', nullable: true })
  changeSummary!: any

  @Column({ name: 'created_by', nullable: true })
  createdBy?: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // 关联关系
  @ManyToOne(() => Page, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page!: Page
}
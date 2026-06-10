import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Project } from '../../project/entities/project.entity'

/**
 * 页面画布配置实体
 * 存储画布的配置信息和组件 JSON
 */
@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'project_id', nullable: true })
  projectId?: number

  @Column({ length: 100 })
  name!: string

  @Column({ default: 1920 })
  width!: number

  @Column({ default: 1080 })
  height!: number

  @Column({ name: 'grid_size', default: 20 })
  gridSize!: number

  @Column({ name: 'snap_to_grid', default: true })
  snapToGrid!: boolean

  @Column({ name: 'show_grid', default: true })
  showGrid!: boolean

  @Column({ name: 'show_rulers', default: false })
  showRulers!: boolean

  @Column({ name: 'background_color', default: '#ffffff' })
  backgroundColor!: string

  @Column({ name: 'canvas_json', type: 'simple-json', nullable: true, default: null })
  canvasJson!: any

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number

  @Column({ name: 'is_home', default: false })
  isHome!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // 关联关系（可选）
  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project
}

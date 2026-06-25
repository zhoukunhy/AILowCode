/**
 * MCP 提示词模板实体
 * 存储 AI 提示词模板，支持变量替换和分类管理
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('mcp_prompt_templates')
export class McpPromptTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 200, comment: '模板名称' })
  name!: string

  @Column({ type: 'text', comment: '模板描述' })
  description!: string

  @Column({ type: 'text', comment: '模板内容（支持 {{variable}} 语法）' })
  content!: string

  @Column({ type: 'simple-json', default: '[]', comment: '模板变量列表' })
  variables!: string[]

  @Column({ length: 100, comment: '分类' })
  @Index()
  category!: string

  @Column({ length: 50, default: '1.0.0', comment: '版本号' })
  version!: string

  @Column({ default: true, comment: '是否启用' })
  isActive!: boolean

  @Column({ length: 50, nullable: true, comment: '标签（逗号分隔）' })
  tags?: string

  @Column({ type: 'simple-json', nullable: true, comment: '使用统计' })
  stats?: { useCount: number; lastUsedAt?: Date }

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date
}

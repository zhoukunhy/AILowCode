/**
 * MCP 工具注册实体
 * 存储可扩展的工具注册信息，与代码内置工具互补
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('mcp_tool_registries')
export class McpToolRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 200, unique: true, comment: '工具名称' })
  @Index()
  name!: string

  @Column({ type: 'text', comment: '工具描述' })
  description!: string

  @Column({ type: 'simple-json', comment: '输入参数 JSON Schema' })
  inputSchema!: Record<string, unknown>

  @Column({ length: 50, default: '1.0.0', comment: '版本号' })
  version!: string

  @Column({ length: 200, nullable: true, comment: '作者' })
  author?: string

  @Column({ length: 50, default: 'custom', comment: '工具来源：builtin（内置）/ custom（自定义）/ plugin（插件）' })
  source!: string

  @Column({ type: 'text', nullable: true, comment: '工具实现代码或调用配置' })
  implementation?: string

  @Column({ default: true, comment: '是否启用' })
  isActive!: boolean

  @Column({ type: 'simple-json', nullable: true, comment: '使用统计' })
  stats?: { callCount: number; lastCalledAt?: Date; avgResponseTime?: number }

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date
}

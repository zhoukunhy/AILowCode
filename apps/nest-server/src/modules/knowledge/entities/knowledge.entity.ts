import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm'

/**
 * 知识库实体
 */
@Entity('knowledge_bases')
export class KnowledgeBaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 255, comment: '知识库名称' })
  name!: string

  @Column({ type: 'text', nullable: true, comment: '知识库描述' })
  description?: string

  @Column({ length: 100, nullable: true, comment: '嵌入模型' })
  embeddingModel?: string

  @Column({ default: 1536, comment: '向量维度' })
  dimension!: number

  @Column({ default: 0, comment: '文档数量' })
  documentCount!: number

  @Column({ default: true, comment: '是否启用' })
  isActive!: boolean

  @Column({ type: 'simple-json', nullable: true, comment: '元数据' })
  metadata?: Record<string, any>

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date

  @DeleteDateColumn({ comment: '删除时间' })
  deletedAt?: Date
}

/**
 * 知识库文档实体
 */
@Entity('knowledge_documents')
export class KnowledgeDocumentEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ comment: '知识库ID' })
  knowledgeBaseId!: number

  @Column({ length: 255, comment: '文档名称' })
  name!: string

  @Column({ type: 'text', nullable: true, comment: '文档内容' })
  content?: string

  @Column({ length: 50, comment: '文档类型（md, api, requirement）' })
  type!: string

  @Column({ nullable: true, comment: '文档大小（字节）' })
  size?: number

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '向量化状态：pending, processing, completed, failed'
  })
  vectorStatus!: string

  @Column({ default: 0, comment: '分块数量' })
  chunkCount!: number

  @Column({ type: 'simple-json', nullable: true, comment: '元数据' })
  metadata?: Record<string, any>

  @Column({ nullable: true, comment: '错误信息' })
  errorMessage?: string

  @ManyToOne(() => KnowledgeBaseEntity)
  @JoinColumn({ name: 'knowledgeBaseId' })
  knowledgeBase?: KnowledgeBaseEntity

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date

  @DeleteDateColumn({ comment: '删除时间' })
  deletedAt?: Date
}

/**
 * 文档分块实体
 */
@Entity('document_chunks')
export class DocumentChunkEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ comment: '文档ID' })
  documentId!: number

  @Column({ comment: '分块索引' })
  chunkIndex!: number

  @Column({ type: 'text', comment: '分块内容' })
  content!: string

  @Column({ type: 'simple-json', nullable: true, comment: '元数据' })
  metadata?: Record<string, any>

  @Column({ type: 'text', nullable: true, comment: 'Chroma向量ID' })
  vectorId?: string

  @ManyToOne(() => KnowledgeDocumentEntity)
  @JoinColumn({ name: 'documentId' })
  document?: KnowledgeDocumentEntity

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date
}

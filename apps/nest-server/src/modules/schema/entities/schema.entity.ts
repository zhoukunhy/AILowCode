/**
 * 数据表 Schema 实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('schemas')
export class SchemaEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100, comment: 'Schema 名称' })
  name!: string

  @Column({ length: 100, comment: '表名' })
  tableName!: string

  @Column({ type: 'simple-json', comment: '字段定义' })
  fields!: SchemaField[]

  @Column({ type: 'simple-json', nullable: true, comment: '索引定义' })
  indexes?: SchemaIndex[]

  @Column({ nullable: true, comment: '所属项目ID' })
  projectId?: number

  @Column({ nullable: true, comment: '创建人ID' })
  createdBy?: number

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date
}

/**
 * 字段定义接口
 */
export interface SchemaField {
  id: string
  name: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: any
}

/**
 * 索引定义接口
 */
export interface SchemaIndex {
  name: string
  fields: string[]
  unique?: boolean
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { ProcessNode } from './process-node.entity'

export type ProcessStatus = 'draft' | 'active' | 'inactive'

@Entity('process_definition')
export class ProcessDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: ProcessStatus

  @Column({ type: 'varchar', length: 36, nullable: true })
  startNodeId?: string

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @Column({ type: 'varchar', length: 36 })
  creatorId!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @OneToMany(() => ProcessNode, (node) => node.processDefinition)
  nodes!: ProcessNode[]
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm'
import { ProcessNode } from './process-node.entity'

@Entity('process_transition')
export class ProcessTransition {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'source_node_id', type: 'varchar', length: 36 })
  sourceNodeId!: string

  @Column({ name: 'target_node_id', type: 'varchar', length: 36 })
  targetNodeId!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  label?: string

  @Column({ type: 'json', nullable: true })
  condition?: ProcessCondition

  @Column({ type: 'json', nullable: true })
  points?: { x: number; y: number }[]

  @Column({ type: 'int', default: 0 })
  zIndex!: number

  @ManyToOne(() => ProcessNode, (node) => node.outgoingTransitions)
  sourceNode!: ProcessNode

  @ManyToOne(() => ProcessNode, (node) => node.incomingTransitions)
  targetNode!: ProcessNode

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

export interface ProcessCondition {
  type: 'expression' | 'script' | 'data'
  value: string
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in'
  compareValue?: any
}
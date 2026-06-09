import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm'
import { ProcessDefinition } from './process-definition.entity'
import { ProcessTransition } from './process-transition.entity'

export type NodeType = 'start' | 'approve' | 'condition' | 'fork' | 'join' | 'end' | 'action'

@Entity('process_node')
export class ProcessNode {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50 })
  type!: NodeType

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'int', default: 0 })
  x!: number

  @Column({ type: 'int', default: 0 })
  y!: number

  @Column({ type: 'int', default: 150 })
  width!: number

  @Column({ type: 'int', default: 60 })
  height!: number

  @Column({ type: 'json', nullable: true })
  config?: Record<string, any>

  @Column({ type: 'int', default: 0 })
  zIndex!: number

  @Column({ name: 'process_definition_id', type: 'varchar', length: 36 })
  processDefinitionId!: string

  @ManyToOne(() => ProcessDefinition, (process) => process.nodes)
  processDefinition!: ProcessDefinition

  @OneToMany(() => ProcessTransition, (transition) => transition.sourceNode)
  outgoingTransitions!: ProcessTransition[]

  @OneToMany(() => ProcessTransition, (transition) => transition.targetNode)
  incomingTransitions!: ProcessTransition[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
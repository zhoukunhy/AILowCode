import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('data_models')
export class DataModelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string

  @Column({ type: 'json', nullable: true })
  entities!: any

  @Column({ type: 'json', nullable: true })
  relations!: any[]

  @Column({ type: 'json', nullable: true })
  enums!: any[]

  @Column({ type: 'varchar', length: 255, nullable: true })
  projectId!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy!: string

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column()
  category!: string

  @Column({ type: 'simple-json', nullable: true })
  schema!: Record<string, any>

  @Column({ default: 0 })
  downloads!: number

  @Column({ default: 'draft' })
  status!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

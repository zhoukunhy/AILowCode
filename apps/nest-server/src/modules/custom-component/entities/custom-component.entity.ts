import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('custom_components')
export class CustomComponentEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  componentId!: string

  @Column()
  name!: string

  @Column()
  displayName!: string

  @Column({ type: 'text', nullable: true })
  description!: string

  @Column()
  category!: string

  @Column({ length: 10 })
  icon!: string

  @Column()
  version!: string

  @Column()
  author!: string

  @Column()
  userId!: number

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status!: string

  @Column({ type: 'json' })
  template!: any

  @Column({ type: 'json' })
  propsSchema!: any

  @Column({ type: 'json', nullable: true })
  events!: any

  @Column({ type: 'json', nullable: true })
  dataSource!: any

  @Column({ type: 'simple-array', nullable: true })
  dependencies!: string

  @Column({ type: 'simple-array', nullable: true })
  tags!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
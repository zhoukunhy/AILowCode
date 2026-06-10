import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm'

@Entity('menus')
export class MenuEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 100 })
  name!: string

  @Column({ length: 255, nullable: true })
  icon?: string

  @Column({ length: 255, nullable: true })
  path?: string

  @Column({ nullable: true })
  parentId?: string

  @ManyToOne(() => MenuEntity, (menu) => menu.children)
  parent?: MenuEntity

  @OneToMany(() => MenuEntity, (menu) => menu.parent)
  children?: MenuEntity[]

  @Column({ default: 0 })
  sortOrder!: number

  @Column({ default: true })
  status!: boolean

  @Column({ length: 500, nullable: true })
  description?: string

  @Column({ nullable: true })
  pageId?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
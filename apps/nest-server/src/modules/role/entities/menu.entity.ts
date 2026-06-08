import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm'
import { Role } from './role.entity'

/**
 * 菜单实体
 */
@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ nullable: true })
  path?: string

  @Column({ nullable: true })
  icon?: string

  @Column({ nullable: true })
  parentId?: number

  @Column({ default: 0 })
  sortOrder!: number

  @Column({ default: true })
  isActive!: boolean

  @Column({ nullable: true })
  permission?: string

  @ManyToMany(() => Role, (role) => role.menus)
  roles!: Role[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm'
import { Role } from './role.entity'

/**
 * 权限实体
 * 用于细粒度的权限控制
 */
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  name!: string

  @Column({ unique: true })
  code!: string

  @Column({
    type: 'varchar',
    length: 20,
    default: 'button',
  })
  type!: 'menu' | 'button' | 'api'

  @Column({ nullable: true })
  parentId?: number

  @Column({ nullable: true })
  path?: string

  @Column({ nullable: true })
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'

  @Column({ nullable: true })
  description?: string

  @Column({ default: true })
  isActive!: boolean

  @ManyToMany(() => Role, (role) => role.permissions)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
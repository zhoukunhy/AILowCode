import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Role } from '../../role/entities/role.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  username!: string

  @Column()
  password!: string

  @Column({ unique: true })
  email!: string

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string

  @Column({ default: 'user' })
  role!: string

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  roleEntity?: Role

  @Column({ name: 'role_id', nullable: true })
  roleId?: number

  @Column({ default: 'active' })
  status!: string

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date

  @Column({ name: 'ai_call_count', default: 0 })
  aiCallCount!: number

  @Column({ name: 'ai_call_limit', default: 100 })
  aiCallLimit!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

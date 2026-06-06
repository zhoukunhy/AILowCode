import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

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

  @Column({ default: 'active' })
  status!: string

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

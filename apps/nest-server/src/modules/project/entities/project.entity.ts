import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../user/entities/user.entity'

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'simple-json', nullable: true })
  schema?: Record<string, any>

  @Column({ default: 'draft' })
  status!: string

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string

  @Column({ name: 'visibility', default: 'private' })
  visibility!: string

  @Column({ name: 'user_id' })
  userId!: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ name: 'published_at', nullable: true })
  publishedAt?: Date

  @Column({ name: 'version', default: '1.0.0' })
  version!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

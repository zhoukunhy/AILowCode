import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from './entities/user.entity'

@Injectable()
export class UserInitService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.initializeDefaultAdmin()
  }

  private async initializeDefaultAdmin() {
    const existingAdmin = await this.userRepository.findOne({
      where: { username: 'admin' },
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const admin = this.userRepository.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        status: 'active',
      })

      await this.userRepository.save(admin)
      console.log('Initialized default admin user: admin/admin123')
    }
  }
}
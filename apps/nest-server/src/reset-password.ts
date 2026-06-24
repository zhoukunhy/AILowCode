import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './modules/user/entities/user.entity'
import * as bcrypt from 'bcrypt'

async function resetPassword() {
  const app = await NestFactory.createApplicationContext(AppModule)

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User))

  const admin = await userRepository.findOne({ where: { username: 'admin' } })

  if (!admin) {
    console.log('用户 admin 不存在，正在创建...')

    const hashedPassword = await bcrypt.hash('admin123', 10)

    const newAdmin = userRepository.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
    })

    await userRepository.save(newAdmin)
    console.log('✅ 用户 admin 创建成功')
    console.log('   用户名: admin')
    console.log('   密码: admin123')
  } else {
    console.log('用户 admin 已存在，正在重置密码...')

    const hashedPassword = await bcrypt.hash('admin123', 10)

    admin.password = hashedPassword
    await userRepository.save(admin)

    console.log('✅ 用户 admin 密码重置成功')
    console.log('   用户名: admin')
    console.log('   密码: admin123')
  }

  await app.close()
}

resetPassword().catch((error) => {
  console.error('重置密码失败:', error)
  process.exit(1)
})
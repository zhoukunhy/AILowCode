/**
 * 用户服务
 * 提供用户查询、更新、删除等操作
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from './entities/user.entity'
import { UpdateUserDto } from '../auth/dto/auth.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * 根据ID查询用户
   * @param id 用户ID
   * @returns 用户信息（不含密码）
   */
  async findById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    const { password, ...result } = user
    return result
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新数据
   * @returns 更新后的用户信息（不含密码）
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10)
    }

    Object.assign(user, updateUserDto)
    await this.userRepository.save(user)

    const { password, ...result } = user
    return result
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果
   */
  async remove(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    await this.userRepository.remove(user)
    return { message: '删除成功' }
  }
}
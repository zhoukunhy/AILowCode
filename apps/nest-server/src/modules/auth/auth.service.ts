import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../user/entities/user.entity'
import { LoginDto, RegisterDto } from './dto/auth.dto'

/**
 * Token 缓存键前缀
 */
const TOKEN_CACHE_PREFIX = 'auth:token:'

/**
 * Auth 服务
 * 处理用户注册、登录和 token 管理
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto) {
    const { username, password, email } = registerDto

    // 检查用户是否已存在
    const existUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    })

    if (existUser) {
      throw new UnauthorizedException('用户名或邮箱已存在')
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      email,
    })

    await this.userRepository.save(user)
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto

    // 查找用户
    const user = await this.userRepository.findOne({ where: { username } })

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误')
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new UnauthorizedException('用户已被禁用')
    }

    // 生成 JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    }
    const token = this.jwtService.sign(payload)

    // 将 token 缓存到 Redis
    const cacheKey = `${TOKEN_CACHE_PREFIX}${user.id}`
    await this.cacheManager.set(cacheKey, token, 7 * 24 * 60 * 60 * 1000) // 7天

    // 更新最后登录时间
    user.lastLoginAt = new Date()
    await this.userRepository.save(user)

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl,
      },
    }
  }

  /**
   * 验证用户（用于 JWT 策略）
   */
  async validateUser(userId: number) {
    return this.userRepository.findOne({ where: { id: userId } })
  }

  /**
   * 登出（移除 token 缓存）
   */
  async logout(userId: number) {
    const cacheKey = `${TOKEN_CACHE_PREFIX}${userId}`
    await this.cacheManager.del(cacheKey)
    return { message: '登出成功' }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    }
    const token = this.jwtService.sign(payload)

    // 更新 Redis 缓存
    const cacheKey = `${TOKEN_CACHE_PREFIX}${user.id}`
    await this.cacheManager.set(cacheKey, token, 7 * 24 * 60 * 60 * 1000)

    return { access_token: token }
  }

  /**
   * 检查 Token 是否有效（Redis 黑名单检查）
   */
  async isTokenValid(userId: number, token: string): Promise<boolean> {
    const cacheKey = `${TOKEN_CACHE_PREFIX}${userId}`
    const cachedToken = await this.cacheManager.get<string>(cacheKey)
    return cachedToken === token
  }
}

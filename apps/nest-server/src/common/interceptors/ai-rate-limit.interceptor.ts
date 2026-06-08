import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Observable } from 'rxjs'
import { User } from '../../modules/user/entities/user.entity'

/**
 * AI 调用限流拦截器
 * 限制用户的 AI 调用次数
 */
@Injectable()
export class AiRateLimitInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest()
    const userId = request.user?.userId

    if (!userId) {
      throw new HttpException('用户未登录', HttpStatus.UNAUTHORIZED)
    }

    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND)
    }

    // 检查是否超限
    if (user.aiCallCount >= user.aiCallLimit) {
      throw new HttpException(
        `AI 调用次数已达上限（${user.aiCallLimit}次），请联系管理员增加配额`,
        HttpStatus.FORBIDDEN
      )
    }

    // 增加调用计数
    user.aiCallCount += 1
    await this.userRepository.save(user)

    return next.handle()
  }
}
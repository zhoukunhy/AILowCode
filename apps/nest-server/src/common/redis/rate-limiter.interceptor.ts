/**
 * 限流拦截器
 * 自动检查请求是否超过限流阈值
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { RateLimitOptions, RATE_LIMIT_KEY } from './rate-limiter.decorator'
import { AIRateLimiter } from './rate-limiter.service'

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly aiRateLimiter: AIRateLimiter,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest()
    
    // 获取装饰器配置
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler())
    
    if (!options || options.skip) {
      return next.handle()
    }

    // 获取用户ID（从JWT token中提取）
    const userId = request.user?.id?.toString() || request.user?.sub?.toString()
    
    if (!userId) {
      // 未登录用户使用IP限流
      const ip = this.getClientIp(request)
      return this.handleRequestWithIp(ip, options, next)
    }

    // 已登录用户使用用户级别限流
    return this.handleRequestWithUser(userId, options, next)
  }

  private async handleRequestWithUser(userId: string, options: RateLimitOptions, next: CallHandler) {
    // 检查用户级别限流
    const userResult = await this.aiRateLimiter.checkUser(userId)
    
    if (!userResult.allowed) {
      throw new HttpException({
        success: false,
        code: 429,
        message: options.message || '用户AI调用次数已达上限，请稍后再试',
        retryAfter: userResult.retryAfter,
      }, HttpStatus.TOO_MANY_REQUESTS)
    }

    // 检查全局限流（如果配置了）
    if (options.globalLimit !== undefined) {
      const globalResult = await this.aiRateLimiter.checkGlobal()
      if (!globalResult.allowed) {
        throw new HttpException({
          success: false,
          code: 429,
          message: '系统AI调用次数已达上限，请稍后再试',
          retryAfter: globalResult.retryAfter,
        }, HttpStatus.TOO_MANY_REQUESTS)
      }
    }

    // 设置响应头
    const response = next.handle()
    return response
  }

  private async handleRequestWithIp(ip: string, options: RateLimitOptions, next: CallHandler) {
    // 使用IP进行限流（创建临时限流器）
    const limiter = this.aiRateLimiter.createLimiter({
      capacity: options.userLimit || 10,
      refillRate: Math.floor((options.userLimit || 10) / 60),
      tokensPerRequest: 1,
    })

    const result = await limiter.check({ ip, prefix: 'ai:ip' })
    
    if (!result.allowed) {
      throw new HttpException({
        success: false,
        code: 429,
        message: options.message || '请求过于频繁，请稍后再试',
        retryAfter: result.retryAfter,
      }, HttpStatus.TOO_MANY_REQUESTS)
    }

    return next.handle()
  }

  private getClientIp(request: any): string {
    const xForwardedFor = request.headers['x-forwarded-for']
    const xRealIp = request.headers['x-real-ip']
    
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim()
    }
    
    if (xRealIp) {
      return xRealIp.trim()
    }
    
    return request.connection?.remoteAddress || 
           request.socket?.remoteAddress || 
           request.ip || 
           'unknown'
  }
}
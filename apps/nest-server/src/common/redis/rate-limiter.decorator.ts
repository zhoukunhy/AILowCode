/**
 * 限流装饰器
 * 用于标记需要限流的API接口
 */

import { SetMetadata } from '@nestjs/common'

export interface RateLimitOptions {
  /** 用户级别限流（每秒请求数） */
  userLimit?: number
  /** 全局限流（每秒请求数） */
  globalLimit?: number
  /** 自定义错误消息 */
  message?: string
  /** 是否跳过限流 */
  skip?: boolean
}

export const RATE_LIMIT_KEY = 'rate_limit'

/**
 * 限流装饰器
 */
export function RateLimit(options: RateLimitOptions = {}) {
  return SetMetadata(RATE_LIMIT_KEY, options)
}
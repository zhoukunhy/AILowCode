/**
 * Redis 令牌桶限流服务
 * 实现 AI 调用限流，防止滥用
 */

import Redis from 'ioredis'

/**
 * 限流配置
 */
export interface RateLimitConfig {
  /** 桶容量（最大令牌数） */
  capacity: number
  /** 每秒补充令牌数 */
  refillRate: number
  /** 每次消耗令牌数 */
  tokensPerRequest: number
}

/**
 * 限流结果
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
  retryAfter?: number
}

/**
 * 限流键配置
 */
export interface RateLimitKeyConfig {
  /** 用户 ID */
  userId?: string
  /** API Key */
  apiKey?: string
  /** IP 地址 */
  ip?: string
  /** 自定义前缀 */
  prefix?: string
}

/**
 * Redis 令牌桶限流器
 */
export class TokenBucketRateLimiter {
  private redis: Redis
  private config: RateLimitConfig
  private keyPrefix: string

  constructor(redis: Redis, config: Partial<RateLimitConfig> = {}) {
    this.redis = redis
    this.config = {
      capacity: config.capacity || 100, // 默认容量 100 个令牌
      refillRate: config.refillRate || 10, // 默认每秒补充 10 个令牌
      tokensPerRequest: config.tokensPerRequest || 1, // 每次请求消耗 1 个令牌
    }
    this.keyPrefix = 'ratelimit:token_bucket:'
  }

  /**
   * 获取限流键
   */
  private getKey(config: RateLimitKeyConfig): string {
    const parts = [this.keyPrefix]

    if (config.prefix) {
      parts.push(config.prefix)
    }

    if (config.userId) {
      parts.push(`user:${config.userId}`)
    } else if (config.apiKey) {
      parts.push(`key:${config.apiKey}`)
    } else if (config.ip) {
      parts.push(`ip:${config.ip}`)
    } else {
      parts.push('default')
    }

    return parts.join(':')
  }

  /**
   * Lua 脚本：原子性获取令牌
   * 返回 [allowed, remaining, retryAfter]
   */
  private luaScript = `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local refillRate = tonumber(ARGV[2])
    local tokensPerRequest = tonumber(ARGV[3])
    local now = tonumber(ARGV[4])

    -- 获取当前状态
    local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
    local tokens = tonumber(data[1]) or capacity
    local lastRefill = tonumber(data[2]) or now

    -- 计算应该补充的令牌数
    local elapsed = now - lastRefill
    local tokensToAdd = elapsed * refillRate / 1000
    tokens = math.min(capacity, tokens + tokensToAdd)

    -- 尝试消耗令牌
    local allowed = 0
    local retryAfter = 0

    if tokens >= tokensPerRequest then
      tokens = tokens - tokensPerRequest
      allowed = 1
    else
      -- 计算需要等待多久才能获得足够令牌
      local tokensNeeded = tokensPerRequest - tokens
      retryAfter = math.ceil(tokensNeeded / refillRate * 1000)
    end

    -- 更新状态
    redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
    redis.call('EXPIRE', key, 3600) -- 1小时后自动清理

    return {allowed, math.floor(tokens), retryAfter}
  `

  /**
   * 检查是否允许请求
   */
  async check(config: RateLimitKeyConfig): Promise<RateLimitResult> {
    const key = this.getKey(config)
    const now = Date.now()

    try {
      const result = await this.redis.eval(
        this.luaScript,
        1,
        key,
        this.config.capacity,
        this.config.refillRate,
        this.config.tokensPerRequest,
        now
      ) as [number, number, number]

      const [allowed, remaining, retryAfter] = result

      return {
        allowed: allowed === 1,
        remaining,
        resetIn: Math.ceil(this.config.capacity / this.config.refillRate) * 1000,
        retryAfter: retryAfter > 0 ? retryAfter : undefined,
      }
    } catch (error) {
      console.error('[TokenBucketRateLimiter] 检查失败:', error)
      // 失败时默认允许（降级处理）
      return {
        allowed: true,
        remaining: this.config.capacity,
        resetIn: 0,
      }
    }
  }

  /**
   * 消费令牌（主动调用，扣减令牌）
   */
  async consume(config: RateLimitKeyConfig): Promise<RateLimitResult> {
    return this.check(config)
  }

  /**
   * 获取当前令牌数
   */
  async getCurrentTokens(config: RateLimitKeyConfig): Promise<number> {
    const key = this.getKey(config)
    const now = Date.now()

    try {
      const data = await this.redis.hmget(key, 'tokens', 'lastRefill')
      let tokens = parseFloat(data[0] || String(this.config.capacity))
      const lastRefill = parseFloat(data[1] || String(now))

      // 计算补充后的令牌数
      const elapsed = now - lastRefill
      const tokensToAdd = elapsed * this.config.refillRate / 1000
      tokens = Math.min(this.config.capacity, tokens + tokensToAdd)

      return Math.floor(tokens)
    } catch (error) {
      console.error('[TokenBucketRateLimiter] 获取令牌失败:', error)
      return this.config.capacity
    }
  }

  /**
   * 重置限流（管理员操作）
   */
  async reset(config: RateLimitKeyConfig): Promise<void> {
    const key = this.getKey(config)
    await this.redis.del(key)
  }

  /**
   * 重置所有限流
   */
  async resetAll(): Promise<void> {
    const pattern = `${this.keyPrefix}*`
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  /**
   * 获取配置信息
   */
  getConfig(): RateLimitConfig {
    return { ...this.config }
  }
}

/**
 * AI 调用限流器（预设配置）
 */
export class AIRateLimiter {
  private limiter: TokenBucketRateLimiter
  private userLimiters: Map<string, TokenBucketRateLimiter> = new Map()

  constructor(redis: Redis) {
    this.limiter = new TokenBucketRateLimiter(redis, {
      capacity: 100, // 全局限流：100 个令牌
      refillRate: 10, // 每秒补充 10 个
      tokensPerRequest: 1,
    })
  }

  /**
   * 检查用户是否允许调用
   */
  async checkUser(userId: string): Promise<RateLimitResult> {
    return this.limiter.check({
      userId,
      prefix: 'ai:user',
    })
  }

  /**
   * 获取用户当前剩余令牌
   */
  async getUserRemaining(userId: string): Promise<number> {
    return this.limiter.getCurrentTokens({
      userId,
      prefix: 'ai:user',
    })
  }

  /**
   * 检查 API Key 是否允许调用
   */
  async checkApiKey(apiKey: string): Promise<RateLimitResult> {
    return this.limiter.check({
      apiKey,
      prefix: 'ai:apikey',
    })
  }

  /**
   * 全局限流检查
   */
  async checkGlobal(): Promise<RateLimitResult> {
    return this.limiter.check({
      prefix: 'ai:global',
    })
  }

  /**
   * 重置用户限流
   */
  async resetUser(userId: string): Promise<void> {
    await this.limiter.reset({
      userId,
      prefix: 'ai:user',
    })
  }

  /**
   * 创建带自定义配置的限流器
   */
  createLimiter(config: RateLimitConfig): TokenBucketRateLimiter {
    return new TokenBucketRateLimiter(this.limiter['redis'] as Redis, config)
  }
}

/**
 * 创建 AI 限流器
 */
export function createAIRateLimiter(redis: Redis): AIRateLimiter {
  return new AIRateLimiter(redis)
}

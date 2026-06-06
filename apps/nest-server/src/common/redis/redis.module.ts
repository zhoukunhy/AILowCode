/**
 * Redis 缓存模块
 * 提供分布式缓存、token 存储和限流功能
 */
import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { redisStore } from 'cache-manager-redis-yet'
import { CacheModule } from '@nestjs/cache-manager'
import { CacheService } from './cache.service'
import { TokenBucketRateLimiter, AIRateLimiter } from './rate-limiter.service'

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
          },
          password: configService.get('REDIS_PASSWORD', ''),
          ttl: 7 * 24 * 60 * 60 * 1000, // 7天 token 过期时间
        })
        return {
          store,
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    CacheService,
    TokenBucketRateLimiter,
    AIRateLimiter,
  ],
  exports: [CacheModule, CacheService, TokenBucketRateLimiter, AIRateLimiter],
})
export class RedisModule {}

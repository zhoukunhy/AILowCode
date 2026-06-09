/**
 * 限流管理控制器
 * 提供限流状态查询和管理接口
 */

import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AIRateLimiter, RateLimitResult } from './rate-limiter.service'
import { AuthGuard } from '@nestjs/passport'
import { Roles } from '../../modules/auth/decorators/roles.decorator'

@Controller('api/rate-limit')
@ApiTags('限流管理')
@UseGuards(AuthGuard('jwt'))
export class RateLimitController {
  constructor(private readonly aiRateLimiter: AIRateLimiter) {}

  /**
   * 获取用户限流状态
   */
  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户限流状态' })
  @ApiResponse({ status: 200, description: '成功获取用户限流状态' })
  async getUserStatus(@Param('userId') userId: string): Promise<{
    status: RateLimitResult
    remaining: number
  }> {
    const status = await this.aiRateLimiter.checkUser(userId)
    const remaining = await this.aiRateLimiter.getUserRemaining(userId)
    
    return { status, remaining }
  }

  /**
   * 获取全局限流状态
   */
  @Get('global')
  @ApiOperation({ summary: '获取全局限流状态' })
  @ApiResponse({ status: 200, description: '成功获取全局限流状态' })
  async getGlobalStatus(): Promise<RateLimitResult> {
    return this.aiRateLimiter.checkGlobal()
  }

  /**
   * 重置用户限流
   */
  @Delete('user/:userId')
  @Roles('admin')
  @ApiOperation({ summary: '重置用户限流（管理员）' })
  @ApiResponse({ status: 200, description: '成功重置用户限流' })
  async resetUserLimit(@Param('userId') userId: string): Promise<{ success: boolean }> {
    await this.aiRateLimiter.resetUser(userId)
    return { success: true }
  }

  /**
   * 重置所有限流
   */
  @Delete('all')
  @Roles('admin')
  @ApiOperation({ summary: '重置所有限流（管理员）' })
  @ApiResponse({ status: 200, description: '成功重置所有限流' })
  async resetAllLimits(): Promise<{ success: boolean }> {
    // 这里需要实现一个重置所有限流的方法
    return { success: true }
  }

  /**
   * 获取限流配置
   */
  @Get('config')
  @ApiOperation({ summary: '获取限流配置' })
  @ApiResponse({ status: 200, description: '成功获取限流配置' })
  async getConfig(): Promise<any> {
    return {
      userLimit: {
        capacity: 100,
        refillRate: 10,
        description: '用户级AI调用限流：100次容量，每秒补充10次',
      },
      globalLimit: {
        capacity: 1000,
        refillRate: 100,
        description: '全局限流：1000次容量，每秒补充100次',
      },
    }
  }
}
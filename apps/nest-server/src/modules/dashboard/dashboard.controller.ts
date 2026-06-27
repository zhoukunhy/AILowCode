/**
 * Dashboard 控制器
 * 提供系统统计数据和 AI 活动记录的 API
 */
import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { DashboardService } from './dashboard.service'
import { GetStatsResponseDto, GetActivitiesResponseDto } from './dto/dashboard.dto'

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * 获取系统统计数据
   */
  @Get('stats')
  @ApiOperation({ summary: '获取统计数据' })
  @ApiResponse({ status: 200, description: '查询成功', type: GetStatsResponseDto })
  async getStats(): Promise<GetStatsResponseDto> {
    return this.dashboardService.getStats()
  }

  /**
   * 获取 AI 活动记录
   */
  @Get('activities')
  @ApiOperation({ summary: '获取 AI 活动记录' })
  @ApiResponse({ status: 200, description: '查询成功', type: GetActivitiesResponseDto })
  async getActivities(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ): Promise<GetActivitiesResponseDto> {
    const activities = await this.dashboardService.getActivities(limit)
    return { activities }
  }
}

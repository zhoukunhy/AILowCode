/**
 * Dashboard 模块
 * 提供系统统计数据和 AI 活动记录功能
 */
import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({
  imports: [],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

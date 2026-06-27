/**
 * Dashboard 模块
 * 提供系统统计数据和 AI 活动记录功能
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { PageEntity } from '../page/entities/page.entity'
import { UserEntity } from '../user/entities/user.entity'
import { KnowledgeEntity } from '../knowledge/entities/knowledge.entity'
import { LlmCallLogEntity } from '../logging/entities/llm-call-log.entity'
import { CodeGenerationLogEntity } from '../codegen/entities/code-generation-log.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PageEntity,
      UserEntity,
      KnowledgeEntity,
      LlmCallLogEntity,
      CodeGenerationLogEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

/**
 * Agent 模块
 * 提供 AI 生成页面的功能
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { AgentSessionEntity } from './entities/agent-session.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentSessionEntity]),
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}

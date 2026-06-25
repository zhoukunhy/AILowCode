/**
 * Agent 模块
 * 提供 AI 生成页面的功能
 * 集成 MCP 提示词管理和上下文存储能力
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { AgentSessionEntity } from './entities/agent-session.entity'
import { MCPModule } from '../../mcp/mcp.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentSessionEntity]),
    MCPModule,
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}

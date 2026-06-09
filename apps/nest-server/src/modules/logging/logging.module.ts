/**
 * 日志模块
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggingController } from './logging.controller'
import { LoggingService } from './logging.service'
import { LlmCallLogEntity } from './entities/llm-call-log.entity'
import { RagRetrievalLogEntity } from './entities/rag-retrieval-log.entity'
import { AgentSessionEntity } from '../agent/entities/agent-session.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LlmCallLogEntity,
      RagRetrievalLogEntity,
      AgentSessionEntity,
    ]),
  ],
  controllers: [LoggingController],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
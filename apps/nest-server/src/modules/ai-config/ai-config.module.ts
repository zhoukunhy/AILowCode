import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AIConfigController } from './ai-config.controller'
import { AIConfigService } from './ai-config.service'
import { AIConfigEntity } from './entities/ai-config.entity'
import { VectorStoreConfigEntity } from './entities/vector-store-config.entity'

/**
 * AI 配置模块
 * 管理 LLM 和向量库配置
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AIConfigEntity, VectorStoreConfigEntity]),
  ],
  controllers: [AIConfigController],
  providers: [AIConfigService],
  exports: [AIConfigService],
})
export class AIConfigModule {}

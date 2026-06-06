import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { KnowledgeController } from './knowledge.controller'
import { KnowledgeService } from './knowledge.service'
import { 
  KnowledgeBaseEntity, 
  KnowledgeDocumentEntity, 
  DocumentChunkEntity 
} from './entities/knowledge.entity'
import { VectorizationLogEntity } from './entities/vectorization-log.entity'

/**
 * 知识库模块
 * 提供知识库管理、文档上传、向量化、检索等功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      KnowledgeBaseEntity,
      KnowledgeDocumentEntity,
      DocumentChunkEntity,
      VectorizationLogEntity,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}

/**
 * 代码生成模块
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CodegenController } from './codegen.controller'
import { CodegenService } from './codegen.service'
import { CodeGenerationLogEntity } from './entities/code-generation-log.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([CodeGenerationLogEntity]),
  ],
  controllers: [CodegenController],
  providers: [CodegenService],
  exports: [CodegenService],
})
export class CodegenModule {}

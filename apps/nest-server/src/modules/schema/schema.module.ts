/**
 * Schema 模块
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SchemaController } from './schema.controller'
import { SchemaService } from './schema.service'
import { SchemaEntity } from './entities/schema.entity'

@Module({
  imports: [TypeOrmModule.forFeature([SchemaEntity])],
  controllers: [SchemaController],
  providers: [SchemaService],
  exports: [SchemaService],
})
export class SchemaModule {}

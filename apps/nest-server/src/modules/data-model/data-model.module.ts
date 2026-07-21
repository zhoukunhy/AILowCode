import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataModelEntity } from './entities/data-model.entity'
import { DataModelService } from './data-model.service'
import { DataModelController } from './data-model.controller'
import { TableGeneratorService } from './services/table-generator.service'
import { CrudGeneratorService } from './services/crud-generator.service'
import { SchemaImportService } from './services/schema-import.service'
import { SqlParserService } from './services/sql-parser.service'

@Module({
  imports: [TypeOrmModule.forFeature([DataModelEntity])],
  providers: [DataModelService, TableGeneratorService, CrudGeneratorService, SchemaImportService, SqlParserService],
  controllers: [DataModelController],
  exports: [DataModelService, TableGeneratorService, CrudGeneratorService, SchemaImportService, SqlParserService],
})
export class DataModelModule {}
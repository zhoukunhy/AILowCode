import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataModelEntity } from './entities/data-model.entity'
import { DataModelService } from './data-model.service'
import { DataModelController } from './data-model.controller'
import { DynamicCrudController } from './dynamic-crud.controller'
import { DynamicCrudService } from './services/dynamic-crud.service'
import { TableGeneratorService } from './services/table-generator.service'
import { CrudGeneratorService } from './services/crud-generator.service'
import { SchemaImportService } from './services/schema-import.service'
import { SqlParserService } from './services/sql-parser.service'

@Module({
  imports: [TypeOrmModule.forFeature([DataModelEntity])],
  providers: [
    DataModelService,
    DynamicCrudService,
    TableGeneratorService,
    CrudGeneratorService,
    SchemaImportService,
    SqlParserService,
  ],
  controllers: [DataModelController, DynamicCrudController],
  exports: [DataModelService, DynamicCrudService, TableGeneratorService, CrudGeneratorService, SchemaImportService, SqlParserService],
})
export class DataModelModule {}
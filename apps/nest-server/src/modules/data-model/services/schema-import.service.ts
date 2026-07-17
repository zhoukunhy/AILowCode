import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { EntityDto, RelationDto, FieldDto } from '../dto/data-model.dto'
import { createDataSourceManager, TableMetadata, ColumnMetadata } from '@ai-lowcode/datasource-core'

@Injectable()
export class SchemaImportService {
  private readonly logger = new Logger(SchemaImportService.name)
  private dataSourceManager = createDataSourceManager()

  private mapDbTypeToFieldType(dbType: string): string {
    const typeMap: Record<string, string> = {
      int: 'integer',
      tinyint: 'boolean',
      smallint: 'integer',
      mediumint: 'integer',
      bigint: 'bigint',
      float: 'float',
      double: 'double',
      decimal: 'decimal',
      numeric: 'decimal',
      char: 'string',
      varchar: 'string',
      text: 'text',
      longtext: 'text',
      mediumtext: 'text',
      tinytext: 'text',
      date: 'date',
      datetime: 'datetime',
      timestamp: 'timestamp',
      time: 'datetime',
      year: 'date',
      json: 'json',
      enum: 'select',
      set: 'select',
      binary: 'string',
      varbinary: 'string',
      blob: 'text',
      longblob: 'text',
      mediumblob: 'text',
      tinyblob: 'text',
    }

    const lowerType = dbType.toLowerCase()

    for (const [key, value] of Object.entries(typeMap)) {
      if (lowerType.startsWith(key)) {
        return value
      }
    }

    return 'string'
  }

  private getLabelFromName(name: string): string {
    const parts = name.split(/_|-/)
    return parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('')
  }

  private convertTableToEntity(table: TableMetadata): EntityDto {
    const fields: FieldDto[] = table.columns.map((col: ColumnMetadata) => {
      const fieldType = this.mapDbTypeToFieldType(col.type)
      const isPrimaryKey = table.primaryKey?.includes(col.name) || false

      return {
        id: `${table.name}-${col.name}`,
        name: col.name,
        label: this.getLabelFromName(col.name),
        type: fieldType as FieldDto['type'],
        required: !col.nullable || isPrimaryKey,
        primaryKey: isPrimaryKey,
        unique: false,
        index: false,
        defaultValue: col.defaultValue,
        validationRules: [],
        dataPermissions: [],
      }
    })

    const createdAtField = fields.some(f => f.name.toLowerCase() === 'createdat' || f.name.toLowerCase() === 'created_at')
    const updatedAtField = fields.some(f => f.name.toLowerCase() === 'updatedat' || f.name.toLowerCase() === 'updated_at')

    return {
      id: `entity-${table.name}`,
      name: this.getLabelFromName(table.name),
      tableName: table.name,
      description: `从数据库表 ${table.name} 导入`,
      fields,
      dataPermissions: [],
      softDelete: false,
      createdAtField,
      updatedAtField,
    }
  }

  private buildRelations(tables: TableMetadata[], entities: EntityDto[]): RelationDto[] {
    const relations: RelationDto[] = []
    const entityMap = new Map<string, EntityDto>()
    
    entities.forEach(entity => {
      entityMap.set(entity.tableName, entity)
    })

    for (const table of tables) {
      for (const fk of table.foreignKeys || []) {
        const sourceEntity = entityMap.get(table.name)
        const targetEntity = entityMap.get(fk.referencedTable || '')

        if (sourceEntity && targetEntity) {
          const sourceField = sourceEntity.fields.find(f => f.name === fk.column)
          const targetField = targetEntity.fields.find(f => f.name === fk.referencedColumn)

          if (sourceField && targetField) {
            relations.push({
              id: `relation-${table.name}-${fk.column}`,
              name: `${sourceEntity.name} -> ${targetEntity.name}`,
              sourceEntityId: sourceEntity.id,
              sourceFieldId: sourceField.id,
              targetEntityId: targetEntity.id,
              targetFieldId: targetField.id,
              type: 'one-to-many',
            })
          }
        }
      }
    }

    return relations
  }

  async importFromDataSource(dataSourceId: string, tableNames?: string[]): Promise<{
    entities: EntityDto[]
    relations: RelationDto[]
    modelName: string
  }> {
    this.logger.log(`开始从数据源 ${dataSourceId} 导入表结构`)

    try {
      const dataSource = this.dataSourceManager.getDataSource(dataSourceId)
      
      if (!dataSource) {
        throw new BadRequestException('数据源未注册，请先创建并测试连接')
      }

      const getAllTablesFn = (dataSource as any).getAllTableMetadata
      if (!getAllTablesFn || typeof getAllTablesFn !== 'function') {
        throw new BadRequestException('数据源不支持获取表结构')
      }

      let allTables = await getAllTablesFn.call(dataSource)

      if (tableNames && tableNames.length > 0) {
        allTables = allTables.filter((t: TableMetadata) => tableNames.includes(t.name))
      }

      if (allTables.length === 0) {
        throw new BadRequestException('未找到指定的表')
      }

      const entities = allTables.map((table: TableMetadata) => this.convertTableToEntity(table))
      const relations = this.buildRelations(allTables, entities)

      const modelName = allTables.length === 1 
        ? `${this.getLabelFromName(allTables[0].name)}模型`
        : '导入的数据模型'

      this.logger.log(`成功导入 ${entities.length} 个实体，${relations.length} 个关系`)

      return { entities, relations, modelName }
    } catch (error: any) {
      this.logger.error(`导入表结构失败: ${error.message}`)
      throw new BadRequestException(`导入表结构失败: ${error.message}`)
    }
  }
}
import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { EntityDto, RelationDto, FieldDto } from '../dto/data-model.dto'

interface ParsedTable {
  name: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    primaryKey: boolean
    unique: boolean
    defaultValue?: string
  }>
  foreignKeys: Array<{
    column: string
    referencedTable: string
    referencedColumn: string
  }>
}

@Injectable()
export class SqlParserService {
  private readonly logger = new Logger(SqlParserService.name)

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
      boolean: 'boolean',
      uuid: 'uuid',
      bit: 'boolean',
    }

    const lowerType = dbType.toLowerCase().split('(')[0].trim()

    for (const [key, value] of Object.entries(typeMap)) {
      if (lowerType.startsWith(key)) {
        return value
      }
    }

    return 'string'
  }

  private getLabelFromName(name: string): string {
    const parts = name.split(/_|-/)
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  }

  private parseCreateTable(sql: string): ParsedTable | null {
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?([^"`'\s]+)["`']?\s*\(\s*([^)]+)\s*\)/gi
    const match = createTableRegex.exec(sql)

    if (!match) {
      return null
    }

    const tableName = match[1]
    const columnsSql = match[2]

    const columns: ParsedTable['columns'] = []
    const foreignKeys: ParsedTable['foreignKeys'] = []

    const columnPattern = /(?:,\s*)?(["`']?)([a-zA-Z_][a-zA-Z0-9_]*)\1\s+(.+?)(?=,\s*["`']?[a-zA-Z_]|$)/g
    let columnMatch

    while ((columnMatch = columnPattern.exec(columnsSql)) !== null) {
      const columnName = columnMatch[2]
      const columnDef = columnMatch[3]

      const typeMatch = columnDef.match(/^([a-zA-Z]+(?:\(\d+(?:,\s*\d+)?\))?)/i)
      const dbType = typeMatch ? typeMatch[1] : 'string'

      const nullable = !/NOT\s+NULL/i.test(columnDef)
      const primaryKey = /PRIMARY\s+KEY/i.test(columnDef)
      const unique = /UNIQUE/i.test(columnDef)

      const defaultMatch = columnDef.match(/DEFAULT\s+(['"]?)([^'"\s]+)\1/i)
      const defaultValue = defaultMatch ? defaultMatch[2] : undefined

      if (!/FOREIGN\s+KEY/i.test(columnDef)) {
        columns.push({
          name: columnName,
          type: dbType,
          nullable,
          primaryKey,
          unique,
          defaultValue,
        })
      }
    }

    const fkPattern = /FOREIGN\s+KEY\s*\(\s*["`']?([^"`'\s]+)["`']?\s*\)\s*REFERENCES\s+["`']?([^"`'\s]+)["`']?\s*\(\s*["`']?([^"`'\s]+)["`']?\s*\)/gi
    let fkMatch

    while ((fkMatch = fkPattern.exec(columnsSql)) !== null) {
      foreignKeys.push({
        column: fkMatch[1],
        referencedTable: fkMatch[2],
        referencedColumn: fkMatch[3],
      })
    }

    return { name: tableName, columns, foreignKeys }
  }

  private parseSql(sql: string): ParsedTable[] {
    const tables: ParsedTable[] = []
    const createTableStatements = sql.split(';').filter(s => s.trim().toUpperCase().startsWith('CREATE TABLE'))

    for (const statement of createTableStatements) {
      const parsed = this.parseCreateTable(statement)
      if (parsed) {
        tables.push(parsed)
      }
    }

    return tables
  }

  private convertParsedTableToEntity(table: ParsedTable): EntityDto {
    const fields: FieldDto[] = table.columns.map(col => ({
      id: `${table.name}-${col.name}`,
      name: col.name,
      label: this.getLabelFromName(col.name),
      type: this.mapDbTypeToFieldType(col.type) as FieldDto['type'],
      required: !col.nullable || col.primaryKey,
      primaryKey: col.primaryKey,
      unique: col.unique,
      index: false,
      defaultValue: col.defaultValue,
      validationRules: [],
      dataPermissions: [],
    }))

    const createdAtField = fields.some(f => f.name.toLowerCase() === 'createdat' || f.name.toLowerCase() === 'created_at')
    const updatedAtField = fields.some(f => f.name.toLowerCase() === 'updatedat' || f.name.toLowerCase() === 'updated_at')

    return {
      id: `entity-${table.name}`,
      name: this.getLabelFromName(table.name),
      tableName: table.name,
      description: `从SQL解析生成: ${table.name}`,
      fields,
      dataPermissions: [],
      softDelete: false,
      createdAtField,
      updatedAtField,
    }
  }

  async parseFromSql(sql: string): Promise<{ entities: EntityDto[]; relations: RelationDto[]; modelName: string }> {
    this.logger.log('开始解析SQL语句')

    const parsedTables = this.parseSql(sql)

    if (parsedTables.length === 0) {
      throw new BadRequestException('未找到有效的CREATE TABLE语句')
    }

    const entities = parsedTables.map(table => this.convertParsedTableToEntity(table))
    const entityMap = new Map<string, EntityDto>()
    entities.forEach(e => entityMap.set(e.tableName, e))

    const relations: RelationDto[] = []
    for (const table of parsedTables) {
      for (const fk of table.foreignKeys) {
        const sourceEntity = entityMap.get(table.name)
        const targetEntity = entityMap.get(fk.referencedTable)

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

    const modelName = parsedTables.length === 1
      ? `${this.getLabelFromName(parsedTables[0].name)}模型`
      : '从SQL生成的数据模型'

    this.logger.log(`成功解析 ${parsedTables.length} 个表，生成 ${entities.length} 个实体，${relations.length} 个关系`)

    return { entities, relations, modelName }
  }
}
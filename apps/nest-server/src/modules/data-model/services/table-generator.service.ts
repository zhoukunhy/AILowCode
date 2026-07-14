import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { DataModelEntity } from '../entities/data-model.entity'

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  index: boolean
  foreignKey?: {
    tableName: string
    columnName: string
    onDelete?: string
    onUpdate?: string
  }
  defaultValue?: string | number | boolean
  length?: number
  precision?: number
  scale?: number
}

export interface TableInfo {
  name: string
  columns: ColumnInfo[]
}

export interface EntityData {
  id: string
  name: string
  tableName: string
  fields: FieldData[]
  createdAtField: boolean
  updatedAtField: boolean
  softDelete: boolean
}

export interface FieldData {
  id: string
  name: string
  type: string
  required: boolean
  primaryKey: boolean
  unique: boolean
  index: boolean
  foreignKey?: {
    entityId: string
    fieldId: string
    onDelete?: string
    onUpdate?: string
  }
  defaultValue?: string | number | boolean
  length?: number
  precision?: number
  scale?: number
}

@Injectable()
export class TableGeneratorService {
  private readonly logger = new Logger(TableGeneratorService.name)

  constructor(private dataSource: DataSource) {}

  private getDbType(): string {
    const driver = this.dataSource.driver
    return driver.options.type || 'sqlite'
  }

  private mapFieldType(fieldType: string, dbType: string): string {
    const typeMap: Record<string, Record<string, string>> = {
      sqlite: {
        string: 'VARCHAR(255)',
        text: 'TEXT',
        integer: 'INTEGER',
        bigint: 'INTEGER',
        smallint: 'INTEGER',
        decimal: 'DECIMAL',
        float: 'REAL',
        double: 'REAL',
        boolean: 'INTEGER',
        date: 'DATE',
        datetime: 'DATETIME',
        timestamp: 'TIMESTAMP',
        json: 'TEXT',
        uuid: 'TEXT',
        email: 'VARCHAR(255)',
        phone: 'VARCHAR(50)',
        password: 'VARCHAR(255)',
        select: 'VARCHAR(255)',
        textarea: 'TEXT',
        enum: 'VARCHAR(255)',
      },
      mysql: {
        string: 'VARCHAR(255)',
        text: 'TEXT',
        integer: 'INT',
        bigint: 'BIGINT',
        smallint: 'SMALLINT',
        decimal: 'DECIMAL',
        float: 'FLOAT',
        double: 'DOUBLE',
        boolean: 'TINYINT(1)',
        date: 'DATE',
        datetime: 'DATETIME',
        timestamp: 'TIMESTAMP',
        json: 'JSON',
        uuid: 'VARCHAR(36)',
        email: 'VARCHAR(255)',
        phone: 'VARCHAR(50)',
        password: 'VARCHAR(255)',
        select: 'VARCHAR(255)',
        textarea: 'TEXT',
        enum: 'ENUM',
      },
      postgres: {
        string: 'VARCHAR(255)',
        text: 'TEXT',
        integer: 'INTEGER',
        bigint: 'BIGINT',
        smallint: 'SMALLINT',
        decimal: 'DECIMAL',
        float: 'FLOAT',
        double: 'DOUBLE PRECISION',
        boolean: 'BOOLEAN',
        date: 'DATE',
        datetime: 'TIMESTAMP',
        timestamp: 'TIMESTAMP',
        json: 'JSONB',
        uuid: 'UUID',
        email: 'VARCHAR(255)',
        phone: 'VARCHAR(50)',
        password: 'VARCHAR(255)',
        select: 'VARCHAR(255)',
        textarea: 'TEXT',
        enum: 'VARCHAR(255)',
      },
    }

    return typeMap[dbType]?.[fieldType] || typeMap[dbType]?.string || 'VARCHAR(255)'
  }

  private buildColumnDefinition(column: ColumnInfo): string {
    let definition = `"${column.name}" ${column.type}`

    if (column.length && column.type.startsWith('VARCHAR')) {
      definition = `"${column.name}" VARCHAR(${column.length})`
    }

    if (column.precision && column.scale && column.type === 'DECIMAL') {
      definition = `"${column.name}" DECIMAL(${column.precision}, ${column.scale})`
    }

    if (!column.nullable) {
      definition += ' NOT NULL'
    }

    if (column.primaryKey) {
      definition += ' PRIMARY KEY'
    }

    if (column.unique && !column.primaryKey) {
      definition += ' UNIQUE'
    }

    if (column.defaultValue !== undefined) {
      if (typeof column.defaultValue === 'string') {
        definition += ` DEFAULT '${column.defaultValue}'`
      } else if (typeof column.defaultValue === 'boolean') {
        definition += ` DEFAULT ${column.defaultValue ? 1 : 0}`
      } else {
        definition += ` DEFAULT ${column.defaultValue}`
      }
    }

    return definition
  }

  private buildCreateTableSql(table: TableInfo, dbType: string): string {
    const columns = table.columns.map(col => 
      this.buildColumnDefinition(col)
    ).join(',\n    ')

    let sql = `CREATE TABLE IF NOT EXISTS "${table.name}" (\n    ${columns}`

    const foreignKeys = table.columns.filter(col => col.foreignKey)
    for (const fk of foreignKeys) {
      if (fk.foreignKey) {
        sql += `,\n    CONSTRAINT fk_${table.name}_${fk.name} FOREIGN KEY ("${fk.name}") REFERENCES "${fk.foreignKey.tableName}"("${fk.foreignKey.columnName}")`
        if (fk.foreignKey.onDelete) {
          sql += ` ON DELETE ${fk.foreignKey.onDelete}`
        }
        if (fk.foreignKey.onUpdate) {
          sql += ` ON UPDATE ${fk.foreignKey.onUpdate}`
        }
      }
    }

    sql += '\n)'

    if (dbType === 'mysql') {
      sql += ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    }

    return sql
  }

  private buildCreateIndexSql(tableName: string, columnName: string): string {
    return `CREATE INDEX IF NOT EXISTS idx_${tableName}_${columnName} ON "${tableName}"("${columnName}")`
  }

  private convertModelToTableInfo(model: DataModelEntity): TableInfo[] {
    const tables: TableInfo[] = []

    for (const entity of model.entities) {
      const columns: ColumnInfo[] = []

      for (const field of entity.fields) {
        const column: ColumnInfo = {
          name: field.name,
          type: this.mapFieldType(field.type, this.getDbType()),
          nullable: !field.required && !field.primaryKey,
          primaryKey: field.primaryKey,
          unique: field.unique,
          index: field.index,
          defaultValue: field.defaultValue,
          length: field.length,
          precision: field.precision,
          scale: field.scale,
        }

        if (field.foreignKey) {
          const targetEntity = (model.entities as EntityData[]).find((e: EntityData) => e.id === field.foreignKey!.entityId)
          if (targetEntity) {
            const targetField = targetEntity.fields.find((f: FieldData) => f.id === field.foreignKey!.fieldId)
            if (targetField) {
              column.foreignKey = {
                tableName: targetEntity.tableName,
                columnName: targetField.name,
                onDelete: field.foreignKey.onDelete,
                onUpdate: field.foreignKey.onUpdate,
              }
            }
          }
        }

        columns.push(column)
      }

      if (entity.createdAtField && !columns.find(c => c.name === 'createdAt')) {
        columns.push({
          name: 'createdAt',
          type: this.mapFieldType('datetime', this.getDbType()),
          nullable: false,
          primaryKey: false,
          unique: false,
          index: false,
        })
      }

      if (entity.updatedAtField && !columns.find(c => c.name === 'updatedAt')) {
        columns.push({
          name: 'updatedAt',
          type: this.mapFieldType('datetime', this.getDbType()),
          nullable: false,
          primaryKey: false,
          unique: false,
          index: false,
        })
      }

      if (entity.softDelete && !columns.find(c => c.name === 'deletedAt')) {
        columns.push({
          name: 'deletedAt',
          type: this.mapFieldType('datetime', this.getDbType()),
          nullable: true,
          primaryKey: false,
          unique: false,
          index: false,
        })
      }

      tables.push({
        name: entity.tableName,
        columns,
      })
    }

    return tables
  }

  async generateTables(model: DataModelEntity): Promise<{ sql: string[]; tables: TableInfo[] }> {
    const tables = this.convertModelToTableInfo(model)
    const dbType = this.getDbType()
    const sql: string[] = []

    for (const table of tables) {
      sql.push(this.buildCreateTableSql(table, dbType))
      
      for (const column of table.columns) {
        if (column.index && !column.primaryKey && !column.unique) {
          sql.push(this.buildCreateIndexSql(table.name, column.name))
        }
      }
    }

    this.logger.log(`为数据模型 ${model.name} 生成了 ${sql.length} 条SQL语句`)
    return { sql, tables }
  }

  async executeTables(model: DataModelEntity): Promise<{ success: boolean; results: Array<{ table: string; success: boolean; error?: string }> }> {
    const { sql, tables } = await this.generateTables(model)
    const results: Array<{ table: string; success: boolean; error?: string }> = []

    try {
      for (let i = 0; i < sql.length; i++) {
        const tableName = tables.find((_t, idx) => idx === Math.floor(i / (tables[i % tables.length]?.columns.length || 1)))?.name || ''
        
        try {
          await this.dataSource.query(sql[i])
          results.push({ table: tableName || 'index', success: true })
        } catch (error: any) {
          results.push({ table: tableName || 'index', success: false, error: error.message })
          this.logger.error(`执行SQL失败: ${sql[i]}`, error)
        }
      }

      const allSuccess = results.every(r => r.success)
      this.logger.log(`表创建完成，成功: ${results.filter(r => r.success).length}, 失败: ${results.filter(r => !r.success).length}`)

      return { success: allSuccess, results }
    } catch (error: any) {
      throw new BadRequestException(`执行表创建失败: ${error.message}`)
    }
  }

  async dropTables(model: DataModelEntity): Promise<{ success: boolean; results: Array<{ table: string; success: boolean; error?: string }> }> {
    const tables = this.convertModelToTableInfo(model)
    const results: Array<{ table: string; success: boolean; error?: string }> = []

    try {
      for (const table of tables) {
        try {
          await this.dataSource.query(`DROP TABLE IF EXISTS "${table.name}"`)
          results.push({ table: table.name, success: true })
        } catch (error: any) {
          results.push({ table: table.name, success: false, error: error.message })
          this.logger.error(`删除表失败: ${table.name}`, error)
        }
      }

      return { success: results.every(r => r.success), results }
    } catch (error: any) {
      throw new BadRequestException(`删除表失败: ${error.message}`)
    }
  }

  async syncTables(model: DataModelEntity): Promise<{ success: boolean; message: string }> {
    const validation = await this.validateModel(model)
    if (!validation.valid) {
      throw new BadRequestException(`数据模型验证失败: ${validation.errors.join(', ')}`)
    }

    const result = await this.executeTables(model)
    
    if (!result.success) {
      const failed = result.results.filter(r => !r.success)
      throw new BadRequestException(`部分表创建失败: ${failed.map(r => `${r.table}: ${r.error}`).join('; ')}`)
    }

    return { success: true, message: `成功创建 ${result.results.filter(r => r.success).length} 个表` }
  }

  async validateModel(model: DataModelEntity): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    const entities = model.entities as EntityData[]

    for (const entity of entities) {
      if (!entity.tableName) {
        errors.push(`实体 ${entity.name} 没有表名`)
      }

      const primaryKeys = entity.fields.filter((f: FieldData) => f.primaryKey)
      if (primaryKeys.length === 0) {
        errors.push(`实体 ${entity.name} 没有主键`)
      }

      const fieldNames = entity.fields.map((f: FieldData) => f.name)
      const duplicateNames = [...new Set(fieldNames.filter((f: string, i: number) => fieldNames.indexOf(f) !== i))]
      if (duplicateNames.length > 0) {
        errors.push(`实体 ${entity.name} 存在重复字段名: ${duplicateNames.join(', ')}`)
      }
    }

    const tableNames = entities.map((e: EntityData) => e.tableName)
    const duplicateTables = [...new Set(tableNames.filter((t: string, i: number) => tableNames.indexOf(t) !== i))]
    if (duplicateTables.length > 0) {
      errors.push(`存在重复表名: ${duplicateTables.join(', ')}`)
    }

    return { valid: errors.length === 0, errors }
  }
}
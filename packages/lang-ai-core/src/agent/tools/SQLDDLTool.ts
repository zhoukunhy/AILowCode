/**
 * SQL DDL 工具 - 自动生成 PostgreSQL 建表语句并执行
 */

import type { SQLDDLInput, SQLDDLOutput } from './ToolTypes'
import { SQLDDLInputSchema } from './ToolTypes'

/**
 * SQL DDL 工具配置
 */
export interface SQLDDLToolConfig {
  executeDDL?: (sql: string) => Promise<{ success: boolean; message: string }>
  databaseType?: 'postgresql' | 'mysql'
}

/**
 * SQL DDL 工具
 */
export class SQLDDLTool {
  name = 'SQL_DDL'
  description = '根据业务字段描述自动生成 PG 建表语句并执行建表'
  inputSchema = SQLDDLInputSchema
  private config: SQLDDLToolConfig

  constructor(config?: SQLDDLToolConfig) {
    this.config = {
      executeDDL: config?.executeDDL,
      databaseType: config?.databaseType || 'postgresql',
    }
  }

  /**
   * 生成 DDL 语句
   */
  generateDDL(input: SQLDDLInput): string {
    const { tableName, columns, indexes, ifNotExists = true } = input
    const lines: string[] = []

    // CREATE TABLE
    const ifNotExistsClause = ifNotExists ? 'IF NOT EXISTS ' : ''
    lines.push(`CREATE TABLE ${ifNotExistsClause}${tableName} (`)

    // 列定义
    const columnDefs = columns.map((col) => {
      const parts: string[] = []

      // 列名
      parts.push(`  ${col.name}`)

      // 数据类型
      parts.push(this.mapColumnType(col.type))

      // Nullable
      if (col.nullable !== true) {
        parts.push('NOT NULL')
      }

      // 主键
      if (col.primaryKey) {
        parts.push('PRIMARY KEY')
      }

      // 唯一
      if (col.unique && !col.primaryKey) {
        parts.push('UNIQUE')
      }

      // 默认值
      if (col.default !== undefined) {
        parts.push(`DEFAULT ${col.default}`)
      }

      // 外键
      if (col.references) {
        parts.push(`REFERENCES ${col.references}`)
      }

      return parts.join(' ')
    })

    lines.push(columnDefs.join(',\n'))

    // 联合主键（如果多个主键）
    const pkColumns = columns.filter(c => c.primaryKey)
    if (pkColumns.length > 1) {
      lines.push(`  ,PRIMARY KEY (${pkColumns.map(c => c.name).join(', ')})`)
    }

    // 表级约束
    const tableConstraints: string[] = []
    if (indexes) {
      for (const idx of indexes) {
        const unique = idx.unique ? 'UNIQUE ' : ''
        const cols = idx.columns.join(', ')
        tableConstraints.push(`${unique}INDEX ${idx.name} (${cols})`)
      }
    }

    if (tableConstraints.length > 0) {
      lines.push(`  ,${tableConstraints.join(',\n  ')}`)
    }

    lines.push(');')

    // 添加注释
    lines.push('')
    lines.push(`COMMENT ON TABLE ${tableName} IS 'Auto generated table';`)

    for (const col of columns) {
      if (col.description || col.name) {
        lines.push(`COMMENT ON COLUMN ${tableName}.${col.name} IS '${col.description || col.name}';`)
      }
    }

    return lines.join('\n')
  }

  /**
   * 映射数据类型
   */
  private mapColumnType(type: string): string {
    const typeMap: Record<string, string> = {
      // PostgreSQL 类型映射
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'int': 'INTEGER',
      'bigint': 'BIGINT',
      'smallint': 'SMALLINT',
      'decimal': 'DECIMAL(10,2)',
      'numeric': 'NUMERIC(10,2)',
      'float': 'REAL',
      'double': 'DOUBLE PRECISION',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'time': 'TIME',
      'timestamp': 'TIMESTAMP',
      'datetime': 'TIMESTAMP',
      'json': 'JSONB',
      'uuid': 'UUID',
      'email': 'VARCHAR(255)',
      'url': 'VARCHAR(500)',
      'phone': 'VARCHAR(20)',
      'enum': 'VARCHAR(50)',
    }

    const mapped = typeMap[type.toLowerCase()]
    return mapped || type.toUpperCase()
  }

  /**
   * 执行 DDL
   */
  async execute(input: SQLDDLInput): Promise<SQLDDLOutput> {
    const startTime = Date.now()
    const sql = this.generateDDL(input)

    console.log(`[SQLDDLTool] 生成 DDL for table: ${input.tableName}`)
    console.log(`[SQLDDLTool] SQL:\n${sql}`)

    try {
      // 如果配置了执行函数，则执行
      if (this.config.executeDDL) {
        const result = await this.config.executeDDL(sql)
        return {
          success: result.success,
          sql,
          executed: result.success,
          message: result.success ? `表 ${input.tableName} 创建成功` : result.message,
          tableName: input.tableName,
        }
      }

      // 只生成不执行
      return {
        success: true,
        sql,
        executed: false,
        message: `DDL 语句已生成，待执行建表`,
        tableName: input.tableName,
      }
    } catch (error) {
      return {
        success: false,
        sql,
        executed: false,
        message: `DDL 生成失败: ${(error as Error).message}`,
        tableName: input.tableName,
      }
    }
  }

  /**
   * 生成 ALTER TABLE 语句（添加列）
   */
  generateAlterTableAddColumns(tableName: string, newColumns: SQLDDLInput['columns']): string {
    const lines: string[] = []

    for (const col of newColumns) {
      const type = this.mapColumnType(col.type)
      const nullable = col.nullable ? '' : 'NOT NULL'
      const defaultVal = col.default ? `DEFAULT ${col.default}` : ''

      lines.push(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${type} ${nullable} ${defaultVal};`)
    }

    return lines.join('\n')
  }

  /**
   * 生成 DROP TABLE 语句
   */
  generateDropTable(tableName: string, ifExists: boolean = true): string {
    const clause = ifExists ? 'IF EXISTS ' : ''
    return `DROP TABLE ${clause}${tableName};`
  }
}

/**
 * 创建 SQL DDL 工具实例
 */
export function createSQLDDLTool(config?: SQLDDLToolConfig): SQLDDLTool {
  return new SQLDDLTool(config)
}

import { DatabaseConfig, QueryResult, FieldInfo, TableMetadata, ColumnMetadata } from './types'
import * as mysql from 'mysql2/promise'

export class MySQLDataSource {
  private config: DatabaseConfig
  private connection: mysql.Connection | null = null
  private queryCount: number = 0
  private totalQueryTime: number = 0

  constructor(config: DatabaseConfig) {
    if (config.type !== 'mysql') {
      throw new Error('MySQLDataSource 只支持 MySQL 类型')
    }
    this.config = config
  }

  async connect(): Promise<void> {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        ssl: this.config.ssl,
        connectTimeout: 10000,
      })
      console.log(`MySQL 连接成功: ${this.config.host}:${this.config.port}/${this.config.database}`)
    } catch (error: any) {
      console.error(`MySQL 连接失败: ${error.message}`)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end()
      this.connection = null
      console.log('MySQL 连接已断开')
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.connection) {
      throw new Error('数据库未连接')
    }

    const startTime = Date.now()

    try {
      const [rows, fields] = await this.connection.execute(sql, params)

      const executionTime = Date.now() - startTime
      this.queryCount++
      this.totalQueryTime += executionTime

      const fieldInfo: FieldInfo[] = (fields as mysql.FieldPacket[]).map((field) => ({
        name: field.name,
        type: field.type,
        nullable: !field.notNull,
      }))

      return {
        rows: rows as any[],
        rowCount: (rows as any[]).length,
        fields: fieldInfo,
      }
    } catch (error: any) {
      console.error(`SQL 执行失败: ${sql}`, error)
      throw error
    }
  }

  async getTables(): Promise<string[]> {
    const result = await this.query("SHOW TABLES")
    return result.rows.map((row: any) => Object.values(row)[0]) as string[]
  }

  async getTableMetadata(tableName: string): Promise<TableMetadata> {
    const result = await this.query(`DESCRIBE ${tableName}`)

    const columns: ColumnMetadata[] = result.rows.map((row: any) => ({
      name: row.Field,
      type: row.Type,
      nullable: row.Null === 'YES',
      defaultValue: row.Default,
      autoIncrement: row.Extra?.includes('auto_increment'),
    }))

    const primaryKeyResult = await this.query(
      `SHOW KEYS FROM ${tableName} WHERE Key_name = 'PRIMARY'`
    )
    const primaryKey = (primaryKeyResult.rows as any[]).map((row: any) => row.Column_name)

    const foreignKeyResult = await this.query(`
      SELECT 
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [this.config.database, tableName])

    const foreignKeys = (foreignKeyResult.rows as any[]).map((row: any) => ({
      columnName: row.COLUMN_NAME,
      referencedTableName: row.REFERENCED_TABLE_NAME,
      referencedColumnName: row.REFERENCED_COLUMN_NAME,
    }))

    return {
      name: tableName,
      columns,
      primaryKey,
      foreignKeys,
    }
  }

  async getAllTableMetadata(): Promise<TableMetadata[]> {
    const tables = await this.getTables()
    const metadata: TableMetadata[] = []
    
    for (const table of tables) {
      metadata.push(await this.getTableMetadata(table))
    }
    
    return metadata
  }

  async previewTable(tableName: string, limit: number = 10): Promise<QueryResult> {
    return this.query(`SELECT * FROM ${tableName} LIMIT ${limit}`)
  }

  isConnected(): boolean {
    return !!this.connection
  }

  getStats() {
    return {
      queryCount: this.queryCount,
      totalQueryTime: this.totalQueryTime,
      averageQueryTime: this.queryCount > 0 
        ? this.totalQueryTime / this.queryCount 
        : 0,
    }
  }
}

export function createMySQLDataSource(config: DatabaseConfig): MySQLDataSource {
  return new MySQLDataSource(config)
}
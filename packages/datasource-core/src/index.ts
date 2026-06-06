/**
 * @ai-lowcode/datasource-core
 * 数据源核心模块
 * 提供 MySQL/HTTP 数据源连接、绑定和预览功能
 */

// 类型定义
export type {
  DataSourceType,
  DatabaseConfig,
  HttpConfig,
  HttpAuthConfig,
  QueryResult,
  FieldInfo,
  DataSourceBinding,
  QueryConfig,
  PaginationConfig,
  FilterConfig,
  SortConfig,
  PreviewResult,
  DataSourceStatus,
  ConnectionStats,
  DataSourceMetadata,
  TableMetadata,
  ColumnMetadata,
  ForeignKeyMetadata,
  EndpointMetadata,
  ParameterMetadata,
} from './types'

// MySQL 数据源
export { MySQLDataSource, createMySQLDataSource } from './MySQLDataSource'

// HTTP 数据源
export { HttpDataSource, createHttpDataSource } from './HttpDataSource'

// 数据源管理器
export { DataSourceManager, createDataSourceManager } from './DataSourceManager'

// Wasm 沙盒
export { WasmSandbox, createWasmSandbox } from './WasmSandbox'
export type { PluginInstance, PluginMetadata, ComponentMetadata, PropDefinition } from './WasmSandbox'

// 旧版导出保持兼容
export type { DatabaseType } from './types'

export class DataSource {
  private config: DatabaseConfig
  private connection: any

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    console.log(`连接数据库: ${this.config.type}://${this.config.host}:${this.config.port}/${this.config.database}`)
    this.connection = true
  }

  async disconnect(): Promise<void> {
    console.log('断开数据库连接')
    this.connection = null
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.connection) {
      throw new Error('数据库未连接')
    }

    console.log(`执行查询: ${sql}`, params)
    return {
      rows: [],
      rowCount: 0,
    }
  }

  async execute(sql: string, params?: any[]): Promise<QueryResult> {
    return this.query(sql, params)
  }

  async transaction<T>(callback: (ds: DataSource) => Promise<T>): Promise<T> {
    console.log('开始事务')
    try {
      const result = await callback(this)
      console.log('提交事务')
      return result
    } catch (error) {
      console.log('回滚事务')
      throw error
    }
  }

  isConnected(): boolean {
    return !!this.connection
  }
}

export class RedisClient {
  private config: DatabaseConfig
  private client: any

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    console.log(`连接Redis: ${this.config.host}:${this.config.port}`)
    this.client = true
  }

  async disconnect(): Promise<void> {
    console.log('断开Redis连接')
    this.client = null
  }

  async get(key: string): Promise<string | null> {
    console.log(`Redis GET: ${key}`)
    return null
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    console.log(`Redis SET: ${key} = ${value}, TTL: ${ttl}`)
  }

  async del(key: string): Promise<void> {
    console.log(`Redis DEL: ${key}`)
  }

  async expire(key: string, seconds: number): Promise<void> {
    console.log(`Redis EXPIRE: ${key}, ${seconds}s`)
  }

  async acquireLock(key: string, ttl: number = 10): Promise<boolean> {
    console.log(`获取分布式锁: ${key}, TTL: ${ttl}s`)
    return true
  }

  async releaseLock(key: string): Promise<void> {
    console.log(`释放分布式锁: ${key}`)
  }
}

export function createDataSource(config: DatabaseConfig): DataSource {
  return new DataSource(config)
}

export function createRedisClient(config: DatabaseConfig): RedisClient {
  return new RedisClient(config)
}
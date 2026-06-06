/**
 * 数据源类型定义
 */

/**
 * 数据源类型枚举
 */
export type DataSourceType = 
  | 'mysql'
  | 'postgres'
  | 'mongodb'
  | 'redis'
  | 'http'
  | 'rest'
  | 'graphql'

/**
 * 数据库配置
 */
export interface DatabaseConfig {
  type: 'mysql' | 'postgres' | 'mongodb' | 'redis'
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl?: boolean
  poolSize?: number
  connectionTimeout?: number
}

/**
 * HTTP 数据源配置
 */
export interface HttpConfig {
  type: 'http' | 'rest' | 'graphql'
  baseUrl: string
  headers?: Record<string, string>
  auth?: HttpAuthConfig
  timeout?: number
}

/**
 * HTTP 认证配置
 */
export interface HttpAuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'apiKey'
  username?: string
  password?: string
  token?: string
  apiKey?: string
  apiKeyHeader?: string
}

/**
 * 查询结果
 */
export interface QueryResult {
  rows: any[]
  rowCount: number
  fields?: FieldInfo[]
  error?: string
}

/**
 * 字段信息
 */
export interface FieldInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
}

/**
 * 数据源绑定信息
 */
export interface DataSourceBinding {
  id: string
  dataSourceId: string
  componentId: string
  fieldMapping: Record<string, string>
  queryConfig: QueryConfig
}

/**
 * 查询配置
 */
export interface QueryConfig {
  type: 'table' | 'query' | 'endpoint'
  tableName?: string
  query?: string
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, any>
  body?: any
  pagination?: PaginationConfig
  filters?: FilterConfig[]
  sort?: SortConfig[]
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  page: number
  pageSize: number
  total?: number
}

/**
 * 过滤配置
 */
export interface FilterConfig {
  field: string
  operator: '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN'
  value: any
}

/**
 * 排序配置
 */
export interface SortConfig {
  field: string
  direction: 'ASC' | 'DESC'
}

/**
 * 预览数据结果
 */
export interface PreviewResult {
  success: boolean
  data: any[]
  total: number
  fields?: FieldInfo[]
  error?: string
  executionTime: number
}

/**
 * 数据源状态
 */
export interface DataSourceStatus {
  connected: boolean
  lastConnected?: Date
  error?: string
  stats?: ConnectionStats
}

/**
 * 连接统计
 */
export interface ConnectionStats {
  queryCount: number
  totalQueryTime: number
  averageQueryTime: number
}

/**
 * 数据源元数据
 */
export interface DataSourceMetadata {
  name: string
  type: DataSourceType
  tables?: TableMetadata[]
  endpoints?: EndpointMetadata[]
}

/**
 * 表元数据
 */
export interface TableMetadata {
  name: string
  columns: ColumnMetadata[]
  primaryKey?: string[]
  foreignKeys?: ForeignKeyMetadata[]
}

/**
 * 列元数据
 */
export interface ColumnMetadata {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
  autoIncrement?: boolean
}

/**
 * 外键元数据
 */
export interface ForeignKeyMetadata {
  column: string
  referencedTable: string
  referencedColumn: string
}

/**
 * API 端点元数据
 */
export interface EndpointMetadata {
  path: string
  method: string
  description?: string
  parameters?: ParameterMetadata[]
  response?: any
}

/**
 * 参数元数据
 */
export interface ParameterMetadata {
  name: string
  type: string
  required: boolean
  location: 'query' | 'path' | 'body'
}

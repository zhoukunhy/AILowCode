/**
 * 数据源类型定义
 * 定义数据源系统中所有核心接口和类型
 */

/**
 * 数据源类型枚举
 * 支持的数据源类型，包括关系型数据库、NoSQL、缓存、HTTP API 等
 */
export type DataSourceType = 
  | 'mysql'      // MySQL 关系型数据库
  | 'postgres'   // PostgreSQL 关系型数据库
  | 'mongodb'    // MongoDB 文档数据库
  | 'redis'      // Redis 键值缓存
  | 'http'       // HTTP 通用接口
  | 'rest'       // RESTful API
  | 'graphql'    // GraphQL API

/**
 * 数据库配置接口
 * 定义关系型数据库和 NoSQL 数据库的连接配置
 */
export interface DatabaseConfig {
  type: 'mysql' | 'postgres' | 'mongodb' | 'redis' // 数据库类型
  host: string          // 数据库主机地址
  port: number          // 数据库端口
  username: string      // 用户名
  password: string      // 密码
  database: string      // 数据库名称
  ssl?: boolean        // 是否启用 SSL 连接
  poolSize?: number    // 连接池大小
  connectionTimeout?: number  // 连接超时时间（毫秒）
}

/**
 * HTTP 数据源配置接口
 * 定义 HTTP API 数据源的连接配置
 */
export interface HttpConfig {
  type: 'http' | 'rest' | 'graphql'  // HTTP 接口类型
  baseUrl: string                    // 基础 URL
  headers?: Record<string, string>   // 自定义请求头
  auth?: HttpAuthConfig             // 认证配置
  timeout?: number                   // 请求超时时间（毫秒）
}

/**
 * HTTP 认证配置接口
 * 定义各种 HTTP 认证方式
 */
export interface HttpAuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'apiKey'  // 认证类型
  username?: string        // Basic 认证用户名
  password?: string        // Basic 认证密码
  token?: string          // Bearer Token
  apiKey?: string         // API Key
  apiKeyHeader?: string   // API Key 请求头名称
}

/**
 * 查询结果接口
 * 定义数据库查询或 API 调用的返回结果
 */
export interface QueryResult {
  rows: any[]              // 查询结果行
  rowCount: number        // 结果行数
  fields?: FieldInfo[]    // 字段信息
  error?: string          // 错误信息
}

/**
 * 字段信息接口
 * 定义查询结果中字段的详细信息
 */
export interface FieldInfo {
  name: string            // 字段名称
  type: string            // 字段类型
  nullable: boolean       // 是否可为空
  defaultValue?: any      // 默认值
}

/**
 * 数据源绑定信息接口
 * 定义数据源与组件之间的绑定关系
 */
export interface DataSourceBinding {
  id: string                          // 绑定唯一 ID
  dataSourceId: string                // 数据源 ID
  componentId: string                 // 组件 ID
  fieldMapping: Record<string, string> // 字段映射关系（数据源字段 -> 组件属性）
  queryConfig: QueryConfig            // 查询配置
}

/**
 * 查询配置接口
 * 定义数据查询的具体配置
 */
export interface QueryConfig {
  type: 'table' | 'query' | 'endpoint'  // 查询类型
  tableName?: string                    // 表名（table 类型）
  query?: string                        // SQL 查询语句（query 类型）
  endpoint?: string                     // API 端点路径（endpoint 类型）
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' // HTTP 方法
  params?: Record<string, any>          // URL 参数
  body?: any                            // 请求体
  pagination?: PaginationConfig         // 分页配置
  filters?: FilterConfig[]              // 过滤条件
  sort?: SortConfig[]                   // 排序条件
}

/**
 * 分页配置接口
 * 定义分页查询的参数
 */
export interface PaginationConfig {
  page: number              // 当前页码
  pageSize: number         // 每页大小
  total?: number          // 总记录数（可选，用于前端分页）
}

/**
 * 过滤配置接口
 * 定义数据过滤条件
 */
export interface FilterConfig {
  field: string            // 字段名
  operator: '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN'  // 比较操作符
  value: any              // 比较值
}

/**
 * 排序配置接口
 * 定义数据排序规则
 */
export interface SortConfig {
  field: string            // 字段名
  direction: 'ASC' | 'DESC'  // 排序方向（升序/降序）
}

/**
 * 预览数据结果接口
 * 定义数据预览功能的返回结果
 */
export interface PreviewResult {
  success: boolean        // 是否成功
  data: any[]            // 预览数据
  total: number          // 数据总数
  fields?: FieldInfo[]   // 字段信息
  error?: string         // 错误信息
  executionTime: number  // 执行时间（毫秒）
}

/**
 * 数据源状态接口
 * 定义数据源的连接状态和统计信息
 */
export interface DataSourceStatus {
  connected: boolean           // 是否已连接
  lastConnected?: Date        // 最后连接时间
  error?: string              // 错误信息
  stats?: ConnectionStats     // 连接统计信息
}

/**
 * 连接统计接口
 * 定义数据源连接的统计信息
 */
export interface ConnectionStats {
  queryCount: number          // 查询次数
  totalQueryTime: number      // 总查询时间（毫秒）
  averageQueryTime: number    // 平均查询时间（毫秒）
}

/**
 * 数据源元数据接口
 * 定义数据源的元数据信息，包括表结构、API 端点等
 */
export interface DataSourceMetadata {
  name: string                // 数据源名称
  type: DataSourceType        // 数据源类型
  tables?: TableMetadata[]    // 表元数据（数据库类型）
  endpoints?: EndpointMetadata[]  // API 端点元数据（HTTP 类型）
}

/**
 * 表元数据接口
 * 定义数据库表的元数据信息
 */
export interface TableMetadata {
  name: string                      // 表名
  columns: ColumnMetadata[]         // 列元数据
  primaryKey?: string[]             // 主键字段列表
  foreignKeys?: ForeignKeyMetadata[] // 外键关系列表
}

/**
 * 列元数据接口
 * 定义表列的元数据信息
 */
export interface ColumnMetadata {
  name: string              // 列名
  type: string              // 数据类型
  nullable: boolean         // 是否可为空
  defaultValue?: any        // 默认值
  autoIncrement?: boolean   // 是否自增
}

/**
 * 外键元数据接口
 * 定义外键关系的信息
 */
export interface ForeignKeyMetadata {
  column: string              // 本表列名
  referencedTable: string     // 引用表名
  referencedColumn: string    // 引用列名
}

/**
 * API 端点元数据接口
 * 定义 HTTP API 端点的元数据信息
 */
export interface EndpointMetadata {
  path: string                        // 端点路径
  method: string                      // HTTP 方法
  description?: string                // 端点描述
  parameters?: ParameterMetadata[]    // 参数元数据
  response?: any                      // 响应示例
}

/**
 * 参数元数据接口
 * 定义 API 参数的元数据信息
 */
export interface ParameterMetadata {
  name: string                  // 参数名称
  type: string                  // 参数类型
  required: boolean             // 是否必填
  location: 'query' | 'path' | 'body'  // 参数位置
}

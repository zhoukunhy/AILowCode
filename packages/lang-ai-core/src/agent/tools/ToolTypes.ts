/**
 * LangGraph 工具调用 Agent - 三大内置工具
 * SQL_DDL / Nest_Crud / Http_Test
 */

import type { z } from 'zod'

// ==================== 工具输入/输出 Schema ====================

/**
 * SQL DDL 工具 Schema
 */
export const SQLDDLInputSchema = z.object({
  tableName: z.string().describe('表名'),
  columns: z.array(
    z.object({
      name: z.string().describe('列名'),
      type: z.string().describe('数据类型'),
      nullable: z.boolean().optional().describe('是否可空'),
      primaryKey: z.boolean().optional().describe('是否主键'),
      unique: z.boolean().optional().describe('是否唯一'),
      default: z.string().optional().describe('默认值'),
      references: z.string().optional().describe('外键引用'),
    })
  ).describe('列定义'),
  indexes: z.array(z.object({
    name: z.string(),
    columns: z.array(z.string()),
    unique: z.boolean().optional(),
  })).optional().describe('索引定义'),
  ifNotExists: z.boolean().optional().describe('IF NOT EXISTS'),
})

export type SQLDDLInput = z.infer<typeof SQLDDLInputSchema>

export interface SQLDDLOutput {
  success: boolean
  sql: string
  executed: boolean
  message: string
  tableName: string
}

/**
 * Nest CRUD 工具 Schema
 */
export const NestCrudInputSchema = z.object({
  entityName: z.string().describe('实体名称'),
  tableName: z.string().describe('表名'),
  columns: z.array(
    z.object({
      name: z.string().describe('列名'),
      type: z.string().describe('TypeScript类型'),
      columnType: z.string().optional().describe('数据库列类型'),
      nullable: z.boolean().optional(),
      primaryKey: z.boolean().optional(),
    })
  ).describe('字段定义'),
  moduleName: z.string().optional().describe('所属模块名'),
  generateService: z.boolean().optional().describe('是否生成Service'),
  generateController: z.boolean().optional().describe('是否生成Controller'),
  generateDTOs: z.boolean().optional().describe('是否生成DTOs'),
  swagger: z.boolean().optional().describe('是否添加Swagger装饰器'),
})

export type NestCrudInput = z.infer<typeof NestCrudInputSchema>

export interface NestCrudOutput {
  success: boolean
  files: GeneratedCodeFile[]
  message: string
}

export interface GeneratedCodeFile {
  path: string
  content: string
  language: 'typescript'
  type: 'entity' | 'dto' | 'service' | 'controller' | 'module'
}

/**
 * HTTP Test 工具 Schema
 */
export const HttpTestInputSchema = z.object({
  url: z.string().describe('请求URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).describe('HTTP方法'),
  headers: z.record(z.string()).optional().describe('请求头'),
  body: z.any().optional().describe('请求体'),
  params: z.record(z.string()).optional().describe('查询参数'),
  timeout: z.number().optional().describe('超时时间(ms)'),
  expectedStatus: z.number().optional().describe('期望状态码'),
})

export type HttpTestInput = z.infer<typeof HttpTestInputSchema>

export interface HttpTestOutput {
  success: boolean
  statusCode: number
  statusText: string
  headers: Record<string, string>
  body: any
  duration: number
  message: string
  errors?: string[]
}

// ==================== 工具接口定义 ====================

/**
 * 工具接口
 */
export interface Tool<TInput = any, TOutput = any> {
  name: string
  description: string
  inputSchema: z.ZodType<TInput>
  execute(input: TInput): Promise<TOutput>
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  toolName: string
  success: boolean
  output: any
  error?: string
  duration: number
}

/**
 * 工具调用决策
 */
export interface ToolCallDecision {
  shouldCallTool: boolean
  toolName?: string
  reasoning?: string
  confidence?: number
}

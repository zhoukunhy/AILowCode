/**
 * 工具调用 Agent - 协调三大内置工具
 * SQL_DDL / Nest_Crud / Http_Test
 */

import type {
  Tool,
  ToolExecutionResult,
  ToolCallDecision,
  SQLDDLInput,
  SQLDDLOutput,
  NestCrudInput,
  NestCrudOutput,
  HttpTestInput,
  HttpTestOutput,
} from './ToolTypes'
import { SQLDDLTool, createSQLDDLTool } from './SQLDDLTool'
import { NestCrudTool, createNestCrudTool } from './NestCrudTool'
import { HttpTestTool, createHttpTestTool } from './HttpTestTool'

/**
 * 工具调用 Agent 状态
 */
export interface ToolCallingAgentState {
  userInput: string
  entities: EntityDefinition[]
  selectedTools: string[]
  executions: ToolExecutionResult[]
  currentNode: 'analyze' | 'plan' | 'execute' | 'complete' | 'failed'
  status: 'running' | 'completed' | 'failed'
  error?: string
  output?: ToolOutput
}

/**
 * 实体定义
 */
export interface EntityDefinition {
  name: string
  tableName: string
  columns: ColumnDefinition[]
}

export interface ColumnDefinition {
  name: string
  type: string
  description?: string
  nullable?: boolean
  primaryKey?: boolean
  unique?: boolean
  default?: string
  references?: string
}

/**
 * 工具输出
 */
export interface ToolOutput {
  ddlResult?: SQLDDLOutput
  crudResults?: NestCrudOutput
  testResults?: HttpTestOutput[]
  summary: string
}

/**
 * 工具调用 Agent 配置
 */
export interface ToolCallingAgentConfig {
  sqlDDLTool?: SQLDDLTool
  nestCrudTool?: NestCrudTool
  httpTestTool?: HttpTestTool
  maxRetries?: number
}

/**
 * 工具调用 Agent
 */
export class ToolCallingAgent {
  private tools: Map<string, Tool>
  private config: ToolCallingAgentConfig

  constructor(config?: ToolCallingAgentConfig) {
    this.config = {
      maxRetries: config?.maxRetries || 3,
    }

    // 初始化工具
    this.tools = new Map()
    const sqlTool = config?.sqlDDLTool || createSQLDDLTool()
    const crudTool = config?.nestCrudTool || createNestCrudTool()
    const httpTool = config?.httpTestTool || createHttpTestTool()

    this.tools.set(sqlTool.name, sqlTool)
    this.tools.set(crudTool.name, crudTool)
    this.tools.set(httpTool.name, httpTool)
  }

  /**
   * 获取所有可用工具
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * 获取工具
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  /**
   * 注册工具
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  /**
   * 决策使用哪个工具
   */
  async decideTool(userInput: string, entities: EntityDefinition[]): Promise<ToolCallDecision> {
    const input = userInput.toLowerCase()

    // 关键词匹配决策
    if (input.includes('建表') || input.includes('create table') || input.includes('ddl')) {
      return {
        shouldCallTool: true,
        toolName: 'SQL_DDL',
        reasoning: '用户请求创建数据库表',
        confidence: 0.9,
      }
    }

    if (input.includes('接口') || input.includes('crud') || input.includes('nest') || input.includes('controller') || input.includes('service')) {
      return {
        shouldCallTool: true,
        toolName: 'Nest_Crud',
        reasoning: '用户请求生成 NestJS CRUD 代码',
        confidence: 0.85,
      }
    }

    if (input.includes('测试') || input.includes('test') || input.includes('连通') || input.includes('校验')) {
      return {
        shouldCallTool: true,
        toolName: 'Http_Test',
        reasoning: '用户请求测试 HTTP 接口',
        confidence: 0.9,
      }
    }

    // 如果有实体定义且用户想要生成代码，自动选择 Nest_Crud
    if (entities.length > 0 && (input.includes('生成') || input.includes('创建'))) {
      return {
        shouldCallTool: true,
        toolName: 'Nest_Crud',
        reasoning: '根据实体定义生成 CRUD 代码',
        confidence: 0.8,
      }
    }

    return {
      shouldCallTool: false,
      reasoning: '无法确定需要调用的工具',
      confidence: 0,
    }
  }

  /**
   * 执行工具
   */
  async executeTool(toolName: string, input: any): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolName)
    if (!tool) {
      return {
        toolName,
        success: false,
        output: null,
        error: `Tool ${toolName} not found`,
        duration: 0,
      }
    }

    const startTime = Date.now()
    console.log(`[ToolCallingAgent] 执行工具: ${toolName}`)

    try {
      const output = await tool.execute(input)
      return {
        toolName,
        success: true,
        output,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      console.error(`[ToolCallingAgent] 工具执行失败: ${toolName}`, error)
      return {
        toolName,
        success: false,
        output: null,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * 执行完整流程
   */
  async execute(userInput: string, entities: EntityDefinition[]): Promise<ToolOutput> {
    console.log('[ToolCallingAgent] 开始执行流程')

    // 1. 决策使用哪个工具
    const decision = await this.decideTool(userInput, entities)
    console.log(`[ToolCallingAgent] 决策结果:`, decision)

    if (!decision.shouldCallTool || !decision.toolName) {
      throw new Error('无法确定需要调用的工具')
    }

    // 2. 根据工具类型准备输入
    let toolInput: any
    let toolName = decision.toolName

    if (toolName === 'SQL_DDL' && entities.length > 0) {
      toolInput = this.prepareDDLInput(entities[0])
    } else if (toolName === 'Nest_Crud' && entities.length > 0) {
      toolInput = this.prepareCrudInput(entities[0])
    } else if (toolName === 'Http_Test') {
      toolInput = this.prepareHttpTestInput(userInput)
    } else {
      throw new Error(`未知工具或缺少实体定义: ${toolName}`)
    }

    // 3. 执行工具
    const result = await this.executeTool(toolName, toolInput)

    if (!result.success) {
      throw new Error(`工具执行失败: ${result.error}`)
    }

    // 4. 构建输出
    const output: ToolOutput = {
      summary: `成功执行 ${toolName}`,
    }

    if (result.toolName === 'SQL_DDL') {
      output.ddlResult = result.output as SQLDDLOutput
      output.summary = `成功生成 DDL: ${output.ddlResult.tableName}`
    } else if (result.toolName === 'Nest_Crud') {
      output.crudResults = result.output as NestCrudOutput
      output.summary = `成功生成 ${output.crudResults.files.length} 个 CRUD 文件`
    } else if (result.toolName === 'Http_Test') {
      output.testResults = [result.output as HttpTestOutput]
      output.summary = `接口测试 ${output.testResults[0].success ? '成功' : '失败'}`
    }

    console.log(`[ToolCallingAgent] 执行完成: ${output.summary}`)

    return output
  }

  /**
   * 准备 DDL 输入
   */
  private prepareDDLInput(entity: EntityDefinition): SQLDDLInput {
    return {
      tableName: entity.tableName || this.toSnakeCase(entity.name),
      columns: entity.columns.map(col => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable ?? true,
        primaryKey: col.primaryKey ?? false,
        unique: col.unique ?? false,
        default: col.default,
        references: col.references,
      })),
      ifNotExists: true,
    }
  }

  /**
   * 准备 CRUD 输入
   */
  private prepareCrudInput(entity: EntityDefinition): NestCrudInput {
    return {
      entityName: entity.name,
      tableName: entity.tableName || this.toSnakeCase(entity.name),
      columns: entity.columns.map(col => ({
        name: col.name,
        type: col.type,
        columnType: col.type,
        nullable: col.nullable,
        primaryKey: col.primaryKey,
      })),
      generateService: true,
      generateController: true,
      generateDTOs: true,
      swagger: true,
    }
  }

  /**
   * 准备 HTTP 测试输入
   */
  private prepareHttpTestInput(userInput: string): HttpTestInput {
    // 从用户输入中解析 URL 和方法
    const methodMatch = userInput.match(/\b(GET|POST|PUT|DELETE|PATCH)\b/i)
    const method = methodMatch ? methodMatch[1].toUpperCase() as HttpTestInput['method'] : 'GET'

    // 简单提取 URL（实际应用中需要更复杂的解析）
    const urlMatch = userInput.match(/https?:\/\/[^\s]+/)
    const url = urlMatch ? urlMatch[0] : 'http://localhost:3000'

    return {
      url,
      method,
      expectedStatus: 200,
    }
  }

  /**
   * 批量执行工具
   */
  async executeBatch(requests: Array<{ toolName: string; input: any }>): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = []

    for (const { toolName, input } of requests) {
      const result = await this.executeTool(toolName, input)
      results.push(result)
    }

    return results
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
  }
}

/**
 * 创建工具调用 Agent
 */
export function createToolCallingAgent(config?: ToolCallingAgentConfig): ToolCallingAgent {
  return new ToolCallingAgent(config)
}

/**
 * 工具调用 Agent - 协调三大内置工具
 * SQL_DDL / Nest_Crud / Http_Test
 * 支持全链路自动化：建表 → CRUD接口生成 → 前端组件绑定
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
  componentSchema?: ComponentBindingSchema
  summary: string
}

/**
 * 组件绑定Schema
 */
export interface ComponentBindingSchema {
  componentType: string
  dataSourceId: string
  apiEndpoint: string
  fields: Array<{
    fieldName: string
    dataField: string
    displayName?: string
  }>
}

/**
 * 工具调用 Agent 配置
 */
export interface ToolCallingAgentConfig {
  sqlDDLTool?: SQLDDLTool
  nestCrudTool?: NestCrudTool
  httpTestTool?: HttpTestTool
  maxRetries?: number
  databaseConfig?: DatabaseConfig
}

export interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  type: 'postgresql' | 'mysql'
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
      ...config,
    }

    // 初始化工具
    this.tools = new Map()
    const sqlTool = config?.sqlDDLTool || createSQLDDLTool({
      databaseType: config?.databaseConfig?.type || 'postgresql',
    })
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
    const toolName = decision.toolName

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
   * 全链路自动化执行：建表 → CRUD接口生成 → 组件绑定
   */
  async executeFullPipeline(userInput: string, entities: EntityDefinition[]): Promise<ToolOutput> {
    console.log('[ToolCallingAgent] 开始全链路自动化流程')

    const output: ToolOutput = {
      summary: '',
      executions: [] as any,
    }

    if (entities.length === 0) {
      throw new Error('请先定义实体')
    }

    const entity = entities[0]
    const executionSteps: ToolExecutionResult[] = []

    try {
      // ============= 第一步：生成DDL并建表 =============
      console.log('[ToolCallingAgent] 步骤1: 生成DDL并建表')
      const ddlInput = this.prepareDDLInput(entity)
      const ddlResult = await this.executeTool('SQL_DDL', ddlInput)
      executionSteps.push(ddlResult)

      if (!ddlResult.success) {
        throw new Error(`DDL执行失败: ${ddlResult.error}`)
      }

      output.ddlResult = ddlResult.output as SQLDDLOutput

      // ============= 第二步：生成CRUD接口 =============
      console.log('[ToolCallingAgent] 步骤2: 生成CRUD接口')
      const crudInput = this.prepareCrudInput(entity)
      const crudResult = await this.executeTool('Nest_Crud', crudInput)
      executionSteps.push(crudResult)

      if (!crudResult.success) {
        throw new Error(`CRUD生成失败: ${crudResult.error}`)
      }

      output.crudResults = crudResult.output as NestCrudOutput

      // ============= 第三步：生成组件绑定Schema =============
      console.log('[ToolCallingAgent] 步骤3: 生成组件绑定Schema')
      const componentSchema = this.generateComponentBindingSchema(entity)
      output.componentSchema = componentSchema

      // ============= 第四步：测试接口（可选）=============
      console.log('[ToolCallingAgent] 步骤4: 测试CRUD接口')
      const testResults = await this.testCrudEndpoints(entity)
      output.testResults = testResults

      // 构建摘要
      const successfulSteps = executionSteps.filter(e => e.success).length
      output.summary = `全链路自动化完成！\n` +
        `- DDL建表: ${output.ddlResult?.success ? '成功' : '失败'}\n` +
        `- CRUD接口生成: ${output.crudResults?.files.length || 0} 个文件\n` +
        `- 接口测试: ${testResults.filter(t => t.success).length}/${testResults.length} 通过\n` +
        `- 组件绑定Schema已生成`

      console.log(`[ToolCallingAgent] 全链路流程完成: ${output.summary}`)

    } catch (error) {
      console.error('[ToolCallingAgent] 全链路流程失败:', error)
      output.error = (error as Error).message
      output.summary = `全链路流程失败: ${(error as Error).message}`
    }

    return output
  }

  /**
   * 测试CRUD接口
   */
  async testCrudEndpoints(entity: EntityDefinition): Promise<HttpTestOutput[]> {
    const httpTool = this.tools.get('Http_Test') as HttpTestTool
    if (!httpTool) {
      console.warn('[ToolCallingAgent] HttpTestTool not available, skipping tests')
      return []
    }

    const kebabName = this.toKebabCase(entity.name)
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000'

    const tests: HttpTestInput[] = [
      {
        url: `${baseUrl}/${kebabName}`,
        method: 'GET',
        expectedStatus: 200,
      },
      {
        url: `${baseUrl}/${kebabName}`,
        method: 'POST',
        body: this.generateTestData(entity),
        expectedStatus: 201,
      },
    ]

    const results: HttpTestOutput[] = []
    for (const test of tests) {
      try {
        const result = await httpTool.execute(test)
        results.push(result)
      } catch {
        results.push({
          success: false,
          statusCode: 0,
          statusText: 'Error',
          headers: {},
          body: null,
          duration: 0,
          message: '测试失败',
        })
      }
    }

    return results
  }

  /**
   * 生成组件绑定Schema
   */
  private generateComponentBindingSchema(entity: EntityDefinition): ComponentBindingSchema {
    const kebabName = this.toKebabCase(entity.name)
    
    return {
      componentType: 'Table',
      dataSourceId: `api_${entity.name.toLowerCase()}`,
      apiEndpoint: `/api/${kebabName}`,
      fields: entity.columns.map(col => ({
        fieldName: col.name,
        dataField: col.name,
        displayName: col.description || col.name,
      })),
    }
  }

  /**
   * 生成测试数据
   */
  private generateTestData(entity: EntityDefinition): Record<string, any> {
    const data: Record<string, any> = {}
    
    for (const col of entity.columns) {
      if (col.primaryKey) continue
      
      data[col.name] = this.generateTestValue(col.type)
    }
    
    return data
  }

  /**
   * 根据类型生成测试值
   */
  private generateTestValue(type: string): any {
    const lowerType = type.toLowerCase()
    
    if (lowerType.includes('int') || lowerType.includes('number') || lowerType.includes('decimal') || lowerType.includes('float')) {
      return Math.floor(Math.random() * 100)
    }
    
    if (lowerType.includes('string') || lowerType.includes('text') || lowerType.includes('email') || lowerType.includes('url')) {
      return `test_${Math.random().toString(36).substr(2, 9)}`
    }
    
    if (lowerType.includes('boolean')) {
      return Math.random() > 0.5
    }
    
    if (lowerType.includes('date') || lowerType.includes('time') || lowerType.includes('timestamp')) {
      return new Date().toISOString()
    }
    
    return `value_${Math.random().toString(36).substr(2, 9)}`
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
    const methodMatch = userInput.match(/\b(GET|POST|PUT|DELETE|PATCH)\b/i)
    const method = methodMatch ? methodMatch[1].toUpperCase() as HttpTestInput['method'] : 'GET'

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

  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  }
}

/**
 * 创建工具调用 Agent
 */
export function createToolCallingAgent(config?: ToolCallingAgentConfig): ToolCallingAgent {
  return new ToolCallingAgent(config)
}
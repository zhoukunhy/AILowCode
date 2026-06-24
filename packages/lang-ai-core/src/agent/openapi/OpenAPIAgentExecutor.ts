/**
 * LangGraph OpenAPI Agent - 解析 OpenAPI 文档并生成画布页面和数据源配置
 */

import type {
  OpenAPIDocument,
  ParsedEndpoint,
  DataSourceConfig,
  GeneratedPageConfig,
  GeneratedComponent,
} from './OpenAPITypes'
import { OpenAPIParser } from './OpenAPIParser'

/**
 * OpenAPI Agent 状态
 */
export interface OpenAPIAgentState {
  document?: OpenAPIDocument
  endpoints: ParsedEndpoint[]
  dataSources: DataSourceConfig[]
  pages: GeneratedPageConfig[]
  currentNode: string
  status: 'running' | 'completed' | 'failed'
  error?: string
}

/**
 * OpenAPI Agent 配置
 */
export interface OpenAPIAgentConfig {
  defaultBaseUrl?: string
  defaultAuthType?: 'none' | 'basic' | 'bearer' | 'apiKey'
  defaultAuthConfig?: Record<string, string>
}

/**
 * 解析节点 - 解析 OpenAPI 文档
 */
export function createParseNode(parser: OpenAPIParser) {
  return async (state: OpenAPIAgentState): Promise<Partial<OpenAPIAgentState>> => {
    console.log('[OpenAPIAgent] 执行解析节点')

    if (!state.document) {
      return {
        status: 'failed',
        error: '缺少 OpenAPI 文档',
        currentNode: 'end',
      }
    }

    try {
      const endpoints = parser.parse(state.document)
      console.log(`[OpenAPIAgent] 解析完成，共 ${endpoints.length} 个接口`)

      return {
        endpoints,
        currentNode: 'generate_datasource',
      }
    } catch (error) {
      return {
        status: 'failed',
        error: (error as Error).message,
        currentNode: 'end',
      }
    }
  }
}

/**
 * 生成数据源配置节点
 */
export function createGenerateDataSourceNode(config: OpenAPIAgentConfig) {
  return async (state: OpenAPIAgentState): Promise<Partial<OpenAPIAgentState>> => {
    console.log('[OpenAPIAgent] 执行数据源生成节点')

    if (state.endpoints.length === 0) {
      return {
        status: 'failed',
        error: '没有可处理的接口',
        currentNode: 'end',
      }
    }

    try {
      // 按标签分组生成数据源
      const tagGroups = new Map<string, ParsedEndpoint[]>()
      state.endpoints.forEach((endpoint) => {
        const tag = endpoint.tags[0] || 'default'
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, [])
        }
        tagGroups.get(tag)!.push(endpoint)
      })

      const dataSources: DataSourceConfig[] = []
      let dsId = 1

      for (const [tag, endpoints] of tagGroups) {
        const servers = state.document?.servers || []
        const baseUrl = servers[0]?.url || config.defaultBaseUrl || 'http://localhost:3000'

        const dataSource: DataSourceConfig = {
          id: `ds-${dsId++}`,
          name: tag === 'default' ? '默认数据源' : `${tag} 数据源`,
          type: 'rest',
          baseUrl,
          authType: config.defaultAuthType || 'none',
          authConfig: config.defaultAuthConfig,
          endpoints,
        }

        dataSources.push(dataSource)
      }

      console.log(`[OpenAPIAgent] 生成 ${dataSources.length} 个数据源`)

      return {
        dataSources,
        currentNode: 'generate_pages',
      }
    } catch (error) {
      return {
        status: 'failed',
        error: (error as Error).message,
        currentNode: 'end',
      }
    }
  }
}

/**
 * 生成页面配置节点
 */
export function createGeneratePagesNode() {
  return async (state: OpenAPIAgentState): Promise<Partial<OpenAPIAgentState>> => {
    console.log('[OpenAPIAgent] 执行页面生成节点')

    if (state.dataSources.length === 0) {
      return {
        status: 'failed',
        error: '没有数据源可处理',
        currentNode: 'end',
      }
    }

    try {
      const pages: GeneratedPageConfig[] = []
      let pageId = 1

      for (const dataSource of state.dataSources) {
        for (const endpoint of dataSource.endpoints) {
          const page = generatePageFromEndpoint(endpoint, dataSource.id, pageId++)
          pages.push(page)
        }
      }

      console.log(`[OpenAPIAgent] 生成 ${pages.length} 个页面`)

      return {
        pages,
        currentNode: 'end',
        status: 'completed',
      }
    } catch (error) {
      return {
        status: 'failed',
        error: (error as Error).message,
        currentNode: 'end',
      }
    }
  }
}

/**
 * 根据接口生成页面配置
 */
function generatePageFromEndpoint(endpoint: ParsedEndpoint, dataSourceId: string, pageId: number): GeneratedPageConfig {
  const pageName = endpoint.summary || endpoint.operationId || `页面 ${pageId}`
  
  // 根据 HTTP 方法和响应结构推断页面类型
  const pageType = inferPageType(endpoint)
  
  // 生成组件
  const components = generateComponents(endpoint, dataSourceId)
  
  // 生成页面 schema
  const pageSchema = generatePageSchema(pageType, components)

  return {
    id: `page-${pageId}`,
    name: pageName,
    endpoint,
    pageSchema,
    components,
  }
}

/**
 * 推断页面类型
 */
function inferPageType(endpoint: ParsedEndpoint): string {
  const { method, responses } = endpoint
  
  // 检查是否有列表响应
  const successResponse = responses.find(r => r.statusCode === '200' || r.statusCode === '201')
  if (successResponse?.schema?.type === 'array') {
    return 'list'
  }
  
  if (method === 'GET') {
    return 'detail'
  }
  
  if (method === 'POST') {
    return 'form'
  }
  
  if (method === 'PUT' || method === 'PATCH') {
    return 'edit'
  }
  
  return 'form'
}

/**
 * 生成组件
 */
function generateComponents(endpoint: ParsedEndpoint, dataSourceId: string): GeneratedComponent[] {
  const components: GeneratedComponent[] = []
  let compId = 1

  // 添加数据列表组件（如果是列表类型）
  if (inferPageType(endpoint) === 'list') {
    components.push({
      id: `comp-${compId++}`,
      type: 'Table',
      props: {
        dataSource: `ds://${dataSourceId}/${endpoint.id}`,
        columns: inferTableColumns(endpoint),
      },
      bindings: [],
    })
  }

  // 添加表单组件（如果有请求体或参数）
  if (endpoint.requestBody || endpoint.parameters.length > 0) {
    const fields = generateFormFields(endpoint)
    components.push({
      id: `comp-${compId++}`,
      type: 'Form',
      props: {
        dataSource: `ds://${dataSourceId}/${endpoint.id}`,
        fields,
        method: endpoint.method,
      },
      bindings: [],
    })
  }

  // 添加详情组件
  if (inferPageType(endpoint) === 'detail') {
    components.push({
      id: `comp-${compId++}`,
      type: 'DetailCard',
      props: {
        dataSource: `ds://${dataSourceId}/${endpoint.id}`,
        fields: inferDetailFields(endpoint),
      },
      bindings: [],
    })
  }

  return components
}

/**
 * 推断表格列
 */
function inferTableColumns(endpoint: ParsedEndpoint): any[] {
  const columns: any[] = []
  const successResponse = endpoint.responses.find(r => r.statusCode === '200')
  
  if (successResponse?.schema?.type === 'array' && successResponse.schema.items?.type === 'object') {
    const properties = successResponse.schema.items.properties || {}
    for (const [key, schema] of Object.entries(properties)) {
      const s = schema as { type?: string; description?: string }
      columns.push({
        key,
        title: s.description || key,
        dataIndex: key,
        type: s.type === 'number' ? 'number' : 'text',
      })
    }
  }
  
  return columns.length > 0 ? columns : [{ key: 'id', title: 'ID', dataIndex: 'id' }]
}

/**
 * 生成表单字段
 */
function generateFormFields(endpoint: ParsedEndpoint): any[] {
  const fields: any[] = []
  
  // 处理路径参数和查询参数
  for (const param of endpoint.parameters) {
    fields.push({
      name: param.name,
      label: param.description || param.name,
      type: param.type === 'number' ? 'number' : 'text',
      required: param.required,
    })
  }
  
  // 处理请求体
  if (endpoint.requestBody?.schema.type === 'object') {
    const properties = endpoint.requestBody.schema.properties || {}
    for (const [key, schema] of Object.entries(properties)) {
      const s = schema as { type?: string; description?: string }
      fields.push({
        name: key,
        label: s.description || key,
        type: getFieldType(s.type),
        required: endpoint.requestBody.schema.required?.includes(key) || false,
      })
    }
  }
  
  return fields
}

/**
 * 获取字段类型
 */
function getFieldType(type?: string): string {
  switch (type) {
    case 'number':
    case 'integer':
      return 'number'
    case 'boolean':
      return 'switch'
    case 'array':
      return 'select'
    case 'object':
      return 'object'
    default:
      return 'text'
  }
}

/**
 * 推断详情字段
 */
function inferDetailFields(endpoint: ParsedEndpoint): any[] {
  const fields: any[] = []
  const successResponse = endpoint.responses.find(r => r.statusCode === '200')
  
  if (successResponse?.schema?.type === 'object') {
    const properties = successResponse.schema.properties || {}
    for (const [key, schema] of Object.entries(properties)) {
      const s = schema as { type?: string; description?: string }
      fields.push({
        key,
        label: s.description || key,
        type: s.type,
      })
    }
  }
  
  return fields.length > 0 ? fields : [{ key: 'id', label: 'ID' }]
}

/**
 * 生成页面 Schema
 */
function generatePageSchema(pageType: string, components: GeneratedComponent[]): any {
  return {
    version: '1.0',
    type: pageType,
    layout: 'vertical',
    components: components.map(c => c.id),
    config: {},
  }
}

/**
 * OpenAPI Agent 执行器
 */
export class OpenAPIAgentExecutor {
  private config: OpenAPIAgentConfig
  private parser: OpenAPIParser

  constructor(config: OpenAPIAgentConfig = {}) {
    this.config = config
    this.parser = new OpenAPIParser()
  }

  /**
   * 执行解析流程
   */
  async execute(document: OpenAPIDocument): Promise<{
    endpoints: ParsedEndpoint[]
    dataSources: DataSourceConfig[]
    pages: GeneratedPageConfig[]
  }> {
    console.log('[OpenAPIAgentExecutor] 开始执行 OpenAPI 解析流程')

    // 验证文档
    const validation = this.parser.validate(document)
    if (!validation.valid) {
      throw new Error(`Invalid OpenAPI document: ${validation.errors.join(', ')}`)
    }

    // 初始化状态
    let state: OpenAPIAgentState = {
      document,
      endpoints: [],
      dataSources: [],
      pages: [],
      currentNode: 'parse',
      status: 'running',
    }

    // 定义工作流
    const workflow = [
      { name: 'parse', fn: createParseNode(this.parser) },
      { name: 'generate_datasource', fn: createGenerateDataSourceNode(this.config) },
      { name: 'generate_pages', fn: createGeneratePagesNode() },
    ]

    // 执行工作流
    for (const { name, fn } of workflow) {
      console.log(`[OpenAPIAgentExecutor] 执行节点: ${name}`)
      state.currentNode = name
      
      try {
        const result = await fn(state)
        state = { ...state, ...result }
        
        if (state.status === 'failed') {
          throw new Error(state.error || 'Unknown error')
        }
        
        if (state.status === 'completed') {
          break
        }
      } catch (error) {
        throw new Error(`Node ${name} failed: ${(error as Error).message}`)
      }
    }

    console.log('[OpenAPIAgentExecutor] 解析流程完成')

    return {
      endpoints: state.endpoints,
      dataSources: state.dataSources,
      pages: state.pages,
    }
  }

  /**
   * 从 JSON 字符串执行
   */
  async executeFromJSON(jsonString: string): Promise<{
    endpoints: ParsedEndpoint[]
    dataSources: DataSourceConfig[]
    pages: GeneratedPageConfig[]
  }> {
    const document = JSON.parse(jsonString) as OpenAPIDocument
    return this.execute(document)
  }
}

/**
 * 创建 OpenAPI Agent 执行器
 */
export function createOpenAPIAgentExecutor(config?: OpenAPIAgentConfig): OpenAPIAgentExecutor {
  return new OpenAPIAgentExecutor(config)
}

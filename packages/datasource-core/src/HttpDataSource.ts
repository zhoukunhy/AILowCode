/**
 * HTTP 数据源连接器
 * 支持 REST API 和 GraphQL
 */
import { HttpConfig, QueryResult, PreviewResult, EndpointMetadata } from './types'

export class HttpDataSource {
  private config: HttpConfig
  private queryCount: number = 0
  private totalQueryTime: number = 0

  constructor(config: HttpConfig) {
    this.config = config
  }

  /**
   * 验证连接
   */
  async validateConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request({
        method: 'GET',
        path: '/health'
      })
      
      return { success: response.status >= 200 && response.status < 300 }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || '连接验证失败' 
      }
    }
  }

  /**
   * 发送 HTTP 请求
   */
  async request(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    queryParams?: Record<string, any>
    body?: any
  }): Promise<{ status: number; data: any; headers: Record<string, string> }> {
    const startTime = Date.now()
    
    const url = new URL(this.config.baseUrl + options.path)
    
    // 添加查询参数
    if (options.queryParams) {
      for (const [key, value] of Object.entries(options.queryParams)) {
        url.searchParams.set(key, String(value))
      }
    }

    // 构建请求配置
    const requestOptions: RequestInit = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
    }

    // 添加认证
    if (this.config.auth) {
      const authHeader = this.buildAuthHeader()
      if (authHeader) {
        requestOptions.headers = {
          ...requestOptions.headers,
          ...authHeader,
        }
      }
    }

    // 添加请求体
    if (options.body) {
      requestOptions.body = JSON.stringify(options.body)
    }

    // 执行请求
    console.log(`HTTP ${options.method}: ${url.toString()}`)
    
    // 实际项目中使用 fetch 或 axios
    // const response = await fetch(url.toString(), requestOptions)
    
    // 模拟响应
    const data = this.mockResponse(options.path, options.method)
    const executionTime = Date.now() - startTime
    
    this.queryCount++
    this.totalQueryTime += executionTime

    return {
      status: 200,
      data,
      headers: {},
    }
  }

  /**
   * 构建认证头
   */
  private buildAuthHeader(): Record<string, string> | null {
    const auth = this.config.auth
    if (!auth || auth.type === 'none') return null

    switch (auth.type) {
      case 'basic':
        if (auth.username && auth.password) {
          const token = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
          return { 'Authorization': `Basic ${token}` }
        }
        break
      case 'bearer':
        if (auth.token) {
          return { 'Authorization': `Bearer ${auth.token}` }
        }
        break
      case 'apiKey':
        if (auth.apiKey) {
          const headerName = auth.apiKeyHeader || 'X-API-Key'
          return { [headerName]: auth.apiKey }
        }
        break
    }
    return null
  }

  /**
   * 模拟响应数据
   */
  private mockResponse(path: string, _method: string): any {
    const mockData: Record<string, any> = {
      '/users': {
        data: [
          { id: 1, name: '张三', email: 'zhangsan@example.com' },
          { id: 2, name: '李四', email: 'lisi@example.com' },
        ],
        total: 2,
      },
      '/items': {
        data: [
          { id: 1, name: '商品1', price: 100 },
          { id: 2, name: '商品2', price: 200 },
        ],
        total: 2,
      },
      '/health': { status: 'ok', timestamp: Date.now() },
    }

    return mockData[path] || { success: true, message: '请求成功' }
  }

  /**
   * 获取 API 端点列表（需要 Swagger/OpenAPI 规范）
   */
  async getEndpoints(): Promise<EndpointMetadata[]> {
    // 模拟端点列表
    return [
      {
        path: '/users',
        method: 'GET',
        description: '获取用户列表',
        parameters: [
          { name: 'page', type: 'number', required: false, location: 'query' },
          { name: 'pageSize', type: 'number', required: false, location: 'query' },
        ],
        response: { data: [], total: 0 },
      },
      {
        path: '/users/:id',
        method: 'GET',
        description: '获取单个用户',
        parameters: [
          { name: 'id', type: 'number', required: true, location: 'path' },
        ],
        response: { id: 1, name: '', email: '' },
      },
      {
        path: '/users',
        method: 'POST',
        description: '创建用户',
        parameters: [
          { name: 'name', type: 'string', required: true, location: 'body' },
          { name: 'email', type: 'string', required: true, location: 'body' },
        ],
        response: { id: 1, name: '', email: '', createdAt: '' },
      },
    ]
  }

  /**
   * 预览数据
   */
  async previewData(endpoint: string, method: string = 'GET', params?: Record<string, any>): Promise<PreviewResult> {
    const startTime = Date.now()
    
    try {
      const response = await this.request({
        method: method as any,
        path: endpoint,
        queryParams: method === 'GET' ? params : undefined,
        body: method !== 'GET' ? params : undefined,
      })

      const executionTime = Date.now() - startTime
      
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || (Array.isArray(response.data) ? response.data.length : 1),
        executionTime,
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime
      
      return {
        success: false,
        data: [],
        total: 0,
        error: error.message,
        executionTime,
      }
    }
  }

  /**
   * 批量获取数据
   */
  async fetchData(
    endpoint: string,
    method: string = 'GET',
    params?: Record<string, any>,
    pagination?: { page: number; pageSize: number }
  ): Promise<QueryResult> {
    const queryParams = {
      ...params,
      ...pagination,
    }

    const response = await this.request({
      method: method as any,
      path: endpoint,
      queryParams: method === 'GET' ? queryParams : undefined,
      body: method !== 'GET' ? queryParams : undefined,
    })

    const data = response.data.data || response.data
    const total = response.data.total || (Array.isArray(data) ? data.length : 1)

    return {
      rows: Array.isArray(data) ? data : [data],
      rowCount: total,
    }
  }

  /**
   * 获取连接统计
   */
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

/**
 * 创建 HTTP 数据源
 */
export function createHttpDataSource(config: HttpConfig): HttpDataSource {
  return new HttpDataSource(config)
}

/**
 * HTTP Test 工具 - 自动发起接口测试，校验数据源连通
 */

import type { HttpTestInput, HttpTestOutput } from './ToolTypes'
import { HttpTestInputSchema } from './ToolTypes'

/**
 * HTTP Test 工具配置
 */
export interface HttpTestToolConfig {
  defaultTimeout?: number
  defaultHeaders?: Record<string, string>
}

/**
 * HTTP Test 工具
 */
export class HttpTestTool {
  name = 'Http_Test'
  description = '自动发起接口测试，校验数据源连通'
  inputSchema = HttpTestInputSchema
  private config: HttpTestToolConfig

  constructor(config?: HttpTestToolConfig) {
    this.config = {
      defaultTimeout: config?.defaultTimeout || 30000,
      defaultHeaders: config?.defaultHeaders,
    }
  }

  /**
   * 执行 HTTP 测试
   */
  async execute(input: HttpTestInput): Promise<HttpTestOutput> {
    const startTime = Date.now()
    const timeout = input.timeout || this.config.defaultTimeout

    console.log(`[HttpTestTool] 测试接口: ${input.method} ${input.url}`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // 构建 URL（添加查询参数）
      let url = input.url
      if (input.params) {
        const searchParams = new URLSearchParams(input.params)
        url += (url.includes('?') ? '&' : '?') + searchParams.toString()
      }

      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.defaultHeaders,
        ...input.headers,
      }

      // 构建请求选项
      const options: RequestInit = {
        method: input.method,
        headers,
        signal: controller.signal,
      }

      // 添加请求体（非 GET 请求）
      if (input.body && input.method !== 'GET') {
        options.body = JSON.stringify(input.body)
      }

      clearTimeout(timeoutId)

      // 发起请求
      const response = await fetch(url, options)
      const duration = Date.now() - startTime

      // 解析响应体
      let responseBody: any
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        responseBody = await response.json()
      } else {
        responseBody = await response.text()
      }

      // 检查状态码
      const expectedStatus = input.expectedStatus || 200
      const success = response.status === expectedStatus

      const result: HttpTestOutput = {
        success,
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        duration,
        message: success
          ? `接口测试成功 (${response.status} ${response.statusText})`
          : `状态码不匹配: 期望 ${expectedStatus}, 实际 ${response.status}`,
      }

      if (!success) {
        result.errors = [`期望状态码 ${expectedStatus}, 实际 ${response.status}`]
      }

      console.log(`[HttpTestTool] 测试完成: ${response.status} in ${duration}ms`)

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = (error as Error).message

      console.error(`[HttpTestTool] 测试失败: ${errorMessage}`)

      // 判断错误类型
      let message = '接口测试失败'
      if (errorMessage.includes('abort')) {
        message = `接口测试超时 (${timeout}ms)`
      } else if (errorMessage.includes('fetch')) {
        message = `无法连接到服务器: ${errorMessage}`
      }

      return {
        success: false,
        statusCode: 0,
        statusText: 'Error',
        headers: {},
        body: null,
        duration,
        message,
        errors: [errorMessage],
      }
    }
  }

  /**
   * 批量测试多个接口
   */
  async executeBatch(inputs: HttpTestInput[]): Promise<HttpTestOutput[]> {
    const results: HttpTestOutput[] = []

    for (const input of inputs) {
      const result = await this.execute(input)
      results.push(result)
    }

    return results
  }

  /**
   * 测试连通性（仅检查是否能连接）
   */
  async testConnectivity(url: string): Promise<{ reachable: boolean; latency: number; error?: string }> {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 5000)

      await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      })

      return {
        reachable: true,
        latency: Date.now() - startTime,
      }
    } catch (error) {
      return {
        reachable: false,
        latency: Date.now() - startTime,
        error: (error as Error).message,
      }
    }
  }
}

/**
 * 创建 HTTP Test 工具实例
 */
export function createHttpTestTool(config?: HttpTestToolConfig): HttpTestTool {
  return new HttpTestTool(config)
}

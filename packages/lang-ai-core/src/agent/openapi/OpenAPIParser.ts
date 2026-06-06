/**
 * OpenAPI 文档解析服务
 */

import type {
  OpenAPIDocument,
  OpenAPIVersion,
  ParsedEndpoint,
  ParsedParameter,
  ParsedRequestBody,
  ParsedResponse,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPISchema,
  OpenAPIReference,
} from './OpenAPITypes'

/**
 * OpenAPI 解析服务
 */
export class OpenAPIParser {
  /**
   * 解析 OpenAPI 文档
   */
  parse(document: OpenAPIDocument): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = []

    for (const [path, pathItem] of Object.entries(document.paths)) {
      const methods = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']

      for (const method of methods) {
        const operation = pathItem[method as keyof typeof pathItem]
        if (operation && typeof operation === 'object' && !('$ref' in operation)) {
          const parsedEndpoint = this.parseOperation(
            path,
            method.toUpperCase(),
            operation as OpenAPIOperation,
            document.components
          )
          endpoints.push(parsedEndpoint)
        }
      }
    }

    return endpoints
  }

  /**
   * 解析单个操作
   */
  private parseOperation(
    path: string,
    method: string,
    operation: OpenAPIOperation,
    components?: OpenAPIDocument['components']
  ): ParsedEndpoint {
    const parameters = this.parseParameters(operation.parameters || [], components)
    const requestBody = this.parseRequestBody(operation.requestBody, components)
    const responses = this.parseResponses(operation.responses, components)

    return {
      id: operation.operationId || `${method.toLowerCase()}-${path.replace(/\//g, '-').replace(/{/g, ':').replace(/}/g, '')}`,
      path,
      method,
      summary: operation.summary || '',
      description: operation.description || '',
      operationId: operation.operationId || '',
      tags: operation.tags || [],
      parameters,
      requestBody,
      responses,
      deprecated: operation.deprecated || false,
    }
  }

  /**
   * 解析参数
   */
  private parseParameters(
    parameters: (OpenAPIParameter | OpenAPIReference)[],
    components?: OpenAPIDocument['components']
  ): ParsedParameter[] {
    return parameters.map((param) => {
      const resolvedParam = this.resolveReference(param, components) as OpenAPIParameter
      const schema = this.resolveSchema(resolvedParam.schema, components)

      return {
        name: resolvedParam.name,
        in: resolvedParam.in,
        description: resolvedParam.description || '',
        required: resolvedParam.required || false,
        type: schema?.type || 'string',
        format: schema?.format || '',
        schema: schema || {},
      }
    })
  }

  /**
   * 解析请求体
   */
  private parseRequestBody(
    requestBody: OpenAPIRequestBody | OpenAPIReference | undefined,
    components?: OpenAPIDocument['components']
  ): ParsedRequestBody | undefined {
    if (!requestBody) return undefined

    const resolvedBody = this.resolveReference(requestBody, components) as OpenAPIRequestBody
    const contentType = Object.keys(resolvedBody.content)[0]
    const mediaType = resolvedBody.content[contentType]
    const schema = this.resolveSchema(mediaType?.schema, components)

    return {
      description: resolvedBody.description || '',
      required: resolvedBody.required || false,
      contentType: contentType || '',
      schema: schema || {},
    }
  }

  /**
   * 解析响应
   */
  private parseResponses(
    responses: Record<string, OpenAPIResponse | OpenAPIReference>,
    components?: OpenAPIDocument['components']
  ): ParsedResponse[] {
    return Object.entries(responses).map(([statusCode, response]) => {
      const resolvedResponse = this.resolveReference(response, components) as OpenAPIResponse
      const contentType = resolvedResponse.content ? Object.keys(resolvedResponse.content)[0] : undefined
      const mediaType = contentType ? resolvedResponse.content[contentType] : undefined
      const schema = this.resolveSchema(mediaType?.schema, components)

      return {
        statusCode,
        description: resolvedResponse.description || '',
        contentType,
        schema,
      }
    })
  }

  /**
   * 解析引用
   */
  private resolveReference<T>(
    ref: T | OpenAPIReference,
    components?: OpenAPIDocument['components']
  ): T {
    if ('$ref' in ref && ref.$ref && components) {
      const refPath = ref.$ref.replace('#/', '')
      const parts = refPath.split('/')
      const componentType = parts[0]
      const componentName = parts[1]

      if (componentType === 'components') {
        const type = parts[1]
        const name = parts[2]
        return components[type as keyof typeof components]?.[name] as T
      }

      return components[componentType as keyof typeof components]?.[componentName] as T
    }
    return ref as T
  }

  /**
   * 解析 Schema
   */
  private resolveSchema(
    schema: OpenAPISchema | OpenAPIReference | undefined,
    components?: OpenAPIDocument['components']
  ): OpenAPISchema | undefined {
    if (!schema) return undefined
    if ('$ref' in schema) {
      return this.resolveReference(schema, components) as OpenAPISchema
    }
    return schema
  }

  /**
   * 获取 OpenAPI 版本
   */
  getVersion(document: OpenAPIDocument): OpenAPIVersion {
    if (document.openapi) {
      if (document.openapi.startsWith('3.1')) return '3.1'
      if (document.openapi.startsWith('3.0')) return '3.0'
    }
    if (document.swagger) {
      return '2.0'
    }
    return '3.0'
  }

  /**
   * 验证 OpenAPI 文档
   */
  validate(document: OpenAPIDocument): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!document.openapi && !document.swagger) {
      errors.push('缺少 openapi 或 swagger 版本字段')
    }

    if (!document.info || !document.info.title || !document.info.version) {
      errors.push('缺少 info.title 或 info.version')
    }

    if (!document.paths || Object.keys(document.paths).length === 0) {
      errors.push('缺少 paths 字段或 paths 为空')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * 从 JSON 字符串解析
   */
  parseFromJSON(jsonString: string): ParsedEndpoint[] {
    try {
      const document = JSON.parse(jsonString) as OpenAPIDocument
      const validation = this.validate(document)
      if (!validation.valid) {
        throw new Error(`Invalid OpenAPI document: ${validation.errors.join(', ')}`)
      }
      return this.parse(document)
    } catch (error) {
      throw new Error(`Failed to parse OpenAPI document: ${(error as Error).message}`)
    }
  }

  /**
   * 获取所有标签
   */
  getTags(document: OpenAPIDocument): string[] {
    const tags = new Set<string>()

    // 从 tags 数组获取
    document.tags?.forEach((tag) => tags.add(tag.name))

    // 从操作中获取
    for (const pathItem of Object.values(document.paths)) {
      const methods = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'] as const
      for (const method of methods) {
        const operation = pathItem[method]
        if (operation && typeof operation === 'object' && !('$ref' in operation)) {
          operation.tags?.forEach((tag) => tags.add(tag))
        }
      }
    }

    return Array.from(tags)
  }

  /**
   * 根据标签过滤接口
   */
  filterByTag(endpoints: ParsedEndpoint[], tag: string): ParsedEndpoint[] {
    return endpoints.filter((endpoint) => endpoint.tags.includes(tag))
  }
}

/**
 * 创建 OpenAPI 解析器
 */
export function createOpenAPIParser(): OpenAPIParser {
  return new OpenAPIParser()
}

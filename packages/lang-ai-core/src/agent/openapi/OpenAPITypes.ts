/**
 * OpenAPI 解析相关类型定义
 */

/**
 * OpenAPI 规范版本
 */
export type OpenAPIVersion = '2.0' | '3.0' | '3.1'

/**
 * OpenAPI 文档结构
 */
export interface OpenAPIDocument {
  openapi?: string
  swagger?: string
  info: OpenAPIInfo
  servers?: OpenAPIServer[]
  paths: OpenAPIPaths
  components?: OpenAPIComponents
  security?: OpenAPISecurity[]
  tags?: OpenAPITag[]
}

export interface OpenAPIInfo {
  title: string
  description?: string
  version: string
  termsOfService?: string
  contact?: OpenAPIContact
  license?: OpenAPILicense
}

export interface OpenAPIContact {
  name?: string
  email?: string
  url?: string
}

export interface OpenAPILicense {
  name: string
  identifier?: string
  url?: string
}

export interface OpenAPIServer {
  url: string
  description?: string
  variables?: Record<string, OpenAPIServerVariable>
}

export interface OpenAPIServerVariable {
  enum?: string[]
  default: string
  description?: string
}

export interface OpenAPIPaths {
  [path: string]: OpenAPIPathItem
}

export interface OpenAPIPathItem {
  $ref?: string
  summary?: string
  description?: string
  get?: OpenAPIOperation
  put?: OpenAPIOperation
  post?: OpenAPIOperation
  delete?: OpenAPIOperation
  options?: OpenAPIOperation
  head?: OpenAPIOperation
  patch?: OpenAPIOperation
  trace?: OpenAPIOperation
  servers?: OpenAPIServer[]
  parameters?: (OpenAPIParameter | OpenAPIReference)[]
}

export interface OpenAPIOperation {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: OpenAPIExternalDocs
  operationId?: string
  parameters?: (OpenAPIParameter | OpenAPIReference)[]
  requestBody?: OpenAPIRequestBody | OpenAPIReference
  responses: OpenAPIResponses
  callbacks?: Record<string, OpenAPICallback | OpenAPIReference>
  deprecated?: boolean
  security?: OpenAPISecurity[]
  servers?: OpenAPIServer[]
}

export interface OpenAPIParameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: string
  explode?: boolean
  allowReserved?: boolean
  schema?: OpenAPISchema | OpenAPIReference
  example?: any
  examples?: Record<string, OpenAPIExample | OpenAPIReference>
}

export interface OpenAPIRequestBody {
  description?: string
  content: Record<string, OpenAPIMediaType>
  required?: boolean
}

export interface OpenAPIMediaType {
  schema?: OpenAPISchema | OpenAPIReference
  example?: any
  examples?: Record<string, OpenAPIExample | OpenAPIReference>
  encoding?: Record<string, OpenAPIEncoding>
}

export interface OpenAPIEncoding {
  contentType?: string
  headers?: Record<string, OpenAPIHeader | OpenAPIReference>
  style?: string
  explode?: boolean
  allowReserved?: boolean
}

export interface OpenAPIResponses {
  [statusCode: string]: OpenAPIResponse | OpenAPIReference
  default?: OpenAPIResponse | OpenAPIReference
}

export interface OpenAPIResponse {
  description: string
  headers?: Record<string, OpenAPIHeader | OpenAPIReference>
  content?: Record<string, OpenAPIMediaType>
  links?: Record<string, OpenAPILink | OpenAPIReference>
}

export interface OpenAPIHeader {
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  schema?: OpenAPISchema | OpenAPIReference
  example?: any
  examples?: Record<string, OpenAPIExample | OpenAPIReference>
}

export interface OpenAPISchema {
  title?: string
  description?: string
  default?: any
  readOnly?: boolean
  writeOnly?: boolean
  example?: any
  examples?: any[]
  required?: string[]
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null'
  format?: string
  items?: OpenAPISchema | OpenAPIReference
  properties?: Record<string, OpenAPISchema | OpenAPIReference>
  additionalProperties?: OpenAPISchema | OpenAPIReference | boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
  exclusiveMinimum?: boolean
  exclusiveMaximum?: boolean
  multipleOf?: number
  enum?: any[]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  oneOf?: (OpenAPISchema | OpenAPIReference)[]
  anyOf?: (OpenAPISchema | OpenAPIReference)[]
  allOf?: (OpenAPISchema | OpenAPIReference)[]
  not?: OpenAPISchema | OpenAPIReference
  nullable?: boolean
  discriminator?: OpenAPIDiscriminator
  xml?: OpenAPIXML
}

export interface OpenAPIDiscriminator {
  propertyName: string
  mapping?: Record<string, string>
}

export interface OpenAPIXML {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean
}

export interface OpenAPIExample {
  summary?: string
  description?: string
  value?: any
  externalValue?: string
}

export interface OpenAPILink {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, any>
  requestBody?: any
  description?: string
  server?: OpenAPIServer
}

export interface OpenAPICallback {
  [expression: string]: OpenAPIPathItem
}

export interface OpenAPISecurity {
  [name: string]: string[]
}

export interface OpenAPITag {
  name: string
  description?: string
  externalDocs?: OpenAPIExternalDocs
}

export interface OpenAPIExternalDocs {
  description?: string
  url: string
}

export interface OpenAPIReference {
  $ref: string
}

export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema | OpenAPIReference>
  responses?: Record<string, OpenAPIResponse | OpenAPIReference>
  parameters?: Record<string, OpenAPIParameter | OpenAPIReference>
  examples?: Record<string, OpenAPIExample | OpenAPIReference>
  requestBodies?: Record<string, OpenAPIRequestBody | OpenAPIReference>
  headers?: Record<string, OpenAPIHeader | OpenAPIReference>
  securitySchemes?: Record<string, OpenAPISecurityScheme | OpenAPIReference>
  links?: Record<string, OpenAPILink | OpenAPIReference>
  callbacks?: Record<string, OpenAPICallback | OpenAPIReference>
}

export interface OpenAPISecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  description?: string
  name?: string
  in?: 'query' | 'header' | 'cookie'
  scheme?: string
  bearerFormat?: string
  flows?: OpenAPIOAuthFlows
  openIdConnectUrl?: string
}

export interface OpenAPIOAuthFlows {
  implicit?: OpenAPIOAuthFlow
  password?: OpenAPIOAuthFlow
  clientCredentials?: OpenAPIOAuthFlow
  authorizationCode?: OpenAPIOAuthFlow
}

export interface OpenAPIOAuthFlow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes?: Record<string, string>
}

// ==================== 解析结果类型 ====================

/**
 * 解析后的接口信息
 */
export interface ParsedEndpoint {
  id: string
  path: string
  method: string
  summary: string
  description: string
  operationId: string
  tags: string[]
  parameters: ParsedParameter[]
  requestBody?: ParsedRequestBody
  responses: ParsedResponse[]
  deprecated: boolean
}

export interface ParsedParameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description: string
  required: boolean
  type: string
  format: string
  schema: OpenAPISchema
}

export interface ParsedRequestBody {
  description: string
  required: boolean
  contentType: string
  schema: OpenAPISchema
}

export interface ParsedResponse {
  statusCode: string
  description: string
  contentType?: string
  schema?: OpenAPISchema
}

/**
 * 数据源配置
 */
export interface DataSourceConfig {
  id: string
  name: string
  type: 'rest' | 'graphql' | 'grpc'
  baseUrl: string
  headers?: Record<string, string>
  authType?: 'none' | 'basic' | 'bearer' | 'apiKey'
  authConfig?: Record<string, string>
  endpoints: ParsedEndpoint[]
}

/**
 * 生成的页面配置
 */
export interface GeneratedPageConfig {
  id: string
  name: string
  endpoint: ParsedEndpoint
  pageSchema: any
  components: GeneratedComponent[]
}

export interface GeneratedComponent {
  id: string
  type: string
  props: Record<string, any>
  bindings: ComponentBinding[]
}

export interface ComponentBinding {
  property: string
  endpoint: string
  path: string
}

/**
 * OpenAPI 导入结果
 */
export interface OpenAPIImportResult {
  success: boolean
  document: OpenAPIDocument
  endpoints: ParsedEndpoint[]
  dataSources: DataSourceConfig[]
  pages: GeneratedPageConfig[]
  errors: string[]
  warnings: string[]
}

// ==================== 版本对比类型 ====================

/**
 * 版本对比结果
 */
export interface VersionComparison {
  id: string
  versionFrom: string
  versionTo: string
  differences: VersionDifference[]
  suggestions: VersionSuggestion[]
  analysis: VersionAnalysis
}

export interface VersionDifference {
  id: string
  type: 'addition' | 'removal' | 'modification' | 'move'
  path: string
  componentId: string
  description: string
  oldValue?: any
  newValue?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface VersionSuggestion {
  id: string
  differenceId: string
  action: string
  description: string
  codeSnippet?: string
  automated: boolean
}

export interface VersionAnalysis {
  totalChanges: number
  additions: number
  removals: number
  modifications: number
  criticalChanges: number
  codeQualityImprovement: boolean
  performanceImprovement: boolean
  breakingChanges: boolean
}

/**
 * 页面版本快照
 */
export interface PageVersionSnapshot {
  id: string
  pageId: string
  version: string
  timestamp: Date
  pageSchema: any
  metadata: VersionMetadata
}

export interface VersionMetadata {
  author?: string
  description?: string
  tags?: string[]
}

/**
 * AI 优化建议
 */
export interface AIOptimizationSuggestion {
  id: string
  category: 'performance' | 'readability' | 'maintainability' | 'security' | 'bestPractice'
  severity: 'low' | 'medium' | 'high'
  description: string
  oldCode: string
  suggestedCode: string
  explanation: string
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray, IsEnum, IsObject, IsNumber, IsBoolean, IsUrl } from 'class-validator'
import { WebhookEventType, WebhookStatus, WebhookTriggerType, WebhookSignatureAlgorithm } from '@ai-lowcode/shared-types'

/**
 * 创建Webhook DTO
 */
export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook名称', example: '项目通知' })
  @IsString()
  name!: string

  @ApiProperty({ description: 'Webhook目标URL', example: 'https://example.com/webhook' })
  @IsUrl()
  url!: string

  @ApiProperty({ 
    description: '订阅的事件类型列表', 
    example: ['project.created', 'page.published'],
    enum: WebhookEventType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events!: WebhookEventType[]

  @ApiPropertyOptional({ 
    description: '触发方式', 
    example: WebhookTriggerType.ASYNC,
    enum: WebhookTriggerType,
  })
  @IsEnum(WebhookTriggerType)
  @IsOptional()
  triggerType?: WebhookTriggerType = WebhookTriggerType.ASYNC

  @ApiPropertyOptional({ 
    description: '签名算法', 
    example: WebhookSignatureAlgorithm.HMAC_SHA256,
    enum: WebhookSignatureAlgorithm,
  })
  @IsEnum(WebhookSignatureAlgorithm)
  @IsOptional()
  signatureAlgorithm?: WebhookSignatureAlgorithm

  @ApiPropertyOptional({ description: '签名密钥', example: 'my-secret-key' })
  @IsString()
  @IsOptional()
  secret?: string

  @ApiPropertyOptional({ description: '自定义请求头', example: { 'X-Custom-Header': 'value' } })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>

  @ApiPropertyOptional({ description: '重试配置' })
  @IsObject()
  @IsOptional()
  retryConfig?: {
    maxRetries: number
    delayMs: number
    backoffMultiplier: number
  }

  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsNumber()
  @IsOptional()
  projectId?: number

  @ApiPropertyOptional({ description: '是否系统Webhook' })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean = false
}

/**
 * 更新Webhook DTO
 */
export class UpdateWebhookDto {
  @ApiPropertyOptional({ description: 'Webhook名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: 'Webhook目标URL' })
  @IsUrl()
  @IsOptional()
  url?: string

  @ApiPropertyOptional({ 
    description: '订阅的事件类型列表', 
    enum: WebhookEventType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  @IsOptional()
  events?: WebhookEventType[]

  @ApiPropertyOptional({ 
    description: '状态', 
    enum: WebhookStatus,
  })
  @IsEnum(WebhookStatus)
  @IsOptional()
  status?: WebhookStatus

  @ApiPropertyOptional({ 
    description: '触发方式', 
    enum: WebhookTriggerType,
  })
  @IsEnum(WebhookTriggerType)
  @IsOptional()
  triggerType?: WebhookTriggerType

  @ApiPropertyOptional({ 
    description: '签名算法', 
    enum: WebhookSignatureAlgorithm,
  })
  @IsEnum(WebhookSignatureAlgorithm)
  @IsOptional()
  signatureAlgorithm?: WebhookSignatureAlgorithm

  @ApiPropertyOptional({ description: '签名密钥' })
  @IsString()
  @IsOptional()
  secret?: string

  @ApiPropertyOptional({ description: '自定义请求头' })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>

  @ApiPropertyOptional({ description: '重试配置' })
  @IsObject()
  @IsOptional()
  retryConfig?: {
    maxRetries: number
    delayMs: number
    backoffMultiplier: number
  }

  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsNumber()
  @IsOptional()
  projectId?: number
}

/**
 * 触发Webhook DTO
 */
export class TriggerWebhookDto {
  @ApiProperty({ 
    description: '事件类型', 
    enum: WebhookEventType,
  })
  @IsEnum(WebhookEventType)
  eventType!: WebhookEventType

  @ApiProperty({ description: '事件数据' })
  @IsObject()
  data!: object

  @ApiPropertyOptional({ description: '项目ID' })
  @IsNumber()
  @IsOptional()
  projectId?: number

  @ApiPropertyOptional({ description: '用户ID' })
  @IsNumber()
  @IsOptional()
  userId?: number
}

/**
 * Webhook测试DTO
 */
export class TestWebhookDto {
  @ApiProperty({ description: '测试数据' })
  @IsObject()
  @IsOptional()
  testData?: Record<string, unknown>
}
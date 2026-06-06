/**
 * Agent 模块 DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator'

/**
 * AI 生成页面请求 DTO
 */
export class GeneratePageDto {
  @ApiProperty({ description: '用户需求描述', example: '创建一个用户管理页面，包含用户列表和搜索功能' })
  @IsString()
  @IsNotEmpty()
  requirement!: string

  @ApiProperty({ description: '知识库ID列表', example: [1, 2] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  knowledgeBaseIds!: number[]

  @ApiPropertyOptional({ description: '页面宽度', default: 1920 })
  @IsNumber()
  @IsOptional()
  pageWidth?: number

  @ApiPropertyOptional({ description: '页面高度', default: 1080 })
  @IsNumber()
  @IsOptional()
  pageHeight?: number

  @ApiPropertyOptional({ description: '会话ID（用于继续对话）' })
  @IsString()
  @IsOptional()
  sessionId?: string

  @ApiPropertyOptional({ description: '元数据' })
  @IsOptional()
  metadata?: Record<string, any>
}

/**
 * Agent 会话查询 DTO
 */
export class QuerySessionsDto {
  @ApiPropertyOptional({ description: '会话ID' })
  @IsString()
  @IsOptional()
  sessionId?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string

  @ApiPropertyOptional({ description: 'Agent 类型' })
  @IsString()
  @IsOptional()
  agentType?: string

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsNumber()
  @IsOptional()
  pageSize?: number
}

/**
 * AI 生成页面响应 DTO
 */
export class GeneratePageResponseDto {
  @ApiProperty({ description: '会话ID' })
  sessionId!: string

  @ApiProperty({ description: '是否成功' })
  success!: boolean

  @ApiProperty({ description: '生成的页面 Schema' })
  schema?: any

  @ApiPropertyOptional({ description: '错误信息' })
  error?: string

  @ApiProperty({ description: '执行日志' })
  logs!: any[]

  @ApiProperty({ description: '执行时长（毫秒）' })
  duration!: number
}

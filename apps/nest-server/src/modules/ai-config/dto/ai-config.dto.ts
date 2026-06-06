import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsUrl } from 'class-validator'

/**
 * LLM 提供商枚举
 */
export enum LLMProvider {
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
  OPENAI = 'openai',
}

/**
 * 创建 AI 配置 DTO
 */
export class CreateAIConfigDto {
  @ApiProperty({ description: '配置名称', example: 'DeepSeek生产环境' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: '提供商', enum: LLMProvider, example: 'deepseek' })
  @IsEnum(LLMProvider)
  @IsNotEmpty()
  provider!: LLMProvider

  @ApiPropertyOptional({ description: '模型名称', example: 'deepseek-chat' })
  @IsString()
  @IsOptional()
  model?: string

  @ApiProperty({ description: 'API密钥', example: 'sk-xxxxx' })
  @IsString()
  @IsNotEmpty()
  apiKey!: string

  @ApiPropertyOptional({ description: 'API基础URL', example: 'https://api.deepseek.com/v1' })
  @IsString()
  @IsOptional()
  baseUrl?: string

  @ApiPropertyOptional({ description: '其他配置', example: { temperature: 0.7, maxTokens: 2000 } })
  @IsOptional()
  config?: Record<string, any>

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

/**
 * 更新 AI 配置 DTO
 */
export class UpdateAIConfigDto {
  @ApiPropertyOptional({ description: '配置名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '模型名称' })
  @IsString()
  @IsOptional()
  model?: string

  @ApiPropertyOptional({ description: 'API密钥' })
  @IsString()
  @IsOptional()
  apiKey?: string

  @ApiPropertyOptional({ description: 'API基础URL' })
  @IsString()
  @IsOptional()
  baseUrl?: string

  @ApiPropertyOptional({ description: '其他配置' })
  @IsOptional()
  config?: Record<string, any>

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

/**
 * 创建向量库配置 DTO
 */
export class CreateVectorStoreConfigDto {
  @ApiProperty({ description: '配置名称', example: 'Milvus生产环境' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: 'Milvus地址', example: 'localhost:19530' })
  @IsString()
  @IsNotEmpty()
  address!: string

  @ApiPropertyOptional({ description: '用户名', example: 'root' })
  @IsString()
  @IsOptional()
  username?: string

  @ApiPropertyOptional({ description: '密码', example: 'Milvus' })
  @IsString()
  @IsOptional()
  password?: string

  @ApiPropertyOptional({ description: '数据库名称', default: 'default' })
  @IsString()
  @IsOptional()
  database?: string

  @ApiPropertyOptional({ description: '是否启用SSL', default: false })
  @IsBoolean()
  @IsOptional()
  ssl?: boolean

  @ApiPropertyOptional({ description: '其他配置' })
  @IsOptional()
  config?: Record<string, any>

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

/**
 * 更新向量库配置 DTO
 */
export class UpdateVectorStoreConfigDto {
  @ApiPropertyOptional({ description: '配置名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: 'Milvus地址' })
  @IsString()
  @IsOptional()
  address?: string

  @ApiPropertyOptional({ description: '用户名' })
  @IsString()
  @IsOptional()
  username?: string

  @ApiPropertyOptional({ description: '密码' })
  @IsString()
  @IsOptional()
  password?: string

  @ApiPropertyOptional({ description: '数据库名称' })
  @IsString()
  @IsOptional()
  database?: string

  @ApiPropertyOptional({ description: '是否启用SSL' })
  @IsBoolean()
  @IsOptional()
  ssl?: boolean

  @ApiPropertyOptional({ description: '其他配置' })
  @IsOptional()
  config?: Record<string, any>

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

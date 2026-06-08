import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator'

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
  @ApiProperty({ description: '配置名称', example: 'Chroma生产环境' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: 'Chroma地址', example: 'http://localhost:8000' })
  @IsString()
  @IsNotEmpty()
  url!: string

  @ApiPropertyOptional({ description: 'API密钥', example: 'your-api-key' })
  @IsString()
  @IsOptional()
  apiKey?: string

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

  @ApiPropertyOptional({ description: 'Chroma地址' })
  @IsString()
  @IsOptional()
  url?: string

  @ApiPropertyOptional({ description: 'API密钥' })
  @IsString()
  @IsOptional()
  apiKey?: string

  @ApiPropertyOptional({ description: '其他配置' })
  @IsOptional()
  config?: Record<string, any>

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

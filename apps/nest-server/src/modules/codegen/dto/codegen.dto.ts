/**
 * 代码生成模块 DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsEnum, IsObject, IsOptional, IsBoolean } from 'class-validator'

/**
 * 生成类型枚举
 */
export enum GenerationType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
}

/**
 * 代码生成请求 DTO
 */
export class GenerateCodeDto {
  @ApiProperty({ description: '画布 Schema', type: Object })
  @IsObject()
  @IsNotEmpty()
  schema!: any

  @ApiProperty({ description: '生成类型', enum: GenerationType })
  @IsEnum(GenerationType)
  @IsNotEmpty()
  type!: GenerationType

  @ApiPropertyOptional({ description: '框架', example: 'react' })
  @IsString()
  @IsOptional()
  framework?: string

  @ApiPropertyOptional({ description: '会话ID' })
  @IsString()
  @IsOptional()
  sessionId?: string

  @ApiPropertyOptional({ description: '启用 RAG 检索', default: false })
  @IsBoolean()
  @IsOptional()
  enableRAG?: boolean

  @ApiPropertyOptional({ description: '启用代码优化', default: false })
  @IsBoolean()
  @IsOptional()
  enableOptimization?: boolean

  @ApiPropertyOptional({ description: '知识库 ID 列表' })
  @IsOptional()
  knowledgeBaseIds?: number[]
}

/**
 * 代码生成响应 DTO
 */
export class GenerateCodeResponseDto {
  @ApiProperty({ description: '会话ID' })
  sessionId!: string

  @ApiProperty({ description: '是否成功' })
  success!: boolean

  @ApiProperty({ description: '生成的文件列表' })
  files!: Array<{ path: string; content: string }>

  @ApiProperty({ description: '文件数量' })
  fileCount!: number

  @ApiPropertyOptional({ description: '错误信息' })
  error?: string

  @ApiProperty({ description: '执行时长（毫秒）' })
  duration!: number

  @ApiPropertyOptional({ description: 'RAG 检索时间（毫秒）' })
  ragRetrievalTime?: number

  @ApiPropertyOptional({ description: '优化文件数量' })
  optimizedFiles?: number
}

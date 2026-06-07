import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator'

/**
 * 文档类型枚举
 */
export enum DocumentType {
  MARKDOWN = 'md',
  API_DOC = 'api',
  REQUIREMENT = 'requirement',
}

/**
 * 创建知识库 DTO
 */
export class CreateKnowledgeBaseDto {
  @ApiProperty({ description: '知识库名称', example: '产品文档库' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiPropertyOptional({ description: '知识库描述', example: '存储产品相关文档' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '嵌入模型', example: 'text-embedding-3-small' })
  @IsString()
  @IsOptional()
  embeddingModel?: string

  @ApiPropertyOptional({ description: '向量维度', default: 1536 })
  @IsNumber()
  @IsOptional()
  dimension?: number

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({ description: '元数据' })
  @IsOptional()
  metadata?: Record<string, any>
}

/**
 * 更新知识库 DTO
 */
export class UpdateKnowledgeBaseDto {
  @ApiPropertyOptional({ description: '知识库名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '知识库描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '嵌入模型' })
  @IsString()
  @IsOptional()
  embeddingModel?: string

  @ApiPropertyOptional({ description: '向量维度' })
  @IsNumber()
  @IsOptional()
  dimension?: number

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({ description: '元数据' })
  @IsOptional()
  metadata?: Record<string, any>
}

/**
 * 上传文档 DTO
 */
export class UploadDocumentDto {
  @ApiProperty({ description: '知识库ID' })
  @IsNumber()
  @IsNotEmpty()
  knowledgeBaseId!: number

  @ApiProperty({ description: '文档名称' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: '文档内容' })
  @IsString()
  @IsNotEmpty()
  content!: string

  @ApiProperty({ description: '文档类型', enum: DocumentType })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type!: DocumentType

  @ApiPropertyOptional({ description: '元数据' })
  @IsOptional()
  metadata?: Record<string, any>
}

/**
 * 检索知识库 DTO
 */
export class SearchKnowledgeDto {
  @ApiProperty({ description: '知识库ID' })
  @IsNumber()
  @IsNotEmpty()
  knowledgeBaseId!: number

  @ApiProperty({ description: '查询文本' })
  @IsString()
  @IsNotEmpty()
  query!: string

  @ApiPropertyOptional({ description: '返回数量', default: 5 })
  @IsNumber()
  @IsOptional()
  topK?: number

  @ApiPropertyOptional({ description: '相似度阈值', default: 0.7 })
  @IsNumber()
  @IsOptional()
  threshold?: number
}

/**
 * 文档分块预览 DTO
 */
export class DocumentChunkPreviewDto {
  @ApiProperty({ description: '文档ID' })
  @IsNumber()
  @IsNotEmpty()
  documentId!: number

  @ApiPropertyOptional({ description: '分页大小', default: 10 })
  @IsNumber()
  @IsOptional()
  pageSize?: number

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number
}

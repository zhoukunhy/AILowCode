import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsObject } from 'class-validator'

/**
 * 创建模板 DTO
 */
export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  name!: string

  @ApiPropertyOptional({ description: '模板描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ description: '模板分类' })
  @IsString()
  category!: string

  @ApiPropertyOptional({ description: '模板配置' })
  @IsObject()
  @IsOptional()
  schema?: Record<string, any>
}

/**
 * 更新模板 DTO
 */
export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: '模板名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '模板描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '模板分类' })
  @IsString()
  @IsOptional()
  category?: string

  @ApiPropertyOptional({ description: '模板配置' })
  @IsObject()
  @IsOptional()
  schema?: Record<string, any>

  @ApiPropertyOptional({ description: '模板状态' })
  @IsString()
  @IsOptional()
  status?: string
}

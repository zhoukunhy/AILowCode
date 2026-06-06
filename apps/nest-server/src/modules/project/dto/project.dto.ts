import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsObject } from 'class-validator'

/**
 * 创建项目 DTO
 */
export class CreateProjectDto {
  @ApiProperty({ description: '项目名称', example: '我的项目' })
  @IsString()
  name!: string

  @ApiPropertyOptional({ description: '项目描述', example: '这是一个低代码项目' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '项目配置', example: {} })
  @IsObject()
  @IsOptional()
  schema?: Record<string, any>
}

/**
 * 更新项目 DTO
 */
export class UpdateProjectDto {
  @ApiPropertyOptional({ description: '项目名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '项目描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '项目配置' })
  @IsObject()
  @IsOptional()
  schema?: Record<string, any>

  @ApiPropertyOptional({ description: '项目状态', enum: ['draft', 'published', 'archived'] })
  @IsString()
  @IsOptional()
  status?: string
}

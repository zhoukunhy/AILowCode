import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 创建页面 DTO
 */
export class CreatePageDto {
  @ApiProperty({ description: '页面名称' })
  @IsString()
  name!: string

  @ApiPropertyOptional({ description: '画布宽度', default: 1920 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  width?: number = 1920

  @ApiPropertyOptional({ description: '画布高度', default: 1080 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  height?: number = 1080

  @ApiPropertyOptional({ description: '栅格大小', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  @Type(() => Number)
  gridSize?: number = 20

  @ApiPropertyOptional({ description: '是否吸附到栅格', default: true })
  @IsOptional()
  @IsBoolean()
  snapToGrid?: boolean = true

  @ApiPropertyOptional({ description: '是否显示栅格', default: true })
  @IsOptional()
  @IsBoolean()
  showGrid?: boolean = true

  @ApiPropertyOptional({ description: '是否显示标尺', default: false })
  @IsOptional()
  @IsBoolean()
  showRulers?: boolean = false

  @ApiPropertyOptional({ description: '背景颜色', default: '#ffffff' })
  @IsOptional()
  @IsString()
  backgroundColor?: string = '#ffffff'

  @ApiPropertyOptional({ description: '画布 JSON 数据' })
  @IsOptional()
  canvasJson?: any = []

  @ApiPropertyOptional({ description: '是否为首页', default: false })
  @IsOptional()
  @IsBoolean()
  isHome?: boolean = false
}

/**
 * 更新页面 DTO
 */
export class UpdatePageDto {
  @ApiPropertyOptional({ description: '页面名称' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '画布宽度' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  width?: number

  @ApiPropertyOptional({ description: '画布高度' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  height?: number

  @ApiPropertyOptional({ description: '栅格大小' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  @Type(() => Number)
  gridSize?: number

  @ApiPropertyOptional({ description: '是否吸附到栅格' })
  @IsOptional()
  @IsBoolean()
  snapToGrid?: boolean

  @ApiPropertyOptional({ description: '是否显示栅格' })
  @IsOptional()
  @IsBoolean()
  showGrid?: boolean

  @ApiPropertyOptional({ description: '是否显示标尺' })
  @IsOptional()
  @IsBoolean()
  showRulers?: boolean

  @ApiPropertyOptional({ description: '背景颜色' })
  @IsOptional()
  @IsString()
  backgroundColor?: string

  @ApiPropertyOptional({ description: '画布 JSON 数据' })
  @IsOptional()
  @IsObject()
  canvasJson?: any

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number

  @ApiPropertyOptional({ description: '是否为首页' })
  @IsOptional()
  @IsBoolean()
  isHome?: boolean

  @ApiPropertyOptional({ description: '页面状态', enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '关联菜单ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  menuId?: number

  @ApiPropertyOptional({ description: '关联数据模型' })
  @IsOptional()
  @IsString()
  dataModel?: string

  @ApiPropertyOptional({ description: '页面描述' })
  @IsOptional()
  @IsString()
  description?: string
}

/**
 * 查询页面列表 DTO
 */
export class QueryPageDto {
  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 10

  @ApiPropertyOptional({ description: '页面名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '页面状态', enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsString()
  status?: string
}

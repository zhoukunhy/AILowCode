import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsEnum, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateCustomComponentDto {
  @ApiProperty({ description: '组件唯一标识' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: '显示名称' })
  @IsString()
  @IsNotEmpty()
  displayName!: string

  @ApiPropertyOptional({ description: '组件描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ description: '组件分类' })
  @IsString()
  @IsNotEmpty()
  category!: string

  @ApiProperty({ description: '组件图标' })
  @IsString()
  @IsNotEmpty()
  icon!: string

  @ApiPropertyOptional({ description: '版本号', default: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string

  @ApiProperty({ description: '模板配置' })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  template: any

  @ApiProperty({ description: '属性定义' })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  propsSchema: any

  @ApiPropertyOptional({ description: '事件定义' })
  @IsArray()
  @IsOptional()
  events?: any[]

  @ApiPropertyOptional({ description: '数据源配置' })
  @IsObject()
  @IsOptional()
  dataSource?: any

  @ApiPropertyOptional({ description: '依赖组件' })
  @IsArray()
  @IsOptional()
  dependencies?: string[]

  @ApiPropertyOptional({ description: '标签' })
  @IsArray()
  @IsOptional()
  tags?: string[]
}

export class UpdateCustomComponentDto {
  @ApiPropertyOptional({ description: '显示名称' })
  @IsString()
  @IsOptional()
  displayName?: string

  @ApiPropertyOptional({ description: '组件描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '组件分类' })
  @IsString()
  @IsOptional()
  category?: string

  @ApiPropertyOptional({ description: '组件图标' })
  @IsString()
  @IsOptional()
  icon?: string

  @ApiPropertyOptional({ description: '版本号' })
  @IsString()
  @IsOptional()
  version?: string

  @ApiPropertyOptional({ description: '模板配置' })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  template?: any

  @ApiPropertyOptional({ description: '属性定义' })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  propsSchema?: any

  @ApiPropertyOptional({ description: '事件定义' })
  @IsArray()
  @IsOptional()
  events?: any[]

  @ApiPropertyOptional({ description: '数据源配置' })
  @IsObject()
  @IsOptional()
  dataSource?: any

  @ApiPropertyOptional({ description: '依赖组件' })
  @IsArray()
  @IsOptional()
  dependencies?: string[]

  @ApiPropertyOptional({ description: '标签' })
  @IsArray()
  @IsOptional()
  tags?: string[]

  @ApiPropertyOptional({ description: '状态', enum: ['draft', 'published', 'deprecated'] })
  @IsEnum(['draft', 'published', 'deprecated'])
  @IsOptional()
  status?: string
}
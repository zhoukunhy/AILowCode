/**
 * 数据源和插件模块 DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsEnum, IsObject, IsNumber, IsOptional } from 'class-validator'

/**
 * 数据源类型枚举
 */
export enum DataSourceType {
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
  MONGODB = 'mongodb',
  REDIS = 'redis',
  HTTP = 'http',
  REST = 'rest',
  GRAPHQL = 'graphql',
}

/**
 * 创建数据源 DTO
 */
export class CreateDataSourceDto {
  @ApiProperty({ description: '数据源名称', example: '用户数据库' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: '数据源类型', enum: DataSourceType })
  @IsEnum(DataSourceType)
  @IsNotEmpty()
  type!: DataSourceType

  @ApiProperty({ description: '数据源配置', type: Object })
  @IsObject()
  @IsNotEmpty()
  config!: Record<string, any>

  @ApiPropertyOptional({ description: '描述', example: '生产环境用户数据库' })
  @IsString()
  @IsOptional()
  description?: string
}

/**
 * 更新数据源 DTO
 */
export class UpdateDataSourceDto {
  @ApiPropertyOptional({ description: '数据源名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '数据源配置', type: Object })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string
}

/**
 * 预览数据 DTO
 */
export class PreviewDataDto {
  @ApiProperty({ description: '数据源ID' })
  @IsNumber()
  @IsNotEmpty()
  dataSourceId!: number

  @ApiProperty({ description: '查询配置', type: Object })
  @IsObject()
  @IsNotEmpty()
  queryConfig!: Record<string, any>
}

/**
 * 创建插件 DTO
 */
export class CreatePluginDto {
  @ApiProperty({ description: '插件名称', example: '自定义图表插件' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: '插件版本', example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  version!: string

  @ApiProperty({ description: '插件类型', example: 'wasm' })
  @IsString()
  @IsNotEmpty()
  type!: string

  @ApiPropertyOptional({ description: '插件描述' })
  @IsString()
  @IsOptional()
  description?: string
}

/**
 * 查询结果 DTO
 */
export class QueryResultDto {
  @ApiProperty({ description: '数据行' })
  rows!: any[]

  @ApiProperty({ description: '行数' })
  rowCount!: number

  @ApiPropertyOptional({ description: '字段信息' })
  fields?: any[]
}

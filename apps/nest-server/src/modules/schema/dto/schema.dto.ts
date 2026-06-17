/**
 * Schema 模块 DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsBoolean, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 字段定义 DTO
 */
export class SchemaFieldDto {
  @ApiProperty({ description: '字段ID' })
  @IsString()
  @IsNotEmpty()
  id!: string

  @ApiProperty({ description: '字段名称', example: 'username' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: '字段标签', example: '用户名' })
  @IsString()
  @IsNotEmpty()
  label!: string

  @ApiProperty({ description: '字段类型', enum: ['string', 'number', 'date', 'boolean', 'email', 'textarea', 'select', 'password'] })
  @IsString()
  type!: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'textarea' | 'select' | 'password'

  @ApiProperty({ description: '是否必填' })
  @IsBoolean()
  required!: boolean

  @ApiPropertyOptional({ description: '占位符' })
  @IsString()
  @IsOptional()
  placeholder?: string

  @ApiPropertyOptional({ description: '选项列表（用于 select 类型）' })
  @IsArray()
  @IsOptional()
  options?: string[]

  @ApiPropertyOptional({ description: '默认值' })
  defaultValue?: any
}

/**
 * 创建 Schema DTO
 */
export class CreateSchemaDto {
  @ApiProperty({ description: 'Schema 名称', example: '用户表' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ description: '表名', example: 'users' })
  @IsString()
  @IsNotEmpty()
  tableName!: string

  @ApiProperty({ description: '字段定义', type: [SchemaFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchemaFieldDto)
  fields!: SchemaFieldDto[]

  @ApiPropertyOptional({ description: '所属项目ID' })
  @IsNumber()
  @IsOptional()
  projectId?: number
}

/**
 * 更新 Schema DTO
 */
export class UpdateSchemaDto {
  @ApiPropertyOptional({ description: 'Schema 名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '表名' })
  @IsString()
  @IsOptional()
  tableName?: string

  @ApiPropertyOptional({ description: '字段定义', type: [SchemaFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchemaFieldDto)
  @IsOptional()
  fields?: SchemaFieldDto[]
}

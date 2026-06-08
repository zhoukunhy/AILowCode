import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator'

/**
 * 创建页面版本快照 DTO
 */
export class CreatePageVersionDto {
  @ApiProperty({ description: '页面ID' })
  @IsNumber()
  pageId!: number

  @ApiProperty({ description: '版本号 (如 1.0.0)' })
  @IsString()
  version!: string

  @ApiPropertyOptional({ description: '画布 JSON 数据' })
  @IsOptional()
  @IsObject()
  canvasJson?: any

  @ApiPropertyOptional({ description: '页面配置' })
  @IsOptional()
  @IsObject()
  pageConfig?: any

  @ApiPropertyOptional({ description: '版本描述' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: '变更摘要' })
  @IsOptional()
  @IsObject()
  changeSummary?: any

  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @IsNumber()
  createdBy?: number
}

/**
 * 查询页面版本列表 DTO
 */
export class QueryPageVersionDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number = 20
}

/**
 * 版本对比 DTO
 */
export class CompareVersionDto {
  @ApiProperty({ description: '版本1 ID' })
  @IsNumber()
  versionId1!: number

  @ApiProperty({ description: '版本2 ID' })
  @IsNumber()
  versionId2!: number
}

/**
 * 回滚版本 DTO
 */
export class RollbackVersionDto {
  @ApiPropertyOptional({ description: '回滚说明' })
  @IsOptional()
  @IsString()
  description?: string
}
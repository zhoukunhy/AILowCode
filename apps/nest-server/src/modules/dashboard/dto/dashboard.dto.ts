import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsNumber, Min } from 'class-validator'

/**
 * 获取统计数据响应 DTO
 */
export class GetStatsResponseDto {
  @ApiProperty({ description: '画布总数' })
  canvasCount!: number

  @ApiProperty({ description: '活跃用户数' })
  activeUsers!: number

  @ApiProperty({ description: 'AI 生成次数' })
  aiGenerationCount!: number

  @ApiProperty({ description: '知识库文档数' })
  knowledgeDocCount!: number

  @ApiProperty({ description: '画布数量变化百分比' })
  canvasChange!: string

  @ApiProperty({ description: '用户数量变化百分比' })
  usersChange!: string

  @ApiProperty({ description: 'AI 生成次数变化百分比' })
  aiChange!: string

  @ApiProperty({ description: '知识库数量变化百分比' })
  knowledgeChange!: string
}

/**
 * AI 活动记录 DTO
 */
export class AIActivityDto {
  @ApiProperty({ description: '活动ID' })
  id!: string

  @ApiProperty({ description: '活动描述' })
  action!: string

  @ApiProperty({ description: '使用的模型' })
  model!: string

  @ApiProperty({ description: '持续时间' })
  duration!: string

  @ApiProperty({ description: '时间戳' })
  timestamp!: string
}

/**
 * 获取 AI 活动记录响应 DTO
 */
export class GetActivitiesResponseDto {
  @ApiProperty({ description: '活动记录列表', type: [AIActivityDto] })
  activities!: AIActivityDto[]
}

/**
 * 获取最近画布查询 DTO
 */
export class GetRecentCanvasesDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number
}

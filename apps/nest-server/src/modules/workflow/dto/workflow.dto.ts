import { IsString, IsOptional, IsArray, IsNumber, IsObject, IsEnum, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export type ProcessStatus = 'draft' | 'active' | 'inactive'
export type NodeType = 'start' | 'approve' | 'condition' | 'fork' | 'join' | 'end' | 'action'

export class CreateProcessDefinitionDto {
  @IsString()
  name!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(['draft', 'active', 'inactive'])
  @IsOptional()
  status?: ProcessStatus

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>

  @IsString()
  creatorId!: string
}

export class UpdateProcessDefinitionDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(['draft', 'active', 'inactive'])
  @IsOptional()
  status?: ProcessStatus

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>

  @IsString()
  @IsOptional()
  startNodeId?: string
}

export class ProcessNodeDto {
  @IsString()
  @IsEnum(['start', 'approve', 'condition', 'fork', 'join', 'end', 'action'])
  type!: NodeType

  @IsString()
  name!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @IsOptional()
  x?: number

  @IsNumber()
  @IsOptional()
  y?: number

  @IsNumber()
  @IsOptional()
  width?: number

  @IsNumber()
  @IsOptional()
  height?: number

  @IsObject()
  @IsOptional()
  config?: Record<string, any>

  @IsNumber()
  @IsOptional()
  zIndex?: number
}

export class ProcessTransitionDto {
  @IsString()
  sourceNodeId!: string

  @IsString()
  targetNodeId!: string

  @IsString()
  @IsOptional()
  label?: string

  @IsObject()
  @IsOptional()
  condition?: any

  @IsArray()
  @IsOptional()
  points?: { x: number; y: number }[]

  @IsNumber()
  @IsOptional()
  zIndex?: number
}

export class ProcessConditionDto {
  @IsEnum(['expression', 'script', 'data'])
  type!: string

  @IsString()
  value!: string

  @IsEnum(['==', '!=', '>', '<', '>=', '<=', 'contains', 'in'])
  @IsOptional()
  operator?: string

  @IsOptional()
  compareValue?: any
}

export class SaveProcessDto {
  @IsString()
  @IsOptional()
  id?: string

  @IsString()
  name!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(['draft', 'active', 'inactive'])
  @IsOptional()
  status?: ProcessStatus

  @IsString()
  @IsOptional()
  startNodeId?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>

  @IsString()
  creatorId!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessNodeDto)
  nodes!: ProcessNodeDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessTransitionDto)
  transitions!: ProcessTransitionDto[]
}

export class MoveNodeDto {
  @IsNumber()
  x!: number

  @IsNumber()
  y!: number
}
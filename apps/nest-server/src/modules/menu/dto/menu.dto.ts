import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class CreateMenuDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  path?: string

  @IsOptional()
  @IsUUID()
  parentId?: string

  @IsOptional()
  @IsNumber()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  status?: boolean

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsUUID()
  pageId?: string
}

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  path?: string

  @IsOptional()
  @IsUUID()
  parentId?: string

  @IsOptional()
  @IsNumber()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  status?: boolean

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsUUID()
  pageId?: string
}
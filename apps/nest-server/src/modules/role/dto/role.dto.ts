import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator'

/**
 * 创建角色 DTO
 */
export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: 'admin' })
  @IsString()
  name!: string

  @ApiPropertyOptional({ description: '角色描述', example: '管理员角色' })
  @IsString()
  @IsOptional()
  description?: string
}

/**
 * 更新角色 DTO
 */
export class UpdateRoleDto {
  @ApiPropertyOptional({ description: '角色名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '角色描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '角色状态' })
  @IsString()
  @IsOptional()
  status?: string
}

/**
 * 角色分配菜单 DTO
 */
export class AssignMenusDto {
  @ApiProperty({ description: '菜单ID列表', example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  menuIds!: number[]
}

/**
 * 创建菜单 DTO
 */
export class CreateMenuDto {
  @ApiProperty({ description: '菜单名称', example: '仪表盘' })
  @IsString()
  name!: string

  @ApiPropertyOptional({ description: '菜单路径', example: '/dashboard' })
  @IsString()
  @IsOptional()
  path?: string

  @ApiPropertyOptional({ description: '菜单图标', example: '📊' })
  @IsString()
  @IsOptional()
  icon?: string

  @ApiPropertyOptional({ description: '父菜单ID' })
  @IsNumber()
  @IsOptional()
  parentId?: number

  @ApiPropertyOptional({ description: '排序号', example: 1 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number

  @ApiPropertyOptional({ description: '权限标识', example: 'dashboard:view' })
  @IsString()
  @IsOptional()
  permission?: string
}

/**
 * 更新菜单 DTO
 */
export class UpdateMenuDto {
  @ApiPropertyOptional({ description: '菜单名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '菜单路径' })
  @IsString()
  @IsOptional()
  path?: string

  @ApiPropertyOptional({ description: '菜单图标' })
  @IsString()
  @IsOptional()
  icon?: string

  @ApiPropertyOptional({ description: '父菜单ID' })
  @IsNumber()
  @IsOptional()
  parentId?: number

  @ApiPropertyOptional({ description: '排序号' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({ description: '权限标识' })
  @IsString()
  @IsOptional()
  permission?: string
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsEnum } from 'class-validator'

/**
 * 创建角色 DTO
 */
export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: '管理员' })
  @IsString()
  name!: string

  @ApiProperty({ description: '角色代码', example: 'admin' })
  @IsString()
  code!: string

  @ApiPropertyOptional({ description: '角色描述', example: '管理员角色' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '是否系统角色', example: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean
}

/**
 * 更新角色 DTO
 */
export class UpdateRoleDto {
  @ApiPropertyOptional({ description: '角色名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '角色代码' })
  @IsString()
  @IsOptional()
  code?: string

  @ApiPropertyOptional({ description: '角色描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '角色状态' })
  @IsString()
  @IsOptional()
  status?: string

  @ApiPropertyOptional({ description: '是否系统角色' })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean
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
 * 角色分配权限 DTO
 */
export class AssignPermissionsDto {
  @ApiProperty({ description: '权限ID列表', example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds!: number[]
}

/**
 * 用户分配角色 DTO
 */
export class AssignRolesDto {
  @ApiProperty({ description: '角色ID列表', example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds!: number[]
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

/**
 * 创建权限 DTO
 */
export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称', example: '查看用户' })
  @IsString()
  name!: string

  @ApiProperty({ description: '权限代码', example: 'user:read' })
  @IsString()
  code!: string

  @ApiProperty({ description: '权限类型', example: 'button', enum: ['menu', 'button', 'api'] })
  @IsEnum(['menu', 'button', 'api'])
  type!: 'menu' | 'button' | 'api'

  @ApiPropertyOptional({ description: '父权限ID' })
  @IsNumber()
  @IsOptional()
  parentId?: number

  @ApiPropertyOptional({ description: 'API路径', example: '/api/users' })
  @IsString()
  @IsOptional()
  path?: string

  @ApiPropertyOptional({ description: 'HTTP方法', example: 'GET', enum: ['GET', 'POST', 'PUT', 'DELETE'] })
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  @IsOptional()
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'

  @ApiPropertyOptional({ description: '权限描述', example: '允许查看用户列表' })
  @IsString()
  @IsOptional()
  description?: string
}

/**
 * 更新权限 DTO
 */
export class UpdatePermissionDto {
  @ApiPropertyOptional({ description: '权限名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '权限代码' })
  @IsString()
  @IsOptional()
  code?: string

  @ApiPropertyOptional({ description: '权限类型', enum: ['menu', 'button', 'api'] })
  @IsEnum(['menu', 'button', 'api'])
  @IsOptional()
  type?: 'menu' | 'button' | 'api'

  @ApiPropertyOptional({ description: '父权限ID' })
  @IsNumber()
  @IsOptional()
  parentId?: number

  @ApiPropertyOptional({ description: 'API路径' })
  @IsString()
  @IsOptional()
  path?: string

  @ApiPropertyOptional({ description: 'HTTP方法', enum: ['GET', 'POST', 'PUT', 'DELETE'] })
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  @IsOptional()
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'

  @ApiPropertyOptional({ description: '权限描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
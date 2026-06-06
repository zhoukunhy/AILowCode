import { SetMetadata } from '@nestjs/common'

/**
 * 角色权限元数据键
 */
export const ROLES_KEY = 'roles'

/**
 * 角色装饰器
 * 用于设置接口需要的角色权限
 * @example
 * @Roles('admin')
 * @Roles('admin', 'developer')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

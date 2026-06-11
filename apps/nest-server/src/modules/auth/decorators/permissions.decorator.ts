import { SetMetadata } from '@nestjs/common'

/**
 * 权限元数据键
 */
export const PERMISSIONS_KEY = 'permissions'

/**
 * 权限装饰器
 * 用于设置接口需要的权限
 * @example
 * @Permissions('user:read')
 * @Permissions('user:read', 'user:write')
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions)
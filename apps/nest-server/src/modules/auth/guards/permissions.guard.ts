import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { RoleService } from '../../role/role.service'

/**
 * 权限守卫
 * 检查用户是否具有访问接口所需的角色或权限
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    
    const path = request.path || request.originalUrl
    
    if (path.startsWith('/auth/')) {
      return true
    }
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // 如果没有设置角色和权限要求，则允许访问
    if (!requiredRoles && !requiredPermissions) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    // 如果用户不存在，拒绝访问
    if (!user || !user.id) {
      throw new UnauthorizedException('用户未登录')
    }

    try {
      // 获取用户的所有角色代码
      const userRoles = await this.roleService.getUserRoles(user.id)
      const roleCodes = userRoles.map(r => r.code)

      // 检查角色
      if (requiredRoles) {
        const hasRole = requiredRoles.some(role => roleCodes.includes(role))
        if (!hasRole) {
          throw new UnauthorizedException('角色权限不足')
        }
      }

      // 检查权限
      if (requiredPermissions) {
        // 获取用户所有权限
        const userPermissions = await this.roleService.getUserPermissions(user.id)
        
        // 检查是否有超级权限
        if (!userPermissions.includes('*')) {
          // 检查所有需要的权限
          const hasAllPermissions = requiredPermissions.every(permission => 
            userPermissions.includes(permission)
          )
          if (!hasAllPermissions) {
            throw new UnauthorizedException('操作权限不足')
          }
        }
      }

      return true
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('权限验证失败')
    }
  }
}
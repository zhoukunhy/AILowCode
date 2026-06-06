import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

/**
 * 角色权限守卫
 * 检查用户是否具有访问接口所需的角色
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // 如果没有设置角色要求，则允许访问
    if (!requiredRoles) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    // 如果用户没有角色，拒绝访问
    if (!user || !user.role) {
      return false
    }

    // 检查用户角色是否在要求的角色列表中
    return requiredRoles.includes(user.role)
  }
}

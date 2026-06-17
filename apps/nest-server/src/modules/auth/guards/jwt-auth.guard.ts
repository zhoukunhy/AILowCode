import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const path = request.path || request.originalUrl
    // 允许登录和注册接口不需要认证
    if (path.startsWith('/auth/')) {
      return true
    }
    return super.canActivate(context)
  }
}

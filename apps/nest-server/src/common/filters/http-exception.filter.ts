import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
import { ApiResponse } from '../interfaces/response.interface'

/**
 * 全局 HTTP 异常过滤器
 * 捕获所有异常并统一返回格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = '服务器内部错误'

    // 处理 HTTP 异常
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message
    } else if (exception instanceof Error) {
      // 处理普通错误
      message = exception.message
    }

    // 记录错误日志
    console.error('Exception caught:', {
      status,
      message,
      stack: exception instanceof Error ? exception.stack : exception,
    })

    const errorResponse: ApiResponse = {
      code: status,
      msg: Array.isArray(message) ? message.join(', ') : message,
      data: null,
    }

    response.status(status).json(errorResponse)
  }
}

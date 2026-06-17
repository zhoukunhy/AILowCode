import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { setupSwagger } from './common/swagger/swagger.config'

/**
 * 应用启动函数
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true, // 拒绝非白名单属性
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式类型转换
      },
    })
  )

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter())

  // 全局响应转换拦截器
  app.useGlobalInterceptors(new TransformInterceptor())

  // 启用 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  // 配置 Swagger API 文档
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app)
    console.log('Swagger 文档地址: http://localhost:3000/api/docs')
  }

  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`应用已启动: http://localhost:${port}`)
  console.log(`API 文档: http://localhost:${port}/api/docs`)
}
bootstrap()

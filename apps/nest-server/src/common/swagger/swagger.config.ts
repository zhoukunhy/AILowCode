import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'

/**
 * Swagger API 文档配置
 * 用于生成和展示 API 接口文档
 */
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('AI低代码平台 API')
    .setDescription('AI低代码平台 RESTful API 接口文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '请输入 JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('auth', '用户认证相关接口')
    .addTag('users', '用户管理接口')
    .addTag('projects', '项目管理接口')
    .addTag('pages', '页面画布配置接口')
    .addTag('ai', 'AI生成记录接口')
    .addTag('plugins', '插件管理接口')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持授权状态
    },
  })
}

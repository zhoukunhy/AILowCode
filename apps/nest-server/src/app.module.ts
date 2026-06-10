import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { RoleModule } from './modules/role/role.module'
import { ProjectModule } from './modules/project/project.module'
import { TemplateModule } from './modules/template/template.module'
import { PageModule } from './modules/page/page.module'
import { KnowledgeModule } from './modules/knowledge/knowledge.module'
import { AgentModule } from './modules/agent/agent.module'
import { MenuModule } from './modules/menu/menu.module'
import { WorkflowModule } from './modules/workflow/workflow.module'
import { CodegenModule } from './modules/codegen/codegen.module'
import { DataSourceModule } from './modules/data-source/data-source.module'
import { AiConfigModule } from './modules/ai-config/ai-config.module'
import { LoggingModule } from './modules/logging/logging.module'
import { RedisModule } from './common/redis/redis.module'
import { CanvasModule } from './modules/canvas/canvas.module'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { RolesGuard } from './modules/auth/guards/roles.guard'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DB_DATABASE', 'ai_lowcode.sqlite'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'ai-lowcode-secret'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    RoleModule,
    ProjectModule,
    TemplateModule,
    PageModule,
    KnowledgeModule,
    AgentModule,
    MenuModule,
    WorkflowModule,
    CodegenModule,
    DataSourceModule,
    AiConfigModule,
    LoggingModule,
    RedisModule,
    CanvasModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

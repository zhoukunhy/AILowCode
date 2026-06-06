import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Page } from './entities/page.entity'
import { PageService } from './page.service'
import { PageController } from './page.controller'
import { Project } from '../project/entities/project.entity'

/**
 * 页面模块
 * 提供页面画布配置的 CRUD 功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([Page, Project])],
  controllers: [PageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}

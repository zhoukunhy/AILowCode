import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Page } from './entities/page.entity'
import { PageVersion } from './entities/page-version.entity'
import { PageService } from './page.service'
import { PageController } from './page.controller'
import { PageVersionService } from './page-version.service'
import { PageVersionController } from './page-version.controller'
import { CanvasPageController } from './canvas-page.controller'
import { Project } from '../project/entities/project.entity'

/**
 * 页面模块
 * 提供页面画布配置的 CRUD 功能和版本管理
 */
@Module({
  imports: [TypeOrmModule.forFeature([Page, PageVersion, Project])],
  controllers: [PageController, PageVersionController, CanvasPageController],
  providers: [PageService, PageVersionService],
  exports: [PageService, PageVersionService],
})
export class PageModule {}

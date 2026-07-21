import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Page } from './entities/page.entity'
import { CreatePageDto, UpdatePageDto, QueryPageDto } from './dto/page.dto'
import { Project } from '../project/entities/project.entity'
import { PageVersionService } from './page-version.service'

/**
 * 页面服务
 * 提供页面画布配置的 CRUD 操作
 */
@Injectable()
export class PageService {
  constructor(
    @InjectRepository(Page)
    private pageRepository: Repository<Page>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @Inject(forwardRef(() => PageVersionService))
    private versionService: PageVersionService
  ) {}

  /**
   * 创建页面
   */
  async create(projectId: number, createPageDto: CreatePageDto): Promise<Page> {
    // 只有指定了项目ID时才检查项目是否存在
    if (projectId > 0) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      })
      if (!project) {
        throw new NotFoundException('项目不存在')
      }
    }

    const page = this.pageRepository.create({
      ...createPageDto,
      projectId: projectId > 0 ? projectId : undefined,
    })

    return this.pageRepository.save(page)
  }

  /**
   * 查询项目的所有页面
   */
  async findAll(projectId: number, query: QueryPageDto) {
    const { page = 1, pageSize = 10, name, status } = query

    const queryBuilder = this.pageRepository.createQueryBuilder('page')

    // projectId 为 0 时查询所有不关联项目的页面
    if (projectId > 0) {
      queryBuilder.where('page.project_id = :projectId', { projectId })
    } else {
      queryBuilder.where('page.project_id IS NULL')
    }

    // 名称模糊搜索
    if (name) {
      queryBuilder.andWhere('page.name LIKE :name', { name: `%${name}%` })
    }

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('page.status = :status', { status })
    }

    const [list, total] = await queryBuilder
      .orderBy('page.sort_order', 'ASC')
      .addOrderBy('page.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()

    return {
      list,
      total,
      page,
      pageSize,
    }
  }

  /**
   * 查询单个页面
   */
  async findOne(id: number): Promise<Page> {
    const page = await this.pageRepository.findOne({
      where: { id },
      relations: ['project'],
    })

    if (!page) {
      throw new NotFoundException('页面不存在')
    }

    return page
  }

  /**
   * 更新页面
   */
  async update(id: number, updatePageDto: UpdatePageDto): Promise<Page> {
    const page = await this.findOne(id)
    Object.assign(page, updatePageDto)
    return this.pageRepository.save(page)
  }

  /**
   * 删除页面
   */
  async remove(id: number): Promise<void> {
    const page = await this.findOne(id)
    await this.pageRepository.remove(page)
  }

  /**
   * 复制页面
   */
  async duplicate(id: number, newName: string): Promise<Page> {
    const page = await this.findOne(id)
    const { id: _, projectId, createdAt, updatedAt, ...pageData } = page

    const newPage = this.pageRepository.create({
      ...pageData,
      name: newName,
      isHome: false, // 复制的新页面不是首页
    })

    return this.pageRepository.save(newPage)
  }

  /**
   * 批量保存页面画布数据（用于自动保存）
   * 保存时自动创建版本快照
   */
  async saveCanvasJson(
    id: number,
    canvasJson: any,
    userId?: number,
    dataModels?: any[]
  ): Promise<{ page: Page; version: any }> {
    const page = await this.findOne(id)
    page.canvasJson = canvasJson
    if (dataModels !== undefined) {
      page.dataModels = dataModels
    }
    const savedPage = await this.pageRepository.save(page)

    // 自动创建版本快照
    const version = await this.versionService.createSnapshot(
      id,
      canvasJson,
      userId,
      '手动保存'
    )

    return { page: savedPage, version }
  }

  /**
   * 导出页面画布 JSON
   * 用于跨项目复用页面配置
   */
  async exportCanvasJson(id: number): Promise<{
    page: Partial<Page>
    canvasJson: any
    exportedAt: string
  }> {
    const page = await this.findOne(id)

    return {
      page: {
        name: page.name,
        width: page.width,
        height: page.height,
        gridSize: page.gridSize,
        snapToGrid: page.snapToGrid,
        showGrid: page.showGrid,
        showRulers: page.showRulers,
        backgroundColor: page.backgroundColor,
        isHome: page.isHome,
      },
      canvasJson: page.canvasJson,
      exportedAt: new Date().toISOString(),
    }
  }

  /**
   * 导入页面画布 JSON
   * 从其他页面配置创建新页面
   */
  async importCanvasJson(
    projectId: number,
    importData: {
      name: string
      canvasJson: any
      pageConfig?: Partial<Page>
    }
  ): Promise<Page> {
    // 检查项目是否存在
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const pageConfig = importData.pageConfig || {}

    const page = this.pageRepository.create({
      name: importData.name,
      projectId,
      canvasJson: importData.canvasJson,
      width: pageConfig.width || 1920,
      height: pageConfig.height || 1080,
      gridSize: pageConfig.gridSize || 20,
      snapToGrid: pageConfig.snapToGrid ?? true,
      showGrid: pageConfig.showGrid ?? true,
      showRulers: pageConfig.showRulers ?? false,
      backgroundColor: pageConfig.backgroundColor || '#ffffff',
      isHome: false,
    })

    return this.pageRepository.save(page)
  }
}

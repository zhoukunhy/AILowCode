import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Page } from './entities/page.entity'
import { CreatePageDto, UpdatePageDto, QueryPageDto } from './dto/page.dto'
import { Project } from '../project/entities/project.entity'

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
    private projectRepository: Repository<Project>
  ) {}

  /**
   * 创建页面
   */
  async create(projectId: number, createPageDto: CreatePageDto): Promise<Page> {
    // 检查项目是否存在
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const page = this.pageRepository.create({
      ...createPageDto,
      projectId,
    })

    return this.pageRepository.save(page)
  }

  /**
   * 查询项目的所有页面
   */
  async findAll(projectId: number, query: QueryPageDto) {
    const { page = 1, pageSize = 10, name } = query

    const queryBuilder = this.pageRepository
      .createQueryBuilder('page')
      .where('page.project_id = :projectId', { projectId })

    // 名称模糊搜索
    if (name) {
      queryBuilder.andWhere('page.name LIKE :name', { name: `%${name}%` })
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
   */
  async saveCanvasJson(id: number, canvasJson: any): Promise<Page> {
    const page = await this.findOne(id)
    page.canvasJson = canvasJson
    return this.pageRepository.save(page)
  }
}

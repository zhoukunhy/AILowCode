import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CustomComponentEntity } from './entities/custom-component.entity'
import { CreateCustomComponentDto, UpdateCustomComponentDto } from './dto/custom-component.dto'

@Injectable()
export class CustomComponentService {
  constructor(
    @InjectRepository(CustomComponentEntity)
    private readonly repository: Repository<CustomComponentEntity>
  ) {}

  /**
   * 创建自定义组件
   */
  async create(userId: number, dto: CreateCustomComponentDto): Promise<CustomComponentEntity> {
    // 检查名称是否已存在
    const existing = await this.repository.findOne({
      where: { name: dto.name, userId },
    })

    if (existing) {
      throw new BadRequestException(`组件名称 ${dto.name} 已存在`)
    }

    const component = this.repository.create({
      componentId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: dto.name,
      displayName: dto.displayName,
      description: dto.description,
      category: dto.category,
      icon: dto.icon,
      version: dto.version || '1.0.0',
      author: 'user',
      userId,
      status: 'draft',
      template: dto.template,
      propsSchema: dto.propsSchema,
      events: dto.events,
      dataSource: dto.dataSource,
      dependencies: dto.dependencies?.join(','),
      tags: dto.tags?.join(','),
    })

    return await this.repository.save(component)
  }

  /**
   * 更新自定义组件
   */
  async update(userId: number, componentId: string, dto: UpdateCustomComponentDto): Promise<CustomComponentEntity> {
    const component = await this.repository.findOne({
      where: { componentId, userId },
    })

    if (!component) {
      throw new NotFoundException('组件不存在')
    }

    // 更新字段
    Object.assign(component, {
      displayName: dto.displayName ?? component.displayName,
      description: dto.description ?? component.description,
      category: dto.category ?? component.category,
      icon: dto.icon ?? component.icon,
      version: dto.version ?? component.version,
      template: dto.template ?? component.template,
      propsSchema: dto.propsSchema ?? component.propsSchema,
      events: dto.events ?? component.events,
      dataSource: dto.dataSource ?? component.dataSource,
      dependencies: dto.dependencies?.join(',') ?? component.dependencies,
      tags: dto.tags?.join(',') ?? component.tags,
      status: dto.status ?? component.status,
      updatedAt: new Date(),
    })

    return await this.repository.save(component)
  }

  /**
   * 获取用户的自定义组件列表
   */
  async findAllByUser(userId: number): Promise<CustomComponentEntity[]> {
    return await this.repository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    })
  }

  /**
   * 获取所有已发布的组件（公开组件库）
   */
  async findAllPublished(): Promise<CustomComponentEntity[]> {
    return await this.repository.find({
      where: { status: 'published' },
      order: { updatedAt: 'DESC' },
    })
  }

  /**
   * 获取单个组件详情
   */
  async findOne(componentId: string, userId?: number): Promise<CustomComponentEntity> {
    const where: any = { componentId }
    if (userId) {
      where.userId = userId
    }

    const component = await this.repository.findOne({ where })
    if (!component) {
      throw new NotFoundException('组件不存在')
    }

    return component
  }

  /**
   * 删除自定义组件
   */
  async remove(userId: number, componentId: string): Promise<void> {
    const component = await this.repository.findOne({
      where: { componentId, userId },
    })

    if (!component) {
      throw new NotFoundException('组件不存在')
    }

    await this.repository.remove(component)
  }

  /**
   * 发布组件
   */
  async publish(userId: number, componentId: string): Promise<CustomComponentEntity> {
    const component = await this.findOne(componentId, userId)
    component.status = 'published'
    return await this.repository.save(component)
  }

  /**
   * 取消发布组件
   */
  async unpublish(userId: number, componentId: string): Promise<CustomComponentEntity> {
    const component = await this.findOne(componentId, userId)
    component.status = 'draft'
    return await this.repository.save(component)
  }

  /**
   * 搜索组件
   */
  async search(query: string, userId?: number): Promise<CustomComponentEntity[]> {
    const qb = this.repository.createQueryBuilder('component')

    qb.where('component.name LIKE :query OR component.displayName LIKE :query OR component.description LIKE :query', {
      query: `%${query}%`,
    })

    if (userId) {
      qb.andWhere('component.userId = :userId', { userId })
    } else {
      qb.andWhere('component.status = :status', { status: 'published' })
    }

    return await qb.orderBy('component.updatedAt', 'DESC').getMany()
  }

  /**
   * 按分类获取组件
   */
  async findByCategory(category: string, userId?: number): Promise<CustomComponentEntity[]> {
    const where: any = { category }
    if (userId) {
      where.userId = userId
    } else {
      where.status = 'published'
    }

    return await this.repository.find({
      where,
      order: { updatedAt: 'DESC' },
    })
  }

  /**
   * 复制组件
   */
  async copy(userId: number, componentId: string, newName?: string): Promise<CustomComponentEntity> {
    const original = await this.findOne(componentId)

    // 检查是否有权限复制
    if (original.userId !== userId && original.status !== 'published') {
      throw new BadRequestException('无权限复制此组件')
    }

    const name = newName || `${original.name}_copy`
    const existing = await this.repository.findOne({
      where: { name, userId },
    })

    if (existing) {
      throw new BadRequestException(`组件名称 ${name} 已存在`)
    }

    const copy = this.repository.create({
      ...original,
      id: undefined,
      componentId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      displayName: newName || `${original.displayName} (副本)`,
      userId,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return await this.repository.save(copy)
  }

  /**
   * 获取组件统计信息
   */
  async getStats(userId: number): Promise<{
    total: number
    draft: number
    published: number
    deprecated: number
  }> {
    const components = await this.repository.find({ where: { userId } })

    return {
      total: components.length,
      draft: components.filter(c => c.status === 'draft').length,
      published: components.filter(c => c.status === 'published').length,
      deprecated: components.filter(c => c.status === 'deprecated').length,
    }
  }
}
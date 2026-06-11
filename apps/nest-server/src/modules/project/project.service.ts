/**
 * 项目服务
 * 提供项目的 CRUD 操作
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto'
import { WebhookService } from '../webhook/webhook.service'
import { WebhookEventType } from '@ai-lowcode/shared-types'

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private webhookService: WebhookService,
  ) {}

  /**
   * 创建项目
   * @param createProjectDto 项目创建数据
   * @param userId 用户ID
   * @returns 创建的项目
   */
  async create(createProjectDto: CreateProjectDto, userId: number): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      userId,
    })
    const savedProject = await this.projectRepository.save(project)

    // 触发项目创建Webhook
    this.webhookService.triggerEvent({
      eventType: WebhookEventType.PROJECT_CREATED,
      data: savedProject,
      projectId: savedProject.id,
      userId,
    }).catch(console.error)

    return savedProject
  }

  /**
   * 查询用户所有项目
   * @param userId 用户ID
   * @returns 项目列表
   */
  async findAll(userId: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * 查询单个项目
   * @param id 项目ID
   * @returns 项目详情（含用户信息）
   */
  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['user'],
    })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    return project
  }

  /**
   * 更新项目
   * @param id 项目ID
   * @param updateProjectDto 更新数据
   * @returns 更新后的项目
   */
  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    Object.assign(project, updateProjectDto)
    const updatedProject = await this.projectRepository.save(project)

    // 触发项目更新Webhook
    this.webhookService.triggerEvent({
      eventType: WebhookEventType.PROJECT_UPDATED,
      data: updatedProject,
      projectId: id,
    }).catch(console.error)

    return updatedProject
  }

  /**
   * 删除项目
   * @param id 项目ID
   * @returns 删除结果
   */
  async remove(id: number): Promise<{ message: string }> {
    const project = await this.projectRepository.findOne({ where: { id } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    // 保存项目信息用于Webhook
    const projectData = { ...project }

    await this.projectRepository.remove(project)

    // 触发项目删除Webhook
    this.webhookService.triggerEvent({
      eventType: WebhookEventType.PROJECT_DELETED,
      data: projectData,
      projectId: id,
    }).catch(console.error)

    return { message: '删除成功' }
  }

  /**
   * 归档项目
   * @param id 项目ID
   * @returns 归档后的项目
   */
  async archive(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    project.status = 'archived'
    const updatedProject = await this.projectRepository.save(project)

    // 触发项目更新Webhook
    this.webhookService.triggerEvent({
      eventType: WebhookEventType.PROJECT_UPDATED,
      data: updatedProject,
      projectId: id,
    }).catch(console.error)

    return updatedProject
  }

  /**
   * 取消归档项目
   * @param id 项目ID
   * @returns 恢复后的项目
   */
  async unarchive(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    project.status = 'draft'
    const updatedProject = await this.projectRepository.save(project)

    // 触发项目更新Webhook
    this.webhookService.triggerEvent({
      eventType: WebhookEventType.PROJECT_UPDATED,
      data: updatedProject,
      projectId: id,
    }).catch(console.error)

    return updatedProject
  }

  /**
   * 获取用户已归档的项目
   * @param userId 用户ID
   * @returns 归档项目列表
   */
  async findArchived(userId: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: { userId, status: 'archived' },
      order: { updatedAt: 'DESC' },
    })
  }
}
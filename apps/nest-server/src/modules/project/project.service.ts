/**
 * 项目服务
 * 提供项目的 CRUD 操作
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto'

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>
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
    return this.projectRepository.save(project)
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
    return this.projectRepository.save(project)
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
    await this.projectRepository.remove(project)
    return { message: '删除成功' }
  }
}
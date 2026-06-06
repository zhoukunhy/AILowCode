import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Template } from './entities/template.entity'
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto'

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>
  ) {}

  async create(createTemplateDto: CreateTemplateDto) {
    const template = this.templateRepository.create(createTemplateDto)
    return this.templateRepository.save(template)
  }

  async findAll(category?: string) {
    const queryBuilder = this.templateRepository.createQueryBuilder('template')
    
    if (category) {
      queryBuilder.where('template.category = :category', { category })
    }

    queryBuilder.orderBy('template.downloads', 'DESC')
    return queryBuilder.getMany()
  }

  async findOne(id: number) {
    const template = await this.templateRepository.findOne({ where: { id } })
    if (!template) {
      throw new NotFoundException('模板不存在')
    }
    return template
  }

  async update(id: number, updateTemplateDto: UpdateTemplateDto) {
    const template = await this.templateRepository.findOne({ where: { id } })
    if (!template) {
      throw new NotFoundException('模板不存在')
    }
    Object.assign(template, updateTemplateDto)
    return this.templateRepository.save(template)
  }

  async remove(id: number) {
    const template = await this.templateRepository.findOne({ where: { id } })
    if (!template) {
      throw new NotFoundException('模板不存在')
    }
    await this.templateRepository.remove(template)
    return { message: '删除成功' }
  }

  async incrementDownload(id: number) {
    const template = await this.templateRepository.findOne({ where: { id } })
    if (!template) {
      throw new NotFoundException('模板不存在')
    }
    template.downloads += 1
    await this.templateRepository.save(template)
    return { message: '下载成功' }
  }
}

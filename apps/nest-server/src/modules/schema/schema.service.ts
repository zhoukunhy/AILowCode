/**
 * Schema 服务
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SchemaEntity } from './entities/schema.entity'
import { CreateSchemaDto, UpdateSchemaDto } from './dto/schema.dto'

@Injectable()
export class SchemaService {
  constructor(
    @InjectRepository(SchemaEntity)
    private schemaRepository: Repository<SchemaEntity>,
  ) {}

  /**
   * 创建 Schema
   */
  async create(createDto: CreateSchemaDto): Promise<SchemaEntity> {
    const schema = this.schemaRepository.create({
      name: createDto.name,
      tableName: createDto.tableName,
      fields: createDto.fields,
      projectId: createDto.projectId,
    })
    return this.schemaRepository.save(schema)
  }

  /**
   * 获取所有 Schema
   */
  async findAll(projectId?: number): Promise<SchemaEntity[]> {
    if (projectId) {
      return this.schemaRepository.find({ where: { projectId } })
    }
    return this.schemaRepository.find()
  }

  /**
   * 获取单个 Schema
   */
  async findOne(id: number): Promise<SchemaEntity> {
    const schema = await this.schemaRepository.findOne({ where: { id } })
    if (!schema) {
      throw new NotFoundException(`Schema with ID ${id} not found`)
    }
    return schema
  }

  /**
   * 更新 Schema
   */
  async update(id: number, updateDto: UpdateSchemaDto): Promise<SchemaEntity> {
    const schema = await this.findOne(id)
    Object.assign(schema, updateDto)
    return this.schemaRepository.save(schema)
  }

  /**
   * 删除 Schema
   */
  async remove(id: number): Promise<void> {
    const schema = await this.findOne(id)
    await this.schemaRepository.remove(schema)
  }

  /**
   * 批量创建或更新 Schema
   */
  async upsertBatch(schemas: CreateSchemaDto[]): Promise<SchemaEntity[]> {
    const results: SchemaEntity[] = []
    for (const schema of schemas) {
      const existing = await this.schemaRepository.findOne({ where: { tableName: schema.tableName } })
      if (existing) {
        Object.assign(existing, schema)
        results.push(await this.schemaRepository.save(existing))
      } else {
        results.push(await this.create(schema))
      }
    }
    return results
  }
}

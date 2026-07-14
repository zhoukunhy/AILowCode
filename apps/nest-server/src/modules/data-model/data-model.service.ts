import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DataModelEntity } from './entities/data-model.entity'
import { CreateDataModelDto, UpdateDataModelDto } from './dto/data-model.dto'

export interface EntityData {
  id: string
  name: string
  tableName: string
  description: string
  fields: FieldData[]
  dataPermissions: any[]
  softDelete: boolean
  createdAtField: boolean
  updatedAtField: boolean
}

export interface FieldData {
  id: string
  name: string
  label: string
  type: string
  required: boolean
  primaryKey: boolean
  unique: boolean
  index: boolean
  foreignKey?: {
    entityId: string
    fieldId: string
  }
  enumId?: string
}

export interface RelationData {
  id: string
  name: string
  sourceEntityId: string
  sourceFieldId?: string
  targetEntityId: string
  targetFieldId?: string
  type: string
}

export interface EnumData {
  id: string
  name: string
  label: string
  options: any[]
}

@Injectable()
export class DataModelService {
  private readonly logger = new Logger(DataModelService.name)

  constructor(
    @InjectRepository(DataModelEntity)
    private dataModelRepository: Repository<DataModelEntity>,
  ) {}

  async create(dto: CreateDataModelDto): Promise<DataModelEntity> {
    this.logger.log(`创建数据模型: ${dto.name}`)
    
    const model = this.dataModelRepository.create({
      name: dto.name,
      description: dto.description,
      entities: dto.entities,
      relations: dto.relations || [],
      enums: dto.enums || [],
      projectId: dto.projectId,
    })

    return this.dataModelRepository.save(model)
  }

  async findAll(projectId?: string): Promise<DataModelEntity[]> {
    const queryBuilder = this.dataModelRepository.createQueryBuilder('model')
    
    if (projectId) {
      queryBuilder.where('model.projectId = :projectId', { projectId })
    }

    return queryBuilder.orderBy('model.createdAt', 'DESC').getMany()
  }

  async findOne(id: string): Promise<DataModelEntity> {
    const model = await this.dataModelRepository.findOne({ where: { id } })
    
    if (!model) {
      throw new NotFoundException(`数据模型 ${id} 不存在`)
    }

    return model
  }

  async update(id: string, dto: UpdateDataModelDto): Promise<DataModelEntity> {
    const model = await this.findOne(id)

    Object.assign(model, dto)
    
    this.logger.log(`更新数据模型: ${id}`)
    return this.dataModelRepository.save(model)
  }

  async remove(id: string): Promise<void> {
    const model = await this.findOne(id)
    
    this.logger.log(`删除数据模型: ${id}`)
    await this.dataModelRepository.remove(model)
  }

  async validateModel(model: DataModelEntity): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    const entities = model.entities as EntityData[]
    const relations = model.relations as RelationData[]
    const enums = model.enums as EnumData[]

    for (const entity of entities) {
      const primaryKeys = entity.fields.filter((f: FieldData) => f.primaryKey)
      if (primaryKeys.length === 0) {
        errors.push(`实体 ${entity.name} 没有主键`)
      }

      for (const field of entity.fields) {
        if (field.foreignKey) {
          const targetEntity = entities.find((e: EntityData) => e.id === field.foreignKey!.entityId)
          if (!targetEntity) {
            errors.push(`字段 ${field.name} 的外键引用实体不存在`)
          } else {
            const targetField = targetEntity.fields.find((f: FieldData) => f.id === field.foreignKey!.fieldId)
            if (!targetField) {
              errors.push(`字段 ${field.name} 的外键引用字段不存在`)
            }
          }
        }

        if (field.enumId) {
          const enumDef = enums.find((e: EnumData) => e.id === field.enumId)
          if (!enumDef) {
            errors.push(`字段 ${field.name} 的枚举引用不存在`)
          }
        }
      }
    }

    for (const relation of relations) {
      const sourceEntity = entities.find((e: EntityData) => e.id === relation.sourceEntityId)
      const targetEntity = entities.find((e: EntityData) => e.id === relation.targetEntityId)
      
      if (!sourceEntity) {
        errors.push(`关系 ${relation.name} 的源实体不存在`)
      }
      if (!targetEntity) {
        errors.push(`关系 ${relation.name} 的目标实体不存在`)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  async getEntityById(modelId: string, entityId: string): Promise<EntityData> {
    const model = await this.findOne(modelId)
    const entities = model.entities as EntityData[]
    const entity = entities.find((e: EntityData) => e.id === entityId)
    
    if (!entity) {
      throw new NotFoundException(`实体 ${entityId} 不存在`)
    }

    return entity
  }

  async getFieldById(modelId: string, entityId: string, fieldId: string): Promise<FieldData> {
    const entity = await this.getEntityById(modelId, entityId)
    const field = entity.fields.find((f: FieldData) => f.id === fieldId)
    
    if (!field) {
      throw new NotFoundException(`字段 ${fieldId} 不存在`)
    }

    return field
  }

  async exportModel(id: string): Promise<any> {
    const model = await this.findOne(id)
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      entities: model.entities,
      relations: model.relations,
      enums: model.enums,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    }
  }
}
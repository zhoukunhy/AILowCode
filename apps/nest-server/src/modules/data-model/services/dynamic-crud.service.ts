import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { DataModelService, EntityData } from '../data-model.service'

export interface CrudResult {
  success: boolean
  data?: any
  total?: number
  message?: string
}

export interface CrudEndpoints {
  tableName: string
  entityName: string
  endpoints: {
    list: string
    detail: string
    create: string
    update: string
    delete: string
  }
}

@Injectable()
export class DynamicCrudService {
  constructor(
    private dataSource: DataSource,
    private dataModelService: DataModelService,
  ) {}

  /**
   * 查找数据模型中的实体信息（表名 + 字段列表）
   */
  private async findEntityByTable(tableName: string): Promise<{ modelId: string; entity: EntityData }> {
    const models = await this.dataModelService.findAll()
    for (const model of models) {
      const entities = model.entities as EntityData[]
      const entity = entities.find((e) => e.tableName === tableName)
      if (entity) {
        return { modelId: model.id, entity }
      }
    }
    throw new NotFoundException(`未找到表 "${tableName}" 对应的数据模型`)
  }

  /**
   * 校验字段名是否在实体定义中（防 SQL 注入）
   */
  private validateField(field: string, entity: EntityData): void {
    const fieldNames = entity.fields.map((f) => f.name)
    const extraFields = ['createdAt', 'updatedAt', 'deletedAt']
    if (!fieldNames.includes(field) && !extraFields.includes(field)) {
      throw new BadRequestException(`字段 "${field}" 不存在于表 "${entity.tableName}"`)
    }
  }

  /**
   * 获取主键字段名
   */
  private getPrimaryKeyField(entity: EntityData): string {
    const pk = entity.fields.find((f) => f.primaryKey)
    return pk ? pk.name : 'id'
  }

  /**
   * 查询列表（分页 + 条件过滤）
   */
  async listRecords(
    tableName: string,
    options: {
      page?: number
      pageSize?: number
      filters?: Record<string, string>
      sortField?: string
      sortOrder?: 'ASC' | 'DESC'
    },
  ): Promise<CrudResult> {
    const { entity } = await this.findEntityByTable(tableName)
    const page = options.page || 1
    const pageSize = Math.min(options.pageSize || 10, 100)
    const offset = (page - 1) * pageSize

    // 构建 WHERE 子句（参数化查询）
    const whereClauses: string[] = []
    const params: any[] = []

    // 软删除过滤
    if (entity.softDelete) {
      whereClauses.push('"deletedAt" IS NULL')
    }

    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        this.validateField(key, entity)
        whereClauses.push(`"${key}" = ?`)
        params.push(value)
      }
    }

    const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : ''

    // 排序
    let orderSql = ''
    if (options.sortField) {
      this.validateField(options.sortField, entity)
      orderSql = ` ORDER BY "${options.sortField}" ${options.sortOrder || 'DESC'}`
    } else {
      const pk = this.getPrimaryKeyField(entity)
      orderSql = ` ORDER BY "${pk}" DESC`
    }

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM "${tableName}"${whereSql}`
    const countResult = await this.dataSource.query(countSql, params)
    const total = countResult[0]?.total || 0

    // 查询数据
    const dataSql = `SELECT * FROM "${tableName}"${whereSql}${orderSql} LIMIT ? OFFSET ?`
    const data = await this.dataSource.query(dataSql, [...params, pageSize, offset])

    return { success: true, data, total }
  }

  /**
   * 查询单条记录
   */
  async getRecord(tableName: string, id: string): Promise<CrudResult> {
    const { entity } = await this.findEntityByTable(tableName)
    const pk = this.getPrimaryKeyField(entity)

    let sql = `SELECT * FROM "${tableName}" WHERE "${pk}" = ?`
    const params: any[] = [id]

    if (entity.softDelete) {
      sql += ` AND "deletedAt" IS NULL`
    }
    sql += ` LIMIT 1`

    const result = await this.dataSource.query(sql, params)
    if (!result || result.length === 0) {
      throw new NotFoundException(`记录 ${id} 不存在于表 ${tableName}`)
    }

    return { success: true, data: result[0] }
  }

  /**
   * 新增记录
   */
  async createRecord(tableName: string, body: Record<string, any>): Promise<CrudResult> {
    const { entity } = await this.findEntityByTable(tableName)

    // 只允许模型中定义的字段
    const allowedFields = entity.fields.map((f) => f.name)
    const insertFields: string[] = []
    const insertValues: any[] = []
    const placeholders: string[] = []

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        insertFields.push(`"${field}"`)
        insertValues.push(body[field])
        placeholders.push('?')
      }
    }

    if (insertFields.length === 0) {
      throw new BadRequestException('没有可插入的字段')
    }

    // 自动添加时间戳
    if (entity.createdAtField && !insertFields.includes('"createdAt"')) {
      insertFields.push('"createdAt"')
      insertValues.push(new Date().toISOString())
      placeholders.push('?')
    }
    if (entity.updatedAtField && !insertFields.includes('"updatedAt"')) {
      insertFields.push('"updatedAt"')
      insertValues.push(new Date().toISOString())
      placeholders.push('?')
    }

    const sql = `INSERT INTO "${tableName}" (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`
    await this.dataSource.query(sql, insertValues)

    // 获取主键值返回新记录
    const pk = this.getPrimaryKeyField(entity)
    const pkValue = body[pk]
    if (pkValue) {
      const created = await this.dataSource.query(
        `SELECT * FROM "${tableName}" WHERE "${pk}" = ? LIMIT 1`,
        [pkValue],
      )
      return { success: true, data: created[0], message: '创建成功' }
    }

    return { success: true, message: '创建成功' }
  }

  /**
   * 更新记录
   */
  async updateRecord(tableName: string, id: string, body: Record<string, any>): Promise<CrudResult> {
    const { entity } = await this.findEntityByTable(tableName)
    const pk = this.getPrimaryKeyField(entity)

    // 检查记录是否存在
    let checkSql = `SELECT 1 FROM "${tableName}" WHERE "${pk}" = ?`
    const checkParams: any[] = [id]
    if (entity.softDelete) {
      checkSql += ` AND "deletedAt" IS NULL`
    }
    const exists = await this.dataSource.query(checkSql, checkParams)
    if (!exists || exists.length === 0) {
      throw new NotFoundException(`记录 ${id} 不存在于表 ${tableName}`)
    }

    // 只允许模型中定义的字段，排除主键
    const allowedFields = entity.fields.filter((f) => !f.primaryKey).map((f) => f.name)
    const setClauses: string[] = []
    const params: any[] = []

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        setClauses.push(`"${field}" = ?`)
        params.push(body[field])
      }
    }

    // 自动更新时间戳
    if (entity.updatedAtField) {
      setClauses.push(`"updatedAt" = ?`)
      params.push(new Date().toISOString())
    }

    if (setClauses.length === 0) {
      throw new BadRequestException('没有可更新的字段')
    }

    params.push(id)
    const sql = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE "${pk}" = ?`
    await this.dataSource.query(sql, params)

    const updated = await this.dataSource.query(
      `SELECT * FROM "${tableName}" WHERE "${pk}" = ? LIMIT 1`,
      [id],
    )
    return { success: true, data: updated[0], message: '更新成功' }
  }

  /**
   * 删除记录（软删除或物理删除）
   */
  async deleteRecord(tableName: string, id: string): Promise<CrudResult> {
    const { entity } = await this.findEntityByTable(tableName)
    const pk = this.getPrimaryKeyField(entity)

    let checkSql = `SELECT 1 FROM "${tableName}" WHERE "${pk}" = ?`
    if (entity.softDelete) {
      checkSql += ` AND "deletedAt" IS NULL`
    }
    const exists = await this.dataSource.query(checkSql, [id])
    if (!exists || exists.length === 0) {
      throw new NotFoundException(`记录 ${id} 不存在于表 ${tableName}`)
    }

    if (entity.softDelete) {
      const sql = `UPDATE "${tableName}" SET "deletedAt" = ? WHERE "${pk}" = ?`
      await this.dataSource.query(sql, [new Date().toISOString(), id])
      return { success: true, message: '删除成功（软删除）' }
    } else {
      const sql = `DELETE FROM "${tableName}" WHERE "${pk}" = ?`
      await this.dataSource.query(sql, [id])
      return { success: true, message: '删除成功' }
    }
  }

  /**
   * 获取数据模型自动生成的所有 CRUD 接口地址
   */
  async getCrudEndpoints(modelId: string): Promise<CrudEndpoints[]> {
    const model = await this.dataModelService.findOne(modelId)
    const entities = model.entities as EntityData[]
    const base = '/api/dynamic-crud'

    return entities.map((entity) => ({
      tableName: entity.tableName,
      entityName: entity.name,
      endpoints: {
        list: `GET    ${base}/${entity.tableName}`,
        detail: `GET    ${base}/${entity.tableName}/:id`,
        create: `POST   ${base}/${entity.tableName}`,
        update: `PUT    ${base}/${entity.tableName}/:id`,
        delete: `DELETE ${base}/${entity.tableName}/:id`,
      },
    }))
  }
}

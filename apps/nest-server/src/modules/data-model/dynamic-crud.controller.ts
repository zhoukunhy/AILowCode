import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { DynamicCrudService } from './services/dynamic-crud.service'

@ApiTags('动态CRUD接口')
@ApiBearerAuth('JWT-auth')
@Controller('dynamic-crud')
export class DynamicCrudController {
  constructor(private readonly dynamicCrudService: DynamicCrudService) {}

  /**
   * 查询某数据模型自动生成的所有 CRUD 接口地址
   */
  @Get('endpoints/:modelId')
  @ApiOperation({ summary: '获取数据模型自动生成的CRUD接口列表' })
  async getEndpoints(@Param('modelId', ParseUUIDPipe) modelId: string) {
    return this.dynamicCrudService.getCrudEndpoints(modelId)
  }

  /**
   * 查询列表（分页 + 过滤）
   * GET /api/dynamic-crud/:tableName?page=1&pageSize=10&sortField=createdAt&sortOrder=DESC
   * 额外的 query 参数自动作为过滤条件，如 ?name=张三 → WHERE name = '张三'
   */
  @Get(':tableName')
  @ApiOperation({ summary: '查询表数据列表' })
  async list(
    @Param('tableName') tableName: string,
    @Query() query: Record<string, string>,
  ) {
    const { page, pageSize, sortField, sortOrder, ...filters } = query
    return this.dynamicCrudService.listRecords(tableName, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      sortField,
      sortOrder: sortOrder as 'ASC' | 'DESC' | undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    })
  }

  /**
   * 查询单条记录
   */
  @Get(':tableName/:id')
  @ApiOperation({ summary: '查询单条记录' })
  async findOne(
    @Param('tableName') tableName: string,
    @Param('id') id: string,
  ) {
    return this.dynamicCrudService.getRecord(tableName, id)
  }

  /**
   * 新增记录
   */
  @Post(':tableName')
  @ApiOperation({ summary: '新增记录' })
  async create(
    @Param('tableName') tableName: string,
    @Body() body: Record<string, any>,
  ) {
    return this.dynamicCrudService.createRecord(tableName, body)
  }

  /**
   * 更新记录
   */
  @Put(':tableName/:id')
  @ApiOperation({ summary: '更新记录' })
  async update(
    @Param('tableName') tableName: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.dynamicCrudService.updateRecord(tableName, id, body)
  }

  /**
   * 删除记录（软删除或物理删除）
   */
  @Delete(':tableName/:id')
  @ApiOperation({ summary: '删除记录' })
  async remove(
    @Param('tableName') tableName: string,
    @Param('id') id: string,
  ) {
    return this.dynamicCrudService.deleteRecord(tableName, id)
  }
}

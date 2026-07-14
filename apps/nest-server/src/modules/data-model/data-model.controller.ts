import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { DataModelService } from './data-model.service'
import { TableGeneratorService } from './services/table-generator.service'
import { CrudGeneratorService } from './services/crud-generator.service'
import { CreateDataModelDto, UpdateDataModelDto } from './dto/data-model.dto'

@ApiTags('数据模型')
@ApiBearerAuth('JWT-auth')
@Controller('data-model')
export class DataModelController {
  constructor(
    private readonly dataModelService: DataModelService,
    private readonly tableGeneratorService: TableGeneratorService,
    private readonly crudGeneratorService: CrudGeneratorService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建数据模型' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() dto: CreateDataModelDto) {
    return this.dataModelService.create(dto)
  }

  @Get()
  @ApiOperation({ summary: '获取数据模型列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query('projectId') projectId?: string) {
    return this.dataModelService.findAll(projectId)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据模型详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataModelService.findOne(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据模型' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDataModelDto,
  ) {
    return this.dataModelService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据模型' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.dataModelService.remove(id)
    return { success: true }
  }

  @Get(':id/validate')
  @ApiOperation({ summary: '验证数据模型' })
  @ApiResponse({ status: 200, description: '验证完成' })
  async validate(@Param('id', ParseUUIDPipe) id: string) {
    const model = await this.dataModelService.findOne(id)
    return this.dataModelService.validateModel(model)
  }

  @Get(':id/export')
  @ApiOperation({ summary: '导出数据模型' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async export(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataModelService.exportModel(id)
  }

  @Get(':id/entities/:entityId')
  @ApiOperation({ summary: '获取实体详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getEntity(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entityId') entityId: string,
  ) {
    return this.dataModelService.getEntityById(id, entityId)
  }

  @Get(':id/entities/:entityId/fields/:fieldId')
  @ApiOperation({ summary: '获取字段详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getField(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entityId') entityId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.dataModelService.getFieldById(id, entityId, fieldId)
  }

  @Post(':id/generate-tables')
  @ApiOperation({ summary: '生成数据库表SQL' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateTables(@Param('id', ParseUUIDPipe) id: string) {
    const model = await this.dataModelService.findOne(id)
    return this.tableGeneratorService.generateTables(model)
  }

  @Post(':id/execute-tables')
  @ApiOperation({ summary: '执行创建数据库表' })
  @ApiResponse({ status: 200, description: '执行成功' })
  async executeTables(@Param('id', ParseUUIDPipe) id: string) {
    const model = await this.dataModelService.findOne(id)
    return this.tableGeneratorService.executeTables(model)
  }

  @Post(':id/sync-tables')
  @ApiOperation({ summary: '同步数据库表' })
  @ApiResponse({ status: 200, description: '同步成功' })
  async syncTables(@Param('id', ParseUUIDPipe) id: string) {
    const model = await this.dataModelService.findOne(id)
    return this.tableGeneratorService.syncTables(model)
  }

  @Delete(':id/drop-tables')
  @ApiOperation({ summary: '删除数据库表' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async dropTables(@Param('id', ParseUUIDPipe) id: string) {
    const model = await this.dataModelService.findOne(id)
    return this.tableGeneratorService.dropTables(model)
  }

  @Post(':id/generate-crud')
  @ApiOperation({ summary: '生成CRUD代码' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateCrud(@Param('id', ParseUUIDPipe) id: string) {
    const model = await this.dataModelService.findOne(id)
    return this.crudGeneratorService.generateCrudCode(model)
  }
}
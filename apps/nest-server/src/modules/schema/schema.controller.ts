/**
 * Schema 控制器
 */
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { SchemaService } from './schema.service'
import { CreateSchemaDto, UpdateSchemaDto } from './dto/schema.dto'
import { SchemaEntity } from './entities/schema.entity'

@ApiTags('数据表Schema管理')
@Controller('schema')
export class SchemaController {
  constructor(private schemaService: SchemaService) {}

  @Post()
  @ApiOperation({ summary: '创建数据表Schema' })
  @ApiResponse({ status: 201, type: SchemaEntity })
  async create(@Body() createDto: CreateSchemaDto) {
    return this.schemaService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: '获取所有数据表Schema' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200, type: [SchemaEntity] })
  async findAll(@Query('projectId') projectId?: number) {
    return this.schemaService.findAll(projectId)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个数据表Schema' })
  @ApiResponse({ status: 200, type: SchemaEntity })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schemaService.findOne(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据表Schema' })
  @ApiResponse({ status: 200, type: SchemaEntity })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSchemaDto,
  ) {
    return this.schemaService.update(id, updateDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据表Schema' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.schemaService.remove(id)
    return { message: 'Schema deleted successfully' }
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建或更新Schema' })
  @ApiResponse({ status: 201, type: [SchemaEntity] })
  async upsertBatch(@Body() schemas: CreateSchemaDto[]) {
    return this.schemaService.upsertBatch(schemas)
  }
}

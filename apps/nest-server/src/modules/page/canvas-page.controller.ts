import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger'
import { PageService } from './page.service'
import { CreatePageDto, UpdatePageDto, QueryPageDto } from './dto/page.dto'

/**
 * 画布页面独立控制器
 * 不依赖项目ID，直接管理画布页面
 */
@ApiTags('canvas-pages')
@ApiBearerAuth('JWT-auth')
@Controller('api/canvas-pages')
export class CanvasPageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  @ApiOperation({ summary: '创建画布页面' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createPageDto: CreatePageDto) {
    // 不关联项目，直接创建页面
    return this.pageService.create(0, createPageDto)
  }

  @Get()
  @ApiOperation({ summary: '获取所有画布页面' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() query: QueryPageDto) {
    return this.pageService.findAll(0, query)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个画布页面' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pageService.findOne(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新画布页面' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePageDto: UpdatePageDto
  ) {
    return this.pageService.update(id, updatePageDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除画布页面' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pageService.remove(id)
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '复制画布页面' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 201, description: '复制成功' })
  duplicate(
    @Param('id', ParseIntPipe) id: number,
    @Body('newName') newName: string
  ) {
    return this.pageService.duplicate(id, newName)
  }

  @Put(':id/canvas')
  @ApiOperation({ summary: '保存画布 JSON' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '保存成功' })
  saveCanvasJson(
    @Param('id', ParseIntPipe) id: number,
    @Body('canvasJson') canvasJson: any,
    @Body('userId') userId?: number
  ) {
    return this.pageService.saveCanvasJson(id, canvasJson, userId)
  }

  @Get(':id/export')
  @ApiOperation({ summary: '导出画布 JSON' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '导出成功' })
  exportCanvasJson(@Param('id', ParseIntPipe) id: number) {
    return this.pageService.exportCanvasJson(id)
  }

  @Post('import')
  @ApiOperation({ summary: '导入画布 JSON' })
  @ApiResponse({ status: 201, description: '导入成功' })
  importCanvasJson(
    @Body() importData: { name: string; canvasJson: any; pageConfig?: any }
  ) {
    return this.pageService.importCanvasJson(0, importData)
  }
}

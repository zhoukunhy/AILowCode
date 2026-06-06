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
 * 页面画布配置控制器
 * 提供页面的 CRUD 接口
 */
@ApiTags('pages')
@ApiBearerAuth('JWT-auth')
@Controller('projects/:projectId/pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  @ApiOperation({ summary: '创建页面' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createPageDto: CreatePageDto
  ) {
    return this.pageService.create(projectId, createPageDto)
  }

  @Get()
  @ApiOperation({ summary: '获取项目所有页面' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: QueryPageDto
  ) {
    return this.pageService.findAll(projectId, query)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个页面详情' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.pageService.findOne(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新页面' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePageDto: UpdatePageDto
  ) {
    return this.pageService.update(id, updatePageDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除页面' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.pageService.remove(id)
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '复制页面' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 201, description: '复制成功' })
  duplicate(
    @Param('id', ParseIntPipe) id: number,
    @Body('newName') newName: string
  ) {
    return this.pageService.duplicate(id, newName)
  }

  @Put(':id/canvas')
  @ApiOperation({ summary: '保存画布 JSON（自动保存）' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiParam({ name: 'id', description: '页面ID' })
  @ApiResponse({ status: 200, description: '保存成功' })
  saveCanvasJson(
    @Param('id', ParseIntPipe) id: number,
    @Body('canvasJson') canvasJson: any
  ) {
    return this.pageService.saveCanvasJson(id, canvasJson)
  }
}

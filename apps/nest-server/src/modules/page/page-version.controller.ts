import {
  Controller,
  Get,
  Post,
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
import { PageVersionService } from './page-version.service'
import { CreatePageVersionDto, QueryPageVersionDto, RollbackVersionDto } from './dto/page-version.dto'

/**
 * 页面版本控制器
 * 提供版本快照、版本历史、回滚和版本对比功能
 */
@ApiTags('page-versions')
@ApiBearerAuth('JWT-auth')
@Controller('pages/:pageId/versions')
export class PageVersionController {
  constructor(private readonly versionService: PageVersionService) {}

  @Post()
  @ApiOperation({ summary: '创建版本快照' })
  @ApiParam({ name: 'pageId', description: '页面ID' })
  @ApiResponse({ status: 201, description: '创建成功' })
  createSnapshot(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() createDto: CreatePageVersionDto
  ) {
    return this.versionService.createSnapshot(
      pageId,
      createDto.canvasJson,
      createDto.createdBy,
      createDto.description
    )
  }

  @Get()
  @ApiOperation({ summary: '获取页面版本历史' })
  @ApiParam({ name: 'pageId', description: '页面ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPageVersions(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Query() query: QueryPageVersionDto
  ) {
    return this.versionService.findPageVersions(pageId, query)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取版本详情' })
  @ApiParam({ name: 'pageId', description: '页面ID' })
  @ApiParam({ name: 'id', description: '版本ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.versionService.findOne(id)
  }

  @Get(':id/canvas-json')
  @ApiOperation({ summary: '获取版本的画布JSON' })
  @ApiParam({ name: 'pageId', description: '页面ID' })
  @ApiParam({ name: 'id', description: '版本ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getVersionCanvasJson(@Param('id', ParseIntPipe) id: number) {
    return this.versionService.getVersionCanvasJson(id)
  }

  @Post(':id/rollback')
  @ApiOperation({ summary: '回滚到指定版本' })
  @ApiParam({ name: 'pageId', description: '页面ID' })
  @ApiParam({ name: 'id', description: '版本ID' })
  @ApiResponse({ status: 200, description: '回滚成功' })
  rollback(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() rollbackDto: RollbackVersionDto
  ) {
    return this.versionService.rollback(pageId, id, rollbackDto)
  }

  @Get('compare')
  @ApiOperation({ summary: '对比两个版本' })
  @ApiParam({ name: 'pageId', description: '页面ID' })
  @ApiResponse({ status: 200, description: '对比成功' })
  compareVersions(
    @Query('versionId1', ParseIntPipe) versionId1: number,
    @Query('versionId2', ParseIntPipe) versionId2: number
  ) {
    return this.versionService.compareVersions(versionId1, versionId2)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除版本' })
  @ApiParam({ name: 'pageId', description: '页面ID' })
  @ApiParam({ name: 'id', description: '版本ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.versionService.remove(id)
  }
}
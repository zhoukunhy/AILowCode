import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CustomComponentService } from './custom-component.service'
import { CreateCustomComponentDto, UpdateCustomComponentDto } from './dto/custom-component.dto'

@ApiTags('自定义组件')
@Controller('custom-components')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CustomComponentController {
  constructor(private readonly service: CustomComponentService) {}

  @Post()
  @ApiOperation({ summary: '创建自定义组件' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Request() req: any, @Body() dto: CreateCustomComponentDto) {
    return await this.service.create(req.user.id, dto)
  }

  @Put(':componentId')
  @ApiOperation({ summary: '更新自定义组件' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Request() req: any,
    @Param('componentId') componentId: string,
    @Body() dto: UpdateCustomComponentDto
  ) {
    return await this.service.update(req.user.id, componentId, dto)
  }

  @Get()
  @ApiOperation({ summary: '获取用户的自定义组件列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Request() req: any) {
    return await this.service.findAllByUser(req.user.id)
  }

  @Get('published')
  @ApiOperation({ summary: '获取所有已发布的组件' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAllPublished() {
    return await this.service.findAllPublished()
  }

  @Get('stats')
  @ApiOperation({ summary: '获取组件统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats(@Request() req: any) {
    return await this.service.getStats(req.user.id)
  }

  @Get('search')
  @ApiOperation({ summary: '搜索组件' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async search(@Request() req: any, @Query('q') query: string) {
    return await this.service.search(query, req.user.id)
  }

  @Get('category/:category')
  @ApiOperation({ summary: '按分类获取组件' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByCategory(@Request() req: any, @Param('category') category: string) {
    return await this.service.findByCategory(category, req.user.id)
  }

  @Get(':componentId')
  @ApiOperation({ summary: '获取组件详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Request() req: any, @Param('componentId') componentId: string) {
    return await this.service.findOne(componentId, req.user.id)
  }

  @Delete(':componentId')
  @ApiOperation({ summary: '删除组件' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Request() req: any, @Param('componentId') componentId: string) {
    await this.service.remove(req.user.id, componentId)
    return { success: true, message: '组件已删除' }
  }

  @Post(':componentId/publish')
  @ApiOperation({ summary: '发布组件' })
  @ApiResponse({ status: 200, description: '发布成功' })
  async publish(@Request() req: any, @Param('componentId') componentId: string) {
    return await this.service.publish(req.user.id, componentId)
  }

  @Post(':componentId/unpublish')
  @ApiOperation({ summary: '取消发布组件' })
  @ApiResponse({ status: 200, description: '取消发布成功' })
  async unpublish(@Request() req: any, @Param('componentId') componentId: string) {
    return await this.service.unpublish(req.user.id, componentId)
  }

  @Post(':componentId/copy')
  @ApiOperation({ summary: '复制组件' })
  @ApiResponse({ status: 201, description: '复制成功' })
  async copy(
    @Request() req: any,
    @Param('componentId') componentId: string,
    @Query('name') newName?: string
  ) {
    return await this.service.copy(req.user.id, componentId, newName)
  }
}
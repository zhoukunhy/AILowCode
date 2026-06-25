/**
 * 画布控制器（MCP 集成版）
 * 提供画布管理 RESTful API，集成 MCP 工具调用能力
 */
import { Controller, Get, Post, Put, Delete, Patch, Param, Body, NotFoundException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CanvasService, Canvas } from './canvas.service'

@ApiTags('画布')
@Controller('api/canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get()
  @ApiOperation({ summary: '获取画布列表' })
  findAll(): Canvas[] {
    return this.canvasService.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: '获取画布详情' })
  findOne(@Param('id') id: string): Canvas {
    const canvas = this.canvasService.findOne(id)
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }

  @Post()
  @ApiOperation({ summary: '创建画布' })
  create(@Body() canvas: Omit<Canvas, 'id' | 'createdAt' | 'updatedAt'>): Canvas {
    return this.canvasService.create(canvas)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新画布' })
  update(@Param('id') id: string, @Body() updates: Partial<Canvas>): Canvas {
    const canvas = this.canvasService.update(id, updates)
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除画布' })
  delete(@Param('id') id: string): { success: boolean } {
    const success = this.canvasService.delete(id)
    if (!success) {
      throw new NotFoundException('画布不存在')
    }
    return { success }
  }

  @Post(':id/copy')
  @ApiOperation({ summary: '复制画布' })
  copy(@Param('id') id: string): Canvas {
    const canvas = this.canvasService.copy(id)
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }

  @Patch(':id/model')
  @ApiOperation({ summary: '更新画布数据模型' })
  updateDataModel(@Param('id') id: string, @Body() body: { dataModelId: string }): Canvas {
    const canvas = this.canvasService.updateDataModel(id, body.dataModelId)
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }

  // ==================== MCP 工具集成 API ====================

  /**
   * 分析画布关联的数据模型
   * 调用 MCP SQL_DDL 工具获取表结构
   */
  @Post(':id/analyze-model')
  @ApiOperation({ summary: '分析画布数据模型（MCP SQL_DDL）' })
  @ApiResponse({ status: 200, description: '分析成功' })
  @ApiResponse({ status: 404, description: '画布不存在' })
  async analyzeDataModel(@Param('id') id: string, @Body() body: { tableName: string }): Promise<any> {
    return this.canvasService.analyzeDataModel(id, body.tableName)
  }

  /**
   * 测试画布关联的 API 端点
   * 调用 MCP Http_Test 工具验证 API
   */
  @Post(':id/test-api')
  @ApiOperation({ summary: '测试画布 API（MCP Http_Test）' })
  @ApiResponse({ status: 200, description: '测试成功' })
  @ApiResponse({ status: 404, description: '画布不存在' })
  async testApiEndpoint(
    @Param('id') id: string,
    @Body() body: { url: string; method?: string; headers?: Record<string, string>; body?: any }
  ): Promise<any> {
    return this.canvasService.testApiEndpoint(id, body)
  }

  /**
   * 为画布生成后端代码
   * 调用 MCP Nest_Crud 工具生成 NestJS 模块
   */
  @Post(':id/generate-backend')
  @ApiOperation({ summary: '生成后端代码（MCP Nest_Crud）' })
  @ApiResponse({ status: 200, description: '生成成功' })
  @ApiResponse({ status: 404, description: '画布不存在' })
  async generateBackendCode(
    @Param('id') id: string,
    @Body() body: { entityName: string; fields: Array<{ name: string; type: string; required: boolean }> }
  ): Promise<any> {
    return this.canvasService.generateBackendCode(id, body.entityName, body.fields)
  }

  /**
   * 获取画布的 MCP 工具执行历史
   */
  @Get(':id/tool-history')
  @ApiOperation({ summary: '获取画布 MCP 工具执行历史' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getToolHistory(@Param('id') id: string): Promise<any[]> {
    return this.canvasService.getToolHistory(id)
  }
}

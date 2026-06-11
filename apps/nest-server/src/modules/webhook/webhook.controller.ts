import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { WebhookService } from './webhook.service'
import { CreateWebhookDto, UpdateWebhookDto, TestWebhookDto } from './dto/webhook.dto'
import { WebhookLogStatus } from '@ai-lowcode/shared-types'

/**
 * Webhook 控制器
 * 提供Webhook管理的API接口
 */
@ApiTags('Webhook')
@ApiBearerAuth('JWT-auth')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * 创建Webhook
   */
  @Post()
  @ApiOperation({ summary: '创建Webhook' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createWebhook(@Body() createWebhookDto: CreateWebhookDto) {
    return this.webhookService.createWebhook(createWebhookDto)
  }

  /**
   * 获取所有Webhook
   */
  @Get()
  @ApiOperation({ summary: '获取所有Webhook' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllWebhooks(@Query('projectId', ParseIntPipe) projectId?: number) {
    return this.webhookService.getAllWebhooks(projectId)
  }

  /**
   * 获取单个Webhook
   */
  @Get(':id')
  @ApiOperation({ summary: '获取单个Webhook' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getWebhookById(@Param('id', ParseIntPipe) id: number) {
    return this.webhookService.getWebhookById(id)
  }

  /**
   * 更新Webhook
   */
  @Put(':id')
  @ApiOperation({ summary: '更新Webhook' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateWebhook(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return this.webhookService.updateWebhook(id, updateWebhookDto)
  }

  /**
   * 删除Webhook
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除Webhook' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteWebhook(@Param('id', ParseIntPipe) id: number) {
    return this.webhookService.deleteWebhook(id)
  }

  /**
   * 启用Webhook
   */
  @Post(':id/enable')
  @ApiOperation({ summary: '启用Webhook' })
  @ApiResponse({ status: 200, description: '启用成功' })
  async enableWebhook(@Param('id', ParseIntPipe) id: number) {
    return this.webhookService.toggleWebhook(id, true)
  }

  /**
   * 禁用Webhook
   */
  @Post(':id/disable')
  @ApiOperation({ summary: '禁用Webhook' })
  @ApiResponse({ status: 200, description: '禁用成功' })
  async disableWebhook(@Param('id', ParseIntPipe) id: number) {
    return this.webhookService.toggleWebhook(id, false)
  }

  /**
   * 测试Webhook
   */
  @Post(':id/test')
  @ApiOperation({ summary: '测试Webhook' })
  @ApiResponse({ status: 200, description: '测试完成' })
  async testWebhook(
    @Param('id', ParseIntPipe) id: number,
    @Body() testWebhookDto?: TestWebhookDto,
  ) {
    return this.webhookService.testWebhook(id, testWebhookDto?.testData)
  }

  /**
   * 获取Webhook日志
   */
  @Get(':id/logs')
  @ApiOperation({ summary: '获取Webhook日志' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getWebhookLogs(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: WebhookLogStatus,
  ) {
    return this.webhookService.getWebhookLogs(id, status)
  }

  /**
   * 获取日志详情
   */
  @Get('logs/:logId')
  @ApiOperation({ summary: '获取日志详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getLogById(@Param('logId', ParseIntPipe) logId: number) {
    return this.webhookService.getLogById(logId)
  }

  /**
   * 获取所有日志
   */
  @Get('logs')
  @ApiOperation({ summary: '获取所有Webhook日志' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllLogs(@Query('status') status?: WebhookLogStatus) {
    return this.webhookService.getWebhookLogs(undefined, status)
  }

  /**
   * 获取事件类型列表
   */
  @Get('events')
  @ApiOperation({ summary: '获取事件类型列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getEventTypes() {
    return this.webhookService.getEventTypes()
  }
}
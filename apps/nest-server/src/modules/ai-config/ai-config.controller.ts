import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AIConfigService } from './ai-config.service'
import { CreateAIConfigDto, UpdateAIConfigDto, CreateVectorStoreConfigDto, UpdateVectorStoreConfigDto } from './dto/ai-config.dto'

/**
 * AI 配置控制器
 * 管理 LLM 和向量库配置
 */
@ApiTags('AI配置')
@ApiBearerAuth('JWT-auth')
@Controller('ai-config')
export class AIConfigController {
  constructor(private readonly aiConfigService: AIConfigService) {}

  // ==================== LLM 配置相关 ====================

  @Post('llm')
  @ApiOperation({ summary: '创建 LLM 配置' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createAIConfig(@Body() createDto: CreateAIConfigDto) {
    return this.aiConfigService.createAIConfig(createDto)
  }

  @Get('llm')
  @ApiOperation({ summary: '获取所有 LLM 配置' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllAIConfigs() {
    return this.aiConfigService.getAllAIConfigs()
  }

  @Get('llm/active')
  @ApiOperation({ summary: '获取启用的 LLM 配置' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getActiveAIConfigs() {
    return this.aiConfigService.getActiveAIConfigs()
  }

  @Get('llm/:id')
  @ApiOperation({ summary: '获取单个 LLM 配置' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAIConfigById(@Param('id', ParseIntPipe) id: number) {
    return this.aiConfigService.getAIConfigById(id)
  }

  @Put('llm/:id')
  @ApiOperation({ summary: '更新 LLM 配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateAIConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAIConfigDto
  ) {
    return this.aiConfigService.updateAIConfig(id, updateDto)
  }

  @Delete('llm/:id')
  @ApiOperation({ summary: '删除 LLM 配置' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteAIConfig(@Param('id', ParseIntPipe) id: number) {
    await this.aiConfigService.deleteAIConfig(id)
    return { message: '删除成功' }
  }

  // ==================== 向量库配置相关 ====================

  @Post('vector-store')
  @ApiOperation({ summary: '创建向量库配置' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createVectorStoreConfig(@Body() createDto: CreateVectorStoreConfigDto) {
    return this.aiConfigService.createVectorStoreConfig(createDto)
  }

  @Get('vector-store')
  @ApiOperation({ summary: '获取所有向量库配置' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllVectorStoreConfigs() {
    return this.aiConfigService.getAllVectorStoreConfigs()
  }

  @Get('vector-store/active')
  @ApiOperation({ summary: '获取启用的向量库配置' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getActiveVectorStoreConfigs() {
    return this.aiConfigService.getActiveVectorStoreConfigs()
  }

  @Get('vector-store/:id')
  @ApiOperation({ summary: '获取单个向量库配置' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getVectorStoreConfigById(@Param('id', ParseIntPipe) id: number) {
    return this.aiConfigService.getVectorStoreConfigById(id)
  }

  @Put('vector-store/:id')
  @ApiOperation({ summary: '更新向量库配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateVectorStoreConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVectorStoreConfigDto
  ) {
    return this.aiConfigService.updateVectorStoreConfig(id, updateDto)
  }

  @Delete('vector-store/:id')
  @ApiOperation({ summary: '删除向量库配置' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteVectorStoreConfig(@Param('id', ParseIntPipe) id: number) {
    await this.aiConfigService.deleteVectorStoreConfig(id)
    return { message: '删除成功' }
  }
}

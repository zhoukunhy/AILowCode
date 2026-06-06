/**
 * 数据源控制器
 */
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseInterceptors, 
  UploadedFile,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Response } from 'express'
import { DataSourceService } from './data-source.service'
import { 
  CreateDataSourceDto, 
  UpdateDataSourceDto, 
  PreviewDataDto, 
  CreatePluginDto 
} from './dto/data-source.dto'
import { DataSourceEntity } from './entities/data-source.entity'
import { PluginEntity } from './entities/plugin.entity'

@ApiTags('数据源管理')
@Controller('data-source')
export class DataSourceController {
  constructor(private dataSourceService: DataSourceService) {}

  // ==================== 数据源 CRUD ====================

  @Post()
  @ApiOperation({ summary: '创建数据源' })
  @ApiResponse({ status: 201, type: DataSourceEntity })
  async createDataSource(@Body() dto: CreateDataSourceDto) {
    return this.dataSourceService.createDataSource(dto)
  }

  @Get()
  @ApiOperation({ summary: '获取所有数据源' })
  @ApiResponse({ status: 200, type: [DataSourceEntity] })
  async getAllDataSources() {
    return this.dataSourceService.getAllDataSources()
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据源详情' })
  @ApiResponse({ status: 200, type: DataSourceEntity })
  async getDataSourceById(@Param('id') id: number) {
    return this.dataSourceService.getDataSourceById(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据源' })
  @ApiResponse({ status: 200, type: DataSourceEntity })
  async updateDataSource(@Param('id') id: number, @Body() dto: UpdateDataSourceDto) {
    return this.dataSourceService.updateDataSource(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据源' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDataSource(@Param('id') id: number) {
    return this.dataSourceService.deleteDataSource(id)
  }

  @Post(':id/test')
  @ApiOperation({ summary: '测试数据源连接' })
  async testConnection(@Param('id') id: number) {
    return this.dataSourceService.testConnection(id)
  }

  @Post('preview')
  @ApiOperation({ summary: '预览数据' })
  async previewData(@Body() dto: PreviewDataDto) {
    return this.dataSourceService.previewData(dto)
  }

  @Get(':id/metadata')
  @ApiOperation({ summary: '获取数据源元数据' })
  async getMetadata(@Param('id') id: number) {
    return this.dataSourceService.getMetadata(id)
  }

  // ==================== 插件管理 ====================

  @Post('plugin/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传插件' })
  @ApiResponse({ status: 201, type: PluginEntity })
  async uploadPlugin(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreatePluginDto
  ) {
    return this.dataSourceService.uploadPlugin(file, dto)
  }

  @Get('plugin')
  @ApiOperation({ summary: '获取所有插件' })
  @ApiResponse({ status: 200, type: [PluginEntity] })
  async getAllPlugins() {
    return this.dataSourceService.getAllPlugins()
  }

  @Get('plugin/:id')
  @ApiOperation({ summary: '获取插件详情' })
  @ApiResponse({ status: 200, type: PluginEntity })
  async getPluginById(@Param('id') id: number) {
    return this.dataSourceService.getPluginById(id)
  }

  @Delete('plugin/:id')
  @ApiOperation({ summary: '删除插件' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlugin(@Param('id') id: number) {
    return this.dataSourceService.deletePlugin(id)
  }

  @Get('plugin/:id/download')
  @ApiOperation({ summary: '下载插件文件' })
  async downloadPlugin(@Param('id') id: number, @Res() res: Response) {
    const plugin = await this.dataSourceService.getPluginById(id)
    const fileBuffer = await this.dataSourceService.getPluginFile(id)

    res.set({
      'Content-Type': 'application/wasm',
      'Content-Disposition': `attachment; filename="${plugin.name}.wasm"`,
    })

    res.send(fileBuffer)
  }
}

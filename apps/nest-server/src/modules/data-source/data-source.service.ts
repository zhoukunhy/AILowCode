/**
 * 数据源服务
 */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import { DataSourceEntity } from './entities/data-source.entity'
import { PluginEntity } from './entities/plugin.entity'
import { 
  CreateDataSourceDto, 
  UpdateDataSourceDto, 
  PreviewDataDto, 
  CreatePluginDto,
  DataSourceType 
} from './dto/data-source.dto'
import { DataSourceManager, createDataSourceManager } from '@ai-lowcode/datasource-core'

@Injectable()
export class DataSourceService {
  private readonly logger = new Logger(DataSourceService.name)
  private dataSourceManager = createDataSourceManager()
  private pluginStoragePath = path.join(__dirname, '..', '..', '..', 'plugins')

  constructor(
    @InjectRepository(DataSourceEntity)
    private dataSourceRepository: Repository<DataSourceEntity>,
    @InjectRepository(PluginEntity)
    private pluginRepository: Repository<PluginEntity>,
  ) {
    // 确保插件存储目录存在
    if (!fs.existsSync(this.pluginStoragePath)) {
      fs.mkdirSync(this.pluginStoragePath, { recursive: true })
    }
  }

  // ==================== 数据源管理 ====================

  /**
   * 创建数据源
   */
  async createDataSource(dto: CreateDataSourceDto): Promise<DataSourceEntity> {
    try {
      // 验证配置
      const validation = await this.dataSourceManager.validateDataSource(
        dto.type,
        dto.config
      )

      if (!validation.success) {
        throw new BadRequestException(`配置验证失败: ${validation.error}`)
      }

      const dataSource = this.dataSourceRepository.create({
        ...dto,
        connectionStatus: 'connected',
      })

      const saved = await this.dataSourceRepository.save(dataSource)

      // 注册到管理器
      await this.dataSourceManager.registerDataSource(
        saved.id.toString(),
        dto.type,
        dto.config
      )

      this.logger.log(`数据源创建成功: ${saved.name}`)
      return saved
    } catch (error: any) {
      this.logger.error(`创建数据源失败: ${error.message}`)
      throw new BadRequestException(`创建数据源失败: ${error.message}`)
    }
  }

  /**
   * 获取所有数据源
   */
  async getAllDataSources(): Promise<DataSourceEntity[]> {
    return this.dataSourceRepository.find({
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * 获取数据源详情
   */
  async getDataSourceById(id: number): Promise<DataSourceEntity> {
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id },
    })

    if (!dataSource) {
      throw new NotFoundException('数据源不存在')
    }

    return dataSource
  }

  /**
   * 更新数据源
   */
  async updateDataSource(id: number, dto: UpdateDataSourceDto): Promise<DataSourceEntity> {
    const dataSource = await this.getDataSourceById(id)

    if (dto.config) {
      // 验证新配置
      const validation = await this.dataSourceManager.validateDataSource(
        dataSource.type as any,
        dto.config
      )

      if (!validation.success) {
        throw new BadRequestException(`配置验证失败: ${validation.error}`)
      }
    }

    Object.assign(dataSource, dto)
    const updated = await this.dataSourceRepository.save(dataSource)

    this.logger.log(`数据源更新成功: ${updated.name}`)
    return updated
  }

  /**
   * 删除数据源
   */
  async deleteDataSource(id: number): Promise<void> {
    const dataSource = await this.getDataSourceById(id)
    
    // 从管理器移除
    await this.dataSourceManager.removeDataSource(id.toString())
    
    // 删除记录
    await this.dataSourceRepository.remove(dataSource)
    
    this.logger.log(`数据源删除成功: ${dataSource.name}`)
  }

  /**
   * 测试数据源连接
   */
  async testConnection(id: number): Promise<{ success: boolean; error?: string }> {
    const dataSource = await this.getDataSourceById(id)

    try {
      const validation = await this.dataSourceManager.validateDataSource(
        dataSource.type as any,
        dataSource.config
      )

      // 更新连接状态
      dataSource.connectionStatus = validation.success ? 'connected' : 'disconnected'
      await this.dataSourceRepository.save(dataSource)

      return validation
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 预览数据
   */
  async previewData(dto: PreviewDataDto): Promise<{ rows: any[]; total: number; fields?: any[] }> {
    try {
      const dataSource = await this.getDataSourceById(dto.dataSourceId)
      
      // 注册数据源（如果未注册）
      if (!this.dataSourceManager.getDataSource(dataSource.id.toString())) {
        await this.dataSourceManager.registerDataSource(
          dataSource.id.toString(),
          dataSource.type as any,
          dataSource.config
        )
      }

      // 创建临时绑定
      const bindingId = `preview-${uuidv4()}`
      this.dataSourceManager.createBinding({
        id: bindingId,
        dataSourceId: dataSource.id.toString(),
        componentId: 'preview',
        fieldMapping: {},
        queryConfig: dto.queryConfig,
      })

      // 预览数据
      const result = await this.dataSourceManager.previewData(bindingId)

      // 清理绑定
      this.dataSourceManager.removeBinding(bindingId)

      return {
        rows: result.data,
        total: result.total,
        fields: result.fields,
      }
    } catch (error: any) {
      this.logger.error(`预览数据失败: ${error.message}`)
      throw new BadRequestException(`预览数据失败: ${error.message}`)
    }
  }

  /**
   * 获取数据源元数据（表结构/API端点）
   */
  async getMetadata(id: number): Promise<any> {
    const dataSource = await this.getDataSourceById(id)

    if (!this.dataSourceManager.getDataSource(dataSource.id.toString())) {
      await this.dataSourceManager.registerDataSource(
        dataSource.id.toString(),
        dataSource.type as any,
        dataSource.config
      )
    }

    return this.dataSourceManager.getTableMetadata(dataSource.id.toString())
  }

  // ==================== 插件管理 ====================

  /**
   * 上传插件
   */
  async uploadPlugin(file: Express.Multer.File, dto: CreatePluginDto): Promise<PluginEntity> {
    try {
      // 生成唯一文件名
      const fileName = `${dto.name}-${dto.version}-${uuidv4()}.wasm`
      const filePath = path.join(this.pluginStoragePath, fileName)

      // 保存文件
      fs.writeFileSync(filePath, file.buffer)

      // 创建插件记录
      const plugin = this.pluginRepository.create({
        ...dto,
        filePath: `/plugins/${fileName}`,
        metadata: {},
        status: 'uploaded',
      })

      const saved = await this.pluginRepository.save(plugin)

      this.logger.log(`插件上传成功: ${saved.name}`)
      return saved
    } catch (error: any) {
      this.logger.error(`插件上传失败: ${error.message}`)
      throw new BadRequestException(`插件上传失败: ${error.message}`)
    }
  }

  /**
   * 获取所有插件
   */
  async getAllPlugins(): Promise<PluginEntity[]> {
    return this.pluginRepository.find({
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * 获取插件详情
   */
  async getPluginById(id: number): Promise<PluginEntity> {
    const plugin = await this.pluginRepository.findOne({
      where: { id },
    })

    if (!plugin) {
      throw new NotFoundException('插件不存在')
    }

    return plugin
  }

  /**
   * 删除插件
   */
  async deletePlugin(id: number): Promise<void> {
    const plugin = await this.getPluginById(id)

    // 删除文件
    try {
      const filePath = path.join(this.pluginStoragePath, path.basename(plugin.filePath))
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      this.logger.warn(`删除插件文件失败: ${error.message}`)
    }

    // 删除记录
    await this.pluginRepository.remove(plugin)

    this.logger.log(`插件删除成功: ${plugin.name}`)
  }

  /**
   * 获取插件文件
   */
  async getPluginFile(id: number): Promise<Buffer> {
    const plugin = await this.getPluginById(id)
    
    const filePath = path.join(this.pluginStoragePath, path.basename(plugin.filePath))
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('插件文件不存在')
    }

    return fs.readFileSync(filePath)
  }
}

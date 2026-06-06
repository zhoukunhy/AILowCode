import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AIConfigEntity } from './entities/ai-config.entity'
import { VectorStoreConfigEntity } from './entities/vector-store-config.entity'
import { CreateAIConfigDto, UpdateAIConfigDto, CreateVectorStoreConfigDto, UpdateVectorStoreConfigDto } from './dto/ai-config.dto'

/**
 * AI 配置服务
 * 管理 LLM 和向量库配置
 */
@Injectable()
export class AIConfigService {
  constructor(
    @InjectRepository(AIConfigEntity)
    private aiConfigRepository: Repository<AIConfigEntity>,
    @InjectRepository(VectorStoreConfigEntity)
    private vectorStoreConfigRepository: Repository<VectorStoreConfigEntity>
  ) {}

  // ==================== LLM 配置相关 ====================

  /**
   * 创建 AI 配置
   */
  async createAIConfig(createDto: CreateAIConfigDto): Promise<AIConfigEntity> {
    const config = this.aiConfigRepository.create(createDto)
    return this.aiConfigRepository.save(config)
  }

  /**
   * 获取所有 AI 配置
   */
  async getAllAIConfigs(): Promise<AIConfigEntity[]> {
    return this.aiConfigRepository.find({
      where: { deletedAt: undefined as any },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * 获取启用的 AI 配置
   */
  async getActiveAIConfigs(): Promise<AIConfigEntity[]> {
    return this.aiConfigRepository.find({
      where: { isActive: true, deletedAt: undefined as any },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * 获取单个 AI 配置
   */
  async getAIConfigById(id: number): Promise<AIConfigEntity> {
    const config = await this.aiConfigRepository.findOne({
      where: { id },
    })
    if (!config) {
      throw new NotFoundException('AI 配置不存在')
    }
    return config
  }

  /**
   * 更新 AI 配置
   */
  async updateAIConfig(id: number, updateDto: UpdateAIConfigDto): Promise<AIConfigEntity> {
    const config = await this.getAIConfigById(id)
    Object.assign(config, updateDto)
    return this.aiConfigRepository.save(config)
  }

  /**
   * 删除 AI 配置（软删除）
   */
  async deleteAIConfig(id: number): Promise<void> {
    const config = await this.getAIConfigById(id)
    await this.aiConfigRepository.softRemove(config)
  }

  // ==================== 向量库配置相关 ====================

  /**
   * 创建向量库配置
   */
  async createVectorStoreConfig(createDto: CreateVectorStoreConfigDto): Promise<VectorStoreConfigEntity> {
    const config = this.vectorStoreConfigRepository.create(createDto)
    return this.vectorStoreConfigRepository.save(config)
  }

  /**
   * 获取所有向量库配置
   */
  async getAllVectorStoreConfigs(): Promise<VectorStoreConfigEntity[]> {
    return this.vectorStoreConfigRepository.find({
      where: { deletedAt: undefined as any },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * 获取启用的向量库配置
   */
  async getActiveVectorStoreConfigs(): Promise<VectorStoreConfigEntity[]> {
    return this.vectorStoreConfigRepository.find({
      where: { isActive: true, deletedAt: undefined as any },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * 获取单个向量库配置
   */
  async getVectorStoreConfigById(id: number): Promise<VectorStoreConfigEntity> {
    const config = await this.vectorStoreConfigRepository.findOne({
      where: { id },
    })
    if (!config) {
      throw new NotFoundException('向量库配置不存在')
    }
    return config
  }

  /**
   * 更新向量库配置
   */
  async updateVectorStoreConfig(id: number, updateDto: UpdateVectorStoreConfigDto): Promise<VectorStoreConfigEntity> {
    const config = await this.getVectorStoreConfigById(id)
    Object.assign(config, updateDto)
    return this.vectorStoreConfigRepository.save(config)
  }

  /**
   * 删除向量库配置（软删除）
   */
  async deleteVectorStoreConfig(id: number): Promise<void> {
    const config = await this.getVectorStoreConfigById(id)
    await this.vectorStoreConfigRepository.softRemove(config)
  }
}

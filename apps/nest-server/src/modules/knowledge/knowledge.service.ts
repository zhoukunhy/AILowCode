import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { KnowledgeBaseEntity, KnowledgeDocumentEntity, DocumentChunkEntity } from './entities/knowledge.entity'
import { VectorizationLogEntity } from './entities/vectorization-log.entity'
import { 
  CreateKnowledgeBaseDto, 
  UpdateKnowledgeBaseDto, 
  UploadDocumentDto, 
  SearchKnowledgeDto,
  DocumentChunkPreviewDto
} from './dto/knowledge.dto'
import { 
  RAGPipelineService, 
  VectorRetrievalService,
  MilvusVectorStore
} from '@ai-lowcode/lang-ai-core'
import type { RAGPipelineConfig } from '@ai-lowcode/lang-ai-core'
import type { MilvusConfig } from '@ai-lowcode/shared-types'

/**
 * 知识库服务
 * 提供知识库管理、文档上传、向量化、检索等功能
 */
@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name)
  private milvusClients: Map<number, MilvusVectorStore> = new Map()
  private ragPipelineServices: Map<number, RAGPipelineService> = new Map()
  private retrievalServices: Map<number, VectorRetrievalService> = new Map()

  constructor(
    @InjectRepository(KnowledgeBaseEntity)
    private knowledgeBaseRepository: Repository<KnowledgeBaseEntity>,
    @InjectRepository(KnowledgeDocumentEntity)
    private documentRepository: Repository<KnowledgeDocumentEntity>,
    @InjectRepository(DocumentChunkEntity)
    private chunkRepository: Repository<DocumentChunkEntity>,
    @InjectRepository(VectorizationLogEntity)
    private logRepository: Repository<VectorizationLogEntity>,
  ) {}

  // ==================== 知识库管理 ====================

  /**
   * 创建知识库
   */
  async createKnowledgeBase(createDto: CreateKnowledgeBaseDto): Promise<KnowledgeBaseEntity> {
    try {
      const knowledgeBase = this.knowledgeBaseRepository.create(createDto)
      const saved = await this.knowledgeBaseRepository.save(knowledgeBase)

      // 初始化 Milvus 集合
      await this.initMilvusCollection(saved.id, saved.dimension)

      this.logger.log(`知识库创建成功: ${saved.name} (ID: ${saved.id})`)
      return saved
    } catch (error) {
      this.logger.error(`创建知识库失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('创建知识库失败')
    }
  }

  /**
   * 获取所有知识库
   */
  async getAllKnowledgeBases(): Promise<KnowledgeBaseEntity[]> {
    try {
      return this.knowledgeBaseRepository.find({
        where: { deletedAt: undefined as any },
        order: { createdAt: 'DESC' },
      })
    } catch (error) {
      this.logger.error(`获取知识库列表失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('获取知识库列表失败')
    }
  }

  /**
   * 获取知识库详情
   */
  async getKnowledgeBaseById(id: number): Promise<KnowledgeBaseEntity> {
    try {
      const knowledgeBase = await this.knowledgeBaseRepository.findOne({
        where: { id },
        relations: ['documents'],
      })
      if (!knowledgeBase) {
        throw new NotFoundException('知识库不存在')
      }
      return knowledgeBase
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`获取知识库详情失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('获取知识库详情失败')
    }
  }

  /**
   * 更新知识库
   */
  async updateKnowledgeBase(id: number, updateDto: UpdateKnowledgeBaseDto): Promise<KnowledgeBaseEntity> {
    try {
      const knowledgeBase = await this.getKnowledgeBaseById(id)
      Object.assign(knowledgeBase, updateDto)
      const updated = await this.knowledgeBaseRepository.save(knowledgeBase)
      this.logger.log(`知识库更新成功: ${updated.name} (ID: ${updated.id})`)
      return updated
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`更新知识库失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('更新知识库失败')
    }
  }

  /**
   * 删除知识库
   */
  async deleteKnowledgeBase(id: number): Promise<void> {
    try {
      const knowledgeBase = await this.getKnowledgeBaseById(id)
      
      // 删除 Milvus 集合
      const milvusClient = await this.getMilvusClient(id)
      if (milvusClient) {
        try {
          await milvusClient.dropCollection(`knowledge_base_${id}`)
          this.logger.log(`Milvus 集合删除成功: knowledge_base_${id}`)
        } catch (error) {
          this.logger.warn(`删除 Milvus 集合失败: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      // 清理服务缓存
      this.ragPipelineServices.delete(id)
      this.retrievalServices.delete(id)
      this.milvusClients.delete(id)

      await this.knowledgeBaseRepository.softRemove(knowledgeBase)
      this.logger.log(`知识库删除成功: ${knowledgeBase.name} (ID: ${knowledgeBase.id})`)
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`删除知识库失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('删除知识库失败')
    }
  }

  // ==================== 文档管理 ====================

  /**
   * 上传文档
   */
  async uploadDocument(uploadDto: UploadDocumentDto): Promise<KnowledgeDocumentEntity> {
    try {
      const knowledgeBase = await this.getKnowledgeBaseById(uploadDto.knowledgeBaseId)

      // 创建文档记录
      const document = this.documentRepository.create({
        ...uploadDto,
        size: Buffer.byteLength(uploadDto.content, 'utf-8'),
        vectorStatus: 'pending',
        chunkCount: 0,
      })
      const savedDocument = await this.documentRepository.save(document)

      this.logger.log(`文档上传成功: ${savedDocument.name} (ID: ${savedDocument.id})`)

      // 异步处理向量化
      this.processDocumentVectorization(savedDocument.id, knowledgeBase).catch(error => {
        this.logger.error(`文档向量化失败: ${savedDocument.name}`, error)
      })

      return savedDocument
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`上传文档失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('上传文档失败')
    }
  }

  /**
   * 获取知识库的文档列表
   */
  async getDocumentsByKnowledgeBase(knowledgeBaseId: number): Promise<KnowledgeDocumentEntity[]> {
    try {
      return this.documentRepository.find({
        where: { knowledgeBaseId, deletedAt: undefined as any },
        order: { createdAt: 'DESC' },
      })
    } catch (error) {
      this.logger.error(`获取文档列表失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('获取文档列表失败')
    }
  }

  /**
   * 获取文档详情
   */
  async getDocumentById(id: number): Promise<KnowledgeDocumentEntity> {
    try {
      const document = await this.documentRepository.findOne({
        where: { id },
        relations: ['knowledgeBase'],
      })
      if (!document) {
        throw new NotFoundException('文档不存在')
      }
      return document
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`获取文档详情失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('获取文档详情失败')
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(id: number): Promise<void> {
    try {
      const document = await this.getDocumentById(id)
      
      // 删除 Milvus 中的向量
      const milvusClient = await this.getMilvusClient(document.knowledgeBaseId)
      if (milvusClient) {
        try {
          const chunks = await this.chunkRepository.find({ where: { documentId: id } })
          if (chunks.length > 0) {
            const vectorIds = chunks.filter(c => c.vectorId).map(c => c.vectorId as string)
            if (vectorIds.length > 0) {
              await milvusClient.deleteDocuments(`knowledge_base_${document.knowledgeBaseId}`, vectorIds)
              this.logger.log(`删除向量: ${vectorIds.length} 个`)
            }
          }
        } catch (error) {
          this.logger.warn(`删除向量失败: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      // 删除分块记录
      await this.chunkRepository.delete({ documentId: id })

      // 删除文档记录
      await this.documentRepository.softRemove(document)

      // 更新知识库文档数量
      await this.updateKnowledgeBaseDocumentCount(document.knowledgeBaseId)

      this.logger.log(`文档删除成功: ${document.name} (ID: ${document.id})`)
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`删除文档失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('删除文档失败')
    }
  }

  // ==================== 向量化处理 ====================

  /**
   * 处理文档向量化（完整 RAG 链路）
   */
  private async processDocumentVectorization(
    documentId: number, 
    knowledgeBase: KnowledgeBaseEntity
  ): Promise<void> {
    const document = await this.documentRepository.findOne({ where: { id: documentId } })
    if (!document) return

    // 创建向量化日志
    const log = this.logRepository.create({
      documentId: document.id.toString(),
      documentName: document.name,
      documentType: document.type,
      status: 'pending',
      stage: 'initialized',
      startTime: new Date(),
      chunkCount: 0,
      vectorCount: 0,
      metadata: {
        knowledgeBaseId: knowledgeBase.id,
        knowledgeBaseName: knowledgeBase.name,
      },
    })
    await this.logRepository.save(log)

    try {
      // 更新状态为处理中
      document.vectorStatus = 'processing'
      await this.documentRepository.save(document)

      log.status = 'processing'
      log.stage = 'processing'
      await this.logRepository.save(log)

      // 获取 RAG 链路服务
      const ragPipeline = await this.getRAGPipelineService(knowledgeBase)

      // 执行完整 RAG 链路
      const result = await ragPipeline.processDocument(
        document.content || '',
        document.type as any,
        document.id.toString(),
        document.name,
        {
          documentId: document.id,
          documentName: document.name,
          documentType: document.type,
          knowledgeBaseId: knowledgeBase.id,
        }
      )

      if (result.success) {
        // 更新文档状态
        document.vectorStatus = 'completed'
        document.chunkCount = result.chunkCount
        await this.documentRepository.save(document)

        // 更新日志
        log.status = 'completed'
        log.stage = 'completed'
        log.endTime = new Date()
        log.duration = log.endTime.getTime() - log.startTime.getTime()
        log.chunkCount = result.chunkCount
        log.vectorCount = result.chunkCount
        await this.logRepository.save(log)

        // 更新知识库文档数量
        await this.updateKnowledgeBaseDocumentCount(knowledgeBase.id)

        this.logger.log(`文档向量化成功: ${document.name}, 分块: ${result.chunkCount}`)
      } else {
        throw new Error(result.error || '向量化失败')
      }
    } catch (error: any) {
      // 更新状态为失败
      document.vectorStatus = 'failed'
      document.errorMessage = error.message
      await this.documentRepository.save(document)

      // 更新日志
      log.status = 'failed'
      log.stage = 'failed'
      log.endTime = new Date()
      log.duration = log.endTime.getTime() - log.startTime.getTime()
      log.error = error.message
      await this.logRepository.save(log)

      this.logger.error(`文档向量化失败: ${document.name}`, error)
    }
  }

  // ==================== 检索功能 ====================

  /**
   * 检索知识库（相似度召回）
   */
  async searchKnowledge(searchDto: SearchKnowledgeDto): Promise<any[]> {
    try {
      const knowledgeBase = await this.getKnowledgeBaseById(searchDto.knowledgeBaseId)

      // 获取检索服务
      const retrievalService = await this.getRetrievalService(knowledgeBase)

      // 执行检索
      const context = await retrievalService.retrieve(
        searchDto.query,
        searchDto.topK || 5,
        searchDto.threshold || 0.7
      )

      this.logger.log(`检索成功: 查询="${searchDto.query}", 结果=${context.results.length}`)

      return context.results.map((result) => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        score: result.score,
      }))
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`检索失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('检索失败')
    }
  }

  /**
   * 获取文档分块预览
   */
  async getDocumentChunks(previewDto: DocumentChunkPreviewDto): Promise<{
    chunks: DocumentChunkEntity[]
    total: number
  }> {
    try {
      const { documentId, page = 1, pageSize = 10 } = previewDto

      const [chunks, total] = await this.chunkRepository.findAndCount({
        where: { documentId },
        order: { chunkIndex: 'ASC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      })

      return { chunks, total }
    } catch (error) {
      this.logger.error(`获取文档分块失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('获取文档分块失败')
    }
  }

  /**
   * 获取向量化日志
   */
  async getVectorizationLogs(documentId?: string): Promise<VectorizationLogEntity[]> {
    try {
      const where: any = {}
      if (documentId) {
        where.documentId = documentId
      }

      return this.logRepository.find({
        where,
        order: { startTime: 'DESC' },
      })
    } catch (error) {
      this.logger.error(`获取向量化日志失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('获取向量化日志失败')
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 初始化 Milvus 集合
   */
  private async initMilvusCollection(knowledgeBaseId: number, dimension: number): Promise<void> {
    try {
      const milvusClient = await this.getMilvusClient(knowledgeBaseId)
      if (milvusClient) {
        await milvusClient.createKnowledgeCollection(
          `knowledge_base_${knowledgeBaseId}`,
          dimension
        )
        this.logger.log(`Milvus 集合创建成功: knowledge_base_${knowledgeBaseId}`)
      }
    } catch (error) {
      this.logger.error(`创建 Milvus 集合失败: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * 获取 Milvus 客户端
   */
  private async getMilvusClient(knowledgeBaseId: number): Promise<MilvusVectorStore | null> {
    if (this.milvusClients.has(knowledgeBaseId)) {
      return this.milvusClients.get(knowledgeBaseId)!
    }

    // 从环境变量获取配置
    const milvusConfig: MilvusConfig = {
      address: process.env.MILVUS_ADDRESS || 'localhost:19530',
      username: process.env.MILVUS_USERNAME || 'root',
      password: process.env.MILVUS_PASSWORD || 'Milvus',
      database: process.env.MILVUS_DATABASE || 'default',
    }

    try {
      const milvusClient = new MilvusVectorStore(milvusConfig)
      await milvusClient.connect()
      this.milvusClients.set(knowledgeBaseId, milvusClient)
      return milvusClient
    } catch (error) {
      this.logger.error(`创建 Milvus 客户端失败: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  /**
   * 获取 RAG 链路服务
   */
  private async getRAGPipelineService(knowledgeBase: KnowledgeBaseEntity): Promise<RAGPipelineService> {
    if (this.ragPipelineServices.has(knowledgeBase.id)) {
      return this.ragPipelineServices.get(knowledgeBase.id)!
    }

    const config: RAGPipelineConfig = {
      milvusConfig: {
        address: process.env.MILVUS_ADDRESS || 'localhost:19530',
        username: process.env.MILVUS_USERNAME || 'root',
        password: process.env.MILVUS_PASSWORD || 'Milvus',
        database: process.env.MILVUS_DATABASE || 'default',
      },
      ragConfig: {
        embeddingApiKey: process.env.EMBEDDING_API_KEY || '',
        embeddingModel: knowledgeBase.embeddingModel || 'text-embedding-3-small',
        embeddingBaseUrl: process.env.EMBEDDING_BASE_URL,
        chunkSize: 1000,
        chunkOverlap: 200,
      },
      collectionName: `knowledge_base_${knowledgeBase.id}`,
    }

    const ragPipeline = new RAGPipelineService(config)
    await ragPipeline.initialize()
    this.ragPipelineServices.set(knowledgeBase.id, ragPipeline)

    return ragPipeline
  }

  /**
   * 获取检索服务
   */
  private async getRetrievalService(knowledgeBase: KnowledgeBaseEntity): Promise<VectorRetrievalService> {
    if (this.retrievalServices.has(knowledgeBase.id)) {
      return this.retrievalServices.get(knowledgeBase.id)!
    }

    const retrievalService = new VectorRetrievalService(
      {
        address: process.env.MILVUS_ADDRESS || 'localhost:19530',
        username: process.env.MILVUS_USERNAME || 'root',
        password: process.env.MILVUS_PASSWORD || 'Milvus',
        database: process.env.MILVUS_DATABASE || 'default',
      },
      {
        embeddingApiKey: process.env.EMBEDDING_API_KEY || '',
        embeddingModel: knowledgeBase.embeddingModel || 'text-embedding-3-small',
        embeddingBaseUrl: process.env.EMBEDDING_BASE_URL,
        chunkSize: 1000,
        chunkOverlap: 200,
      },
      `knowledge_base_${knowledgeBase.id}`
    )

    await retrievalService.initialize()
    this.retrievalServices.set(knowledgeBase.id, retrievalService)

    return retrievalService
  }

  /**
   * 更新知识库文档数量
   */
  private async updateKnowledgeBaseDocumentCount(knowledgeBaseId: number): Promise<void> {
    try {
      const count = await this.documentRepository.count({
        where: { knowledgeBaseId, deletedAt: undefined as any },
      })
      
      await this.knowledgeBaseRepository.update(knowledgeBaseId, {
        documentCount: count,
      })
    } catch (error) {
      this.logger.error(`更新知识库文档数量失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
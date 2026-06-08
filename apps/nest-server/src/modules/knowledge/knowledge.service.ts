import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
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
  ChromaVectorStore
} from '@ai-lowcode/lang-ai-core'
import type { RAGPipelineConfig } from '@ai-lowcode/lang-ai-core'
import type { ChromaConfig } from '@ai-lowcode/shared-types'

/**
 * 知识库服务
 * 提供知识库管理、文档上传、向量化、检索等功能
 */
@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name)
  private chromaClients: Map<number, InstanceType<typeof ChromaVectorStore>> = new Map()
  private ragPipelineServices: Map<number, InstanceType<typeof RAGPipelineService>> = new Map()
  private retrievalServices: Map<number, InstanceType<typeof VectorRetrievalService>> = new Map()

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

      // 初始化 Chroma 集合
      await this.initChromaCollection(saved.id, saved.dimension)

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
      
      // 删除 Chroma 集合
      const chromaClient = await this.getChromaClient(id)
      if (chromaClient) {
        try {
          await chromaClient.dropCollection(`knowledge_base_${id}`)
          this.logger.log(`Chroma 集合删除成功: knowledge_base_${id}`)
        } catch (error) {
          this.logger.warn(`删除 Chroma 集合失败: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      // 清理服务缓存
      this.ragPipelineServices.delete(id)
      this.retrievalServices.delete(id)
      this.chromaClients.delete(id)

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
      
      // 删除 Chroma 中的向量
      const chromaClient = await this.getChromaClient(document.knowledgeBaseId)
      if (chromaClient) {
        try {
          const chunks = await this.chunkRepository.find({ where: { documentId: id } })
          if (chunks.length > 0) {
            const vectorIds = chunks.filter(c => c.vectorId).map(c => c.vectorId as string)
            if (vectorIds.length > 0) {
              await chromaClient.deleteDocuments(`knowledge_base_${document.knowledgeBaseId}`, vectorIds)
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

      return context.results.map((result: { id: string; content: string | null; metadata: Record<string, unknown>; score: number }) => ({
        id: result.id,
        content: result.content || '',
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

  /**
   * 批量清空知识库向量
   */
  async clearKnowledgeBaseVectors(knowledgeBaseId: number): Promise<void> {
    try {
      const knowledgeBase = await this.getKnowledgeBaseById(knowledgeBaseId)

      // 删除所有分块记录
      const documents = await this.documentRepository.find({ where: { knowledgeBaseId } })
      const documentIds = documents.map(doc => doc.id)
      
      if (documentIds.length > 0) {
        await this.chunkRepository.delete({ documentId: In(documentIds) })
      }

      for (const doc of documents) {
        doc.vectorStatus = 'pending'
        doc.chunkCount = 0
        doc.errorMessage = undefined
        await this.documentRepository.save(doc)
      }

      this.logger.log(`知识库向量清空成功: ${knowledgeBase.name} (ID: ${knowledgeBaseId})`)
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`清空知识库向量失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('清空知识库向量失败')
    }
  }

  /**
   * 获取知识库统计信息
   */
  async getKnowledgeBaseStats(knowledgeBaseId: number): Promise<{
    documentCount: number
    chunkCount: number
    pendingCount: number
    completedCount: number
    failedCount: number
  }> {
    try {
      await this.getKnowledgeBaseById(knowledgeBaseId)

      const documents = await this.documentRepository.find({ 
        where: { knowledgeBaseId, deletedAt: undefined as any },
        select: ['id']
      })
      const documentIds = documents.map(doc => doc.id)

      const [documentCount, chunkCount] = await Promise.all([
        documents.length,
        documentIds.length > 0 
          ? this.chunkRepository.count({ where: { documentId: In(documentIds) } })
          : Promise.resolve(0),
      ])

      const pendingCount = await this.documentRepository.count({
        where: { knowledgeBaseId, vectorStatus: 'pending', deletedAt: undefined as any },
      })

      const completedCount = await this.documentRepository.count({
        where: { knowledgeBaseId, vectorStatus: 'completed', deletedAt: undefined as any },
      })

      const failedCount = await this.documentRepository.count({
        where: { knowledgeBaseId, vectorStatus: 'failed', deletedAt: undefined as any },
      })

      return {
        documentCount,
        chunkCount: chunkCount as any,
        pendingCount,
        completedCount,
        failedCount,
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`获取知识库统计信息失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('获取知识库统计信息失败')
    }
  }

  /**
   * 混合检索（向量 + 关键词）
   */
  async hybridSearchKnowledge(searchDto: SearchKnowledgeDto): Promise<any[]> {
    try {
      const knowledgeBase = await this.getKnowledgeBaseById(searchDto.knowledgeBaseId)

      const retrievalService = await this.getRetrievalService(knowledgeBase)

      const context = await retrievalService.hybridRetrieve(
        searchDto.query,
        searchDto.topK || 5,
        searchDto.threshold || 0.7
      )

      this.logger.log(`混合检索成功: 查询="${searchDto.query}", 结果=${context.results.length}`)

      return context.results.map((result: { id: string; content: string | null; metadata: Record<string, unknown>; score: number }) => ({
        id: result.id,
        content: result.content || '',
        metadata: result.metadata,
        score: result.score,
      }))
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`混合检索失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('混合检索失败')
    }
  }

  /**
   * 重新向量化文档
   */
  async revectorizeDocument(documentId: number): Promise<KnowledgeDocumentEntity> {
    try {
      const document = await this.getDocumentById(documentId)
      const knowledgeBase = await this.getKnowledgeBaseById(document.knowledgeBaseId)

      // 重置文档状态
      document.vectorStatus = 'pending'
      document.chunkCount = 0
      document.errorMessage = undefined
      await this.documentRepository.save(document)

      // 删除旧的分块记录
      await this.chunkRepository.delete({ documentId })

      // 异步重新向量化
      this.processDocumentVectorization(document.id, knowledgeBase).catch(error => {
        this.logger.error(`文档重新向量化失败: ${document.name}`, error)
      })

      return document
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      this.logger.error(`重新向量化文档失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('重新向量化文档失败')
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 初始化 Chroma 集合
   */
  private async initChromaCollection(knowledgeBaseId: number, dimension: number): Promise<void> {
    try {
      const chromaClient = await this.getChromaClient(knowledgeBaseId)
      if (chromaClient) {
        await chromaClient.createKnowledgeCollection(
          `knowledge_base_${knowledgeBaseId}`,
          dimension
        )
        this.logger.log(`Chroma 集合创建成功: knowledge_base_${knowledgeBaseId}`)
      }
    } catch (error) {
      this.logger.error(`创建 Chroma 集合失败: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * 获取 Chroma 客户端
   */
  private async getChromaClient(knowledgeBaseId: number): Promise<InstanceType<typeof ChromaVectorStore> | null> {
    if (this.chromaClients.has(knowledgeBaseId)) {
      return this.chromaClients.get(knowledgeBaseId)!
    }

    // 从环境变量获取配置
    const chromaConfig: ChromaConfig = {
      url: process.env.CHROMA_URL || 'http://localhost:8000',
      apiKey: process.env.CHROMA_API_KEY,
    }

    try {
      const chromaClient = new ChromaVectorStore(chromaConfig)
      await chromaClient.connect()
      this.chromaClients.set(knowledgeBaseId, chromaClient)
      return chromaClient
    } catch (error) {
      this.logger.error(`创建 Chroma 客户端失败: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  /**
   * 获取 RAG 链路服务
   */
  private async getRAGPipelineService(knowledgeBase: KnowledgeBaseEntity): Promise<InstanceType<typeof RAGPipelineService>> {
    if (this.ragPipelineServices.has(knowledgeBase.id)) {
      return this.ragPipelineServices.get(knowledgeBase.id)!
    }

    const config: RAGPipelineConfig = {
      chromaConfig: {
        url: process.env.CHROMA_URL || 'http://localhost:8000',
        apiKey: process.env.CHROMA_API_KEY,
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
  private async getRetrievalService(knowledgeBase: KnowledgeBaseEntity): Promise<InstanceType<typeof VectorRetrievalService>> {
    if (this.retrievalServices.has(knowledgeBase.id)) {
      return this.retrievalServices.get(knowledgeBase.id)!
    }

    const retrievalService = new VectorRetrievalService(
      {
        url: process.env.CHROMA_URL || 'http://localhost:8000',
        apiKey: process.env.CHROMA_API_KEY,
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

/**
 * RAG 完整链路服务
 * 文档加载 → 文本分割 → Embedding 向量化 → 写入 Milvus
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { DocumentLoaderFactory } from './DocumentLoader'
import { RAGProcessor } from './RAGProcessor'
import { MilvusVectorStore } from './MilvusVectorStore'
import type { MilvusConfig, RAGConfig, RAGDocument } from '@ai-lowcode/shared-types'
import type { Document } from '@langchain/core/documents'

/**
 * RAG 链路配置
 */
export interface RAGPipelineConfig {
  milvusConfig: MilvusConfig
  ragConfig: RAGConfig
  collectionName: string
}

/**
 * 向量化日志
 */
export interface VectorizationLog {
  documentId: string
  documentName: string
  documentType: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  stage: string
  startTime: Date
  endTime?: Date
  duration?: number
  chunkCount: number
  vectorCount: number
  error?: string
  metadata?: Record<string, any>
}

/**
 * RAG 链路服务
 */
export class RAGPipelineService {
  private milvusClient: MilvusVectorStore
  private ragProcessor: RAGProcessor
  private config: RAGPipelineConfig
  private logs: Map<string, VectorizationLog> = new Map()

  constructor(config: RAGPipelineConfig) {
    this.config = config
    this.milvusClient = new MilvusVectorStore(config.milvusConfig)
    this.ragProcessor = new RAGProcessor(config.ragConfig)
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      await this.milvusClient.connect()
      console.log('RAG Pipeline Service initialized')
    } catch (error) {
      throw new Error(`初始化失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 完整 RAG 链路处理
   * @param content 文档内容
   * @param documentType 文档类型
   * @param documentId 文档ID
   * @param documentName 文档名称
   * @param metadata 元数据
   * @returns 处理结果
   */
  async processDocument(
    content: string,
    documentType: 'text' | 'md' | 'api' | 'requirement',
    documentId: string,
    documentName: string,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; chunkCount: number; error?: string }> {
    const log: VectorizationLog = {
      documentId,
      documentName,
      documentType,
      status: 'pending',
      stage: 'initialized',
      startTime: new Date(),
      chunkCount: 0,
      vectorCount: 0,
      metadata,
    }

    this.logs.set(documentId, log)

    try {
      // 阶段 1: 文档加载
      log.stage = 'loading'
      log.status = 'processing'
      this.updateLog(documentId, log)

      const documents = await this.loadDocument(content, documentType, {
        documentId,
        documentName,
        documentType,
        ...metadata,
      })

      console.log(`[RAG] 文档加载成功: ${documentName}, 加载 ${documents.length} 个文档`)

      // 阶段 2: 文本分割
      log.stage = 'splitting'
      this.updateLog(documentId, log)

      const chunks = await this.splitDocuments(documents)

      log.chunkCount = chunks.length
      console.log(`[RAG] 文本分割成功: ${documentName}, 分割为 ${chunks.length} 个分块`)

      // 阶段 3: Embedding 向量化
      log.stage = 'embedding'
      this.updateLog(documentId, log)

      const ragDocuments = await this.generateEmbeddings(chunks, {
        documentId,
        documentName,
        documentType,
        ...metadata,
      })

      log.vectorCount = ragDocuments.length
      console.log(`[RAG] 向量化成功: ${documentName}, 生成 ${ragDocuments.length} 个向量`)

      // 阶段 4: 写入 Milvus
      log.stage = 'storing'
      this.updateLog(documentId, log)

      await this.storeVectors(ragDocuments)

      console.log(`[RAG] 向量存储成功: ${documentName}, 已存储到 Milvus`)

      // 完成处理
      log.status = 'completed'
      log.stage = 'completed'
      log.endTime = new Date()
      log.duration = log.endTime.getTime() - log.startTime.getTime()
      this.updateLog(documentId, log)

      return {
        success: true,
        chunkCount: chunks.length,
      }
    } catch (error) {
      // 记录错误
      log.status = 'failed'
      log.stage = 'failed'
      log.endTime = new Date()
      log.duration = log.endTime.getTime() - log.startTime.getTime()
      log.error = error instanceof Error ? error.message : String(error)
      this.updateLog(documentId, log)

      console.error(`[RAG] 处理失败: ${documentName}`, error)

      return {
        success: false,
        chunkCount: 0,
        error: log.error,
      }
    }
  }

  /**
   * 文档加载
   */
  private async loadDocument(
    content: string,
    type: 'text' | 'md' | 'api' | 'requirement',
    metadata: Record<string, any>
  ): Promise<Document[]> {
    try {
      const loader = DocumentLoaderFactory.createLoader(type, content, metadata)
      const documents = await loader.load()
      return documents
    } catch (error) {
      throw new Error(`文档加载失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 文本分割
   */
  private async splitDocuments(documents: Document[]): Promise<Document[]> {
    try {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.config.ragConfig.chunkSize || 1000,
        chunkOverlap: this.config.ragConfig.chunkOverlap || 200,
      })

      const chunks: Document[] = []
      for (const doc of documents) {
        const docChunks = await splitter.splitDocuments([doc])
        chunks.push(...docChunks)
      }

      return chunks
    } catch (error) {
      throw new Error(`文本分割失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 生成嵌入向量
   */
  private async generateEmbeddings(
    chunks: Document[],
    metadata: Record<string, any>
  ): Promise<RAGDocument[]> {
    try {
      const texts = chunks.map((chunk) => chunk.pageContent)
      const embeddings = await this.ragProcessor.generateEmbeddings(texts)

      const ragDocuments: RAGDocument[] = chunks.map((chunk, index) => ({
        id: `${metadata.documentId}-${index}`,
        content: chunk.pageContent,
        embedding: embeddings[index],
        metadata: {
          ...metadata,
          chunkIndex: index,
          totalChunks: chunks.length,
          chunkMetadata: chunk.metadata,
        },
      }))

      return ragDocuments
    } catch (error) {
      throw new Error(`向量化失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 存储向量到 Milvus
   */
  private async storeVectors(ragDocuments: RAGDocument[]): Promise<void> {
    try {
      await this.milvusClient.insertDocuments(
        this.config.collectionName,
        ragDocuments
      )
    } catch (error) {
      throw new Error(`向量存储失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 批量处理文档
   */
  async processBatchDocuments(
    documents: Array<{
      content: string
      type: 'text' | 'md' | 'api' | 'requirement'
      id: string
      name: string
      metadata?: Record<string, any>
    }>
  ): Promise<Array<{ documentId: string; success: boolean; chunkCount: number; error?: string }>> {
    const results = []

    for (const doc of documents) {
      const result = await this.processDocument(
        doc.content,
        doc.type,
        doc.id,
        doc.name,
        doc.metadata
      )
      results.push({
        documentId: doc.id,
        ...result,
      })
    }

    return results
  }

  /**
   * 获取处理日志
   */
  getLog(documentId: string): VectorizationLog | undefined {
    return this.logs.get(documentId)
  }

  /**
   * 获取所有日志
   */
  getAllLogs(): VectorizationLog[] {
    return Array.from(this.logs.values())
  }

  /**
   * 清除日志
   */
  clearLogs(): void {
    this.logs.clear()
  }

  /**
   * 更新日志
   */
  private updateLog(documentId: string, log: VectorizationLog): void {
    this.logs.set(documentId, { ...log })
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    await this.milvusClient.close()
    console.log('RAG Pipeline Service closed')
  }
}

export default RAGPipelineService
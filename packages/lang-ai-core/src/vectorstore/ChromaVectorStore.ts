/**
 * Chroma 向量库管理类
 * 用于连接和管理 Chroma 向量数据库
 */

import { ChromaClient } from 'chromadb'
import type { ChromaConfig, RAGDocument } from '@ai-lowcode/shared-types'

/**
 * Chroma 向量库管理类
 */
export class ChromaVectorStore {
  private client: ChromaClient
  private config: ChromaConfig
  private isConnected: boolean = false

  constructor(config: ChromaConfig) {
    this.config = config
    this.client = new ChromaClient({
      path: config.url,
      apiKey: config.apiKey,
    })
  }

  /**
   * 连接到 Chroma
   */
  async connect(): Promise<void> {
    try {
      await this.client.heartbeat()
      this.isConnected = true
      console.log('Successfully connected to Chroma')
    } catch (error) {
      console.error('Failed to connect to Chroma:', error)
      throw error
    }
  }

  /**
   * 创建知识库集合
   * @param collectionName 集合名称
   * @param dimension 向量维度
   */
  async createKnowledgeCollection(
    collectionName: string = 'knowledge_base',
    dimension: number = 1536
  ): Promise<void> {
    try {
      await this.client.getCollection({ name: collectionName })
      console.log(`Collection ${collectionName} already exists`)
    } catch {
      await this.client.createCollection({
        name: collectionName,
        metadata: {
          dimension,
        },
      })
      console.log(`Collection ${collectionName} created successfully`)
    }
  }

  /**
   * 插入文档向量
   * @param collectionName 集合名称
   * @param documents 文档列表
   */
  async insertDocuments(
    collectionName: string,
    documents: RAGDocument[]
  ): Promise<void> {
    const ids = documents.map((doc) => doc.id)
    const embeddings = documents.map((doc) => doc.embedding)
    const metadatas = documents.map((doc) => ({
      content: doc.content,
      ...(doc.metadata || {}),
    }))
    const contents = documents.map((doc) => doc.content)

    const collection = await this.client.getCollection({ name: collectionName })
    await collection.add({
      ids,
      embeddings,
      metadatas,
      documents: contents,
    })

    console.log(`Inserted ${documents.length} documents into ${collectionName}`)
  }

  /**
   * 向量相似度搜索
   * @param collectionName 集合名称
   * @param queryVector 查询向量
   * @param topK 返回数量
   */
  async search(
    collectionName: string,
    queryVector: number[],
    topK: number = 5
  ): Promise<any[]> {
    const collection = await this.client.getCollection({ name: collectionName })
    const results = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: topK,
    })

    return results.documents?.[0]?.map((content: string, index: number) => ({
      id: results.ids?.[0]?.[index],
      content,
      metadata: results.metadatas?.[0]?.[index],
      distance: results.distances?.[0]?.[index],
    })) || []
  }

  /**
   * 删除文档
   * @param collectionName 集合名称
   * @param ids 文档ID列表
   */
  async deleteDocuments(
    collectionName: string,
    ids: string[]
  ): Promise<void> {
    const collection = await this.client.getCollection({ name: collectionName })
    await collection.delete({ ids })

    console.log(`Deleted ${ids.length} documents from ${collectionName}`)
  }

  /**
   * 获取集合统计信息
   * @param collectionName 集合名称
   */
  async getCollectionStats(collectionName: string): Promise<any> {
    const collection = await this.client.getCollection({ name: collectionName })
    const count = await collection.count()
    return { count }
  }

  /**
   * 删除集合
   * @param collectionName 集合名称
   */
  async dropCollection(collectionName: string): Promise<void> {
    await this.client.deleteCollection({ name: collectionName })
    console.log(`Collection ${collectionName} dropped`)
  }

  /**
   * 列出所有集合
   */
  async listCollections(): Promise<string[]> {
    const collections = await this.client.listCollections()
    return collections.map((c: any) => c.name)
  }

  /**
   * 检查连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    this.isConnected = false
    console.log('Chroma connection closed')
  }
}

export default ChromaVectorStore

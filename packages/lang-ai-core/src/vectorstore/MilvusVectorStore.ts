/**
 * Milvus 向量库管理类
 * 用于连接和管理 Milvus 向量数据库
 */

import { MilvusClient, DataType, LoadState } from '@zilliz/milvus2-sdk-node'
import type { MilvusConfig, RAGDocument } from '@ai-lowcode/shared-types'

/**
 * Milvus 向量库管理类
 */
export class MilvusVectorStore {
  private client: MilvusClient
  private config: MilvusConfig
  private isConnected: boolean = false

  constructor(config: MilvusConfig) {
    this.config = config
    this.client = new MilvusClient({
      address: config.address,
      username: config.username,
      password: config.password,
      ssl: config.ssl,
    })
  }

  /**
   * 连接到 Milvus
   */
  async connect(): Promise<void> {
    try {
      await this.client.connectPromise
      this.isConnected = true
      console.log('Successfully connected to Milvus')
    } catch (error) {
      console.error('Failed to connect to Milvus:', error)
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
    const schema = [
      {
        name: 'id',
        description: '文档ID',
        data_type: DataType.VarChar,
        max_length: 255,
        is_primary_key: true,
      },
      {
        name: 'content',
        description: '文档内容',
        data_type: DataType.VarChar,
        max_length: 65535,
      },
      {
        name: 'embedding',
        description: '向量嵌入',
        data_type: DataType.FloatVector,
        dimension,
      },
      {
        name: 'metadata',
        description: '元数据JSON',
        data_type: DataType.JSON,
      },
      {
        name: 'document_id',
        description: '文档ID',
        data_type: DataType.Int64,
        auto_id: true,
      },
      {
        name: 'created_at',
        description: '创建时间',
        data_type: DataType.Int64,
      },
    ]

    await this.client.createCollection({
      collection_name: collectionName,
      fields: schema,
    })

    // 创建向量索引
    await this.client.createIndex({
      collection_name: collectionName,
      field_name: 'embedding',
      index_type: 'IVF_FLAT',
      metric_type: 'COSINE',
      params: { nlist: 1024 },
    })

    // 加载集合到内存
    await this.client.loadCollectionSync({
      collection_name: collectionName,
    })

    console.log(`Collection ${collectionName} created successfully`)
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
    const data = documents.map((doc) => ({
      id: doc.id,
      content: doc.content,
      embedding: doc.embedding,
      metadata: doc.metadata || {},
      created_at: Date.now(),
    }))

    await this.client.insert({
      collection_name: collectionName,
      data,
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
    const results = await this.client.search({
      collection_name: collectionName,
      vectors: [queryVector],
      top_k: topK,
      params: {
        nprobe: 10,
      },
      output_fields: ['id', 'content', 'metadata', 'created_at'],
    })

    return results.results || []
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
    await this.client.deleteEntities({
      collection_name: collectionName,
      expr: `id in [${ids.map((id) => `'${id}'`).join(',')}]`,
    })

    console.log(`Deleted ${ids.length} documents from ${collectionName}`)
  }

  /**
   * 获取集合统计信息
   * @param collectionName 集合名称
   */
  async getCollectionStats(collectionName: string): Promise<any> {
    const stats = await this.client.getCollectionStatistics({
      collection_name: collectionName,
    })

    return stats
  }

  /**
   * 删除集合
   * @param collectionName 集合名称
   */
  async dropCollection(collectionName: string): Promise<void> {
    await this.client.dropCollection({
      collection_name: collectionName,
    })

    console.log(`Collection ${collectionName} dropped`)
  }

  /**
   * 列出所有集合
   */
  async listCollections(): Promise<string[]> {
    const result = await this.client.showCollections()
    return result.data.map((c: any) => c.name)
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
    await this.client.closeConnection()
    this.isConnected = false
    console.log('Milvus connection closed')
  }
}

export default MilvusVectorStore

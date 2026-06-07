/**
 * 向量检索服务
 * 提供相似度召回功能
 */

import { MilvusVectorStore } from '../vectorstore/MilvusVectorStore'
import { RAGProcessor } from './RAGProcessor'
import type { MilvusConfig, RAGConfig } from '@ai-lowcode/shared-types'

/**
 * 检索结果
 */
export interface RetrievalResult {
  id: string
  content: string
  metadata: Record<string, any>
  score: number
}

/**
 * 检索上下文
 */
export interface RetrievalContext {
  query: string
  results: RetrievalResult[]
  topK: number
  threshold: number
  retrievedAt: Date
}

/**
 * 向量检索服务
 */
export class VectorRetrievalService {
  private milvusClient: MilvusVectorStore
  private ragProcessor: RAGProcessor
  private collectionName: string

  constructor(
    milvusConfig: MilvusConfig,
    ragConfig: RAGConfig,
    collectionName: string
  ) {
    this.milvusClient = new MilvusVectorStore(milvusConfig)
    this.ragProcessor = new RAGProcessor(ragConfig)
    this.collectionName = collectionName
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    await this.milvusClient.connect()
  }

  /**
   * 检索相关文档
   * @param query 查询文本
   * @param topK 返回数量
   * @param threshold 相似度阈值
   * @returns 检索结果
   */
  async retrieve(
    query: string,
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<RetrievalContext> {
    try {
      // 生成查询向量
      const queryVector = await this.ragProcessor.generateEmbedding(query)

      // 向量搜索
      const searchResults = await this.milvusClient.search(
        this.collectionName,
        queryVector,
        topK
      )

      // 过滤低相似度结果
      const filteredResults = searchResults
        .filter((result: any) => result.score >= threshold)
        .map((result: any) => ({
          id: result.id,
          content: result.content,
          metadata: result.metadata || {},
          score: result.score,
        }))

      return {
        query,
        results: filteredResults,
        topK,
        threshold,
        retrievedAt: new Date(),
      }
    } catch (error) {
      throw new Error(`检索失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 拼接检索结果为上下文
   * @param retrievalContext 检索上下文
   * @returns 拼接后的上下文文本
   */
  formatContext(retrievalContext: RetrievalContext): string {
    if (retrievalContext.results.length === 0) {
      return '未找到相关文档。'
    }

    const contextParts = retrievalContext.results.map((result, index) => {
      const metadata = result.metadata || {}
      const source = metadata.source || '未知来源'
      const documentName = metadata.documentName || '未知文档'

      return `[文档 ${index + 1}] (相似度: ${(result.score * 100).toFixed(1)}%)\n来源: ${source} - ${documentName}\n内容:\n${result.content}\n`
    })

    return `基于以下相关文档回答问题：\n\n${contextParts.join('\n')}`
  }

  /**
   * 混合检索（向量 + 关键词）
   * @param query 查询文本
   * @param topK 返回数量
   * @param threshold 相似度阈值
   * @returns 检索结果
   */
  async hybridRetrieve(
    query: string,
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<RetrievalContext> {
    try {
      // 向量检索
      const vectorContext = await this.retrieve(query, topK, threshold)

      // 关键词匹配（简单实现）
      const keywordResults = this.keywordMatch(query, vectorContext.results)

      // 合并结果
      const combinedResults = this.mergeResults(vectorContext.results, keywordResults)

      return {
        query,
        results: combinedResults.slice(0, topK),
        topK,
        threshold,
        retrievedAt: new Date(),
      }
    } catch (error) {
      throw new Error(`混合检索失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 关键词匹配
   */
  private keywordMatch(query: string, results: RetrievalResult[]): RetrievalResult[] {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 1)

    return results
      .map((result) => {
        const content = result.content.toLowerCase()
        let matchCount = 0

        keywords.forEach((keyword) => {
          const regex = new RegExp(keyword, 'g')
          const matches = content.match(regex)
          if (matches) {
            matchCount += matches.length
          }
        })

        return {
          ...result,
          score: result.score + (matchCount * 0.01), // 关键词匹配加分
        }
      })
      .sort((a, b) => b.score - a.score)
  }

  /**
   * 合并结果
   */
  private mergeResults(
    vectorResults: RetrievalResult[],
    keywordResults: RetrievalResult[]
  ): RetrievalResult[] {
    const merged = new Map<string, RetrievalResult>()

    // 添加向量检索结果
    vectorResults.forEach((result) => {
      merged.set(result.id, result)
    })

    // 合并关键词匹配结果
    keywordResults.forEach((result) => {
      const existing = merged.get(result.id)
      if (existing) {
        // 取更高的分数
        merged.set(result.id, {
          ...result,
          score: Math.max(existing.score, result.score),
        })
      } else {
        merged.set(result.id, result)
      }
    })

    // 按分数排序
    return Array.from(merged.values()).sort((a, b) => b.score - a.score)
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    await this.milvusClient.close()
  }
}

export default VectorRetrievalService
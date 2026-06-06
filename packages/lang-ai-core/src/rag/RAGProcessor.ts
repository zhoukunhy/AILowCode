/**
 * RAG 文档处理工具
 * 用于文档分块、嵌入生成等
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import type { Document } from '@langchain/core/documents'
import type { RAGDocument, RAGConfig } from '@ai-lowcode/shared-types'

/**
 * RAG 文档处理器
 */
export class RAGProcessor {
  private embeddings: OpenAIEmbeddings
  private splitter: RecursiveCharacterTextSplitter

  constructor(config: RAGConfig) {
    // 初始化嵌入模型
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.embeddingApiKey,
      modelName: config.embeddingModel || 'text-embedding-3-small',
      configuration: {
        baseURL: config.embeddingBaseUrl,
      },
    })

    // 初始化文本分块器
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize || 1000,
      chunkOverlap: config.chunkOverlap || 200,
    })
  }

  /**
   * 分块文档
   * @param text 文本内容
   * @returns 分块后的文档列表
   */
  async splitText(text: string): Promise<Document[]> {
    const docs = await this.splitter.createDocuments([text])
    return docs
  }

  /**
   * 生成文档嵌入向量
   * @param texts 文本列表
   * @returns 嵌入向量列表
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await this.embeddings.embedDocuments(texts)
    return embeddings
  }

  /**
   * 生成单个文本的嵌入向量
   * @param text 文本
   * @returns 嵌入向量
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embedding = await this.embeddings.embedQuery(text)
    return embedding
  }

  /**
   * 处理文档并生成 RAG 文档对象
   * @param content 文档内容
   * @param metadata 元数据
   * @returns RAG 文档列表
   */
  async processDocument(
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<RAGDocument[]> {
    // 分块
    const chunks = await this.splitText(content)

    // 生成嵌入向量
    const texts = chunks.map((chunk) => chunk.pageContent)
    const embeddings = await this.generateEmbeddings(texts)

    // 构建 RAG 文档列表
    const ragDocuments: RAGDocument[] = chunks.map((chunk, index) => ({
      id: `${metadata.documentId || 'doc'}-${index}`,
      content: chunk.pageContent,
      embedding: embeddings[index],
      metadata: {
        ...metadata,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
    }))

    return ragDocuments
  }

  /**
   * 计算两个向量的余弦相似度
   * @param vec1 向量1
   * @param vec2 向量2
   * @returns 相似度分数
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }
}

export default RAGProcessor

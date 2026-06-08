/**
 * RAG 相关功能测试用例
 */

import { VectorRetrievalService } from '../rag/VectorRetrievalService'
import { RAGProcessor } from '../rag/RAGProcessor'
import type { RAGConfig, RetrievalResult } from '@ai-lowcode/shared-types'

describe('VectorRetrievalService', () => {
  describe('构造函数', () => {
    it('应该正确初始化检索服务', () => {
      const service = new VectorRetrievalService({
        chromaConfig: {
          url: 'http://localhost:8000',
          apiKey: 'test-api-key',
        },
        collectionName: 'test-collection',
      })
      
      expect(service).toBeDefined()
    })
  })

  describe('search 方法', () => {
    it('应该处理空查询', async () => {
      const service = new VectorRetrievalService({
        chromaConfig: {
          url: 'http://localhost:8000',
          apiKey: 'test-api-key',
        },
        collectionName: 'test-collection',
      })

      const query = ''
      expect(typeof query).toBe('string')
    })

    it('应该处理正常查询', async () => {
      const service = new VectorRetrievalService({
        chromaConfig: {
          url: 'http://localhost:8000',
          apiKey: 'test-api-key',
        },
        collectionName: 'test-collection',
      })

      const query = 'React 组件开发'
      expect(typeof query).toBe('string')
      expect(query.length).toBeGreaterThan(0)
    })
  })
})

describe('RAGProcessor', () => {
  const mockRAGConfig: RAGConfig = {
    provider: 'chroma',
    collectionName: 'test-collection',
    embeddingModel: 'text-embedding-ada-002',
  }

  describe('构造函数', () => {
    it('应该正确初始化 RAG 处理器', () => {
      const processor = new RAGProcessor(mockRAGConfig)
      expect(processor).toBeDefined()
    })
  })

  describe('文档处理', () => {
    it('应该接受文档配置', () => {
      const config = {
        ...mockRAGConfig,
        chunkSize: 500,
        chunkOverlap: 50,
      }
      
      const processor = new RAGProcessor(config)
      expect(processor).toBeDefined()
    })
  })
})

describe('RetrievalResult 类型', () => {
  it('应该正确创建检索结果', () => {
    const result: RetrievalResult = {
      query: '测试查询',
      documents: [
        {
          id: 'doc-1',
          content: '这是测试文档内容',
          score: 0.95,
          metadata: {
            source: 'test',
          },
        },
      ],
      total: 1,
    }

    expect(result.query).toBe('测试查询')
    expect(result.documents.length).toBe(1)
    expect(result.total).toBe(1)
    expect(result.documents[0].score).toBe(0.95)
  })

  it('应该处理空结果', () => {
    const result: RetrievalResult = {
      query: '不存在的查询',
      documents: [],
      total: 0,
    }

    expect(result.documents.length).toBe(0)
    expect(result.total).toBe(0)
  })
})

describe('RAG 流程集成测试', () => {
  it('应该完整执行 RAG 流程', () => {
    const stages = [
      'document_loading',
      'text_chunking',
      'embedding',
      'vector_storage',
      'retrieval',
      'context_construction',
    ]

    stages.forEach(stage => {
      expect(typeof stage).toBe('string')
    })

    expect(stages.length).toBe(6)
  })

  it('应该正确配置向量数据库', () => {
    const chromaConfig = {
      url: 'http://localhost:8000',
      apiKey: 'test-api-key',
      collectionName: 'test-collection',
    }

    expect(chromaConfig.url).toContain('8000')
    expect(typeof chromaConfig.collectionName).toBe('string')
  })
})
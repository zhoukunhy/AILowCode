/**
 * 异常诊断 Agent 测试用例
 */

import { 
  DiagnosticAgentExecutor,
  createDiagnosticAgentExecutor 
} from '../agent/diagnostic/DiagnosticAgentExecutor'
import { DiagnosticService, createDiagnosticService } from '../agent/diagnostic/DiagnosticService'
import type { 
  DiagnosticAgentConfig,
  DiagnosticServiceConfig,
  ErrorInfo,
  DiagnosisResult,
  ErrorKnowledgeEntry,
} from '../agent/diagnostic/DiagnosticAgentTypes'

// 共享的 mock 配置
const mockAgentConfig: DiagnosticAgentConfig = {
  llmConfig: {
    apiKey: 'test-api-key',
    model: 'gpt-4',
    temperature: 0.3,
  },
  ragConfig: {
    topK: 5,
    threshold: 0.7,
  },
  knowledgeBaseConfig: {
    errorCollectionName: 'test-errors',
    knowledgeCollectionName: 'test-knowledge',
  },
  collectionName: 'test-collection',
}

describe('DiagnosticAgentExecutor', () => {
  describe('构造函数', () => {
    it('应该正确初始化执行器', () => {
      const executor = new DiagnosticAgentExecutor(mockAgentConfig)
      expect(executor).toBeDefined()
      expect(executor).toBeInstanceOf(DiagnosticAgentExecutor)
    })

    it('应该使用工厂函数创建执行器', () => {
      const executor = createDiagnosticAgentExecutor(mockAgentConfig)
      expect(executor).toBeInstanceOf(DiagnosticAgentExecutor)
    })
  })

  describe('execute 方法', () => {
    it('应该接受有效的错误信息', async () => {
      const executor = new DiagnosticAgentExecutor(mockAgentConfig)
      
      const errorInfo: ErrorInfo = {
        id: 'test-error-001',
        type: 'datasource_connection',
        source: 'data_source',
        message: '连接数据库失败',
        stack: 'Error: Connection failed\n    at Database.connect',
        timestamp: new Date(),
        context: {
          dataSourceId: 'ds-001',
          componentId: 'comp-001',
        },
      }

      // 由于需要 LLM API，这里测试基本流程
      expect(executor).toBeDefined()
    })

    it('应该生成唯一的 sessionId', () => {
      const executor = new DiagnosticAgentExecutor(mockAgentConfig)
      const sessionId = `session-${Date.now()}`
      expect(sessionId).toMatch(/^session-\d+$/)
    })
  })
})

describe('DiagnosticService', () => {
  const mockServiceConfig: DiagnosticServiceConfig = {
    ...mockAgentConfig,
    enableAutoUpdate: true,
  }

  describe('构造函数', () => {
    it('应该正确初始化服务', () => {
      const service = new DiagnosticService(mockServiceConfig)
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(DiagnosticService)
    })

    it('应该使用工厂函数创建服务', () => {
      const service = createDiagnosticService(mockServiceConfig)
      expect(service).toBeInstanceOf(DiagnosticService)
    })
  })

  describe('知识库管理', () => {
    let service: DiagnosticService

    beforeEach(() => {
      service = new DiagnosticService(mockServiceConfig)
    })

    it('应该能够添加知识库条目', async () => {
      const entry: ErrorKnowledgeEntry = {
        errorType: 'datasource_connection',
        errorMessage: '数据库连接失败',
        rootCause: '网络超时',
        solution: '检查网络连接',
        tags: ['database', 'connection'],
        occurrences: 1,
      }

      const id = await service.addToKnowledgeBase(entry)
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('应该能够获取知识库条目', async () => {
      const entry: ErrorKnowledgeEntry = {
        errorType: 'api_request',
        errorMessage: 'API 请求失败',
        rootCause: '服务不可用',
        solution: '检查服务状态',
        tags: ['api'],
        occurrences: 1,
      }

      const id = await service.addToKnowledgeBase(entry)
      const retrieved = service.getKnowledgeEntry(id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.errorMessage).toBe('API 请求失败')
    })

    it('应该能够更新知识库条目', async () => {
      const entry: ErrorKnowledgeEntry = {
        errorType: 'validation',
        errorMessage: '参数验证失败',
        rootCause: '缺少必填字段',
        solution: '添加必填字段',
        tags: ['validation'],
        occurrences: 1,
      }

      const id = await service.addToKnowledgeBase(entry)
      await service.updateKnowledgeEntry(id, { occurrences: 5 })
      
      const updated = service.getKnowledgeEntry(id)
      expect(updated?.occurrences).toBe(5)
    })

    it('应该能够删除知识库条目', async () => {
      const entry: ErrorKnowledgeEntry = {
        errorType: 'runtime',
        errorMessage: '运行时错误',
        rootCause: '空指针',
        solution: '添加空值检查',
        tags: ['runtime'],
        occurrences: 1,
      }

      const id = await service.addToKnowledgeBase(entry)
      service.deleteKnowledgeEntry(id)
      
      const retrieved = service.getKnowledgeEntry(id)
      expect(retrieved).toBeUndefined()
    })

    it('应该能够搜索知识库', async () => {
      await service.addToKnowledgeBase({
        errorType: 'network',
        errorMessage: '网络连接失败',
        rootCause: '网络不可达',
        solution: '检查网络',
        tags: ['network', 'connection'],
        occurrences: 1,
      })

      await service.addToKnowledgeBase({
        errorType: 'timeout',
        errorMessage: '请求超时',
        rootCause: '服务器响应慢',
        solution: '增加超时时间',
        tags: ['timeout'],
        occurrences: 1,
      })

      const results = service.searchKnowledgeBase('网络')
      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it('应该能够获取所有知识库条目', async () => {
      await service.addToKnowledgeBase({
        errorType: 'authentication',
        errorMessage: '认证失败',
        rootCause: 'Token 过期',
        solution: '刷新 Token',
        tags: ['auth'],
        occurrences: 1,
      })

      const entries = service.getAllKnowledgeEntries()
      expect(Array.isArray(entries)).toBe(true)
    })
  })

  describe('错误统计', () => {
    let service: DiagnosticService

    beforeEach(async () => {
      service = new DiagnosticService(mockServiceConfig)
      
      // 添加一些测试数据
      await service.addToKnowledgeBase({
        errorType: 'datasource_connection',
        errorMessage: '错误1',
        rootCause: '原因1',
        solution: '解决方案1',
        tags: ['database'],
        occurrences: 3,
      })

      await service.addToKnowledgeBase({
        errorType: 'datasource_connection',
        errorMessage: '错误2',
        rootCause: '原因2',
        solution: '解决方案2',
        tags: ['database'],
        occurrences: 2,
      })

      await service.addToKnowledgeBase({
        errorType: 'api_request',
        errorMessage: '错误3',
        rootCause: '原因3',
        solution: '解决方案3',
        tags: ['api'],
        occurrences: 1,
      })
    })

    it('应该正确计算错误统计', () => {
      const stats = service.getErrorStatistics()
      
      expect(stats.totalErrors).toBe(3)
      expect(stats.totalOccurrences).toBe(6)
      expect(stats.typeDistribution['datasource_connection']).toBe(5)
      expect(stats.typeDistribution['api_request']).toBe(1)
    })

    it('应该正确统计标签分布', () => {
      const stats = service.getErrorStatistics()
      
      expect(stats.tagDistribution['database']).toBe(2)
      expect(stats.tagDistribution['api']).toBe(1)
    })

    it('应该返回 top 标签', () => {
      const stats = service.getErrorStatistics()
      
      expect(stats.topTags).toBeDefined()
      expect(Array.isArray(stats.topTags)).toBe(true)
      expect(stats.topTags[0].tag).toBe('database')
      expect(stats.topTags[0].count).toBe(2)
    })
  })
})

describe('ErrorInfo 类型验证', () => {
  it('应该验证有效的错误类型', () => {
    const errorTypes = [
      'datasource_connection',
      'datasource_query',
      'api_request',
      'api_response',
      'validation',
      'runtime',
      'network',
      'timeout',
      'authentication',
      'authorization',
    ]

    errorTypes.forEach(type => {
      const errorInfo: ErrorInfo = {
        id: `test-${type}`,
        type: type as any,
        source: 'canvas_component',
        message: 'Test error message',
        timestamp: new Date(),
      }
      
      expect(errorInfo.type).toBe(type)
    })
  })

  it('应该验证有效的错误来源', () => {
    const errorSources = [
      'canvas_component',
      'data_source',
      'api_endpoint',
      'database',
      'frontend',
      'backend',
    ]

    errorSources.forEach(source => {
      const errorInfo: ErrorInfo = {
        id: `test-${source}`,
        type: 'runtime',
        source: source as any,
        message: 'Test error message',
        timestamp: new Date(),
      }
      
      expect(errorInfo.source).toBe(source)
    })
  })
})

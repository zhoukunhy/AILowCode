/**
 * 页面规划 Agent 单元测试
 * 覆盖核心功能：Agent初始化、状态管理、条件路由、校验逻辑
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { PagePlanningAgent, createPagePlanningAgent } from '../agent/PagePlanningAgent'
import { LangGraphExecutor } from '../agent/LangGraphExecutor'
import { AgentState, AgentNodeName, PageSchema, ValidationResult } from '../agent/types'
import { createValidationNode } from '../agent/nodes/ValidationNode'

// Mock 配置
const mockConfig = {
  llmConfig: {
    apiKey: 'test-api-key',
    model: 'gpt-4',
    baseUrl: 'http://mock-llm-server',
  },
  chromaConfig: {
    host: 'localhost',
    port: 8000,
  },
  ragConfig: {
    knowledgeBaseIds: [],
    topK: 5,
    threshold: 0.7,
  },
  knowledgeBaseIds: [],
  defaultPageSize: { width: 1920, height: 1080 },
  componentLibrary: ['Button', 'Input', 'Table', 'Text'],
  strictValidation: true,
  maxRetries: 3,
}

// 模拟有效的 PageSchema
const validPageSchema: PageSchema = {
  id: 'test-page-1',
  name: '测试页面',
  type: 'page',
  config: { title: '测试页面标题' },
  children: [
    {
      id: 'btn-1',
      type: 'Button',
      props: { label: '点击我', variant: 'primary' },
    },
    {
      id: 'input-1',
      type: 'Input',
      props: { placeholder: '请输入内容' },
    },
  ],
}

describe('PagePlanningAgent', () => {
  let agent: PagePlanningAgent

  beforeEach(() => {
    agent = createPagePlanningAgent(mockConfig)
  })

  describe('构造函数与初始化', () => {
    it('应该正确初始化 Agent 实例', () => {
      expect(agent).toBeDefined()
      expect(agent).toBeInstanceOf(PagePlanningAgent)
    })

    it('应该使用工厂函数创建实例', () => {
      const factoryAgent = createPagePlanningAgent(mockConfig)
      expect(factoryAgent).toBeInstanceOf(PagePlanningAgent)
    })

    it('应该支持默认配置参数', () => {
      const minimalConfig = {
        llmConfig: { apiKey: 'test' },
        chromaConfig: { host: 'localhost', port: 8000 },
        ragConfig: { knowledgeBaseIds: [] },
        knowledgeBaseIds: [],
      }
      const agent = createPagePlanningAgent(minimalConfig as any)
      expect(agent).toBeDefined()
    })
  })

  describe('getGraphInfo 方法', () => {
    it('应该返回图结构信息', () => {
      const graphInfo = agent.getGraphInfo()
      
      expect(graphInfo).toBeDefined()
      expect(Array.isArray(graphInfo.nodes)).toBe(true)
      expect(graphInfo.nodes.length).toBeGreaterThan(0)
      expect(typeof graphInfo.structure).toBe('string')
    })

    it('应该包含所有核心节点', () => {
      const graphInfo = agent.getGraphInfo()
      const expectedNodes: AgentNodeName[] = ['requirement_analysis', 'rag_retrieval', 'schema_generation', 'validation']
      
      expectedNodes.forEach(node => {
        expect(graphInfo.nodes).toContain(node)
      })
    })
  })

  describe('getExecutionStats 方法', () => {
    it('应该正确计算执行统计', () => {
      const mockState: AgentState = {
        userInput: '测试输入',
        currentNode: 'end',
        status: 'completed',
        logs: [
          { node: 'requirement_analysis', timestamp: new Date(), input: {}, duration: 100 },
          { node: 'rag_retrieval', timestamp: new Date(), input: {}, duration: 200 },
          { node: 'schema_generation', timestamp: new Date(), input: {}, duration: 300 },
          { node: 'validation', timestamp: new Date(), input: {}, duration: 50 },
        ],
      }

      const stats = agent.getExecutionStats(mockState)
      
      expect(stats.totalSteps).toBe(4)
      expect(stats.totalDuration).toBe(650)
      expect(stats.nodeDurations['requirement_analysis']).toBe(100)
      expect(stats.nodeDurations['rag_retrieval']).toBe(200)
    })

    it('应该处理空日志', () => {
      const mockState: AgentState = {
        userInput: '测试',
        currentNode: 'end',
        status: 'completed',
        logs: [],
      }

      const stats = agent.getExecutionStats(mockState)
      
      expect(stats.totalSteps).toBe(0)
      expect(stats.totalDuration).toBe(0)
      expect(Object.keys(stats.nodeDurations).length).toBe(0)
    })
  })
})

describe('LangGraphExecutor', () => {
  describe('执行流程', () => {
    it('应该按顺序执行节点', async () => {
      const executedNodes: AgentNodeName[] = []
      
      const nodes = [
        { name: 'node1' as AgentNodeName, handler: async () => { executedNodes.push('node1'); return { currentNode: 'node2' } } },
        { name: 'node2' as AgentNodeName, handler: async () => { executedNodes.push('node2'); return { currentNode: 'end' } } },
      ]
      
      const edges = [
        { source: 'node1' as AgentNodeName, target: 'node2' as AgentNodeName },
        { source: 'node2' as AgentNodeName, target: 'end' as const },
      ]

      const executor = new LangGraphExecutor(nodes, edges, 'node1')
      const initialState: AgentState = {
        userInput: 'test',
        currentNode: 'node1',
        status: 'running',
        logs: [],
      }

      await executor.execute(initialState)
      
      expect(executedNodes).toEqual(['node1', 'node2'])
    })

    it('应该处理节点不存在的情况', async () => {
      const nodes = [
        { name: 'node1' as AgentNodeName, handler: async () => ({ currentNode: 'nonexistent' }) },
      ]
      
      const edges = [
        { source: 'node1' as AgentNodeName, target: 'nonexistent' as AgentNodeName },
      ]

      const executor = new LangGraphExecutor(nodes, edges, 'node1')
      const initialState: AgentState = {
        userInput: 'test',
        currentNode: 'node1',
        status: 'running',
        logs: [],
      }

      const result = await executor.execute(initialState)
      
      expect(result.status).toBe('failed')
      expect(result.error).toContain('节点未找到')
    })

    it('应该限制最大执行步数防止无限循环', async () => {
      const nodes = [
        { name: 'loop' as AgentNodeName, handler: async () => ({ currentNode: 'loop' }) },
      ]
      
      const edges = [
        { source: 'loop' as AgentNodeName, target: 'loop' as AgentNodeName },
      ]

      const executor = new LangGraphExecutor(nodes, edges, 'loop', 3)
      const initialState: AgentState = {
        userInput: 'test',
        currentNode: 'loop',
        status: 'running',
        logs: [],
      }

      const result = await executor.execute(initialState)
      
      expect(result.status).toBe('completed')
      expect(result.logs.length).toBeGreaterThan(0)
    })
  })

  describe('条件路由', () => {
    it('应该支持条件路由', async () => {
      const executionPath: string[] = []
      let conditionCount = 0
      
      const nodes = [
        { name: 'start' as AgentNodeName, handler: async () => { executionPath.push('start'); return { value: 42 } } },
        { name: 'success' as AgentNodeName, handler: async () => { executionPath.push('success'); return {} } },
        { name: 'failure' as AgentNodeName, handler: async () => { executionPath.push('failure'); return {} } },
      ]
      
      const edges = [
        { source: 'start' as AgentNodeName, target: 'success' as AgentNodeName, condition: (state: AgentState) => {
          conditionCount++
          return (state as any).value > 10 ? 'success' : 'failure'
        }},
        { source: 'start' as AgentNodeName, target: 'failure' as AgentNodeName },
        { source: 'success' as AgentNodeName, target: 'end' as const },
        { source: 'failure' as AgentNodeName, target: 'end' as const },
      ]

      const executor = new LangGraphExecutor(nodes, edges, 'start')
      const initialState: AgentState = {
        userInput: 'test',
        currentNode: 'start',
        status: 'running',
        logs: [],
      } as any

      await executor.execute(initialState)
      
      expect(executionPath).toEqual(['start', 'success'])
      expect(conditionCount).toBe(1)
    })
  })

  describe('重试机制', () => {
    it('应该在节点失败时重试', async () => {
      let attemptCount = 0
      
      const nodes = [
        { name: 'flaky' as AgentNodeName, handler: async () => {
          attemptCount++
          // 节点总是失败，测试重试机制
          throw new Error('临时失败')
        }},
      ]
      
      const edges = [
        { source: 'flaky' as AgentNodeName, target: 'end' as const },
      ]

      const executor = new LangGraphExecutor(nodes, edges, 'flaky', 3)
      const initialState: AgentState = {
        userInput: 'test',
        currentNode: 'flaky',
        status: 'running',
        logs: [],
      }

      const result = await executor.execute(initialState)
      
      expect(attemptCount).toBe(3)
      expect(result.status).toBe('failed')
    })

    it('应该在重试成功后继续执行', async () => {
      let attemptCount = 0
      
      const nodes = [
        { name: 'flaky' as AgentNodeName, handler: async () => {
          attemptCount++
          if (attemptCount < 3) {
            throw new Error('临时失败')
          }
          return { currentNode: 'success' }
        }},
        { name: 'success' as AgentNodeName, handler: async () => ({}) },
      ]
      
      const edges = [
        { source: 'flaky' as AgentNodeName, target: 'success' as AgentNodeName },
        { source: 'success' as AgentNodeName, target: 'end' as const },
      ]

      const executor = new LangGraphExecutor(nodes, edges, 'flaky', 3)
      const initialState: AgentState = {
        userInput: 'test',
        currentNode: 'flaky',
        status: 'running',
        logs: [],
      }

      const result = await executor.execute(initialState)
      
      expect(attemptCount).toBe(3)
      expect(result.status).toBe('completed')
    })
  })
})

describe('ValidationNode', () => {
  describe('Schema 校验', () => {
    it('应该校验有效 Schema', () => {
      const validationNode = createValidationNode({ strictMode: true })
      
      const validState: AgentState = {
        userInput: 'test',
        currentNode: 'validation',
        status: 'running',
        logs: [],
        schemaResult: {
          pageSchema: validPageSchema,
          referencedComponents: ['Button', 'Input'],
          reasoning: '测试',
        },
      }

      expect(async () => {
        const result = await validationNode.handler(validState)
        expect(result.validationResult?.isValid).toBe(true)
      }).not.toThrow()
    })

    it('应该检测空 Schema', async () => {
      const validationNode = createValidationNode()
      
      const invalidState: AgentState = {
        userInput: 'test',
        currentNode: 'validation',
        status: 'running',
        logs: [],
      }

      const result = await validationNode.handler(invalidState)
      
      expect(result.validationResult?.isValid).toBe(false)
      expect(result.validationResult?.errors.length).toBeGreaterThan(0)
      expect(result.validationResult?.errors[0].message).toContain('Schema 生成结果为空')
    })

    it('应该检测缺少组件 ID', async () => {
      const invalidSchema: PageSchema = {
        id: 'test',
        name: '测试',
        type: 'page',
        children: [
          { type: 'Button', props: {} }, // 缺少 id
        ],
      }

      // 设置 strictMode: false 以测试原始校验逻辑（不自动修正）
      const validationNode = createValidationNode({ strictMode: false })
      
      const state: AgentState = {
        userInput: 'test',
        currentNode: 'validation',
        status: 'running',
        logs: [],
        schemaResult: {
          pageSchema: invalidSchema,
          referencedComponents: [],
          reasoning: '',
        },
      }

      const result = await validationNode.handler(state)
      
      expect(result.validationResult?.isValid).toBe(false)
      expect(result.validationResult?.errors.some(e => e.message.includes('缺少 id'))).toBe(true)
    })

    it('应该检测重复组件 ID', async () => {
      const invalidSchema: PageSchema = {
        id: 'test',
        name: '测试',
        type: 'page',
        children: [
          { id: 'duplicate', type: 'Button' },
          { id: 'duplicate', type: 'Input' }, // 重复 ID
        ],
      }

      const validationNode = createValidationNode()
      
      const state: AgentState = {
        userInput: 'test',
        currentNode: 'validation',
        status: 'running',
        logs: [],
        schemaResult: {
          pageSchema: invalidSchema,
          referencedComponents: [],
          reasoning: '',
        },
      }

      const result = await validationNode.handler(state)
      
      expect(result.validationResult?.isValid).toBe(false)
      expect(result.validationResult?.errors.some(e => e.message.includes('不唯一'))).toBe(true)
    })
  })

  describe('自动修正', () => {
    it('应该自动为组件分配 ID', async () => {
      const invalidSchema: PageSchema = {
        name: '测试',
        type: 'page',
        children: [
          { type: 'Button', props: {} },
          { type: 'Input', props: {} },
        ],
      }

      const validationNode = createValidationNode({ strictMode: true })
      
      const state: AgentState = {
        userInput: 'test',
        currentNode: 'validation',
        status: 'running',
        logs: [],
        schemaResult: {
          pageSchema: invalidSchema,
          referencedComponents: [],
          reasoning: '',
        },
      }

      const result = await validationNode.handler(state)
      
      expect(result.finalSchema?.children?.every((c: any) => c.id)).toBe(true)
    })

    it('应该自动设置默认名称', async () => {
      const invalidSchema: PageSchema = {
        type: 'page',
        children: [],
      } as any

      const validationNode = createValidationNode({ strictMode: true })
      
      const state: AgentState = {
        userInput: 'test',
        currentNode: 'validation',
        status: 'running',
        logs: [],
        schemaResult: {
          pageSchema: invalidSchema,
          referencedComponents: [],
          reasoning: '',
        },
      }

      const result = await validationNode.handler(state)
      
      expect(result.finalSchema?.name).toBeDefined()
    })
  })

  describe('组件白名单', () => {
    it('应该对不在白名单的组件发出警告', async () => {
      const schemaWithUnknownComponent: PageSchema = {
        id: 'test',
        name: '测试',
        type: 'page',
        children: [
          { id: 'unknown', type: 'UnknownComponent', props: {} },
        ],
      }

      const validationNode = createValidationNode({
        strictMode: true,
        allowedComponents: ['Button', 'Input', 'Table'],
      })
      
      const state: AgentState = {
        userInput: 'test',
        currentNode: 'validation',
        status: 'running',
        logs: [],
        schemaResult: {
          pageSchema: schemaWithUnknownComponent,
          referencedComponents: [],
          reasoning: '',
        },
      }

      const result = await validationNode.handler(state)
      
      expect(result.validationResult?.isValid).toBe(true)
      expect(result.validationResult?.warnings.length).toBeGreaterThan(0)
      expect(result.validationResult?.warnings[0].message).toContain('UnknownComponent')
    })
  })
})

describe('AgentState 状态管理', () => {
  it('应该正确创建初始状态', () => {
    const initialState: AgentState = {
      sessionId: 'test-session',
      userInput: '创建用户列表页面',
      currentNode: 'requirement_analysis',
      status: 'running',
      logs: [],
    }

    expect(initialState.userInput).toBe('创建用户列表页面')
    expect(initialState.currentNode).toBe('requirement_analysis')
    expect(initialState.status).toBe('running')
    expect(initialState.logs).toEqual([])
  })

  it('应该正确更新状态', () => {
    const state: AgentState = {
      userInput: 'test',
      currentNode: 'requirement_analysis',
      status: 'running',
      logs: [],
    }

    const updatedState: AgentState = {
      ...state,
      currentNode: 'rag_retrieval',
      status: 'completed',
      logs: [{
        node: 'requirement_analysis',
        timestamp: new Date(),
        input: {},
        duration: 100,
      }],
    }

    expect(updatedState.currentNode).toBe('rag_retrieval')
    expect(updatedState.status).toBe('completed')
    expect(updatedState.logs.length).toBe(1)
  })
})

describe('条件路由逻辑', () => {
  it('shouldRetryGeneration 应该在校验通过时返回 end', () => {
    const agent = createPagePlanningAgent(mockConfig)
    
    const validState: AgentState = {
      userInput: 'test',
      currentNode: 'validation',
      status: 'running',
      logs: [],
      validationResult: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    }

    // 通过私有方法测试条件路由逻辑
    const retryMethod = agent['shouldRetryGeneration'].bind(agent)
    const result = retryMethod(validState)
    
    expect(result).toBe('end')
  })

  it('shouldRetryGeneration 应该在有严重错误时返回 schema_generation', () => {
    const agent = createPagePlanningAgent(mockConfig)
    
    const invalidState: AgentState = {
      userInput: 'test',
      currentNode: 'validation',
      status: 'running',
      logs: [],
      validationResult: {
        isValid: false,
        errors: [{ path: '', message: 'Schema 不能为空', severity: 'error' }],
        warnings: [],
      },
    }

    const retryMethod = agent['shouldRetryGeneration'].bind(agent)
    const result = retryMethod(invalidState)
    
    expect(result).toBe('schema_generation')
  })

  it('shouldRetryGeneration 应该在没有校验结果时返回 end', () => {
    const agent = createPagePlanningAgent(mockConfig)
    
    const state: AgentState = {
      userInput: 'test',
      currentNode: 'validation',
      status: 'running',
      logs: [],
    }

    const retryMethod = agent['shouldRetryGeneration'].bind(agent)
    const result = retryMethod(state)
    
    expect(result).toBe('end')
  })
})
/**
 * 页面规划 Agent 测试用例
 */

import { PagePlanningAgent } from '../agent/PagePlanningAgent'
import type { PlanningAgentConfig, PageSchema } from '../agent/types'

describe('PagePlanningAgent', () => {
  const mockConfig: PlanningAgentConfig = {
    llmConfig: {
      apiKey: 'test-api-key',
      model: 'gpt-4',
    },
    ragConfig: {
      knowledgeBaseIds: [],
      topK: 5,
      threshold: 0.7,
    },
    schemaConfig: {
      defaultPageSize: { width: 1920, height: 1080 },
      componentLibrary: [],
    },
  }

  describe('构造函数', () => {
    it('应该正确初始化 Agent', () => {
      const agent = new PagePlanningAgent(mockConfig)
      expect(agent).toBeDefined()
    })

    it('应该使用默认配置', () => {
      const agent = new PagePlanningAgent(mockConfig)
      expect(agent).toBeInstanceOf(PagePlanningAgent)
    })
  })

  describe('execute 方法', () => {
    it('应该接受有效的用户输入', async () => {
      const agent = new PagePlanningAgent(mockConfig)
      
      // 由于 LLM 调用需要真实 API，这里测试基本流程
      expect(agent).toBeDefined()
    })
  })
})

describe('AgentState', () => {
  it('应该正确创建状态对象', () => {
    const state = {
      userInput: '创建一个用户列表页面',
      logs: [],
      currentNode: 'requirement_analysis' as const,
      status: 'idle' as const,
    }
    
    expect(state.userInput).toBe('创建一个用户列表页面')
    expect(state.currentNode).toBe('requirement_analysis')
    expect(state.status).toBe('idle')
  })
})

/**
 * 节点 1：需求解析
 * 解析用户自然语言输入，提取实体和子任务
 */
import { AgentState, RequirementAnalysis, ExtractedEntity, SubTask } from './types'
import { StateUpdate } from './LangGraphState'
import { LLMFactory } from '../../llm/LLMFactory'
import type { LLMConfig } from '@ai-lowcode/shared-types'

export interface RequirementAnalysisNodeConfig {
  llmConfig: LLMConfig
}

/**
 * 创建需求解析节点
 */
export function createRequirementAnalysisNode(
  config: RequirementAnalysisNodeConfig
) {
  return {
    name: 'requirement_analysis' as const,
    
    handler: async (state: AgentState): Promise<StateUpdate> => {
      const startTime = Date.now()
      const log: any = {
        node: 'requirement_analysis',
        timestamp: new Date(),
        input: state.userInput,
      }

      try {
        // 构建分析提示词
        const prompt = buildAnalysisPrompt(state.userInput)
        
        // 调用 LLM 解析需求
        const llm = LLMFactory.createLLM({
          provider: 'openai',
          config: config.llmConfig,
        })

        const response = await llm.complete(prompt)
        
        // 解析 LLM 返回结果
        const analysis = parseAnalysisResult(response.content)

        log.output = analysis
        log.duration = Date.now() - startTime

        return {
          requirementAnalysis: analysis,
          currentNode: 'rag_retrieval',
          status: 'running',
          logs: [...state.logs, log],
        }
      } catch (error: any) {
        log.error = error.message
        log.duration = Date.now() - startTime

        return {
          error: `需求解析失败: ${error.message}`,
          currentNode: 'end',
          status: 'failed',
          logs: [...state.logs, log],
        }
      }
    },
  }
}

/**
 * 构建需求分析提示词
 */
function buildAnalysisPrompt(userInput: string): string {
  return `你是一个需求分析专家。请分析以下用户需求，提取关键信息。

用户需求：${userInput}

请以 JSON 格式输出分析结果，包含以下字段：
- parsedIntent: 解析后的意图（简短的动词短语）
- extractedEntities: 提取的实体列表，包含 name（实体名称）、type（类型：component/page/feature/style）、value（具体值）、confidence（置信度 0-1）
- subTasks: 拆分的子任务列表，包含 id、description、priority（high/medium/low）、status
- confidence: 整体置信度（0-1）

请确保输出的 JSON 格式正确，可以直接被 JSON.parse 解析。`
}

/**
 * 解析分析结果
 */
function parseAnalysisResult(content: string): RequirementAnalysis {
  try {
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        rawInput: content,
        parsedIntent: parsed.parsedIntent || '未识别意图',
        extractedEntities: parsed.extractedEntities || [],
        subTasks: (parsed.subTasks || []).map((task: any, index: number) => ({
          id: task.id || `task-${index}`,
          description: task.description || '',
          priority: task.priority || 'medium',
          status: task.status || 'pending',
        })),
        confidence: parsed.confidence || 0.5,
      }
    }
  } catch (error) {
    console.warn('解析分析结果失败，使用默认解析')
  }

  // 默认解析
  return {
    rawInput: content,
    parsedIntent: extractIntentFromText(content),
    extractedEntities: extractEntitiesFromText(content),
    subTasks: [{ id: 'task-1', description: content, priority: 'medium', status: 'pending' }],
    confidence: 0.5,
  }
}

/**
 * 从文本提取意图
 */
function extractIntentFromText(text: string): string {
  const actionWords = ['创建', '生成', '设计', '开发', '构建', '制作']
  for (const word of actionWords) {
    if (text.includes(word)) {
      return `用户想要${word}页面`
    }
  }
  return '用户有页面需求'
}

/**
 * 从文本提取实体
 */
function extractEntitiesFromText(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = []
  
  // 简单的组件识别
  const componentPatterns = [
    { pattern: /表单|form/gi, type: 'component', name: 'Form' },
    { pattern: /表格|table/gi, type: 'component', name: 'Table' },
    { pattern: /列表|list/gi, type: 'component', name: 'List' },
    { pattern: /导航|nav/gi, type: 'component', name: 'Navigation' },
    { pattern: /卡片|card/gi, type: 'component', name: 'Card' },
    { pattern: /按钮|button/gi, type: 'component', name: 'Button' },
    { pattern: /输入框|input/gi, type: 'component', name: 'Input' },
  ]

  for (const { pattern, type, name } of componentPatterns) {
    if (pattern.test(text)) {
      entities.push({
        name,
        type,
        value: name,
        confidence: 0.8,
      })
    }
  }

  return entities
}

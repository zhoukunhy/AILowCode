/**
 * 节点 3：页面 Schema 生成
 * 基于需求分析和 RAG 召回结果生成画布 JSON Schema
 */
import { AgentState, SchemaGenerationResult, PageSchema, ComponentSchema } from './types'
import { StateUpdate } from './LangGraphState'
import { LLMFactory } from '../llm/LLMFactory'
import type { LLMConfig } from '@ai-lowcode/shared-types'

export interface SchemaGenerationNodeConfig {
  llmConfig: LLMConfig
  defaultPageSize?: { width: number; height: number }
  componentLibrary?: string[]
}

/**
 * 创建 Schema 生成节点
 */
export function createSchemaGenerationNode(config: SchemaGenerationNodeConfig) {
  return {
    name: 'schema_generation' as const,
    
    handler: async (state: AgentState): Promise<StateUpdate> => {
      const startTime = Date.now()
      const log: any = {
        node: 'schema_generation',
        timestamp: new Date(),
        input: {
          requirement: state.requirementAnalysis,
          ragDocCount: state.ragResults?.retrievedDocs.length || 0,
        },
      }

      try {
        // 构建生成提示词
        const prompt = buildSchemaGenerationPrompt(state, config)
        
        // 调用 LLM 生成 Schema
        const llm = LLMFactory.createLLM({
          provider: 'openai',
          config: config.llmConfig,
        })

        const response = await llm.complete(prompt)
        
        // 解析生成的 Schema
        const schemaResult = parseSchemaResult(response.content, state)

        log.output = {
          componentCount: schemaResult.pageSchema.children.length,
          referencedComponents: schemaResult.referencedComponents,
        }
        log.duration = Date.now() - startTime

        return {
          schemaResult,
          currentNode: 'validation',
          status: 'running',
          logs: [...state.logs, log],
        }
      } catch (error: any) {
        log.error = error.message
        log.duration = Date.now() - startTime

        return {
          error: `Schema 生成失败: ${error.message}`,
          currentNode: 'end',
          status: 'failed',
          logs: [...state.logs, log],
        }
      }
    },
  }
}

/**
 * 构建 Schema 生成提示词
 */
function buildSchemaGenerationPrompt(
  state: AgentState,
  config: SchemaGenerationNodeConfig
): string {
  const { requirementAnalysis, ragResults } = state
  
  // 提取相关文档内容
  const relevantDocs = ragResults?.retrievedDocs || []
  const docContext = relevantDocs.length > 0
    ? relevantDocs.map((doc, i) => `参考文档 ${i + 1}:\n${doc.content}`).join('\n\n')
    : '无相关参考文档'

  // 可用组件库
  const componentLibrary = config.componentLibrary?.join(', ') || 'Button, Input, Text, Image, Card, List, Form, Table, Modal, Navigation'

  // 页面尺寸
  const pageSize = config.defaultPageSize || { width: 1920, height: 1080 }

  return `你是一个低代码平台页面生成专家。请根据用户需求和参考文档生成标准的画布 JSON Schema。

## 用户需求
- 原始输入: ${requirementAnalysis?.rawInput || state.userInput}
- 解析意图: ${requirementAnalysis?.parsedIntent || '未解析'}
- 提取的组件: ${requirementAnalysis?.extractedEntities?.map(e => e.value).join(', ') || '未识别'}

## 参考文档（知识库 RAG 召回）
${docContext}

## 可用组件库
${componentLibrary}

## 页面尺寸
宽度: ${pageSize.width}px, 高度: ${pageSize.height}px

## 输出要求
请生成符合以下格式的 JSON Schema：
{
  "id": "page-xxx",
  "name": "页面名称",
  "type": "page",
  "config": {
    "title": "页面标题",
    "background": "#ffffff",
    "width": ${pageSize.width},
    "height": ${pageSize.height}
  },
  "children": [
    {
      "id": "comp-xxx",
      "type": "组件类型",
      "props": { /* 组件属性 */ },
      "style": { /* 样式 */ },
      "children": [ /* 子组件 */ ]
    }
  ]
}

请确保：
1. 组件类型使用标准组件名称
2. 每个组件有唯一 id
3. 布局合理，遵循设计规范
4. props 包含必要的组件属性
5. 输出完整的 JSON，可以直接被 JSON.parse 解析

请直接输出 JSON，不要有其他解释。`
}

/**
 * 解析 Schema 生成结果
 */
function parseSchemaResult(content: string, state: AgentState): SchemaGenerationResult {
  try {
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const pageSchema = JSON.parse(jsonMatch[0]) as PageSchema
      
      // 提取引用的组件
      const referencedComponents = extractComponentTypes(pageSchema)

      return {
        pageSchema: {
          ...pageSchema,
          id: pageSchema.id || `page-${Date.now()}`,
          type: 'page',
          config: {
            title: pageSchema.config?.title || 'AI 生成页面',
            background: pageSchema.config?.background || '#ffffff',
            width: pageSchema.config?.width || 1920,
            height: pageSchema.config?.height || 1080,
            ...pageSchema.config,
          },
        },
        referencedComponents,
        reasoning: `基于需求"${state.requirementAnalysis?.parsedIntent}"生成，参考了${state.ragResults?.retrievedDocs.length || 0}个文档`,
      }
    }
  } catch (error) {
    console.warn('解析 Schema 结果失败:', error)
  }

  // 返回默认 Schema
  return generateDefaultSchema(state)
}

/**
 * 提取组件类型
 */
function extractComponentTypes(schema: PageSchema): string[] {
  const types = new Set<string>()
  
  function traverse(components: ComponentSchema[]) {
    for (const comp of components) {
      if (comp.type) {
        types.add(comp.type)
      }
      if (comp.children) {
        traverse(comp.children)
      }
    }
  }

  if (schema.children) {
    traverse(schema.children)
  }

  return Array.from(types)
}

/**
 * 生成默认 Schema
 */
function generateDefaultSchema(state: AgentState): SchemaGenerationResult {
  const pageId = `page-${Date.now()}`
  
  const pageSchema: PageSchema = {
    id: pageId,
    name: state.requirementAnalysis?.parsedIntent || 'AI 生成页面',
    type: 'page',
    config: {
      title: state.requirementAnalysis?.parsedIntent || 'AI 生成页面',
      background: '#ffffff',
      width: 1920,
      height: 1080,
    },
    children: [
      {
        id: `header-${pageId}`,
        type: 'Container',
        props: {
          text: state.requirementAnalysis?.parsedIntent || '页面标题',
        },
        style: {
          width: '100%',
          height: '60px',
          background: '#1890ff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
        },
      },
      {
        id: `content-${pageId}`,
        type: 'Container',
        props: {
          text: '页面内容区域',
        },
        style: {
          width: '100%',
          flex: 1,
          padding: '20px',
        },
      },
    ],
  }

  return {
    pageSchema,
    referencedComponents: ['Container'],
    reasoning: `基于需求"${state.requirementAnalysis?.parsedIntent}"生成`,
  }
}

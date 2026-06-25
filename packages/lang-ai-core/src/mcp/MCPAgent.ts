import type { MCPRequest, MCPResponse } from './MCPProtocol'
import { MCP_ERROR_CODES } from './MCPProtocol'
import { ToolManager } from './ToolManager'
import { PromptStore } from './PromptStore'
import { ContextStore } from './ContextStore'
import { ToolCallingAgent } from '../agent/tools/ToolCallingAgent'

/**
 * MCP Agent 配置接口
 * 定义 MCP Agent 的可选依赖组件
 */
export interface MCPAgentConfig {
  toolManager?: ToolManager    // 自定义工具管理器
  promptStore?: PromptStore    // 自定义提示词存储
  contextStore?: ContextStore  // 自定义上下文存储
}

/**
 * MCP Agent 主类
 * 实现模型上下文协议的核心代理，负责协议请求的处理和路由
 * 提供工具调用、提示词管理和上下文管理的统一入口
 */
export class MCPAgent {
  readonly toolManager: ToolManager           // 工具管理器实例
  readonly promptStore: PromptStore           // 提示词存储实例
  readonly contextStore: ContextStore         // 上下文存储实例
  private toolCallingAgent: ToolCallingAgent  // 工具调用代理实例

  /**
   * 构造函数
   * @param config - 可选的 MCP Agent 配置
   */
  constructor(config?: MCPAgentConfig) {
    this.toolManager = config?.toolManager || new ToolManager()
    this.promptStore = config?.promptStore || new PromptStore()
    this.contextStore = config?.contextStore || new ContextStore()

    this.toolCallingAgent = new ToolCallingAgent()

    this.initializeBuiltinTools()    // 初始化内置工具
    this.initializeDefaultPrompts()  // 初始化默认提示词
  }

  /**
   * 初始化内置工具
   * 将 ToolCallingAgent 中的工具注册到工具管理器中
   */
  private initializeBuiltinTools(): void {
    const builtinTools = this.toolCallingAgent.getTools()
    for (const tool of builtinTools) {
      this.toolManager.registerTool(tool, {
        description: tool.description,
        inputSchema: {},
        version: '1.0.0',
        author: 'AI LowCode Platform',
      })
    }
  }

  /**
   * 初始化默认提示词模板
   * 预置代码生成、需求分析、Schema生成等常用提示词
   */
  private initializeDefaultPrompts(): void {
    const defaultPrompts = [
      {
        name: '代码生成提示词',
        description: '用于指导AI生成代码的标准提示词',
        content: '你是一个专业的{{role}}。\n' +
        '根据用户需求生成高质量的代码。\n\n' +
        '## 用户需求\n' +
        '{{userInput}}\n\n' +
        '## 要求\n' +
        '1. 代码必须符合最佳实践\n' +
        '2. 使用TypeScript编写\n' +
        '3. 包含完整的类型定义\n' +
        '4. 添加适当的注释\n' +
        '5. 确保代码可运行\n\n' +
        '## 输出格式\n' +
        '输出完整的代码文件内容。',
        variables: ['role', 'userInput'],
        category: 'codegen',
        version: '1.0.0',
      },
      {
        name: '需求分析提示词',
        description: '用于分析用户需求的提示词',
        content: `请分析以下用户需求并提取关键信息：

## 用户需求
{{userInput}}

## 需要提取的信息
1. 业务实体及其属性
2. 功能需求
3. 数据关系
4. UI/UX要求

## 输出格式
以结构化JSON格式输出分析结果。`,
        variables: ['userInput'],
        category: 'analysis',
        version: '1.0.0',
      },
      {
        name: 'Schema生成提示词',
        description: '用于生成组件Schema的提示词',
        content: `根据用户需求生成页面组件Schema。

## 用户需求
{{userInput}}

## Schema格式要求
- 遵循平台组件规范
- 包含组件类型、属性、布局信息
- 支持响应式设计
- 包含数据绑定配置

## 输出格式
JSON格式的组件Schema。`,
        variables: ['userInput'],
        category: 'schema',
        version: '1.0.0',
      },
    ]

    for (const prompt of defaultPrompts) {
      this.promptStore.createPrompt(prompt)
    }
  }

  /**
   * 处理 MCP 协议请求
   * 根据 method 参数路由到相应的处理逻辑
   * @param request - MCP 请求对象
   * @returns MCP 响应对象（成功或错误）
   */
  async processRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'mcp/list_tools':
          return this.createSuccessResponse(request.id, this.toolManager.listTools())

        case 'mcp/describe_tool': {
          const name = request.params?.name as string
          return this.createSuccessResponse(request.id, this.toolManager.describeTool(name))
        }

        case 'mcp/call_tool': {
          const { toolName, input } = request.params as { toolName: string; input: any }
          const result = await this.toolManager.callTool(toolName, input)
          return this.createSuccessResponse(request.id, result)
        }

        case 'mcp/list_prompts': {
          const category = request.params?.category as string
          return this.createSuccessResponse(request.id, this.promptStore.listPrompts(category))
        }

        case 'mcp/get_prompt': {
          const id = request.params?.id as string
          return this.createSuccessResponse(request.id, this.promptStore.getPrompt(id))
        }

        case 'mcp/set_prompt': {
          const prompt = this.promptStore.createPrompt(request.params as any)
          return this.createSuccessResponse(request.id, prompt)
        }

        case 'mcp/render_prompt': {
          const { id, variables } = request.params as { id: string; variables: Record<string, any> }
          const result = this.promptStore.renderPrompt(id, variables)
          return this.createSuccessResponse(request.id, result)
        }

        case 'mcp/get_context': {
          const sessionId = request.params?.sessionId as string
          return this.createSuccessResponse(request.id, this.contextStore.getContext(sessionId))
        }

        case 'mcp/set_context': {
          const { sessionId, message, metadata } = request.params as {
            sessionId: string
            message?: any
            metadata?: Record<string, any>
          }
          if (!this.contextStore.hasContext(sessionId)) {
            this.contextStore.createContext(sessionId)
          }
          if (message) this.contextStore.addMessage(sessionId, message)
          if (metadata) this.contextStore.setMetadata(sessionId, metadata)
          return this.createSuccessResponse(request.id, true)
        }

        case 'mcp/clear_context': {
          const sessionId = request.params?.sessionId as string
          this.contextStore.clearContext(sessionId)
          return this.createSuccessResponse(request.id, true)
        }

        default:
          return this.createErrorResponse(request.id, MCP_ERROR_CODES.METHOD_NOT_FOUND, `Unknown method: ${request.method}`)
      }
    } catch (error) {
      return this.createErrorResponse(request.id, MCP_ERROR_CODES.INTERNAL_ERROR, (error as Error).message)
    }
  }

  /**
   * 创建成功响应
   * @param id - 请求ID
   * @param result - 响应结果
   * @returns MCP 成功响应对象
   */
  private createSuccessResponse<T>(id: string, result: T): MCPResponse<T> {
    return {
      jsonrpc: '2.0',
      id,
      result,
    }
  }

  /**
   * 创建错误响应
   * @param id - 请求ID
   * @param code - 错误代码
   * @param message - 错误消息
   * @returns MCP 错误响应对象
   */
  private createErrorResponse(id: string, code: number, message: string): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    }
  }
}
import type { Tool } from '../agent/tools/ToolTypes'

/**
 * 工具注册元数据接口
 * 定义工具在 MCP 系统中的注册信息
 */
export interface ToolRegistration {
  name: string                  // 工具名称，必须唯一
  description: string           // 工具功能描述
  inputSchema: Record<string, unknown> // 工具输入参数的 JSON Schema 验证规则
  version: string               // 工具版本号
  author?: string              // 工具作者信息
}

/**
 * 工具管理器类
 * 负责工具的注册、查询、调用和生命周期管理
 * 实现工具的统一管理和接口标准化
 */
export class ToolManager {
  private tools: Map<string, Tool> = new Map()           // 工具实例存储
  private toolMetadata: Map<string, ToolRegistration> = new Map() // 工具元数据存储

  /**
   * 注册新工具到管理器
   * @param tool - 工具实例，包含 name 和 execute 方法
   * @param metadata - 工具元数据（排除 name，从 tool.name 获取）
   */
  registerTool(tool: Tool, metadata: Omit<ToolRegistration, 'name'>): void {
    this.tools.set(tool.name, tool)
    this.toolMetadata.set(tool.name, { ...metadata, name: tool.name })
  }

  /**
   * 获取指定名称的工具实例
   * @param name - 工具名称
   * @returns 工具实例或 undefined
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  /**
   * 列出所有已注册的工具元数据
   * @returns 工具注册信息数组
   */
  listTools(): ToolRegistration[] {
    return Array.from(this.toolMetadata.values())
  }

  /**
   * 获取指定工具的详细描述信息
   * @param name - 工具名称
   * @returns 工具注册信息或 undefined
   */
  describeTool(name: string): ToolRegistration | undefined {
    return this.toolMetadata.get(name)
  }

  /**
   * 调用指定工具执行操作
   * @param name - 工具名称
   * @param input - 工具输入参数
   * @returns 工具执行结果
   * @throws Error 当工具不存在时抛出异常
   */
  async callTool(name: string, input: any): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) throw new Error(`Tool not found: ${name}`)
    return tool.execute(input)
  }

  /**
   * 检查指定工具是否已注册
   * @param name - 工具名称
   * @returns 是否存在该工具
   */
  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * 注销指定工具
   * @param name - 工具名称
   * @returns 是否成功注销
   */
  unregisterTool(name: string): boolean {
    this.toolMetadata.delete(name)
    return this.tools.delete(name)
  }
}
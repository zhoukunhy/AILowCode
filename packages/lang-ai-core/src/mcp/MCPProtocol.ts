/**
 * MCP 协议请求接口
 * 基于 JSON-RPC 2.0 规范的 MCP 请求格式
 */
export interface MCPRequest {
  jsonrpc: '2.0' // JSON-RPC 版本标识
  id: string      // 请求唯一标识符，用于匹配响应
  method: string  // 调用的 MCP 方法名称
  params?: Record<string, unknown> // 方法参数
}

/**
 * MCP 协议响应接口
 * 基于 JSON-RPC 2.0 规范的 MCP 响应格式
 */
export interface MCPResponse<T = any> {
  jsonrpc: '2.0' // JSON-RPC 版本标识
  id: string      // 对应请求的唯一标识符
  result?: T      // 成功时的返回结果
  error?: MCPError // 错误时的错误信息
}

/**
 * MCP 协议错误接口
 * 定义标准化的错误格式
 */
export interface MCPError {
  code: number     // 错误代码
  message: string  // 错误描述信息
  data?: any       // 额外的错误数据
}

/**
 * MCP 支持的方法类型
 * 定义所有可用的 MCP 操作方法
 */
export type MCPMethod =
  | 'mcp/list_tools'      // 列出所有可用工具
  | 'mcp/describe_tool'   // 获取工具详细信息
  | 'mcp/call_tool'       // 调用特定工具
  | 'mcp/list_prompts'    // 列出所有提示词模板
  | 'mcp/get_prompt'      // 获取特定提示词模板
  | 'mcp/set_prompt'      // 创建或更新提示词模板
  | 'mcp/render_prompt'   // 渲染提示词模板
  | 'mcp/get_context'     // 获取会话上下文
  | 'mcp/set_context'     // 设置会话上下文
  | 'mcp/clear_context'   // 清除会话上下文

/**
 * MCP 错误代码常量
 * 遵循 JSON-RPC 2.0 标准错误代码
 */
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,      // JSON 解析错误
  INVALID_REQUEST: -32600,  // 无效的请求格式
  METHOD_NOT_FOUND: -32601, // 请求的方法不存在
  INVALID_PARAMS: -32602,   // 无效的方法参数
  INTERNAL_ERROR: -32603,   // 内部服务器错误
  SERVER_ERROR: -32000,     // 服务器错误
} as const
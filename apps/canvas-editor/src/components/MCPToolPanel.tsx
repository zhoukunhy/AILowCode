'use client'

import { useState, useEffect } from 'react'
import { mcpApi } from '@/lib/api'

/**
 * 工具注册信息接口
 * 定义 MCP 工具的注册信息结构
 */
export interface ToolRegistration {
  name: string                    // 工具名称
  description: string             // 工具描述
  inputSchema: Record<string, unknown> // 输入参数的 JSON Schema
  version: string                 // 工具版本
  author?: string                // 工具作者
}

/**
 * MCP 工具面板组件
 * 提供工具列表展示、详情查看、参数输入和工具调用的交互界面
 * 支持实时调用 MCP 工具并显示调用结果
 */
export function MCPToolPanel() {
  // 状态管理
  const [tools, setTools] = useState<ToolRegistration[]>([])  // 可用工具列表
  const [selectedTool, setSelectedTool] = useState<ToolRegistration | null>(null)  // 当前选中的工具
  const [toolInput, setToolInput] = useState<Record<string, any>>({})  // 工具输入参数
  const [isCalling, setIsCalling] = useState(false)  // 是否正在调用工具
  const [callResult, setCallResult] = useState<any>(null)  // 工具调用结果
  const [error, setError] = useState('')  // 错误信息

  // 组件挂载时获取工具列表
  useEffect(() => {
    fetchTools()
  }, [])

  /**
   * 获取可用工具列表
   * 从后端 API 获取所有已注册的 MCP 工具
   */
  const fetchTools = async () => {
    try {
      const result: any = await mcpApi.listTools()
      setTools(result?.data || [])
    } catch (err) {
      console.error('获取工具列表失败:', err)
      setTools([])
    }
  }

  /**
   * 处理工具选择事件
   * @param tool - 被选择的工具
   */
  const handleToolSelect = (tool: ToolRegistration) => {
    setSelectedTool(tool)
    setToolInput({})
    setCallResult(null)
    setError('')
  }

  /**
   * 调用选中的工具
   * 使用当前输入参数调用工具并显示结果
   */
  const handleCallTool = async () => {
    if (!selectedTool) return
    setIsCalling(true)
    setError('')
    
    try {
      const result = await mcpApi.callTool(selectedTool.name, toolInput)
      setCallResult(result)
    } catch (err: any) {
      setError(err.message || '调用工具失败')
    } finally {
      setIsCalling(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔧 MCP 工具中心</h1>
          <p className="text-gray-500 mt-1">管理和调用 AI 工具</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 工具列表区域 */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">可用工具</h3>
          <div className="space-y-2">
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleToolSelect(tool)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedTool?.name === tool.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-800">{tool.name}</div>
                <div className="text-sm text-gray-500 mt-1">{tool.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">v{tool.version}</span>
                  {tool.author && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tool.author}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 工具详情和调用区域 */}
        <div className="md:col-span-2">
          {selectedTool ? (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">工具详情</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{selectedTool.name}</h4>
                    <p className="text-gray-500">{selectedTool.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    v{selectedTool.version}
                  </span>
                </div>

                {/* 参数输入区域 */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-700 mb-3">参数</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <textarea
                      value={JSON.stringify(toolInput, null, 2)}
                      onChange={(e) => {
                        try {
                          setToolInput(JSON.parse(e.target.value))
                        } catch {
                          // ignore
                        }
                      }}
                      placeholder="输入工具参数 JSON..."
                      className="w-full h-40 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm"
                    />
                  </div>
                </div>

                {/* 错误信息显示 */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    ❌ {error}
                  </div>
                )}

                {/* 调用按钮 */}
                <button
                  onClick={handleCallTool}
                  disabled={isCalling}
                  className={`w-full px-6 py-3 rounded-xl font-medium transition-colors ${
                    isCalling
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCalling ? '⏳ 调用中...' : '🚀 调用工具'}
                </button>

                {/* 调用结果显示 */}
                {callResult !== null && (
                  <div className="mt-6">
                    <h5 className="font-medium text-gray-700 mb-3">调用结果</h5>
                    <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-auto">
                      <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(callResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-3">🔧</div>
                <p>选择一个工具查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
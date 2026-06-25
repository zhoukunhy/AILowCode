'use client'

import { useState, useEffect } from 'react'
import { mcpApi } from '@/lib/api'

/**
 * 提示词模板接口
 * 定义 MCP 提示词模板的完整结构
 */
export interface PromptTemplate {
  id: string                      // 模板唯一ID
  name: string                    // 模板名称
  description: string             // 模板描述
  content: string                 // 模板内容（支持 {{variable}} 语法）
  variables: string[]             // 模板中使用的变量名列表
  category: string                // 模板分类
  version: string                 // 模板版本
  createdAt: Date                 // 创建时间
  updatedAt: Date                 // 更新时间
}

/**
 * MCP 提示词管理面板组件
 * 提供提示词模板的列表展示、详情查看、创建和删除功能
 * 支持模板变量的管理和模板内容的编辑
 */
export function MCPPromptPanel() {
  // 状态管理
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])  // 提示词模板列表
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null)  // 当前选中的模板
  const [newPrompt, setNewPrompt] = useState<Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    content: '',
    variables: [],
    category: '',
    version: '1.0.0',
  })  // 新模板表单数据
  const [isCreating, setIsCreating] = useState(false)  // 是否正在创建
  const [error, setError] = useState('')  // 错误信息

  // 组件挂载时获取提示词列表
  useEffect(() => {
    fetchPrompts()
  }, [])

  /**
   * 获取提示词模板列表
   * 从后端 API 获取所有已注册的提示词模板
   */
  const fetchPrompts = async () => {
    try {
      const result = await mcpApi.listPrompts()
      const promptsData = result?.data || []
      // 标准化变量字段，确保总是数组类型
      const normalizedPrompts = promptsData.map((prompt: any) => ({
        ...prompt,
        variables: Array.isArray(prompt.variables)
          ? prompt.variables
          : typeof prompt.variables === 'string'
          ? prompt.variables.split(' ').filter(Boolean)
          : [],
      }))
      setPrompts(normalizedPrompts)
    } catch (err) {
      console.error('获取提示词列表失败:', err)
      setPrompts([])
    }
  }

  /**
   * 创建新的提示词模板
   * 使用当前表单数据创建新模板并刷新列表
   */
  const handleCreatePrompt = async () => {
    if (!newPrompt.name || !newPrompt.content) return
    setIsCreating(true)
    setError('')
    
    try {
      await mcpApi.createPrompt(newPrompt)
      fetchPrompts()
      setNewPrompt({
        name: '',
        description: '',
        content: '',
        variables: [],
        category: '',
        version: '1.0.0',
      })
    } catch (err: any) {
      setError(err.message || '创建提示词失败')
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * 删除指定的提示词模板
   * @param id - 要删除的模板ID
   */
  const handleDeletePrompt = async (id: string) => {
    if (!confirm('确定要删除这个提示词吗？')) return
    try {
      await mcpApi.deletePrompt(id)
      fetchPrompts()
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null)
      }
    } catch (err) {
      console.error('删除提示词失败:', err)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📝 MCP 提示词管理</h1>
          <p className="text-gray-500 mt-1">管理和使用 AI 提示词模板</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 提示词列表区域 */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">提示词列表</h3>
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => setSelectedPrompt(prompt)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedPrompt?.id === prompt.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-800">{prompt.name}</div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-2">{prompt.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                    {prompt.category}
                  </span>
                  <span className="text-xs text-gray-400">v{prompt.version}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 提示词详情或创建表单区域 */}
        <div className="md:col-span-2">
          {selectedPrompt ? (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">提示词详情</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{selectedPrompt.name}</h4>
                    <p className="text-gray-500">{selectedPrompt.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {selectedPrompt.category}
                    </span>
                    <button
                      onClick={() => handleDeletePrompt(selectedPrompt.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* 变量列表 */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">变量</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.variables.map((varName) => (
                      <span key={varName} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        {{{varName}}}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 模板内容 */}
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">内容</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {selectedPrompt.content}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 创建新提示词表单 */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">创建新提示词</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                    <input
                      type="text"
                      value={newPrompt.name}
                      onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="输入提示词名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <input
                      type="text"
                      value={newPrompt.description}
                      onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="输入提示词描述"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                    <input
                      type="text"
                      value={newPrompt.category}
                      onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="例如：codegen, analysis, schema"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">变量（逗号分隔）</label>
                    <input
                      type="text"
                      value={newPrompt.variables.join(',')}
                      onChange={(e) => setNewPrompt({
                        ...newPrompt,
                        variables: e.target.value.split(',').map((v: string) => v.trim()).filter(Boolean),
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="例如：userInput, context, requirements"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                    <textarea
                      value={newPrompt.content}
                      onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm"
                      rows={8}
                      placeholder="输入提示词内容，使用 {{variable}} 引用变量..."
                    />
                  </div>

                  {/* 错误信息显示 */}
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                      ❌ {error}
                    </div>
                  )}

                  {/* 创建按钮 */}
                  <button
                    onClick={handleCreatePrompt}
                    disabled={isCreating || !newPrompt.name || !newPrompt.content}
                    className={`w-full px-6 py-3 rounded-xl font-medium transition-colors ${
                      isCreating || !newPrompt.name || !newPrompt.content
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCreating ? '⏳ 创建中...' : '➕ 创建提示词'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'

interface ComponentTemplate {
  id: string
  name: string
  description: string
  category: string
  preview: string
  schema: Record<string, unknown>
  downloads: number
  rating: number
  author: string
  createdAt: string
  tags: string[]
}

const API_BASE = 'http://localhost:3002/api'

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function fetchComponentTemplates(category?: string): Promise<ComponentTemplate[]> {
  const url = category 
    ? `${API_BASE}/component-templates?category=${category}` 
    : `${API_BASE}/component-templates`
  const response = await fetch(url, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取组件模板失败')
  const data = await response.json()
  return (data.data || []).map((item: Record<string, unknown>) => ({
    id: String(item.id),
    name: (item.name as string) || '未命名模板',
    description: (item.description as string) || '',
    category: (item.category as string) || '其他',
    preview: (item.preview as string) || '',
    schema: (item.schema as Record<string, unknown>) || {},
    downloads: (item.downloads as number) || 0,
    rating: (item.rating as number) || 0,
    author: (item.author as string) || '官方',
    createdAt: item.createdAt ? new Date(item.createdAt as string).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
    tags: (item.tags as string[]) || [],
  }))
}

async function downloadComponentTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/component-templates/${id}/download`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('下载组件模板失败')
}

const categories = [
  { id: 'all', name: '全部', icon: '📦' },
  { id: 'form', name: '表单组件', icon: '📝' },
  { id: 'layout', name: '布局组件', icon: '📐' },
  { id: 'business', name: '业务组件', icon: '💼' },
  { id: 'data', name: '数据展示', icon: '📊' },
  { id: 'interaction', name: '交互组件', icon: '🎯' },
]

interface ComponentMarketProps {
  onUseTemplate: (schema: any) => void
}

export function ComponentMarket({ onUseTemplate }: ComponentMarketProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [templates, setTemplates] = useState<ComponentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [previewTemplate, setPreviewTemplate] = useState<ComponentTemplate | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [selectedCategory])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const category = selectedCategory === 'all' ? undefined : selectedCategory
      const data = await fetchComponentTemplates(category)
      setTemplates(data)
    } catch (error) {
      console.error('加载组件模板失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchKeyword = template.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      template.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchKeyword.toLowerCase()))
    return matchKeyword
  })

  const handleUseTemplate = async (template: ComponentTemplate) => {
    try {
      await downloadComponentTemplate(template.id)
      onUseTemplate(template.schema)
      setTemplates(templates.map(t => 
        t.id === template.id ? { ...t, downloads: t.downloads + 1 } : t
      ))
    } catch (error) {
      console.error('使用模板失败:', error)
      alert('使用模板失败，请重试')
    }
  }

  const renderPreview = (template: ComponentTemplate) => {
    if (template.preview) {
      return (
        <div className="w-full h-32 bg-gray-100 rounded-t-lg overflow-hidden">
          <img 
            src={template.preview} 
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </div>
      )
    }
    return (
      <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-t-lg flex items-center justify-center">
        <span className="text-4xl">🎨</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部搜索 */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative mb-3">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索组件模板..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 模板列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-sm">加载中...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-sm">暂无组件模板</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => setPreviewTemplate(template)}
              >
                {renderPreview(template)}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-800 truncate mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <span>⭐</span> {template.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>⬇️</span> {template.downloads}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        +{template.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
                {/* 悬停操作按钮 */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUseTemplate(template)
                    }}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    使用模板
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewTemplate(template)
                    }}
                    className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  >
                    预览
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 预览弹窗 */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{previewTemplate.name}</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {renderPreview(previewTemplate)}
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">描述</h4>
                <p className="text-sm text-gray-600">{previewTemplate.description}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">标签</h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500">作者</div>
                  <div className="font-medium text-gray-800">{previewTemplate.author}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500">评分</div>
                  <div className="font-medium text-yellow-600">⭐ {previewTemplate.rating.toFixed(1)}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500">下载</div>
                  <div className="font-medium text-gray-800">{previewTemplate.downloads}</div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate)
                  setPreviewTemplate(null)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                使用此模板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
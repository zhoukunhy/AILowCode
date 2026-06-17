'use client'

import React, { useState, useEffect } from 'react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  downloads: number
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  schema?: Record<string, any>
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

async function fetchTemplates(category?: string): Promise<Template[]> {
  const url = category ? `${API_BASE}/templates?category=${category}` : `${API_BASE}/templates`
  const response = await fetch(url, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取模板列表失败')
  const data = await response.json()
  return (data.data || []).map((item: any) => ({
    id: String(item.id),
    name: item.name || '未命名模板',
    description: item.description || '',
    category: item.category || '其他',
    downloads: item.downloads || 0,
    status: item.status || 'draft',
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
    schema: item.schema,
  }))
}

async function createTemplate(data: { name: string; description?: string; category: string; schema?: Record<string, any> }): Promise<Template> {
  const response = await fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('创建模板失败')
  const result = await response.json()
  const item = result.data || result
  return {
    id: String(item.id),
    name: item.name,
    description: item.description || '',
    category: item.category,
    downloads: 0,
    status: 'draft',
    createdAt: new Date(item.createdAt).toLocaleDateString('zh-CN'),
    updatedAt: new Date(item.updatedAt).toLocaleDateString('zh-CN'),
    schema: item.schema,
  }
}

async function updateTemplate(id: string, data: { name?: string; description?: string; category?: string; status?: string; schema?: Record<string, any> }): Promise<void> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('更新模板失败')
}

async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('删除模板失败')
}

async function downloadTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/templates/${id}/download`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('下载模板失败')
}

const categories = ['全部', '表单', '列表', '详情', '首页', '其他']

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', category: '表单', schema: {} })
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const category = selectedCategory === '全部' ? undefined : selectedCategory
      const data = await fetchTemplates(category)
      setTemplates(data)
    } catch (error) {
      console.error('加载模板失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchCategory = selectedCategory === '全部' || template.category === selectedCategory
    const matchKeyword = template.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      template.description.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchCategory && matchKeyword
  })

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'published':
        return { label: '已发布', className: 'bg-green-100 text-green-700' }
      case 'draft':
      default:
        return { label: '草稿', className: 'bg-gray-100 text-gray-700' }
    }
  }

  const handleCreateTemplate = async () => {
    if (!formData.name.trim()) return
    try {
      const newTemplate = await createTemplate(formData)
      setTemplates([newTemplate, ...templates])
      setShowCreateModal(false)
      setFormData({ name: '', description: '', category: '表单', schema: {} })
    } catch (error) {
      console.error('创建模板失败:', error)
      alert('创建模板失败，请重试')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name.trim()) return
    try {
      await updateTemplate(editingTemplate.id, formData)
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData, status: t.status }
          : t
      ))
      setShowEditModal(false)
      setEditingTemplate(null)
    } catch (error) {
      console.error('更新模板失败:', error)
      alert('更新模板失败，请重试')
    }
  }

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`确定要删除模板 "${name}" 吗？`)) return
    try {
      await deleteTemplate(id)
      setTemplates(templates.filter(t => t.id !== id))
    } catch (error) {
      console.error('删除模板失败:', error)
      alert('删除模板失败，请重试')
    }
  }

  const handleDownload = async (id: string) => {
    try {
      await downloadTemplate(id)
      setTemplates(templates.map(t => 
        t.id === id ? { ...t, downloads: t.downloads + 1 } : t
      ))
    } catch (error) {
      console.error('下载模板失败:', error)
      alert('下载模板失败，请重试')
    }
  }

  const handlePublish = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      await updateTemplate(id, { status: newStatus })
      setTemplates(templates.map(t => 
        t.id === id ? { ...t, status: newStatus as 'draft' | 'published' } : t
      ))
    } catch (error) {
      console.error('更新状态失败:', error)
      alert('更新状态失败，请重试')
    }
  }

  const openEditModal = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      schema: template.schema || {},
    })
    setShowEditModal(true)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">模板管理</h1>
          <p className="text-gray-500 mt-1">管理您的页面模板</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建模板</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索模板名称或描述..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  loadTemplates()
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const statusInfo = getStatusInfo(template.status)
              return (
                <div
                  key={template.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 truncate">{template.name}</h3>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {template.category}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <span>⬇️</span> {template.downloads} 次下载
                      </span>
                      <span>{template.updatedAt}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleDownload(template.id)}
                        className="flex-1 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        下载使用
                      </button>
                      <button
                        onClick={() => handlePublish(template.id, template.status)}
                        className="px-3 py-1.5 text-sm bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        {template.status === 'published' ? '取消发布' : '发布'}
                      </button>
                      <button
                        onClick={() => openEditModal(template)}
                        className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">暂无模板</h3>
              <p className="text-gray-500 mb-4">创建您的第一个模板开始吧</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                新建模板
              </button>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新建模板</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入模板名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="请输入模板描述（可选）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {categories.filter(c => c !== '全部').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">编辑模板</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入模板名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="请输入模板描述（可选）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {categories.filter(c => c !== '全部').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setEditingTemplate(null) }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateTemplate}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
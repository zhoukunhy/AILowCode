'use client'

import React, { useState, useEffect } from 'react'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'inactive'
  triggerType: 'sync' | 'async'
  signatureAlgorithm?: string
  createdAt: string
  updatedAt: string
}

interface WebhookLog {
  id: string
  webhookId: string
  eventType: string
  status: 'success' | 'failed' | 'pending'
  requestPayload: string
  responsePayload: string
  errorMessage?: string
  createdAt: string
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

async function fetchWebhooks(): Promise<Webhook[]> {
  const response = await fetch(`${API_BASE}/webhooks`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取Webhook列表失败')
  const data = await response.json()
  return (data.data || []).map((item: any) => ({
    id: String(item.id),
    name: item.name || '未命名Webhook',
    url: item.url,
    events: item.events || [],
    status: item.status === 'active' ? 'active' : 'inactive',
    triggerType: item.triggerType === 'sync' ? 'sync' : 'async',
    signatureAlgorithm: item.signatureAlgorithm,
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
  }))
}

async function createWebhook(data: { name: string; url: string; events: string[]; triggerType?: string; secret?: string }): Promise<Webhook> {
  const response = await fetch(`${API_BASE}/webhooks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('创建Webhook失败')
  const result = await response.json()
  const item = result.data || result
  return {
    id: String(item.id),
    name: item.name,
    url: item.url,
    events: item.events || [],
    status: 'active',
    triggerType: item.triggerType === 'sync' ? 'sync' : 'async',
    signatureAlgorithm: item.signatureAlgorithm,
    createdAt: new Date(item.createdAt).toLocaleString('zh-CN'),
    updatedAt: new Date(item.updatedAt).toLocaleString('zh-CN'),
  }
}

async function updateWebhook(id: string, data: { name?: string; url?: string; events?: string[]; triggerType?: string; secret?: string }): Promise<void> {
  const response = await fetch(`${API_BASE}/webhooks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('更新Webhook失败')
}

async function deleteWebhook(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/webhooks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('删除Webhook失败')
}

async function toggleWebhook(id: string, enable: boolean): Promise<void> {
  const endpoint = enable ? `enable` : `disable`
  const response = await fetch(`${API_BASE}/webhooks/${id}/${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error(`Webhook${enable ? '启用' : '禁用'}失败`)
}

async function testWebhook(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/webhooks/${id}/test`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ testData: { test: 'data' } }),
  })
  if (!response.ok) return { success: false, message: '测试失败' }
  const data = await response.json()
  return { success: true, message: data.msg || '测试成功' }
}

async function fetchWebhookLogs(webhookId: string): Promise<WebhookLog[]> {
  const response = await fetch(`${API_BASE}/webhooks/${webhookId}/logs`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取日志失败')
  const data = await response.json()
  return (data.data || []).map((item: any) => ({
    id: String(item.id),
    webhookId: String(item.webhookId),
    eventType: item.eventType || 'unknown',
    status: item.status === 'success' ? 'success' : item.status === 'failed' ? 'failed' : 'pending',
    requestPayload: JSON.stringify(item.requestPayload, null, 2),
    responsePayload: item.responsePayload ? JSON.stringify(item.responsePayload, null, 2) : '',
    errorMessage: item.errorMessage,
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
  }))
}

const eventTypes = [
  { value: 'canvas.created', label: '画布创建' },
  { value: 'canvas.updated', label: '画布更新' },
  { value: 'canvas.deleted', label: '画布删除' },
  { value: 'project.created', label: '项目创建' },
  { value: 'project.updated', label: '项目更新' },
  { value: 'project.deleted', label: '项目删除' },
  { value: 'user.created', label: '用户创建' },
  { value: 'user.updated', label: '用户更新' },
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    url: string
    events: string[]
    triggerType: 'sync' | 'async'
    secret: string
  }>({
    name: '',
    url: '',
    events: [],
    triggerType: 'async',
    secret: '',
  })
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null)

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    try {
      setLoading(true)
      const data = await fetchWebhooks()
      setWebhooks(data)
    } catch (error) {
      console.error('加载Webhook失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.url.trim() || formData.events.length === 0) return
    try {
      const newWebhook = await createWebhook(formData)
      setWebhooks([newWebhook, ...webhooks])
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('创建失败:', error)
      alert('创建失败，请重试')
    }
  }

  const handleUpdate = async () => {
    if (!editingWebhook || !formData.name.trim() || !formData.url.trim()) return
    try {
      await updateWebhook(editingWebhook.id, formData)
      setWebhooks(webhooks.map(w =>
        w.id === editingWebhook.id
          ? { ...w, ...formData }
          : w
      ))
      setShowEditModal(false)
      setEditingWebhook(null)
    } catch (error) {
      console.error('更新失败:', error)
      alert('更新失败，请重试')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除Webhook "${name}" 吗？`)) return
    try {
      await deleteWebhook(id)
      setWebhooks(webhooks.filter(w => w.id !== id))
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleToggle = async (id: string, currentStatus: string) => {
    const enable = currentStatus === 'inactive'
    try {
      await toggleWebhook(id, enable)
      setWebhooks(webhooks.map(w =>
        w.id === id
          ? { ...w, status: enable ? 'active' : 'inactive' }
          : w
      ))
    } catch (error) {
      console.error('状态切换失败:', error)
      alert('状态切换失败，请重试')
    }
  }

  const handleTest = async (id: string) => {
    try {
      setTestResult(null)
      const result = await testWebhook(id)
      setTestResult(result)
      setTimeout(() => setTestResult(null), 3000)
    } catch (error) {
      console.error('测试失败:', error)
      setTestResult({ success: false, message: '测试失败' })
      setTimeout(() => setTestResult(null), 3000)
    }
  }

  const handleViewLogs = async (webhookId: string) => {
    try {
      const data = await fetchWebhookLogs(webhookId)
      setLogs(data)
      setShowLogsModal(true)
    } catch (error) {
      console.error('获取日志失败:', error)
      alert('获取日志失败，请重试')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', url: '', events: [], triggerType: 'async', secret: '' })
  }

  const openEditModal = (webhook: Webhook) => {
    setEditingWebhook(webhook)
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: [...webhook.events],
      triggerType: webhook.triggerType,
      secret: '',
    })
    setShowEditModal(true)
  }

  const toggleEvent = (eventValue: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter(e => e !== eventValue)
        : [...prev.events, eventValue],
    }))
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Webhook 管理</h1>
          <p className="text-gray-500 mt-1">管理系统事件通知</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建Webhook</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">名称</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">URL</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">事件类型</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">触发方式</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">状态</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">更新时间</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <p className="font-medium text-gray-800">{webhook.name}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-gray-600 text-sm break-all max-w-xs">{webhook.url}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => {
                        const eventLabel = eventTypes.find(e => e.value === event)?.label || event
                        return (
                          <span key={event} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {eventLabel}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      webhook.triggerType === 'sync' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {webhook.triggerType === 'sync' ? '同步' : '异步'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      webhook.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {webhook.status === 'active' ? '已启用' : '已禁用'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm">{webhook.updatedAt}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTest(webhook.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded"
                        title="测试"
                      >
                        🧪
                      </button>
                      <button
                        onClick={() => handleViewLogs(webhook.id)}
                        className="text-sm text-green-600 hover:text-green-700 px-2 py-1 hover:bg-green-50 rounded"
                        title="查看日志"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => openEditModal(webhook)}
                        className="text-sm text-gray-600 hover:text-gray-700 px-2 py-1 hover:bg-gray-50 rounded"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggle(webhook.id, webhook.status)}
                        className={`text-sm px-2 py-1 rounded ${
                          webhook.status === 'active'
                            ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        }`}
                        title={webhook.status === 'active' ? '禁用' : '启用'}
                      >
                        {webhook.status === 'active' ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleDelete(webhook.id, webhook.name)}
                        className="text-sm text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {webhooks.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">暂无Webhook</h3>
              <p className="text-gray-500 mb-4">创建Webhook来接收系统事件通知</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                新建Webhook
              </button>
            </div>
          )}
        </div>
      )}

      {testResult && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
          testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {testResult.success ? '✅' : '❌'} {testResult.message}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新建Webhook</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入Webhook名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入接收地址"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">触发方式</label>
                <select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as 'sync' | 'async' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="async">异步</option>
                  <option value="sync">同步</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">触发事件</label>
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes.map((event) => (
                    <label
                      key={event.value}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        formData.events.includes(event.value)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">签名密钥（可选）</label>
                <input
                  type="password"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="用于签名验证"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); resetForm() }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name.trim() || !formData.url.trim() || formData.events.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">编辑Webhook</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">触发方式</label>
                <select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as 'sync' | 'async' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="async">异步</option>
                  <option value="sync">同步</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">触发事件</label>
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes.map((event) => (
                    <label
                      key={event.value}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        formData.events.includes(event.value)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setEditingWebhook(null) }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdate}
                disabled={!formData.name.trim() || !formData.url.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Webhook 日志</h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-500">暂无日志记录</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' :
                          log.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.status === 'success' ? '成功' : log.status === 'failed' ? '失败' : '待处理'}
                        </span>
                        <span className="text-sm text-gray-600">{log.eventType}</span>
                      </div>
                      <span className="text-xs text-gray-400">{log.createdAt}</span>
                    </div>
                    {log.errorMessage && (
                      <div className="mb-2 p-2 bg-red-50 rounded text-sm text-red-600">
                        {log.errorMessage}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">请求数据</p>
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {log.requestPayload}
                        </pre>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">响应数据</p>
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {log.responsePayload || '-'}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
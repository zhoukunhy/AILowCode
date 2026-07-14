'use client'

import React, { useState, useEffect } from 'react'

// 数据源类型
enum DataSourceType {
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
  MONGODB = 'mongodb',
  REDIS = 'redis',
  HTTP = 'http',
  REST = 'rest',
  GRAPHQL = 'graphql',
}

// 数据源接口
interface DataSource {
  id: number
  name: string
  type: string
  config: Record<string, any>
  connectionStatus: string
  description?: string
  createdAt: string
  updatedAt: string
}

// API 基础地址
const API_BASE = 'http://localhost:3002/api'

// 获取认证头
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

// API 函数
async function fetchDataSources(): Promise<DataSource[]> {
  const response = await fetch(`${API_BASE}/data-source`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取数据源列表失败')
  const data = await response.json()
  return (data.data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    config: item.config,
    connectionStatus: item.connectionStatus || 'pending',
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
}

async function createDataSource(data: {
  name: string
  type: string
  config: Record<string, any>
  description?: string
}): Promise<DataSource> {
  const response = await fetch(`${API_BASE}/data-source`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('创建数据源失败')
  const result = await response.json()
  const item = result.data || result
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    config: item.config,
    connectionStatus: item.connectionStatus || 'pending',
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

async function updateDataSource(
  id: number,
  data: { name?: string; config?: Record<string, any>; description?: string }
): Promise<void> {
  const response = await fetch(`${API_BASE}/data-source/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('更新数据源失败')
}

async function deleteDataSource(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/data-source/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('删除数据源失败')
}

async function testConnection(type: string, config: Record<string, any>): Promise<boolean> {
  const response = await fetch(`${API_BASE}/data-source/test`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ type, config }),
  })
  if (!response.ok) throw new Error('测试连接失败')
  const data = await response.json()
  return data.success || data.data?.success || false
}

export default function DataSourcePage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: DataSourceType.MYSQL,
    config: {} as Record<string, any>,
    description: '',
  })
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // 加载数据源列表
  useEffect(() => {
    loadDataSources()
  }, [])

  const loadDataSources = async () => {
    try {
      setLoading(true)
      const data = await fetchDataSources()
      setDataSources(data)
    } catch (error) {
      console.error('加载数据源失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 打开创建弹窗
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      type: DataSourceType.MYSQL,
      config: {},
      description: '',
    })
    setTestResult(null)
    setShowCreateModal(true)
  }

  // 打开编辑弹窗
  const handleOpenEditModal = (dataSource: DataSource) => {
    setEditingDataSource(dataSource)
    setFormData({
      name: dataSource.name,
      type: dataSource.type as DataSourceType,
      config: dataSource.config,
      description: dataSource.description || '',
    })
    setTestResult(null)
    setShowEditModal(true)
  }

  // 测试连接
  const handleTestConnection = async () => {
    setTestingConnection(true)
    setTestResult(null)
    try {
      const success = await testConnection(formData.type, formData.config)
      setTestResult({
        success,
        message: success ? '连接成功' : '连接失败，请检查配置',
      })
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || '连接测试失败',
      })
    } finally {
      setTestingConnection(false)
    }
  }

  // 创建数据源
  const handleCreate = async () => {
    if (!formData.name.trim()) return
    try {
      const newDataSource = await createDataSource(formData)
      setDataSources([newDataSource, ...dataSources])
      setShowCreateModal(false)
      setFormData({ name: '', type: DataSourceType.MYSQL, config: {}, description: '' })
    } catch (error) {
      console.error('创建数据源失败:', error)
      alert('创建数据源失败，请重试')
    }
  }

  // 更新数据源
  const handleUpdate = async () => {
    if (!editingDataSource || !formData.name.trim()) return
    try {
      await updateDataSource(editingDataSource.id, {
        name: formData.name,
        config: formData.config,
        description: formData.description,
      })
      setDataSources(
        dataSources.map((ds) =>
          ds.id === editingDataSource.id
            ? { ...ds, name: formData.name, config: formData.config, description: formData.description }
            : ds
        )
      )
      setShowEditModal(false)
      setEditingDataSource(null)
    } catch (error) {
      console.error('更新数据源失败:', error)
      alert('更新数据源失败，请重试')
    }
  }

  // 删除数据源
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除数据源 "${name}" 吗？`)) return
    try {
      await deleteDataSource(id)
      setDataSources(dataSources.filter((ds) => ds.id !== id))
    } catch (error) {
      console.error('删除数据源失败:', error)
      alert('删除数据源失败，请重试')
    }
  }

  // 根据类型获取配置字段
  const getConfigFields = (type: string) => {
    switch (type) {
      case DataSourceType.MYSQL:
      case DataSourceType.POSTGRES:
        return [
          { key: 'host', label: '主机地址', type: 'text', placeholder: 'localhost' },
          { key: 'port', label: '端口', type: 'number', placeholder: '3306' },
          { key: 'database', label: '数据库名', type: 'text', placeholder: 'mydb' },
          { key: 'username', label: '用户名', type: 'text', placeholder: 'root' },
          { key: 'password', label: '密码', type: 'password', placeholder: '******' },
        ]
      case DataSourceType.MONGODB:
        return [
          { key: 'host', label: '主机地址', type: 'text', placeholder: 'localhost' },
          { key: 'port', label: '端口', type: 'number', placeholder: '27017' },
          { key: 'database', label: '数据库名', type: 'text', placeholder: 'mydb' },
          { key: 'username', label: '用户名', type: 'text', placeholder: 'admin' },
          { key: 'password', label: '密码', type: 'password', placeholder: '******' },
        ]
      case DataSourceType.REDIS:
        return [
          { key: 'host', label: '主机地址', type: 'text', placeholder: 'localhost' },
          { key: 'port', label: '端口', type: 'number', placeholder: '6379' },
          { key: 'password', label: '密码', type: 'password', placeholder: '******' },
        ]
      case DataSourceType.HTTP:
      case DataSourceType.REST:
      case DataSourceType.GRAPHQL:
        return [
          { key: 'url', label: 'API 地址', type: 'text', placeholder: 'https://api.example.com' },
          { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'your-api-key' },
        ]
      default:
        return []
    }
  }

  // 获取类型显示名称
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mysql: 'MySQL',
      postgres: 'PostgreSQL',
      mongodb: 'MongoDB',
      redis: 'Redis',
      http: 'HTTP',
      rest: 'REST API',
      graphql: 'GraphQL',
    }
    return labels[type] || type
  }

  // 获取连接状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700'
      case 'disconnected':
        return 'bg-red-100 text-red-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 获取连接状态文本
  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      connected: '已连接',
      disconnected: '未连接',
      pending: '待测试',
    }
    return texts[status] || '未知'
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数据源管理</h1>
          <p className="text-gray-500 mt-1">管理您的所有数据源连接</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建数据源</span>
        </button>
      </div>

      {/* 加载状态 */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <>
          {/* 数据源列表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    名称
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    类型
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    连接状态
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    描述
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    更新时间
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataSources.map((dataSource) => (
                  <tr key={dataSource.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg mr-3">
                          🗄️
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{dataSource.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{getTypeLabel(dataSource.type)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          dataSource.connectionStatus
                        )}`}
                      >
                        {getStatusText(dataSource.connectionStatus)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {dataSource.description || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-sm">
                      {new Date(dataSource.updatedAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(dataSource)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(dataSource.id, dataSource.name)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 空状态 */}
          {dataSources.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">🗄️</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">暂无数据源</h3>
              <p className="text-gray-500 mb-4">创建您的第一个数据源开始吧</p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                新建数据源
              </button>
            </div>
          )}
        </>
      )}

      {/* 创建/编辑数据源弹窗 */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {showCreateModal ? '新建数据源' : '编辑数据源'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数据源名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入数据源名称"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数据源类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value as DataSourceType, config: {} })
                    setTestResult(null)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {Object.values(DataSourceType).map((type) => (
                    <option key={type} value={type}>
                      {getTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 配置字段 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  连接配置
                </label>
                {getConfigFields(formData.type).map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={formData.config[field.key] || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: { ...formData.config, [field.key]: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="请输入数据源描述（可选）"
                />
              </div>

              {/* 测试连接按钮和结果 */}
              <div>
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.name.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {testingConnection ? '测试中...' : '测试连接'}
                </button>
                {testResult && (
                  <div
                    className={`mt-2 p-3 rounded-lg text-sm ${
                      testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setEditingDataSource(null)
                  setFormData({ name: '', type: DataSourceType.MYSQL, config: {}, description: '' })
                  setTestResult(null)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleUpdate}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {showCreateModal ? '创建' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import { Plus, Database, Globe, Settings, Trash2, Edit2, Upload, Check, X, Table2 } from 'lucide-react'
import { MySQLConfigForm, MySQLConfig } from './MySQLConfigForm'
import { useDataPreviewStore } from '@/store/dataPreviewStore'

export type DataSourceType = 'mysql' | 'http' | 'postgres' | 'mongodb'

export interface DataSourceItem {
  id: string | number
  name: string
  type: DataSourceType
  config: Record<string, any>
  status: 'connected' | 'disconnected' | 'connecting' | 'pending'
}

export interface TableInfo {
  name: string
  tableName: string
  columns: { name: string; type: string }[]
  primaryKey: string[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)
}

export function DataSourceConfigPanel() {
  const { dataSources, addDataSource, updateDataSource, removeDataSource } = useDataPreviewStore()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [selectedType, setSelectedType] = useState<DataSourceType>('mysql')
  
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedDataSourceForImport, setSelectedDataSourceForImport] = useState<DataSourceItem | null>(null)
  const [importTables, setImportTables] = useState<TableInfo[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)

  const handleSubmit = async (config: MySQLConfig) => {
    const dataSource: DataSourceItem = {
      id: editingId || `ds-${Date.now()}`,
      name: config.database || 'MySQL数据源',
      type: 'mysql',
      config,
      status: 'connecting',
    }

    if (editingId) {
      await updateDataSource(String(editingId), dataSource)
      setEditingId(null)
    } else {
      await addDataSource(dataSource)
    }

    setIsAdding(false)
    setSelectedType('mysql')
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setSelectedType('mysql')
  }

  const handleEdit = (dataSource: DataSourceItem) => {
    setEditingId(dataSource.id)
    setSelectedType(dataSource.type)
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个数据源吗？')) {
      await removeDataSource(id)
    }
  }

  const getTypeIcon = (type: DataSourceType) => {
    switch (type) {
      case 'mysql':
      case 'postgres':
        return <Database className="w-4 h-4 text-orange-500" />
      case 'http':
        return <Globe className="w-4 h-4 text-blue-500" />
      case 'mongodb':
        return <Database className="w-4 h-4 text-green-500" />
      default:
        return <Settings className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
            已连接
          </span>
        )
      case 'disconnected':
        return (
          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
            未连接
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
            待测试
          </span>
        )
    }
  }

  const getTypeLabel = (type: DataSourceType) => {
    const labels: Record<DataSourceType, string> = {
      mysql: 'MySQL',
      postgres: 'PostgreSQL',
      http: 'HTTP API',
      mongodb: 'MongoDB',
    }
    return labels[type]
  }

  const handleOpenImportModal = async (dataSource: DataSourceItem) => {
    if (dataSource.status !== 'connected') {
      alert('请先测试连接并确保数据源已连接')
      return
    }

    setSelectedDataSourceForImport(dataSource)
    setShowImportModal(true)
    setImportLoading(true)

    try {
      const response = await fetch(`${API_BASE}/data-model/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ dataSourceId: String(dataSource.id) }),
      })

      if (!response.ok) {
        throw new Error('获取表结构失败')
      }

      const result = await response.json()
      setImportTables(result.entities || [])
      setSelectedTables(result.entities?.map((e: any) => e.tableName) || [])
    } catch (error: any) {
      console.error('获取表结构失败:', error)
      alert(`获取表结构失败: ${error.message}`)
      setShowImportModal(false)
    } finally {
      setImportLoading(false)
    }
  }

  const handleToggleTable = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    )
  }

  const handleSelectAll = () => {
    if (selectedTables.length === importTables.length) {
      setSelectedTables([])
    } else {
      setSelectedTables(importTables.map(t => t.tableName))
    }
  }

  const handleImport = async () => {
    if (selectedTables.length === 0) {
      alert('请至少选择一个表')
      return
    }

    setImportLoading(true)

    try {
      const response = await fetch(`${API_BASE}/data-model/import-and-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          dataSourceId: String(selectedDataSourceForImport?.id),
          tableNames: selectedTables,
        }),
      })

      if (!response.ok) {
        throw new Error('导入失败')
      }

      const result = await response.json()
      console.log('导入成功:', result)
      setImportSuccess(true)

      setTimeout(() => {
        setShowImportModal(false)
        setImportSuccess(false)
        setSelectedTables([])
        setImportTables([])
        setSelectedDataSourceForImport(null)
      }, 2000)
    } catch (error: any) {
      console.error('导入失败:', error)
      alert(`导入失败: ${error.message}`)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          <span className="font-medium">数据源管理</span>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isAdding && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                {editingId ? '编辑数据源' : '新增数据源'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2">选择类型</label>
              <div className="flex gap-2">
                {(['mysql', 'http', 'postgres', 'mongodb'] as DataSourceType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex items-center gap-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                      selectedType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {getTypeIcon(type)}
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            {selectedType === 'mysql' && (
              <MySQLConfigForm
                initialConfig={editingId ? dataSources.find(ds => ds.id === editingId)?.config : undefined}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            )}

            {selectedType === 'http' && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500 py-8">
                  <Globe className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>HTTP 数据源配置</p>
                  <p className="text-sm">请在后端管理面板配置</p>
                </div>
              </div>
            )}

            {(selectedType === 'postgres' || selectedType === 'mongodb') && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500 py-8">
                  <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>{getTypeLabel(selectedType)} 数据源配置</p>
                  <p className="text-sm">即将支持</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!isAdding && (
          <div className="p-4 space-y-3">
            {dataSources.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>暂无数据源</p>
                <p className="text-sm">点击上方按钮添加</p>
              </div>
            ) : (
              dataSources.map((ds) => (
                <div
                  key={ds.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(ds.type)}
                      <div>
                        <div className="text-sm font-medium text-gray-800">{ds.name}</div>
                        <div className="text-xs text-gray-500">
                          {getTypeLabel(ds.type)}
                          <span className="mx-2">·</span>
                          {getStatusBadge(ds.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {ds.status === 'connected' && (
                        <button
                          onClick={() => handleOpenImportModal(ds)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="导入表结构"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(ds)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(String(ds.id))}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    {ds.type === 'mysql' && (
                      <>
                        <div>
                          <span className="font-medium">主机:</span> {ds.config.host}:{ds.config.port}
                        </div>
                        <div>
                          <span className="font-medium">数据库:</span> {ds.config.database}
                        </div>
                        <div>
                          <span className="font-medium">用户名:</span> {ds.config.username}
                        </div>
                      </>
                    )}
                    {ds.type === 'http' && (
                      <div>
                        <span className="font-medium">地址:</span> {ds.config.baseUrl}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                从数据源导入表结构
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setSelectedTables([])
                  setImportTables([])
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  数据源: <span className="font-medium">{selectedDataSourceForImport?.name}</span>
                </p>
              </div>

              {importLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : importSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-green-600">导入成功</p>
                  <p className="text-sm text-gray-500 mt-2">已创建数据模型</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">选择要导入的表</label>
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {selectedTables.length === importTables.length ? '取消全选' : '全选'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {importTables.map((table) => (
                      <div
                        key={table.tableName}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTables.includes(table.tableName)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleToggleTable(table.tableName)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedTables.includes(table.tableName)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedTables.includes(table.tableName) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Table2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-800 truncate">{table.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {table.columns.length} 个字段
                            {table.primaryKey.length > 0 && (
                              <span className="ml-2">· 主键: {table.primaryKey.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {importTables.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Table2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>未找到表</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {!importLoading && !importSuccess && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setSelectedTables([])
                    setImportTables([])
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedTables.length === 0}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    selectedTables.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  导入 ({selectedTables.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
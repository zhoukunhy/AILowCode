'use client'

import React, { useState } from 'react'
import { Plus, Database, Globe, Settings, Trash2, Edit2 } from 'lucide-react'
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

export function DataSourceConfigPanel() {
  const { dataSources, addDataSource, updateDataSource, removeDataSource } = useDataPreviewStore()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [selectedType, setSelectedType] = useState<DataSourceType>('mysql')

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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
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

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 添加/编辑表单 */}
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

            {/* 类型选择 */}
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

            {/* 配置表单 */}
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

        {/* 数据源列表 */}
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
                  
                  {/* 配置摘要 */}
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
    </div>
  )
}
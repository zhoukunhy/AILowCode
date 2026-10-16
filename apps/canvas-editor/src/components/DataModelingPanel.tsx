'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { EntityEditor } from './EntityEditor'
import { RelationEditor } from './RelationEditor'
import { FormGenerator } from '@/services/FormGenerator'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

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

export function DataModelingPanel() {
  const dataModels = useCanvasStore((state) => state.dataModels)
  const addDataModel = useCanvasStore((state) => state.addDataModel)
  const updateDataModel = useCanvasStore((state) => state.updateDataModel)
  const deleteDataModel = useCanvasStore((state) => state.deleteDataModel)
  const addComponentsBatch = useCanvasStore((state) => state.addComponentsBatch)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'entities' | 'relations' | 'crud'>('entities')
  const [showSqlModal, setShowSqlModal] = useState(false)
  const [sqlContent, setSqlContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [crudEndpoints, setCrudEndpoints] = useState<any[]>([])
  const [syncMessage, setSyncMessage] = useState('')

  const selectedModel = dataModels.find(m => m.id === selectedModelId)

  const handleGenerateForm = (entity: any) => {
    const components = FormGenerator.generateFromEntity(entity)
    addComponentsBatch(components)
  }

  // 判断是否为有效UUID
  const isUuid = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  // 同步表到数据库 + 自动生成CRUD接口
  const handleSyncTables = async () => {
    if (!selectedModel) return
    if (selectedModel.entities.length === 0) {
      alert('请先添加实体和字段')
      return
    }

    setSyncing(true)
    setSyncMessage('')
    try {
      let modelId = selectedModel.id

      // 如果模型还未保存到后端，先创建
      if (!isUuid(modelId)) {
        const createRes = await fetch(`${API_BASE}/data-model`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: selectedModel.name,
            description: selectedModel.description,
            entities: selectedModel.entities,
            relations: selectedModel.relations,
            enums: selectedModel.enums,
          }),
        })
        const created = await createRes.json()
        if (!createRes.ok) throw new Error(created.message || '保存数据模型失败')
        modelId = (created.data || created).id
        // 用后端返回的真实ID替换本地ID
        updateDataModel(selectedModel.id, { ...selectedModel, id: modelId })
        setSelectedModelId(modelId)
      } else {
        // 已存在则更新
        await fetch(`${API_BASE}/data-model/${modelId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: selectedModel.name,
            description: selectedModel.description,
            entities: selectedModel.entities,
            relations: selectedModel.relations,
            enums: selectedModel.enums,
          }),
        })
      }

      // 同步表 + 获取CRUD接口
      const syncRes = await fetch(`${API_BASE}/data-model/${modelId}/sync-tables`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      const syncResult = await syncRes.json()
      if (!syncRes.ok) throw new Error(syncResult.message || '同步失败')

      // 后端全局拦截器将响应包成 { code, msg, data } 格式
      const syncData = syncResult.data || syncResult
      setCrudEndpoints(syncData.crudEndpoints || [])
      setSyncMessage(syncData.message || '同步成功')
      setActiveTab('crud')
    } catch (error: any) {
      setSyncMessage(`同步失败: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  // 从后端获取已有的CRUD接口列表
  const handleFetchCrudEndpoints = async () => {
    if (!selectedModel || !isUuid(selectedModel.id)) {
      alert('请先同步表结构')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/dynamic-crud/endpoints/${selectedModel.id}`, {
        headers: getAuthHeaders(),
      })
      const result = await res.json()
      // 后端全局拦截器将响应包成 { code, msg, data } 格式
      const data = result.data || result
      setCrudEndpoints(Array.isArray(data) ? data : [])
      setActiveTab('crud')
    } catch {
      alert('获取CRUD接口列表失败')
    }
  }

  const handleAddModel = () => {
    const newModel = {
      id: `model-${Date.now()}`,
      name: '新建数据模型',
      entities: [],
      relations: [],
      enums: [],
      description: '',
    }
    addDataModel(newModel)
    setSelectedModelId(newModel.id)
  }

  const handleDeleteModel = (id: string) => {
    if (confirm('确定要删除这个数据模型吗？')) {
      deleteDataModel(id)
      if (selectedModelId === id) {
        setSelectedModelId(null)
      }
    }
  }

  const handleSqlImport = async () => {
    if (!sqlContent.trim()) {
      alert('请输入SQL语句')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/data-model/create-from-sql`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sql: sqlContent }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.message || result.msg || result.error?.message || '创建失败'
        throw new Error(errorMsg)
      }

      const modelData = result.data || result

      if (!modelData.id) {
        throw new Error('返回数据格式错误')
      }

      const newModel = {
        id: modelData.id,
        name: modelData.name,
        entities: modelData.entities || [],
        relations: modelData.relations || [],
        enums: modelData.enums || [],
        description: modelData.description || '',
      }

      addDataModel(newModel)
      setSelectedModelId(newModel.id)
      setShowSqlModal(false)
      setSqlContent('')
      alert('数据模型创建成功')
    } catch (error: any) {
      alert(`创建失败: ${error.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  const sqlTemplate = `CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);`

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">数据建模</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              ← 从SQL导入
            </button>
            <button
              onClick={handleAddModel}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + 新建模型
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {dataModels.map((model) => (
            <div
              key={model.id}
              className={`flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                selectedModelId === model.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{model.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteModel(model.id)
                  }}
                  className="ml-2 text-xs text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedModel ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'entities'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('entities')}
            >
              实体管理
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'relations'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('relations')}
            >
              关系定义
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'crud'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleFetchCrudEndpoints()}
            >
              CRUD 接口
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'entities' ? (
              <EntityEditor
                model={selectedModel}
                onUpdate={(updatedModel) => updateDataModel(selectedModelId!, updatedModel)}
                onGenerateForm={handleGenerateForm}
              />
            ) : activeTab === 'relations' ? (
              <RelationEditor
                model={selectedModel}
                onUpdate={(updatedModel) => updateDataModel(selectedModelId!, updatedModel)}
              />
            ) : (
              <div className="space-y-4">
                {crudEndpoints.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">🔌</div>
                    <p className="text-sm">暂无CRUD接口</p>
                    <p className="text-xs mt-1">点击「同步表并自动生成CRUD接口」按钮</p>
                  </div>
                ) : (
                  crudEndpoints.map((ep) => (
                    <div key={ep.tableName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-gray-800">{ep.entityName}</span>
                        <span className="text-xs text-gray-400">表: {ep.tableName}</span>
                      </div>
                      <div className="space-y-1.5">
                        {Object.entries(ep.endpoints).map(([method, url]) => {
                          const color = String(url).startsWith('GET')
                            ? 'text-green-600'
                            : String(url).startsWith('POST')
                            ? 'text-blue-600'
                            : String(url).startsWith('PUT')
                            ? 'text-orange-600'
                            : 'text-red-600'
                          return (
                            <div key={method} className="flex items-center gap-2 text-xs">
                              <code className={`font-mono font-bold ${color}`}>{String(url)}</code>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleSyncTables}
              disabled={syncing || selectedModel.entities.length === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {syncing ? '同步中...' : '同步表并生成CRUD接口'}
            </button>
            {syncMessage && (
              <div className={`mt-2 text-xs ${syncMessage.includes('失败') ? 'text-red-500' : 'text-green-600'}`}>
                {syncMessage}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div>请选择或创建一个数据模型</div>
            <div className="text-sm mt-2">或从SQL导入现有表结构</div>
          </div>
        </div>
      )}

      {showSqlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">从SQL导入数据模型</h3>
              <button
                onClick={() => {
                  setShowSqlModal(false)
                  setSqlContent('')
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="text-sm text-gray-600 mb-2">
                请输入 CREATE TABLE 语句，支持多个表（用分号分隔），系统会自动解析并创建数据模型
              </div>
              <textarea
                value={sqlContent}
                onChange={(e) => setSqlContent(e.target.value)}
                placeholder={sqlTemplate}
                className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setSqlContent(sqlTemplate)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                使用示例模板
              </button>
              <button
                onClick={() => {
                  setShowSqlModal(false)
                  setSqlContent('')
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSqlImport}
                disabled={loading || !sqlContent.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? '导入中...' : '导入数据模型'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
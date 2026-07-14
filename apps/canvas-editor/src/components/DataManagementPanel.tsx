'use client'

import React, { useState, useEffect } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { Database, Plus, Trash2, Edit2, Table, List, RefreshCw } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface FieldConfig {
  id: string
  name: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'textarea' | 'select' | 'password'
  required: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: any
}

interface TableSchema {
  id: number
  name: string
  tableName: string
  fields: FieldConfig[]
}

const defaultFieldTypes = [
  { value: 'string', label: '文本', icon: '📝' },
  { value: 'number', label: '数字', icon: '🔢' },
  { value: 'date', label: '日期', icon: '📅' },
  { value: 'boolean', label: '布尔', icon: '✅' },
  { value: 'email', label: '邮箱', icon: '📧' },
  { value: 'textarea', label: '多行文本', icon: '📄' },
  { value: 'select', label: '下拉选择', icon: '🔽' },
  { value: 'password', label: '密码', icon: '🔐' },
]

// 获取 auth header
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
async function fetchSchemas(): Promise<TableSchema[]> {
  const response = await fetch(`${API_BASE}/schema`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取数据表失败')
  const data = await response.json()
  if (Array.isArray(data)) {
    return data
  }
  return data.data || []
}

async function saveSchema(schema: Omit<TableSchema, 'id'>): Promise<TableSchema> {
  const response = await fetch(`${API_BASE}/schema`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(schema),
  })
  if (!response.ok) throw new Error('保存数据表失败')
  const data = await response.json()
  return data.data || data
}

async function updateSchema(id: number, schema: Partial<TableSchema>): Promise<TableSchema> {
  const response = await fetch(`${API_BASE}/schema/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(schema),
  })
  if (!response.ok) throw new Error('更新数据表失败')
  const data = await response.json()
  return data.data || data
}

async function deleteSchema(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/schema/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('删除数据表失败')
}

export function DataManagementPanel() {
  const addComponent = useCanvasStore((state) => state.addComponent)
  const [schemas, setSchemas] = useState<TableSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedSchema, setSelectedSchema] = useState<TableSchema | null>(null)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [newField, setNewField] = useState<FieldConfig>({
    id: '',
    name: '',
    label: '',
    type: 'string',
    required: false,
  })

  // 加载数据
  useEffect(() => {
    loadSchemas()
  }, [])

  const loadSchemas = async () => {
    try {
      setLoading(true)
      const data = await fetchSchemas()
      setSchemas(data)
      if (data.length > 0 && !selectedSchema) {
        setSelectedSchema(data[0])
      }
    } catch (error) {
      console.error('加载数据表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSchema = async () => {
    const name = prompt('请输入数据表名称：', '新数据表')
    if (!name) return
    
    const tableName = prompt('请输入表名（英文）：', `table_${Date.now()}`)
    if (!tableName) return

    try {
      setSaving(true)
      const saved = await saveSchema({ name, tableName, fields: [] })
      setSchemas([...schemas, saved])
      setSelectedSchema(saved)
    } catch (error) {
      console.error('创建数据表失败:', error)
      alert('创建数据表失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSchema = async (schemaId: number) => {
    if (!confirm('确定要删除这个数据表吗？')) return
    try {
      await deleteSchema(schemaId)
      setSchemas(schemas.filter(s => s.id !== schemaId))
      if (selectedSchema?.id === schemaId) {
        setSelectedSchema(schemas.find(s => s.id !== schemaId) || null)
      }
    } catch (error) {
      console.error('删除数据表失败:', error)
      alert('删除数据表失败')
    }
  }

  const handleOpenFieldModal = (field?: FieldConfig) => {
    if (field) {
      setEditingField(field)
      setNewField({ ...field })
    } else {
      setEditingField(null)
      setNewField({
        id: `f_${Date.now()}`,
        name: '',
        label: '',
        type: 'string',
        required: false,
      })
    }
    setShowFieldModal(true)
  }

  const handleSaveField = async () => {
    if (!newField.name || !newField.label) {
      alert('请填写字段名称和标签')
      return
    }

    if (!selectedSchema) {
      alert('请先选择一个数据表')
      return
    }

    try {
      setSaving(true)
      let updatedFields: FieldConfig[]
      
      if (editingField) {
        updatedFields = (selectedSchema.fields || []).map(f => 
          f.id === editingField.id ? newField : f
        )
      } else {
        updatedFields = [...(selectedSchema.fields || []), newField]
      }

      const updated = await updateSchema(selectedSchema.id, { fields: updatedFields })
      setSchemas(schemas.map(s => s.id === selectedSchema.id ? updated : s))
      setSelectedSchema(updated)
      setShowFieldModal(false)
      setEditingField(null)
      setNewField({ id: '', name: '', label: '', type: 'string', required: false })
    } catch (error) {
      console.error('保存字段失败:', error)
      alert('保存字段失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('确定要删除这个字段吗？')) return
    if (!selectedSchema) return

    try {
      setSaving(true)
      const updatedFields = (selectedSchema.fields || []).filter(f => f.id !== fieldId)
      const updated = await updateSchema(selectedSchema.id, { fields: updatedFields })
      setSchemas(schemas.map(s => s.id === selectedSchema.id ? updated : s))
      setSelectedSchema(updated)
    } catch (error) {
      console.error('删除字段失败:', error)
      alert('删除字段失败')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateForm = () => {
    if (!selectedSchema || (selectedSchema.fields || []).length === 0) {
      alert('请选择一个数据表并添加字段')
      return
    }

    (selectedSchema.fields || []).forEach((field, index) => {
      const x = 50
      const height = field.type === 'textarea' ? 120 : 50
      const currentY = 50 + index * (height + 20)

      let componentType = 'input'
      const props: Record<string, any> = {
        label: field.label,
        required: field.required,
        placeholder: field.placeholder || `请输入${field.label}`,
      }

      switch (field.type) {
        case 'number':
          componentType = 'numberInput'
          break
        case 'date':
          componentType = 'datepicker'
          break
        case 'boolean':
          componentType = 'switch'
          break
        case 'email':
          componentType = 'emailInput'
          break
        case 'textarea':
          componentType = 'textarea'
          break
        case 'select':
          componentType = 'select'
          props.options = field.options || ['选项1', '选项2', '选项3']
          break
        case 'password':
          componentType = 'passwordInput'
          break
        default:
          componentType = 'input'
      }

      setTimeout(() => {
        addComponent(componentType, x, currentY)
      }, index * 100)
    })

    alert(`已根据 ${selectedSchema.name} 生成表单！`)
  }

  const handleGenerateTable = () => {
    if (!selectedSchema || (selectedSchema.fields || []).length === 0) {
      alert('请选择一个数据表并添加字段')
      return
    }

    addComponent('table', 50, 50)
    alert(`已根据 ${selectedSchema.name} 生成表格！`)
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">数据管理</h2>
            {saving && <span className="text-xs text-blue-500 animate-pulse">保存中...</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadSchemas}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleAddSchema}
              disabled={saving}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="新建数据表"
            >
              <Plus className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">加载中...</p>
          </div>
        </div>
      )}

      {/* 数据表列表 */}
      {!loading && (
      <div className="p-3 border-b border-gray-200">
        {schemas.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <p className="text-sm">暂无数据表</p>
            <button
              onClick={handleAddSchema}
              className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建第一个数据表
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {schemas.map((schema) => (
              <div
                key={schema.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedSchema?.id === schema.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => setSelectedSchema(schema)}
              >
                <span className="text-sm font-medium truncate flex-1">{schema.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSchema(schema.id)
                  }}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* 字段列表 */}
      {!loading && selectedSchema && (
      <div className="flex-1 overflow-auto p-3">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              {selectedSchema.name} ({(selectedSchema.fields || []).length} 个字段)
            </h3>
            <button
              onClick={() => handleOpenFieldModal()}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-3 h-3" />
              添加字段
            </button>
          </div>

          <div className="space-y-2">
            {(selectedSchema.fields || []).length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无字段</p>
                <button
                  onClick={() => handleOpenFieldModal()}
                  className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  添加第一个字段
                </button>
              </div>
            ) : (
              (selectedSchema.fields || []).map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {field.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {field.name} ({field.type})
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenFieldModal(field)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="编辑"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1 hover:bg-red-100 rounded"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {!loading && !selectedSchema && schemas.length > 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">请选择一个数据表</p>
          </div>
        </div>
      )}

      {/* 生成按钮 */}
      {selectedSchema && (selectedSchema.fields || []).length > 0 && (
        <div className="p-3 border-t border-gray-200 space-y-2">
          <button
            onClick={handleGenerateForm}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <List className="w-4 h-4" />
            根据字段生成表单
          </button>
          <button
            onClick={handleGenerateTable}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Table className="w-4 h-4" />
            根据字段生成表格
          </button>
        </div>
      )}

      {/* 字段编辑弹窗 */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingField ? '编辑字段' : '添加字段'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">字段名称</label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="字段名（英文）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">显示标签</label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="显示名称（中文）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">数据类型</label>
                <select
                  value={newField.type}
                  onChange={(e) => {
                    const type = e.target.value as FieldConfig['type']
                    setNewField({ ...newField, type })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {defaultFieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {newField.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选项列表（逗号分隔）</label>
                  <input
                    type="text"
                    value={newField.options?.join(',') || ''}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="选项1,选项2,选项3"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">占位文本</label>
                <input
                  type="text"
                  value={newField.placeholder || ''}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  id="required"
                  className="mr-2"
                />
                <label htmlFor="required" className="text-sm text-gray-700">必填字段</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFieldModal(false)
                  setEditingField(null)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveField}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
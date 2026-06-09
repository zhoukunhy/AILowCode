'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { Database, Plus, Trash2, Edit2, Table, List } from 'lucide-react'

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
  id: string
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

export function DataManagementPanel() {
  const addComponent = useCanvasStore((state) => state.addComponent)
  const [schemas, setSchemas] = useState<TableSchema[]>([
    {
      id: '1',
      name: '用户表',
      tableName: 'users',
      fields: [
        { id: 'f1', name: 'id', label: 'ID', type: 'number', required: true },
        { id: 'f2', name: 'name', label: '姓名', type: 'string', required: true, placeholder: '请输入姓名' },
        { id: 'f3', name: 'email', label: '邮箱', type: 'email', required: true, placeholder: '请输入邮箱' },
        { id: 'f4', name: 'status', label: '状态', type: 'boolean', required: false },
      ],
    },
  ])
  const [selectedSchema, setSelectedSchema] = useState<TableSchema | null>(schemas[0] || null)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [newField, setNewField] = useState<FieldConfig>({
    id: '',
    name: '',
    label: '',
    type: 'string',
    required: false,
  })

  const handleAddSchema = () => {
    const newSchema: TableSchema = {
      id: Date.now().toString(),
      name: '新数据表',
      tableName: `table_${Date.now()}`,
      fields: [],
    }
    setSchemas([...schemas, newSchema])
    setSelectedSchema(newSchema)
  }

  const handleDeleteSchema = (schemaId: string) => {
    if (!confirm('确定要删除这个数据表吗？')) return
    setSchemas(schemas.filter(s => s.id !== schemaId))
    if (selectedSchema?.id === schemaId) {
      setSelectedSchema(schemas.find(s => s.id !== schemaId) || null)
    }
  }

  const handleOpenFieldModal = (field?: FieldConfig) => {
    if (field) {
      setEditingField(field)
      setNewField({ ...field })
    } else {
      setEditingField(null)
      setNewField({
        id: Date.now().toString(),
        name: '',
        label: '',
        type: 'string',
        required: false,
      })
    }
    setShowFieldModal(true)
  }

  const handleSaveField = () => {
    if (!newField.name || !newField.label) {
      alert('请填写字段名称和标签')
      return
    }

    if (selectedSchema) {
      const updatedSchemas = schemas.map(schema => {
        if (schema.id === selectedSchema.id) {
          if (editingField) {
            return {
              ...schema,
              fields: schema.fields.map(f => f.id === editingField.id ? newField : f),
            }
          } else {
            return {
              ...schema,
              fields: [...schema.fields, newField],
            }
          }
        }
        return schema
      })
      setSchemas(updatedSchemas)
      const updated = updatedSchemas.find(s => s.id === selectedSchema.id)
      if (updated) {
        setSelectedSchema(updated)
      }
    }
    setShowFieldModal(false)
    setEditingField(null)
    setNewField({ id: '', name: '', label: '', type: 'string', required: false })
  }

  const handleDeleteField = (fieldId: string) => {
    if (!confirm('确定要删除这个字段吗？')) return
    if (selectedSchema) {
      const updatedSchemas = schemas.map(schema => {
        if (schema.id === selectedSchema.id) {
          return {
            ...schema,
            fields: schema.fields.filter(f => f.id !== fieldId),
          }
        }
        return schema
      })
      setSchemas(updatedSchemas)
      const updated = updatedSchemas.find(s => s.id === selectedSchema.id)
      if (updated) {
        setSelectedSchema(updated)
      }
    }
  }

  const handleGenerateForm = () => {
    if (!selectedSchema || selectedSchema.fields.length === 0) {
      alert('请选择一个数据表并添加字段')
      return
    }

    let y = 50
    selectedSchema.fields.forEach((field, index) => {
      const x = 50
      const height = field.type === 'textarea' ? 120 : 50

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
        addComponent(componentType, x, y)
      }, index * 100)

      y += height + 20
    })

    alert(`已根据 ${selectedSchema.name} 生成表单！`)
  }

  const handleGenerateTable = () => {
    if (!selectedSchema || selectedSchema.fields.length === 0) {
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
          </div>
          <button
            onClick={handleAddSchema}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="新建数据表"
          >
            <Plus className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* 数据表列表 */}
      <div className="p-3 border-b border-gray-200">
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
      </div>

      {/* 字段列表 */}
      <div className="flex-1 overflow-auto p-3">
        {selectedSchema ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {selectedSchema.name} ({selectedSchema.fields.length} 个字段)
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
              {selectedSchema.fields.length === 0 ? (
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
                selectedSchema.fields.map((field) => (
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
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">请选择一个数据表</p>
          </div>
        )}
      </div>

      {/* 生成按钮 */}
      {selectedSchema && selectedSchema.fields.length > 0 && (
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
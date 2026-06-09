'use client'

import React, { useState } from 'react'
import { DataModel, Entity, Field } from '@/store/canvasStore'

interface EntityEditorProps {
  model: DataModel
  onUpdate: (model: DataModel) => void
}

export function EntityEditor({ model, onUpdate }: EntityEditorProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [newEntityName, setNewEntityName] = useState('')

  const selectedEntity = model.entities.find(e => e.id === selectedEntityId)

  const handleAddEntity = () => {
    if (!newEntityName.trim()) return
    
    const newEntity: Entity = {
      id: `entity-${Date.now()}`,
      name: newEntityName.trim(),
      tableName: newEntityName.trim().toLowerCase().replace(/\s+/g, '_'),
      description: '',
      fields: [
        {
          id: `field-${Date.now()}`,
          name: 'id',
          label: 'ID',
          type: 'number',
          required: true,
          primaryKey: true,
        },
      ],
    }

    onUpdate({
      ...model,
      entities: [...model.entities, newEntity],
    })
    setNewEntityName('')
  }

  const handleDeleteEntity = (entityId: string) => {
    if (confirm('确定要删除这个实体吗？')) {
      onUpdate({
        ...model,
        entities: model.entities.filter(e => e.id !== entityId),
        relations: model.relations.filter(r => 
          r.sourceEntityId !== entityId && r.targetEntityId !== entityId
        ),
      })
      if (selectedEntityId === entityId) {
        setSelectedEntityId(null)
      }
    }
  }

  const handleAddField = () => {
    if (!selectedEntityId || !selectedEntity) return

    const fieldCount = selectedEntity.fields.length
    const newField: Field = {
      id: `field-${Date.now()}`,
      name: `field${fieldCount + 1}`,
      label: `字段${fieldCount + 1}`,
      type: 'string',
      required: false,
      primaryKey: false,
      defaultValue: '',
      length: 255,
    }

    onUpdate({
      ...model,
      entities: model.entities.map(e =>
        e.id === selectedEntityId
          ? { ...e, fields: [...e.fields, newField] }
          : e
      ),
    })
  }

  const handleUpdateField = (fieldId: string, updates: Partial<Field>) => {
    if (!selectedEntityId) return

    onUpdate({
      ...model,
      entities: model.entities.map(e =>
        e.id === selectedEntityId
          ? {
              ...e,
              fields: e.fields.map(f =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : e
      ),
    })
  }

  const handleDeleteField = (fieldId: string) => {
    if (!selectedEntityId || !selectedEntity) return
    if (selectedEntity.fields.length <= 1) {
      alert('实体至少需要一个字段')
      return
    }

    onUpdate({
      ...model,
      entities: model.entities.map(e =>
        e.id === selectedEntityId
          ? { ...e, fields: e.fields.filter(f => f.id !== fieldId) }
          : e
      ),
    })
    if (editingFieldId === fieldId) {
      setEditingFieldId(null)
    }
  }

  const fieldTypes = [
    { value: 'string', label: '字符串' },
    { value: 'number', label: '数字' },
    { value: 'integer', label: '整数' },
    { value: 'boolean', label: '布尔' },
    { value: 'date', label: '日期' },
    { value: 'datetime', label: '日期时间' },
    { value: 'text', label: '文本' },
    { value: 'email', label: '邮箱' },
    { value: 'phone', label: '电话' },
    { value: 'password', label: '密码' },
    { value: 'select', label: '下拉选择' },
    { value: 'textarea', label: '多行文本' },
    { value: 'json', label: 'JSON' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newEntityName}
          onChange={(e) => setNewEntityName(e.target.value)}
          placeholder="实体名称"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleAddEntity()}
        />
        <button
          onClick={handleAddEntity}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        >
          + 添加
        </button>
      </div>

      <div className="flex gap-4">
        <div className="w-48 flex-shrink-0 space-y-2">
          {model.entities.map((entity) => (
            <div
              key={entity.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedEntityId === entity.id
                  ? 'bg-blue-100 border border-blue-300'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedEntityId(entity.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{entity.name}</div>
                  <div className="text-xs text-gray-500">{entity.fields.length} 个字段</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteEntity(entity.id)
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedEntity && (
          <div className="flex-1 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={selectedEntity.name}
                  onChange={(e) =>
                    onUpdate({
                      ...model,
                      entities: model.entities.map((entity) =>
                        entity.id === selectedEntityId
                          ? { ...entity, name: e.target.value }
                          : entity
                      ),
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                />
              </div>
              <input
                type="text"
                value={selectedEntity.tableName}
                onChange={(e) =>
                  onUpdate({
                    ...model,
                    entities: model.entities.map((entity) =>
                      entity.id === selectedEntityId
                        ? { ...entity, tableName: e.target.value }
                        : entity
                    ),
                  })
                }
                placeholder="数据库表名"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500"
              />
              <textarea
                value={selectedEntity.description}
                onChange={(e) =>
                  onUpdate({
                    ...model,
                    entities: model.entities.map((entity) =>
                      entity.id === selectedEntityId
                        ? { ...entity, description: e.target.value }
                        : entity
                    ),
                  })
                }
                placeholder="实体描述..."
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">字段列表</h3>
              <button
                onClick={handleAddField}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + 添加字段
              </button>
            </div>

            <div className="space-y-2">
              {selectedEntity.fields.map((field) => (
                <div
                  key={field.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    editingFieldId === field.id
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {editingFieldId === field.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            handleUpdateField(field.id, { name: e.target.value })
                          }
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="字段名"
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            handleUpdateField(field.id, { type: e.target.value as any })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {fieldTypes.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            handleUpdateField(field.id, { label: e.target.value })
                          }
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="显示标签"
                        />
                        {field.type === 'string' && (
                          <input
                            type="number"
                            value={field.length || 255}
                            onChange={(e) =>
                              handleUpdateField(field.id, { length: parseInt(e.target.value) })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="长度"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              handleUpdateField(field.id, { required: e.target.checked })
                            }
                          />
                          必填
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={field.primaryKey}
                            onChange={(e) =>
                              handleUpdateField(field.id, { primaryKey: e.target.checked })
                            }
                          />
                          主键
                        </label>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="ml-auto text-xs text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                      <button
                        onClick={() => setEditingFieldId(null)}
                        className="w-full px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                      >
                        完成编辑
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{field.label || field.name}</div>
                        <div className="text-xs text-gray-500">
                          {field.name} : {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                          {field.required && ' *'}
                          {field.primaryKey && ' 🔑'}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingFieldId(field.id)}
                        className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                      >
                        编辑
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
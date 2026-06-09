'use client'

import React, { useState } from 'react'
import { DataModel, Relation } from '@/store/canvasStore'

interface RelationEditorProps {
  model: DataModel
  onUpdate: (model: DataModel) => void
}

export function RelationEditor({ model, onUpdate }: RelationEditorProps) {
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRelation, setNewRelation] = useState({
    sourceEntityId: '',
    sourceFieldId: '',
    targetEntityId: '',
    targetFieldId: '',
    type: 'one-to-many' as Relation['type'],
    name: '',
  })

  const selectedRelation = model.relations.find(r => r.id === selectedRelationId)

  const relationTypes = [
    { value: 'one-to-one', label: '一对一' },
    { value: 'one-to-many', label: '一对多' },
    { value: 'many-to-many', label: '多对多' },
  ]

  const handleAddRelation = () => {
    if (!newRelation.sourceEntityId || !newRelation.targetEntityId) return

    const relation: Relation = {
      id: `relation-${Date.now()}`,
      ...newRelation,
    }

    onUpdate({
      ...model,
      relations: [...model.relations, relation],
    })

    setShowAddModal(false)
    setNewRelation({
      sourceEntityId: '',
      sourceFieldId: '',
      targetEntityId: '',
      targetFieldId: '',
      type: 'one-to-many',
      name: '',
    })
  }

  const handleDeleteRelation = (relationId: string) => {
    if (confirm('确定要删除这个关系吗？')) {
      onUpdate({
        ...model,
        relations: model.relations.filter(r => r.id !== relationId),
      })
      if (selectedRelationId === relationId) {
        setSelectedRelationId(null)
      }
    }
  }

  const handleUpdateRelation = (relationId: string, updates: Partial<Relation>) => {
    onUpdate({
      ...model,
      relations: model.relations.map(r =>
        r.id === relationId ? { ...r, ...updates } : r
      ),
    })
  }

  const getEntityName = (entityId: string) => {
    return model.entities.find(e => e.id === entityId)?.name || entityId
  }

  const getFieldName = (entityId: string, fieldId: string) => {
    const entity = model.entities.find(e => e.id === entityId)
    return entity?.fields.find(f => f.id === fieldId)?.name || fieldId
  }

  const getEntityFields = (entityId: string) => {
    const entity = model.entities.find(e => e.id === entityId)
    return entity?.fields || []
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-700">关系列表</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + 添加关系
        </button>
      </div>

      <div className="space-y-2">
        {model.relations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-3xl mb-2">🔗</div>
            <div>暂无关系定义</div>
            <div className="text-sm">点击上方按钮添加实体关系</div>
          </div>
        ) : (
          model.relations.map((relation) => (
            <div
              key={relation.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedRelationId === relation.id
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedRelationId(relation.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">
                  {relation.name || '未命名关系'}
                </div>
                <span className="px-2 py-0.5 text-xs bg-gray-200 rounded">
                  {relationTypes.find(t => t.value === relation.type)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{getEntityName(relation.sourceEntityId)}</span>
                <span>→</span>
                <span className="font-medium">{getEntityName(relation.targetEntityId)}</span>
                {relation.sourceFieldId && (
                  <span className="text-xs text-gray-400">
                    ({getFieldName(relation.sourceEntityId, relation.sourceFieldId)})
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteRelation(relation.id)
                }}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                删除关系
              </button>
            </div>
          ))
        )}
      </div>

      {selectedRelation && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">编辑关系</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={selectedRelation.name}
              onChange={(e) =>
                handleUpdateRelation(selectedRelation.id, { name: e.target.value })
              }
              placeholder="关系名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={selectedRelation.type}
              onChange={(e) =>
                handleUpdateRelation(selectedRelation.id, { type: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {relationTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
            <h3 className="font-medium mb-4">添加关系</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">源实体</label>
                <select
                  value={newRelation.sourceEntityId}
                  onChange={(e) => {
                    setNewRelation({ ...newRelation, sourceEntityId: e.target.value, sourceFieldId: '' })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">请选择源实体</option>
                  {model.entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>
              {newRelation.sourceEntityId && (
                <div>
                  <label className="block text-sm font-medium mb-1">源字段（可选）</label>
                  <select
                    value={newRelation.sourceFieldId}
                    onChange={(e) =>
                      setNewRelation({ ...newRelation, sourceFieldId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">选择字段</option>
                    {getEntityFields(newRelation.sourceEntityId).map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">目标实体</label>
                <select
                  value={newRelation.targetEntityId}
                  onChange={(e) => {
                    setNewRelation({ ...newRelation, targetEntityId: e.target.value, targetFieldId: '' })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">请选择目标实体</option>
                  {model.entities
                    .filter(e => e.id !== newRelation.sourceEntityId)
                    .map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                </select>
              </div>
              {newRelation.targetEntityId && (
                <div>
                  <label className="block text-sm font-medium mb-1">目标字段（可选）</label>
                  <select
                    value={newRelation.targetFieldId}
                    onChange={(e) =>
                      setNewRelation({ ...newRelation, targetFieldId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">选择字段</option>
                    {getEntityFields(newRelation.targetEntityId).map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">关系类型</label>
                <select
                  value={newRelation.type}
                  onChange={(e) =>
                    setNewRelation({ ...newRelation, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {relationTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">关系名称</label>
                <input
                  type="text"
                  value={newRelation.name}
                  onChange={(e) =>
                    setNewRelation({ ...newRelation, name: e.target.value })
                  }
                  placeholder="输入关系名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAddRelation}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
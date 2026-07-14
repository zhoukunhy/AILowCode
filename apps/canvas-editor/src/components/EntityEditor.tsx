'use client'

import React, { useState } from 'react'
import { DataModel, Entity, Field, EnumDefinition, EnumOption, ValidationRule, DataPermission } from '@/store/canvasStore'

interface EntityEditorProps {
  model: DataModel
  onUpdate: (model: DataModel) => void
}

export function EntityEditor({ model, onUpdate }: EntityEditorProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [newEntityName, setNewEntityName] = useState('')
  const [activeTab, setActiveTab] = useState<'fields' | 'validation' | 'permissions' | 'enums'>('fields')
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null)
  const [editingEnumId, setEditingEnumId] = useState<string | null>(null)
  const [newEnumName, setNewEnumName] = useState('')

  const selectedEntity = model.entities.find(e => e.id === selectedEntityId)
  const selectedField = selectedEntity?.fields.find(f => f.id === editingFieldId)

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
          type: 'uuid',
          required: true,
          primaryKey: true,
          unique: true,
          index: false,
          validationRules: [],
          dataPermissions: [],
        },
      ],
      dataPermissions: [],
      softDelete: false,
      createdAtField: true,
      updatedAtField: true,
    }

    onUpdate({
      ...model,
      entities: [...model.entities, newEntity],
    })
    setNewEntityName('')
    setSelectedEntityId(newEntity.id)
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
      unique: false,
      index: false,
      defaultValue: '',
      length: 255,
      validationRules: [],
      dataPermissions: [],
    }

    onUpdate({
      ...model,
      entities: model.entities.map(e =>
        e.id === selectedEntityId
          ? { ...e, fields: [...e.fields, newField] }
          : e
      ),
    })
    setEditingFieldId(newField.id)
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

  const handleAddValidationRule = () => {
    if (!selectedField) return
    
    const newRule: ValidationRule = {
      id: `rule-${Date.now()}`,
      type: 'required',
      message: '请填写此字段',
    }
    
    handleUpdateField(selectedField.id, {
      validationRules: [...selectedField.validationRules, newRule],
    })
  }

  const handleUpdateValidationRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    if (!selectedField) return
    
    handleUpdateField(selectedField.id, {
      validationRules: selectedField.validationRules.map(r =>
        r.id === ruleId ? { ...r, ...updates } : r
      ),
    })
  }

  const handleDeleteValidationRule = (ruleId: string) => {
    if (!selectedField) return
    
    handleUpdateField(selectedField.id, {
      validationRules: selectedField.validationRules.filter(r => r.id !== ruleId),
    })
    if (editingRuleId === ruleId) {
      setEditingRuleId(null)
    }
  }

  const handleAddPermission = () => {
    if (!selectedField) return
    
    const newPermission: DataPermission = {
      id: `perm-${Date.now()}`,
      roleId: '',
      roleName: '',
      permissionType: 'read',
    }
    
    handleUpdateField(selectedField.id, {
      dataPermissions: [...selectedField.dataPermissions, newPermission],
    })
  }

  const handleUpdatePermission = (permId: string, updates: Partial<DataPermission>) => {
    if (!selectedField) return
    
    handleUpdateField(selectedField.id, {
      dataPermissions: selectedField.dataPermissions.map(p =>
        p.id === permId ? { ...p, ...updates } : p
      ),
    })
  }

  const handleDeletePermission = (permId: string) => {
    if (!selectedField) return
    
    handleUpdateField(selectedField.id, {
      dataPermissions: selectedField.dataPermissions.filter(p => p.id !== permId),
    })
    if (editingPermissionId === permId) {
      setEditingPermissionId(null)
    }
  }

  const handleAddEnum = () => {
    if (!newEnumName.trim()) return
    
    const newEnum: EnumDefinition = {
      id: `enum-${Date.now()}`,
      name: newEnumName.trim(),
      label: newEnumName.trim(),
      options: [],
    }
    
    onUpdate({
      ...model,
      enums: [...model.enums, newEnum],
    })
    setNewEnumName('')
    setEditingEnumId(newEnum.id)
  }

  const handleUpdateEnum = (enumId: string, updates: Partial<EnumDefinition>) => {
    onUpdate({
      ...model,
      enums: model.enums.map(e =>
        e.id === enumId ? { ...e, ...updates } : e
      ),
    })
  }

  const handleDeleteEnum = (enumId: string) => {
    if (confirm('确定要删除这个枚举吗？')) {
      onUpdate({
        ...model,
        enums: model.enums.filter(e => e.id !== enumId),
        entities: model.entities.map(entity => ({
          ...entity,
          fields: entity.fields.map(field => ({
            ...field,
            enumId: field.enumId === enumId ? undefined : field.enumId,
          })),
        })),
      })
      if (editingEnumId === enumId) {
        setEditingEnumId(null)
      }
    }
  }

  const handleAddEnumOption = (enumId: string) => {
    const targetEnum = model.enums.find(e => e.id === enumId)
    if (!targetEnum) return
    
    const newOption: EnumOption = {
      label: `选项${targetEnum.options.length + 1}`,
      value: `value${targetEnum.options.length + 1}`,
    }
    
    handleUpdateEnum(enumId, {
      options: [...targetEnum.options, newOption],
    })
  }

  const handleUpdateEnumOption = (enumId: string, optionIndex: number, updates: Partial<EnumOption>) => {
    const targetEnum = model.enums.find(e => e.id === enumId)
    if (!targetEnum) return
    
    const newOptions = [...targetEnum.options]
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates }
    
    handleUpdateEnum(enumId, { options: newOptions })
  }

  const handleDeleteEnumOption = (enumId: string, optionIndex: number) => {
    const targetEnum = model.enums.find(e => e.id === enumId)
    if (!targetEnum || targetEnum.options.length <= 1) return
    
    handleUpdateEnum(enumId, {
      options: targetEnum.options.filter((_, idx) => idx !== optionIndex),
    })
  }

  const fieldTypes = [
    { value: 'string', label: '字符串' },
    { value: 'number', label: '数字' },
    { value: 'integer', label: '整数' },
    { value: 'bigint', label: '大整数' },
    { value: 'smallint', label: '小整数' },
    { value: 'decimal', label: '小数' },
    { value: 'float', label: '浮点数' },
    { value: 'double', label: '双精度' },
    { value: 'boolean', label: '布尔' },
    { value: 'date', label: '日期' },
    { value: 'datetime', label: '日期时间' },
    { value: 'timestamp', label: '时间戳' },
    { value: 'text', label: '文本' },
    { value: 'email', label: '邮箱' },
    { value: 'phone', label: '电话' },
    { value: 'password', label: '密码' },
    { value: 'select', label: '下拉选择' },
    { value: 'textarea', label: '多行文本' },
    { value: 'json', label: 'JSON' },
    { value: 'uuid', label: 'UUID' },
    { value: 'enum', label: '枚举' },
  ]

  const validationTypes = [
    { value: 'required', label: '必填' },
    { value: 'min', label: '最小值' },
    { value: 'max', label: '最大值' },
    { value: 'minLength', label: '最小长度' },
    { value: 'maxLength', label: '最大长度' },
    { value: 'pattern', label: '正则表达式' },
    { value: 'email', label: '邮箱格式' },
    { value: 'phone', label: '手机号格式' },
    { value: 'url', label: 'URL格式' },
    { value: 'custom', label: '自定义校验' },
  ]

  const permissionTypes = [
    { value: 'read', label: '只读' },
    { value: 'write', label: '可写' },
    { value: 'delete', label: '可删除' },
    { value: 'manage', label: '管理' },
  ]

  return (
    <div className="space-y-4 h-full flex flex-col">
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

      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="w-48 flex-shrink-0 space-y-2 overflow-y-auto">
          {model.entities.map((entity) => (
            <div
              key={entity.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedEntityId === entity.id
                  ? 'bg-blue-100 border border-blue-300'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => {
                setSelectedEntityId(entity.id)
                setActiveTab('fields')
              }}
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
          <div className="flex-1 flex flex-col overflow-hidden">
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
              <div className="flex gap-4 mt-2 text-sm">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedEntity.softDelete}
                    onChange={(e) =>
                      onUpdate({
                        ...model,
                        entities: model.entities.map((entity) =>
                          entity.id === selectedEntityId
                            ? { ...entity, softDelete: e.target.checked }
                            : entity
                        ),
                      })
                    }
                  />
                  软删除
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedEntity.createdAtField}
                    onChange={(e) =>
                      onUpdate({
                        ...model,
                        entities: model.entities.map((entity) =>
                          entity.id === selectedEntityId
                            ? { ...entity, createdAtField: e.target.checked }
                            : entity
                        ),
                      })
                    }
                  />
                  创建时间字段
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedEntity.updatedAtField}
                    onChange={(e) =>
                      onUpdate({
                        ...model,
                        entities: model.entities.map((entity) =>
                          entity.id === selectedEntityId
                            ? { ...entity, updatedAtField: e.target.checked }
                            : entity
                        ),
                      })
                    }
                  />
                  更新时间字段
                </label>
              </div>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'fields'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('fields')}
              >
                字段管理
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'validation'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('validation')}
              >
                校验规则
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'permissions'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('permissions')}
              >
                数据权限
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'enums'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('enums')}
              >
                枚举定义
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'fields' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-700">字段列表</h3>
                    <button
                      onClick={handleAddField}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      + 添加字段
                    </button>
                  </div>

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
                            {field.type === 'decimal' && (
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  value={field.precision || 10}
                                  onChange={(e) =>
                                    handleUpdateField(field.id, { precision: parseInt(e.target.value) })
                                  }
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="精度"
                                />
                                <input
                                  type="number"
                                  value={field.scale || 2}
                                  onChange={(e) =>
                                    handleUpdateField(field.id, { scale: parseInt(e.target.value) })
                                  }
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="小数位"
                                />
                              </div>
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
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={field.unique}
                                onChange={(e) =>
                                  handleUpdateField(field.id, { unique: e.target.checked })
                                }
                              />
                              唯一
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={field.index}
                                onChange={(e) =>
                                  handleUpdateField(field.id, { index: e.target.checked })
                                }
                              />
                              索引
                            </label>
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="ml-auto text-xs text-red-500 hover:text-red-700"
                            >
                              删除
                            </button>
                          </div>
                          {field.type === 'enum' && (
                            <div className="mt-2">
                              <label className="text-xs text-gray-600">关联枚举</label>
                              <select
                                value={field.enumId || ''}
                                onChange={(e) =>
                                  handleUpdateField(field.id, { enumId: e.target.value || undefined })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                              >
                                <option value="">选择枚举</option>
                                {model.enums.map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {(field.type === 'select' || field.type === 'enum') && (
                            <div className="mt-2">
                              <label className="text-xs text-gray-600">选项列表</label>
                              <div className="space-y-1 mt-1">
                                {(field.options || []).map((opt, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={opt.label}
                                      onChange={(e) => {
                                        const newOptions = [...(field.options || [])]
                                        newOptions[idx] = { ...newOptions[idx], label: e.target.value }
                                        handleUpdateField(field.id, { options: newOptions })
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                      placeholder="显示值"
                                    />
                                    <input
                                      type="text"
                                      value={opt.value}
                                      onChange={(e) => {
                                        const newOptions = [...(field.options || [])]
                                        newOptions[idx] = { ...newOptions[idx], value: e.target.value }
                                        handleUpdateField(field.id, { options: newOptions })
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                      placeholder="实际值"
                                    />
                                    <button
                                      onClick={() => {
                                        const newOptions = (field.options || []).filter((_, i) => i !== idx)
                                        handleUpdateField(field.id, { options: newOptions })
                                      }}
                                      className="px-2 text-xs text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newOptions = [...(field.options || []), { label: '', value: '' }]
                                    handleUpdateField(field.id, { options: newOptions })
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-dashed border-gray-300 rounded hover:border-gray-400"
                                >
                                  + 添加选项
                                </button>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => setEditingFieldId(null)}
                            className="w-full px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 mt-2"
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
                              {field.unique && ' 🔒'}
                              {field.index && ' 📌'}
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
              )}

              {activeTab === 'validation' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={editingFieldId || ''}
                      onChange={(e) => setEditingFieldId(e.target.value || null)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">选择字段</option>
                      {selectedEntity.fields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.label || field.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedField && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-700">校验规则 ({selectedField.validationRules.length})</h3>
                        <button
                          onClick={handleAddValidationRule}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          + 添加规则
                        </button>
                      </div>

                      {selectedField.validationRules.map((rule) => (
                        <div
                          key={rule.id}
                          className={`p-3 border rounded-lg transition-colors ${
                            editingRuleId === rule.id
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-200'
                          }`}
                        >
                          {editingRuleId === rule.id ? (
                            <div className="space-y-2">
                              <select
                                value={rule.type}
                                onChange={(e) =>
                                  handleUpdateValidationRule(rule.id, { type: e.target.value as any })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {validationTypes.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                              {(rule.type === 'min' || rule.type === 'max' || rule.type === 'minLength' || rule.type === 'maxLength') && (
                                <input
                                  type="text"
                                  value={rule.value}
                                  onChange={(e) =>
                                    handleUpdateValidationRule(rule.id, { value: e.target.value })
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="阈值"
                                />
                              )}
                              {rule.type === 'pattern' && (
                                <input
                                  type="text"
                                  value={rule.value}
                                  onChange={(e) =>
                                    handleUpdateValidationRule(rule.id, { value: e.target.value })
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                  placeholder="正则表达式"
                                />
                              )}
                              <input
                                type="text"
                                value={rule.message}
                                onChange={(e) =>
                                  handleUpdateValidationRule(rule.id, { message: e.target.value })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="错误提示"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingRuleId(null)}
                                  className="flex-1 px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                >
                                  完成
                                </button>
                                <button
                                  onClick={() => handleDeleteValidationRule(rule.id)}
                                  className="px-2 py-1 text-xs text-red-500 hover:text-red-700"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">
                                  {validationTypes.find(t => t.value === rule.type)?.label || rule.type}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {rule.value && `值: ${rule.value} `}
                                  {rule.message && `- ${rule.message}`}
                                </div>
                              </div>
                              <button
                                onClick={() => setEditingRuleId(rule.id)}
                                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                              >
                                编辑
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'permissions' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={editingFieldId || ''}
                      onChange={(e) => setEditingFieldId(e.target.value || null)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">选择字段</option>
                      {selectedEntity.fields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.label || field.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedField && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-700">数据权限 ({selectedField.dataPermissions.length})</h3>
                        <button
                          onClick={handleAddPermission}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          + 添加权限
                        </button>
                      </div>

                      {selectedField.dataPermissions.map((perm) => (
                        <div
                          key={perm.id}
                          className={`p-3 border rounded-lg transition-colors ${
                            editingPermissionId === perm.id
                              ? 'border-green-400 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          {editingPermissionId === perm.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={perm.roleName}
                                onChange={(e) =>
                                  handleUpdatePermission(perm.id, { roleName: e.target.value })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="角色名称"
                              />
                              <select
                                value={perm.permissionType}
                                onChange={(e) =>
                                  handleUpdatePermission(perm.id, { permissionType: e.target.value as any })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {permissionTypes.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingPermissionId(null)}
                                  className="flex-1 px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                >
                                  完成
                                </button>
                                <button
                                  onClick={() => handleDeletePermission(perm.id)}
                                  className="px-2 py-1 text-xs text-red-500 hover:text-red-700"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{perm.roleName || '未命名角色'}</div>
                                <div className="text-xs text-gray-500">
                                  {permissionTypes.find(t => t.value === perm.permissionType)?.label || perm.permissionType}
                                </div>
                              </div>
                              <button
                                onClick={() => setEditingPermissionId(perm.id)}
                                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                              >
                                编辑
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'enums' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEnumName}
                      onChange={(e) => setNewEnumName(e.target.value)}
                      placeholder="枚举名称"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEnum()}
                    />
                    <button
                      onClick={handleAddEnum}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      + 添加枚举
                    </button>
                  </div>

                  <div className="space-y-2">
                    {model.enums.map((enumDef) => (
                      <div
                        key={enumDef.id}
                        className={`p-3 border rounded-lg transition-colors ${
                          editingEnumId === enumDef.id
                            ? 'border-purple-400 bg-purple-50'
                            : 'border-gray-200'
                        }`}
                      >
                        {editingEnumId === enumDef.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={enumDef.name}
                              onChange={(e) =>
                                handleUpdateEnum(enumDef.id, { name: e.target.value })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                            />
                            <input
                              type="text"
                              value={enumDef.label}
                              onChange={(e) =>
                                handleUpdateEnum(enumDef.id, { label: e.target.value })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="显示标签"
                            />
                            <div className="space-y-1">
                              {enumDef.options.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) =>
                                      handleUpdateEnumOption(enumDef.id, idx, { label: e.target.value })
                                    }
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                    placeholder="显示值"
                                  />
                                  <input
                                    type="text"
                                    value={opt.value}
                                    onChange={(e) =>
                                      handleUpdateEnumOption(enumDef.id, idx, { value: e.target.value })
                                    }
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                    placeholder="实际值"
                                  />
                                  <button
                                    onClick={() => handleDeleteEnumOption(enumDef.id, idx)}
                                    className="px-2 text-xs text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => handleAddEnumOption(enumDef.id)}
                                className="w-full px-2 py-1 text-xs border border-dashed border-gray-300 rounded hover:border-gray-400"
                              >
                                + 添加选项
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingEnumId(null)}
                                className="flex-1 px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                              >
                                完成
                              </button>
                              <button
                                onClick={() => handleDeleteEnum(enumDef.id)}
                                className="px-2 py-1 text-xs text-red-500 hover:text-red-700"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{enumDef.label || enumDef.name}</div>
                              <div className="text-xs text-gray-500">
                                {enumDef.options.length} 个选项: {enumDef.options.map(o => o.label).join(', ')}
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingEnumId(enumDef.id)}
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
        )}
      </div>
    </div>
  )
}
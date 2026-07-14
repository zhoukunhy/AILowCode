'use client'

import React, { useState, useEffect } from 'react'
import { Select, Button, Card, Tag } from 'antd'
import { PlusOutlined, LinkOutlined } from '@ant-design/icons'
import { useCanvasStore } from '@/store/canvasStore'

export function DataModelBinding() {
  const selectedId = useCanvasStore((state) => state.selectedId)
  const components = useCanvasStore((state) => state.components)
  const dataModels = useCanvasStore((state) => state.dataModels)
  const updateComponentProps = useCanvasStore((state) => state.updateComponentProps)

  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [selectedEntityId, setSelectedEntityId] = useState<string>('')
  const [selectedFieldId, setSelectedFieldId] = useState<string>('')

  const selectedComponent = components.find((c) => c.id === selectedId)
  const selectedModel = dataModels.find((m) => m.id === selectedModelId)
  const selectedEntity = selectedModel?.entities.find((e) => e.id === selectedEntityId)

  useEffect(() => {
    const binding = selectedComponent?.props.dataModelBinding
    if (binding) {
      setSelectedModelId(binding.modelId || '')
      setSelectedEntityId(binding.entityId || '')
      setSelectedFieldId(binding.fieldId || '')
    } else {
      setSelectedModelId('')
      setSelectedEntityId('')
      setSelectedFieldId('')
    }
  }, [selectedId, selectedComponent])

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId)
    setSelectedEntityId('')
    setSelectedFieldId('')
  }

  const handleEntityChange = (entityId: string) => {
    setSelectedEntityId(entityId)
    setSelectedFieldId('')
  }

  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId)
  }

  const handleSaveBinding = () => {
    if (!selectedId) return

    const binding = {
      modelId: selectedModelId,
      entityId: selectedEntityId,
      fieldId: selectedFieldId,
      modelName: selectedModel?.name || '',
      entityName: selectedEntity?.name || '',
      fieldName: selectedEntity?.fields.find(f => f.id === selectedFieldId)?.name || '',
    }

    updateComponentProps(selectedId, { dataModelBinding: binding })
  }

  const handleClearBinding = () => {
    if (!selectedId) return
    updateComponentProps(selectedId, { dataModelBinding: undefined })
    setSelectedModelId('')
    setSelectedEntityId('')
    setSelectedFieldId('')
  }

  const currentBinding = selectedComponent?.props.dataModelBinding

  return (
    <div className="border-b border-gray-200">
      <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <LinkOutlined className="w-4 h-4" />
          数据模型绑定
        </span>
      </div>
      <div className="p-4 space-y-4">
        <Card size="small" className="bg-gray-50 border-gray-200">
          <div className="space-y-3">
            <Select
              value={selectedModelId}
              onChange={handleModelChange}
              placeholder="选择数据模型"
              style={{ width: '100%' }}
              options={dataModels.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              showSearch
              optionFilterProp="children"
            />

            {selectedModelId && (
              <Select
                value={selectedEntityId}
                onChange={handleEntityChange}
                placeholder="选择实体"
                style={{ width: '100%' }}
                options={selectedModel?.entities.map((e) => ({
                  value: e.id,
                  label: `${e.name} (${e.tableName})`,
                })) || []}
                showSearch
                optionFilterProp="children"
              />
            )}

            {selectedEntityId && (
              <Select
                value={selectedFieldId}
                onChange={handleFieldChange}
                placeholder="选择字段（可选）"
                style={{ width: '100%' }}
                options={selectedEntity?.fields.map((f) => ({
                  value: f.id,
                  label: `${f.label || f.name} (${f.type})${f.primaryKey ? ' 🔑' : ''}`,
                })) || []}
                showSearch
                optionFilterProp="children"
                allowClear
              />
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              type="primary"
              size="small"
              onClick={handleSaveBinding}
              disabled={!selectedModelId || !selectedEntityId}
              block
              className="flex items-center justify-center gap-1"
            >
              <PlusOutlined className="w-4 h-4" />
              绑定数据模型
            </Button>
            {currentBinding && (
              <Button
                type="default"
                size="small"
                onClick={handleClearBinding}
                block
              >
                清除绑定
              </Button>
            )}
          </div>
        </Card>

        {currentBinding && (
          <Card size="small" className="bg-green-50 border-green-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag color="green">已绑定</Tag>
                <span className="text-sm font-medium text-green-700">
                  {currentBinding.modelName}
                </span>
              </div>
              <div className="text-sm text-gray-600 pl-10">
                → {currentBinding.entityName}
                {currentBinding.fieldName && ` → ${currentBinding.fieldName}`}
              </div>
              <div className="text-xs text-gray-500 pl-10 mt-1">
                {currentBinding.modelName} / {currentBinding.entityName}
                {currentBinding.fieldName && ` / ${currentBinding.fieldName}`}
              </div>
            </div>
          </Card>
        )}

        {dataModels.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm">暂无数据模型</div>
            <div className="text-xs mt-1">请先在数据建模页面创建数据模型</div>
          </div>
        )}
      </div>
    </div>
  )
}
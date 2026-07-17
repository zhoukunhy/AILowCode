'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { EntityEditor } from './EntityEditor'
import { RelationEditor } from './RelationEditor'
import { FormGenerator } from '@/services/FormGenerator'

export function DataModelingPanel() {
  const dataModels = useCanvasStore((state) => state.dataModels)
  const addDataModel = useCanvasStore((state) => state.addDataModel)
  const updateDataModel = useCanvasStore((state) => state.updateDataModel)
  const deleteDataModel = useCanvasStore((state) => state.deleteDataModel)
  const addComponentsBatch = useCanvasStore((state) => state.addComponentsBatch)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'entities' | 'relations'>('entities')

  const selectedModel = dataModels.find(m => m.id === selectedModelId)

  const handleGenerateForm = (entity: any) => {
    const components = FormGenerator.generateFromEntity(entity)
    addComponentsBatch(components)
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

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">数据建模</h2>
          <button
            onClick={handleAddModel}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + 新建模型
          </button>
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
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'entities' ? (
              <EntityEditor
                model={selectedModel}
                onUpdate={(updatedModel) => updateDataModel(selectedModelId!, updatedModel)}
                onGenerateForm={handleGenerateForm}
              />
            ) : (
              <RelationEditor
                model={selectedModel}
                onUpdate={(updatedModel) => updateDataModel(selectedModelId!, updatedModel)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div>请选择或创建一个数据模型</div>
          </div>
        </div>
      )}
    </div>
  )
}
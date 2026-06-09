'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { useDataPreviewStore } from '@/store/dataPreviewStore'

export function DataSourceBinding() {
  const selectedId = useCanvasStore((state) => state.selectedId)
  const components = useCanvasStore((state) => state.components)
  const updateComponentProps = useCanvasStore((state) => state.updateComponentProps)
  
  const { dataSources, getFieldsByDataSource } = useDataPreviewStore()
  
  const [selectedDataSource, setSelectedDataSource] = useState<string>('')
  const [selectedField, setSelectedField] = useState<string>('')
  
  const selectedComponent = components.find((c) => c.id === selectedId)
  const boundDataSource = selectedComponent?.props.dataSourceId || ''
  const boundField = selectedComponent?.props.dataField || ''
  
  const fields = selectedDataSource ? getFieldsByDataSource(selectedDataSource) : []
  
  const handleDataSourceChange = (dataSourceId: string) => {
    setSelectedDataSource(dataSourceId)
    setSelectedField('')
    if (selectedId) {
      updateComponentProps(selectedId, { 
        dataSourceId,
        dataField: '' 
      })
    }
  }
  
  const handleFieldChange = (fieldName: string) => {
    setSelectedField(fieldName)
    if (selectedId) {
      updateComponentProps(selectedId, { dataField: fieldName })
    }
  }
  
  const handleClearBinding = () => {
    setSelectedDataSource('')
    setSelectedField('')
    if (selectedId) {
      updateComponentProps(selectedId, { 
        dataSourceId: '',
        dataField: '' 
      })
    }
  }
  
  React.useEffect(() => {
    if (boundDataSource) {
      setSelectedDataSource(boundDataSource)
    } else {
      setSelectedDataSource('')
    }
    if (boundField) {
      setSelectedField(boundField)
    } else {
      setSelectedField('')
    }
  }, [selectedId, boundDataSource, boundField])
  
  return (
    <div className="border-b border-gray-200">
      <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700">
        数据源绑定
      </div>
      <div className="p-4">
        {/* 选择数据源 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-600 mb-2">选择数据源</label>
          <select
            value={selectedDataSource}
            onChange={(e) => handleDataSourceChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">请选择数据源</option>
            {dataSources.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.type})
              </option>
            ))}
          </select>
        </div>
        
        {/* 选择字段 */}
        {selectedDataSource && (
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-2">选择字段</label>
            <div className="grid grid-cols-2 gap-2">
              {fields.map((field) => (
                <button
                  key={field.name}
                  onClick={() => handleFieldChange(field.name)}
                  className={`px-3 py-2 text-xs border rounded transition-colors ${
                    selectedField === field.name
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{field.name}</div>
                  <div className="text-gray-400">{field.type}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 当前绑定状态 */}
        {(boundDataSource || boundField) && (
          <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-green-700 font-medium">已绑定:</span>
                {boundDataSource && (
                  <span className="ml-2 text-gray-600">
                    {dataSources.find((ds) => ds.id === boundDataSource)?.name}
                  </span>
                )}
                {boundField && (
                  <span className="ml-2 text-gray-600">/ {boundField}</span>
                )}
              </div>
              <button
                onClick={handleClearBinding}
                className="text-xs text-red-600 hover:text-red-700"
              >
                清除绑定
              </button>
            </div>
          </div>
        )}
        
        {/* 绑定说明 */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
          <div className="font-medium mb-1">绑定说明:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>输入框可绑定文本字段</li>
            <li>表格可绑定数据源进行数据展示</li>
            <li>按钮可绑定接口进行触发</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
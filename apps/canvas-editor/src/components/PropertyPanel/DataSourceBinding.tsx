'use client'

import React, { useState } from 'react'
import { Button, Select, Table, Space } from 'antd'
import { PlusOutlined, DeleteOutlined, RestOutlined } from '@ant-design/icons'
import { useCanvasStore } from '@/store/canvasStore'
import { useDataPreviewStore } from '@/store/dataPreviewStore'

export interface FieldMapping {
  componentProp: string
  dataSourceField: string
}

export function DataSourceBinding() {
  const selectedId = useCanvasStore((state) => state.selectedId)
  const components = useCanvasStore((state) => state.components)
  const updateComponentProps = useCanvasStore((state) => state.updateComponentProps)
  
  const { dataSources, getFieldsByDataSource, fetchPreviewData, getMockData, loadDataSources } = useDataPreviewStore()
  
  const [selectedDataSource, setSelectedDataSource] = useState<string>('')
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [fields, setFields] = useState<any[]>([])
  
  const selectedComponent = components.find((c) => c.id === selectedId)
  const boundDataSource = selectedComponent?.props.dataSourceId || ''

  const componentProps = Object.keys(selectedComponent?.props || {}).filter(
    (key) => !['dataSourceId', 'dataField', 'eventBindings'].includes(key)
  )
  
  React.useEffect(() => {
    loadDataSources()
  }, [])
  
  React.useEffect(() => {
    if (boundDataSource) {
      setSelectedDataSource(boundDataSource)
    } else {
      setSelectedDataSource('')
    }
    
    const savedMappings = selectedComponent?.props.fieldMappings as FieldMapping[] || []
    setFieldMappings(savedMappings)
  }, [selectedId, boundDataSource, selectedComponent])
  
  React.useEffect(() => {
    const loadFields = async () => {
      if (selectedDataSource) {
        const dsFields = await getFieldsByDataSource(selectedDataSource)
        setFields(dsFields)
      } else {
        setFields([])
      }
    }
    loadFields()
  }, [selectedDataSource, getFieldsByDataSource])

  const handleDataSourceChange = (dataSourceId: string) => {
    setSelectedDataSource(dataSourceId)
    setFieldMappings([])
    if (selectedId) {
      updateComponentProps(selectedId, { 
        dataSourceId,
        fieldMappings: [],
        dataField: '' 
      })
    }
  }

  const handleAddMapping = () => {
    setFieldMappings([...fieldMappings, { componentProp: '', dataSourceField: '' }])
  }

  const handleRemoveMapping = (index: number) => {
    const newMappings = fieldMappings.filter((_, i) => i !== index)
    setFieldMappings(newMappings)
    if (selectedId) {
      updateComponentProps(selectedId, { fieldMappings: newMappings })
    }
  }

  const handleMappingChange = (index: number, key: 'componentProp' | 'dataSourceField', value: string) => {
    const newMappings = [...fieldMappings]
    newMappings[index] = { ...newMappings[index], [key]: value }
    setFieldMappings(newMappings)
  }

  const handleSaveMappings = () => {
    if (selectedId) {
      updateComponentProps(selectedId, { fieldMappings })
    }
  }

  const handlePreviewData = async () => {
    if (selectedDataSource && selectedId) {
      await fetchPreviewData(selectedId, selectedDataSource, { type: 'table' })
      const mockData = getMockData(selectedDataSource) || []
      const tableData = Array.isArray(mockData) ? mockData : mockData.data || []
      setPreviewData(tableData.slice(0, 10))
    }
  }

  return (
    <div className="border-b border-gray-200">
      <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span>数据源绑定</span>
        {selectedDataSource && (
          <Button type="text" icon={<RestOutlined />} onClick={handlePreviewData} size="small">
            预览数据
          </Button>
        )}
      </div>
      <div className="p-4">
        {/* 选择数据源 */}
        <div className="mb-4">
          <Select
            value={selectedDataSource}
            onChange={handleDataSourceChange}
            placeholder="选择数据源"
            style={{ width: '100%' }}
            options={dataSources.map((ds) => ({
              value: ds.id,
              label: `${ds.name} (${ds.type})`,
            }))}
          />
        </div>
        
        {/* 字段映射 */}
        {selectedDataSource && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">字段映射</span>
              <Button type="text" icon={<PlusOutlined />} onClick={handleAddMapping} size="small">
                添加映射
              </Button>
            </div>
            
            <div className="space-y-2">
              {fieldMappings.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">
                  暂无字段映射，点击上方按钮添加
                </div>
              ) : (
                fieldMappings.map((mapping, index) => (
                  <Space key={index} style={{ width: '100%' }}>
                    <Select
                      value={mapping.componentProp}
                      onChange={(value) => handleMappingChange(index, 'componentProp', value)}
                      placeholder="组件属性"
                      style={{ flex: 1 }}
                      options={componentProps.map((prop) => ({
                        value: prop,
                        label: prop,
                      }))}
                    />
                    <span className="text-gray-400">→</span>
                    <Select
                      value={mapping.dataSourceField}
                      onChange={(value) => handleMappingChange(index, 'dataSourceField', value)}
                      placeholder="数据源字段"
                      style={{ flex: 1 }}
                      options={fields.map((field) => ({
                        value: field.name,
                        label: `${field.name} (${field.type})`,
                      }))}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveMapping(index)}
                      size="small"
                    />
                  </Space>
                ))
              )}
            </div>
            
            {fieldMappings.length > 0 && (
              <Button
                type="primary"
                size="small"
                onClick={handleSaveMappings}
                style={{ marginTop: 8 }}
                block
              >
                保存映射
              </Button>
            )}
          </div>
        )}
        
        {/* 数据预览 */}
        {selectedDataSource && previewData.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-600 font-medium mb-2">数据预览</div>
            <div className="border border-gray-200 rounded overflow-hidden">
              <Table
                dataSource={previewData.slice(0, 5)}
                columns={fields.map((field) => ({
                  title: field.name,
                  dataIndex: field.name,
                  key: field.name,
                  width: 120,
                  render: (value: any) => (
                    <span className="text-xs truncate" style={{ maxWidth: 100 }}>
                      {String(value)}
                    </span>
                  ),
                }))}
                pagination={false}
                size="small"
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              显示前 5 条记录，共 {previewData.length} 条
            </div>
          </div>
        )}
        
        {/* 当前绑定状态 */}
        {boundDataSource && (
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-green-700 font-medium">已绑定:</span>
                <span className="ml-2 text-gray-600">
                  {dataSources.find((ds) => ds.id === boundDataSource)?.name}
                </span>
                {fieldMappings.length > 0 && (
                  <span className="ml-2 text-gray-500">
                    ({fieldMappings.length} 个字段映射)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import React, { useEffect, useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { useDataPreviewStore } from '@/store/dataPreviewStore'
import { RefreshCw, Eye, EyeOff, Database, Table, List } from 'lucide-react'

export function DataPreviewPanel() {
  const selectedId = useCanvasStore((state) => state.selectedId)
  const components = useCanvasStore((state) => state.components)
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'preview' | 'dataSources'>('preview')

  const {
    fetchPreviewData,
    getPreviewData,
    refreshPreviewData,
    dataSources,
    getFieldsByDataSource,
  } = useDataPreviewStore()

  const selectedComponent = components.find((c) => c.id === selectedId)
  const previewData = selectedId ? getPreviewData(selectedId) : undefined
  const dataSourceId = selectedComponent?.props.dataSourceId || ''
  const dataField = selectedComponent?.props.dataField || ''
  const [fields, setFields] = useState<any[]>([])

  useEffect(() => {
    if (dataSourceId) {
      getFieldsByDataSource(dataSourceId).then((result) => setFields(result || []))
    } else {
      setFields([])
    }
  }, [dataSourceId, getFieldsByDataSource])

  useEffect(() => {
    if (selectedId && dataSourceId && !previewData) {
      fetchPreviewData(selectedId, dataSourceId, { type: 'table' })
    }
  }, [selectedId, dataSourceId, previewData, fetchPreviewData])

  useEffect(() => {
    if (selectedId && dataSourceId && previewData && previewData.dataSourceId !== dataSourceId) {
      fetchPreviewData(selectedId, dataSourceId, { type: 'table' })
    }
  }, [selectedId, dataSourceId, previewData, fetchPreviewData])

  const handleRefresh = async () => {
    if (selectedId && previewData) {
      await refreshPreviewData(selectedId)
    }
  }

  const handlePreview = () => {
    if (selectedId && dataSourceId) {
      fetchPreviewData(selectedId, dataSourceId, { type: 'table' })
    }
  }

  if (!selectedComponent) {
    return (
      <div className="border-b border-gray-200">
        <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            数据预览
          </span>
        </div>
        <div className="p-4 text-gray-500 text-sm text-center">
          请选择一个组件以查看数据预览
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-gray-200">
      <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          数据预览
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* 标签切换 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Table className="w-3 h-3" />
                实时预览
              </span>
            </button>
            <button
              onClick={() => setActiveTab('dataSources')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                activeTab === 'dataSources'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                数据源列表
              </span>
            </button>
          </div>

          {activeTab === 'preview' && (
            <div>
              {/* 当前绑定状态 */}
              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">绑定状态</span>
                  {dataSourceId && (
                    <button
                      onClick={handleRefresh}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      刷新
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {dataSourceId ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      已绑定数据源: {dataSources.find((ds) => ds.id === dataSourceId)?.name}
                      {dataField && (
                        <span className="text-gray-400">/ {dataField}</span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                      未绑定数据源
                    </span>
                  )}
                </div>
              </div>

              {/* 预览区域 */}
              {!dataSourceId ? (
                <div className="p-6 bg-gray-50 rounded border border-gray-200 text-center">
                  <Database className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">请先绑定数据源</p>
                  <button
                    onClick={handlePreview}
                    className="mt-3 px-4 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    绑定后预览
                  </button>
                </div>
              ) : previewData?.loading ? (
                <div className="p-6 bg-gray-50 rounded border border-gray-200 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">正在获取数据...</p>
                </div>
              ) : previewData?.error ? (
                <div className="p-4 bg-red-50 rounded border border-red-200">
                  <p className="text-sm text-red-600">
                    <span className="font-medium">错误:</span> {previewData.error}
                  </p>
                </div>
              ) : previewData?.data && previewData.data.length > 0 ? (
                <div className="space-y-4">
                  {/* 数据摘要 */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-2">
                      <List className="w-3 h-3" />
                      共 {previewData.total} 条记录，显示 {previewData.data.length} 条
                    </span>
                    <span className="text-gray-400">
                      更新于 {previewData.lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* 数据表格预览 */}
                  <div className="border border-gray-200 rounded overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {previewData.fields.slice(0, 6).map((field) => (
                            <th key={field} className="px-3 py-2 text-left font-medium text-gray-600 border-b">
                              {field}
                            </th>
                          ))}
                          {previewData.fields.length > 6 && (
                            <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">
                              ...
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.data.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {previewData.fields.slice(0, 6).map((field) => (
                              <td key={field} className="px-3 py-2 text-gray-700 border-b border-gray-100 max-w-24 truncate">
                                {row[field] !== undefined && row[field] !== null
                                  ? String(row[field])
                                  : '-'}
                              </td>
                            ))}
                            {previewData.fields.length > 6 && (
                              <td className="px-3 py-2 text-gray-400 border-b border-gray-100">
                                ...
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 单字段预览（如果绑定了字段） */}
                  {dataField && previewData.data.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs text-blue-800 font-medium mb-2">字段预览: {dataField}</div>
                      <div className="flex flex-wrap gap-2">
                        {previewData.data.slice(0, 5).map((row, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-white border border-blue-300 rounded text-blue-700"
                          >
                            {row[dataField] !== undefined && row[dataField] !== null
                              ? String(row[dataField])
                              : '-'}
                          </span>
                        ))}
                        {previewData.total > 5 && (
                          <span className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-500">
                            +{previewData.total - 5} 更多
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded border border-gray-200 text-center">
                  <Table className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">暂无数据</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dataSources' && (
            <div className="space-y-2">
              {dataSources.map((ds) => (
                <div
                  key={ds.id}
                  className={`p-3 rounded border transition-colors ${
                    dataSourceId === ds.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        ds.status === 'connected' ? 'bg-green-500' : 
                        ds.status === 'connecting' ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></span>
                      <span className="text-sm font-medium text-gray-700">{ds.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">
                        {ds.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{ds.status}</span>
                  </div>
                  {dataSourceId === ds.id && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="text-xs text-gray-600 mb-1">可用字段:</div>
                      <div className="flex flex-wrap gap-1">
                        {fields.map((field) => (
                          <span
                            key={field.name}
                            className={`px-2 py-0.5 text-xs rounded ${
                              dataField === field.name
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {field.name}
                            <span className="ml-1 text-gray-400">({field.type})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import { Database, Code, Play, Plus, Trash2, ChevronRight } from 'lucide-react'

interface ColumnDefinition {
  id: string
  name: string
  type: string
  description?: string
  nullable: boolean
  primaryKey: boolean
  unique: boolean
}

interface ToolExecutionResult {
  step: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  details?: string
}

const DATA_TYPES = [
  'string', 'text', 'integer', 'int', 'bigint', 'smallint',
  'decimal', 'numeric', 'float', 'double', 'boolean',
  'date', 'time', 'timestamp', 'datetime', 'json', 'uuid',
  'email', 'url', 'phone', 'enum'
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function EntityDefinitionPanel() {
  const [entityName, setEntityName] = useState('')
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { id: '1', name: 'id', type: 'integer', primaryKey: true, nullable: false, unique: true },
    { id: '2', name: 'name', type: 'string', primaryKey: false, nullable: false, unique: false },
  ])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<ToolExecutionResult[]>([])
  const [outputSummary, setOutputSummary] = useState('')

  const addColumn = () => {
    const newId = `col-${Date.now()}`
    setColumns([...columns, {
      id: newId,
      name: `field_${columns.length + 1}`,
      type: 'string',
      nullable: true,
      primaryKey: false,
      unique: false,
    }])
  }

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return
    setColumns(columns.filter(col => col.id !== id))
  }

  const updateColumn = (id: string, field: keyof ColumnDefinition, value: string | boolean) => {
    setColumns(columns.map(col => 
      col.id === id ? { ...col, [field]: value } : col
    ))
  }

  const executePipeline = async () => {
    if (!entityName.trim()) {
      alert('请输入实体名称')
      return
    }

    setIsExecuting(true)
    setExecutionResults([
      { step: '代码生成', status: 'pending' },
      { step: '文件打包', status: 'pending' },
      { step: '下载准备', status: 'pending' },
    ])
    setOutputSummary('')

    try {
      setExecutionResults(prev => prev.map(r => 
        r.step === '代码生成' ? { ...r, status: 'running' } : r
      ))

      const schema = {
        name: entityName,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          primaryKey: col.primaryKey,
          unique: col.unique,
        })),
      }

      const response = await fetch(`${API_BASE}/codegen/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          type: 'full-stack',
          schema,
          framework: 'react',
          enableRAG: false,
          enableOptimization: false,
        }),
      })

      if (!response.ok) {
        throw new Error('代码生成失败')
      }

      const result = await response.json()

      setExecutionResults(prev => prev.map(r => 
        r.step === '代码生成' ? { ...r, status: 'success', message: `生成 ${result.fileCount} 个文件`, details: `时长 ${result.duration}ms` } : r
      ))

      setExecutionResults(prev => prev.map(r => 
        r.step === '文件打包' ? { ...r, status: 'running' } : r
      ))

      const downloadResponse = await fetch(`${API_BASE}/codegen/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          type: 'full-stack',
          schema,
          framework: 'react',
          enableRAG: false,
          enableOptimization: false,
        }),
      })

      if (!downloadResponse.ok) {
        throw new Error('打包失败')
      }

      setExecutionResults(prev => prev.map(r => 
        r.step === '文件打包' ? { ...r, status: 'success', message: '打包成功', details: 'ZIP文件已生成' } : r
      ))

      setExecutionResults(prev => prev.map(r => 
        r.step === '下载准备' ? { ...r, status: 'running' } : r
      ))

      const blob = await downloadResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entityName.toLowerCase()}-codegen.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setExecutionResults(prev => prev.map(r => 
        r.step === '下载准备' ? { ...r, status: 'success', message: '下载已开始', details: '浏览器已触发下载' } : r
      ))

      setOutputSummary(`全链路自动化完成！\n\n实体: ${entityName}\n字段数: ${columns.length}\n\n生成内容:\n- ${result.fileCount} 个文件\n- 时长: ${result.duration}ms\n- 文件已自动下载`)
    } catch (error: any) {
      setExecutionResults(prev => prev.map(r => 
        r.status === 'running' ? { ...r, status: 'error', message: error.message } : r
      ))
      setOutputSummary(`执行失败: ${error.message}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const formatTypeScriptType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'string': 'string', 'text': 'string', 'email': 'string', 'url': 'string', 'phone': 'string', 'uuid': 'string',
      'integer': 'number', 'int': 'number', 'bigint': 'number', 'smallint': 'number',
      'decimal': 'number', 'numeric': 'number', 'float': 'number', 'double': 'number',
      'boolean': 'boolean',
      'date': 'Date', 'time': 'Date', 'timestamp': 'Date', 'datetime': 'Date',
      'json': 'object', 'enum': 'string',
    }
    return typeMap[type] || 'any'
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <Database className="w-5 h-5" />
        <span className="font-medium">实体定义</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">实体名称</label>
          <input
            type="text"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder="例如: User, Product, Order"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">字段列表</label>
            <button
              onClick={addColumn}
              disabled={isExecuting}
              className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              添加字段
            </button>
          </div>

          <div className="space-y-2">
            {columns.map((column, index) => (
              <div key={column.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">字段 {index + 1}</span>
                  <button
                    onClick={() => removeColumn(column.id)}
                    disabled={isExecuting || columns.length <= 1}
                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">字段名</label>
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => updateColumn(column.id, 'name', e.target.value)}
                      disabled={isExecuting}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">数据类型</label>
                    <select
                      value={column.type}
                      onChange={(e) => updateColumn(column.id, 'type', e.target.value)}
                      disabled={isExecuting}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                    >
                      {DATA_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type} ({formatTypeScriptType(type)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={column.primaryKey}
                      onChange={(e) => {
                        updateColumn(column.id, 'primaryKey', e.target.checked)
                        if (e.target.checked) {
                          updateColumn(column.id, 'nullable', false)
                          updateColumn(column.id, 'unique', true)
                        }
                      }}
                      disabled={isExecuting || (column.primaryKey && columns.filter(c => c.primaryKey).length <= 1)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    主键
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={column.nullable}
                      onChange={(e) => updateColumn(column.id, 'nullable', e.target.checked)}
                      disabled={isExecuting || column.primaryKey}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    可空
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={column.unique}
                      onChange={(e) => updateColumn(column.id, 'unique', e.target.checked)}
                      disabled={isExecuting}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    唯一
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={executePipeline}
          disabled={isExecuting || !entityName.trim()}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            isExecuting || !entityName.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
          }`}
        >
          <Play className={`w-4 h-4 ${isExecuting ? 'animate-pulse' : ''}`} />
          {isExecuting ? '执行中...' : '执行全链路自动化'}
        </button>

        {executionResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">执行进度</div>
            {executionResults.map((result) => (
              <div key={result.step} className="flex items-center gap-2">
                <ChevronRight className={`w-4 h-4 ${
                  result.status === 'success' ? 'text-green-500' :
                  result.status === 'error' ? 'text-red-500' :
                  result.status === 'running' ? 'text-blue-500 animate-pulse' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      result.status === 'success' ? 'text-green-700' :
                      result.status === 'error' ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {result.step}
                    </span>
                    {result.status === 'running' && (
                      <span className="text-xs text-blue-500">进行中...</span>
                    )}
                    {result.status === 'success' && (
                      <span className="text-xs text-green-500">✓ 完成</span>
                    )}
                    {result.status === 'error' && (
                      <span className="text-xs text-red-500">✗ 失败</span>
                    )}
                  </div>
                  {result.message && (
                    <div className="text-xs text-gray-500">{result.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {outputSummary && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">执行结果</span>
            </div>
            <pre className="text-sm text-green-800 whitespace-pre-wrap">{outputSummary}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'

// 文档类型
interface Document {
  id: string
  title: string
  type: 'markdown' | 'pdf' | 'api' | 'requirement'
  size: string
  chunks: number
  status: '已索引' | '索引中' | '索引失败'
  createdAt: string
  updatedAt: string
}

// 模拟文档数据
const mockDocuments: Document[] = [
  {
    id: '1',
    title: '前端编码规范',
    type: 'markdown',
    size: '128 KB',
    chunks: 45,
    status: '已索引',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    title: '后端 API 文档',
    type: 'api',
    size: '256 KB',
    chunks: 89,
    status: '已索引',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14',
  },
  {
    id: '3',
    title: '系统需求规格说明书',
    type: 'requirement',
    size: '512 KB',
    chunks: 156,
    status: '已索引',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
  },
  {
    id: '4',
    title: 'React 组件库文档',
    type: 'markdown',
    size: '320 KB',
    chunks: 112,
    status: '索引中',
    createdAt: '2024-01-13',
    updatedAt: '2024-01-15',
  },
  {
    id: '5',
    title: '数据库设计文档',
    type: 'pdf',
    size: '1.2 MB',
    chunks: 0,
    status: '索引失败',
    createdAt: '2024-01-11',
    updatedAt: '2024-01-11',
  },
  {
    id: '6',
    title: 'OpenAPI 3.0 规范',
    type: 'api',
    size: '64 KB',
    chunks: 28,
    status: '已索引',
    createdAt: '2024-01-09',
    updatedAt: '2024-01-13',
  },
]

// 统计类型
interface Statistic {
  title: string
  value: string | number
  icon: string
  color: string
}

const statistics: Statistic[] = [
  { title: '文档总数', value: 156, icon: '📄', color: 'blue' },
  { title: '向量碎片', value: '4,521', icon: '🧩', color: 'purple' },
  { title: '知识库体积', value: '128 MB', icon: '💾', color: 'green' },
  { title: '检索次数', value: '2,847', icon: '🔍', color: 'orange' },
]

// 类型映射
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'markdown':
      return { icon: '📝', color: 'bg-blue-100 text-blue-600' }
    case 'pdf':
      return { icon: '📕', color: 'bg-red-100 text-red-600' }
    case 'api':
      return { icon: '🔌', color: 'bg-green-100 text-green-600' }
    case 'requirement':
      return { icon: '📋', color: 'bg-yellow-100 text-yellow-600' }
    default:
      return { icon: '📄', color: 'bg-gray-100 text-gray-600' }
  }
}

// 状态映射
const getStatusInfo = (status: string) => {
  switch (status) {
    case '已索引':
      return { color: 'bg-green-100 text-green-700', icon: '✓' }
    case '索引中':
      return { color: 'bg-blue-100 text-blue-700', icon: '↻' }
    case '索引失败':
      return { color: 'bg-red-100 text-red-700', icon: '✗' }
    default:
      return { color: 'bg-gray-100 text-gray-700', icon: '?' }
  }
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterType, setFilterType] = useState('全部')

  // 过滤文档
  const filteredDocuments = documents.filter((doc) => {
    const matchType = filterType === '全部' || doc.type === filterType
    const matchKeyword = doc.title.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchType && matchKeyword
  })

  // 切换选择
  const toggleSelect = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([])
    } else {
      setSelectedDocs(filteredDocuments.map((d) => d.id))
    }
  }

  // 删除选中文档
  const deleteSelected = () => {
    if (selectedDocs.length === 0) return
    if (!confirm(`确定要删除选中的 ${selectedDocs.length} 个文档吗？`)) return
    setDocuments((prev) => prev.filter((d) => !selectedDocs.includes(d.id)))
    setSelectedDocs([])
  }

  // 重新索引失败文档
  const retryIndexing = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: '索引中' as const } : d))
    )
    // 模拟重新索引
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: '已索引' as const, chunks: 100 } : d))
      )
    }, 2000)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">知识库管理</h1>
          <p className="text-gray-500 mt-1">管理 RAG 私有知识库文档</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>⬆️</span>
          <span>上传文档</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {statistics.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索文档..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* 类型筛选 */}
          <div className="flex items-center gap-2">
            {['全部', 'markdown', 'pdf', 'api', 'requirement'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type === '全部' ? '全部' : type.toUpperCase()}
              </button>
            ))}
          </div>

          {/* 批量操作 */}
          {selectedDocs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                已选择 {selectedDocs.length} 项
              </span>
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                删除选中
              </button>
              <button
                onClick={() => setSelectedDocs([])}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消选择
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 文档列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-6 text-left">
                <input
                  type="checkbox"
                  checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                文档名称
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                类型
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                大小
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                碎片数
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                状态
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                更新时间
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc) => {
              const typeInfo = getTypeIcon(doc.type)
              const statusInfo = getStatusInfo(doc.status)
              return (
                <tr
                  key={doc.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                        {typeInfo.icon}
                      </div>
                      <span className="font-medium text-gray-800">{doc.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
                      {doc.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{doc.size}</td>
                  <td className="py-4 px-6 text-gray-600">{doc.chunks}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusInfo.color}`}>
                      <span>{statusInfo.icon}</span>
                      <span>{doc.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm">{doc.updatedAt}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        预览
                      </button>
                      {doc.status === '索引失败' && (
                        <button
                          onClick={() => retryIndexing(doc.id)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          重试
                        </button>
                      )}
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 空状态 */}
      {filteredDocuments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无文档</h3>
          <p className="text-gray-500 mb-4">上传您的第一个文档到知识库</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            上传文档
          </button>
        </div>
      )}

      {/* 上传弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">上传文档</h3>
            
            {/* 上传区域 */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer mb-4">
              <input
                type="file"
                multiple
                accept=".md,.pdf,.txt,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-5xl mb-3">📤</div>
                <p className="text-gray-600 mb-2">
                  点击或拖拽文件到此处上传
                </p>
                <p className="text-sm text-gray-400">
                  支持 Markdown、PDF、TXT、DOC、DOCX 格式
                </p>
              </label>
            </div>

            {/* 上传的文件列表 */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">📝</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">前端编码规范.md</p>
                  <p className="text-xs text-gray-500">128 KB</p>
                </div>
                <button className="text-gray-400 hover:text-red-500">✕</button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                开始上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

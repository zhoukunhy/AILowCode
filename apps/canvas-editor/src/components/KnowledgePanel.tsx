'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Upload,
  Search,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Loader2,
  BookOpen,
  Layers,
  RefreshCw,
} from 'lucide-react'
import {
  knowledgeApi,
  type KnowledgeBase,
  type KnowledgeDocument,
  type SearchResult,
  type KnowledgeBaseStats,
} from '@/lib/api'

type TabType = 'bases' | 'documents' | 'search'

type ModalType = 'create-base' | 'edit-base' | 'upload-doc' | 'doc-detail' | null

interface CreateBaseForm {
  name: string
  description: string
}

interface UploadDocForm {
  name: string
  content: string
  type: 'md' | 'api' | 'requirement'
}

export function KnowledgePanel() {
  const [activeTab, setActiveTab] = useState<TabType>('bases')
  const [modalType, setModalType] = useState<ModalType>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [bases, setBases] = useState<KnowledgeBase[]>([])
  const [selectedBase, setSelectedBase] = useState<KnowledgeBase | null>(null)
  const [expandedBases, setExpandedBases] = useState<Set<number>>(new Set())

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null)

  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchBaseId, setSearchBaseId] = useState<number | null>(null)
  
  const [baseStats, setBaseStats] = useState<KnowledgeBaseStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const [createBaseForm, setCreateBaseForm] = useState<CreateBaseForm>({
    name: '',
    description: '',
  })

  const [editBaseForm, setEditBaseForm] = useState<CreateBaseForm>({
    name: '',
    description: '',
  })

  const [uploadDocForm, setUploadDocForm] = useState<UploadDocForm>({
    name: '',
    content: '',
    type: 'md',
  })

  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const fetchBases = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await knowledgeApi.getAllKnowledgeBases()
      const data = result as Record<string, unknown>
      const basesData = Array.isArray(data) ? data : (data.data as KnowledgeBase[] || [])
      setBases(basesData)
    } catch (err: any) {
      setError(err.message || '获取知识库列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDocuments = useCallback(async (baseId: number) => {
    setLoading(true)
    setError('')
    try {
      const result = await knowledgeApi.getDocumentsByKnowledgeBase(baseId)
      const data = result as Record<string, unknown>
      const docsData = Array.isArray(data) ? data : (data.data as KnowledgeDocument[] || [])
      setDocuments(docsData)
    } catch (err: any) {
      setError(err.message || '获取文档列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBases()
  }, [fetchBases])

  const fetchBaseStats = useCallback(async (baseId: number) => {
    setStatsLoading(true)
    try {
      const result = await knowledgeApi.getKnowledgeBaseStats(baseId)
      const data = result as Record<string, unknown>
      const statsData = data as KnowledgeBaseStats
      setBaseStats(statsData)
    } catch (err) {
      console.error('获取知识库统计失败:', err)
      setBaseStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedBase) {
      fetchDocuments(selectedBase.id)
      fetchBaseStats(selectedBase.id)
    } else {
      setBaseStats(null)
    }
  }, [selectedBase, fetchDocuments, fetchBaseStats])

  const handleCreateBase = async () => {
    if (!createBaseForm.name.trim()) {
      setError('请输入知识库名称')
      return
    }
    setLoading(true)
    try {
      await knowledgeApi.createKnowledgeBase({
        name: createBaseForm.name.trim(),
        description: createBaseForm.description.trim() || undefined,
      })
      setModalType(null)
      setCreateBaseForm({ name: '', description: '' })
      fetchBases()
    } catch (err: any) {
      setError(err.message || '创建知识库失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEditBase = async () => {
    if (!selectedBase || !editBaseForm.name.trim()) {
      setError('请输入知识库名称')
      return
    }
    setLoading(true)
    try {
      await knowledgeApi.updateKnowledgeBase(selectedBase.id, {
        name: editBaseForm.name.trim(),
        description: editBaseForm.description.trim() || undefined,
      })
      setModalType(null)
      setEditBaseForm({ name: '', description: '' })
      fetchBases()
    } catch (err: any) {
      setError(err.message || '更新知识库失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBase = async (baseId: number) => {
    if (!confirm('确定要删除这个知识库吗？此操作不可恢复。')) return
    setLoading(true)
    try {
      await knowledgeApi.deleteKnowledgeBase(baseId)
      if (selectedBase?.id === baseId) {
        setSelectedBase(null)
        setDocuments([])
      }
      fetchBases()
    } catch (err: any) {
      setError(err.message || '删除知识库失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadTextDocument = async () => {
    if (!selectedBase) {
      setError('请先选择一个知识库')
      return
    }
    if (!uploadDocForm.name.trim() || !uploadDocForm.content.trim()) {
      setError('请填写文档名称和内容')
      return
    }
    setLoading(true)
    try {
      await knowledgeApi.uploadDocument({
        knowledgeBaseId: selectedBase.id,
        name: uploadDocForm.name.trim(),
        content: uploadDocForm.content.trim(),
        type: uploadDocForm.type,
      })
      setModalType(null)
      setUploadDocForm({ name: '', content: '', type: 'md' })
      fetchDocuments(selectedBase.id)
      fetchBaseStats(selectedBase.id)
    } catch (err: any) {
      setError(err.message || '上传文档失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadFileDocument = async () => {
    if (!selectedBase || !uploadFile) {
      setError('请选择知识库和文件')
      return
    }
    setLoading(true)
    try {
      const type = uploadFile.name.endsWith('.md')
        ? 'md'
        : uploadFile.name.endsWith('.json')
        ? 'api'
        : 'requirement'
      await knowledgeApi.uploadDocumentFile(uploadFile, selectedBase.id, type)
      setUploadFile(null)
      setUploadDocForm({ name: '', content: '', type: 'md' })
      fetchDocuments(selectedBase.id)
      fetchBaseStats(selectedBase.id)
    } catch (err: any) {
      setError(err.message || '上传文件失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!selectedBase) return
    if (!confirm('确定要删除这个文档吗？')) return
    setLoading(true)
    try {
      await knowledgeApi.deleteDocument(docId)
      fetchDocuments(selectedBase.id)
      fetchBaseStats(selectedBase.id)
    } catch (err: any) {
      setError(err.message || '删除文档失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRevectorize = async (docId: number) => {
    if (!confirm('确定要重新向量化这个文档吗？')) return
    setLoading(true)
    try {
      await knowledgeApi.revectorizeDocument(docId)
      if (selectedBase) {
        fetchDocuments(selectedBase.id)
      }
    } catch (err: any) {
      setError(err.message || '重新向量化失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchBaseId || !searchQuery.trim()) {
      setError('请选择知识库并输入搜索关键词')
      return
    }
    setLoading(true)
    try {
      const result = await knowledgeApi.searchKnowledge({
        knowledgeBaseId: searchBaseId,
        query: searchQuery.trim(),
        topK: 10,
        threshold: 0.7,
      })
      const data = result as Record<string, unknown>
      const searchData = Array.isArray(data) ? data : (data.data as SearchResult[] || [])
      setSearchResults(searchData)
    } catch (err: any) {
      setError(err.message || '搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleBaseExpand = (baseId: number) => {
    setExpandedBases((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(baseId)) {
        newSet.delete(baseId)
      } else {
        newSet.add(baseId)
      }
      return newSet
    })
  }

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'md':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'api':
        return <Layers className="w-4 h-4 text-green-500" />
      case 'requirement':
        return <BookOpen className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
            待处理
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            处理中
          </span>
        )
      case 'completed':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
            <Check className="w-3 h-3" />
            已完成
          </span>
        )
      case 'failed':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            失败
          </span>
        )
      default:
        return null
    }
  }

  const formatFileSize = (size?: number) => {
    if (!size) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const tabs = [
    { key: 'bases', label: '知识库', icon: FolderOpen },
    { key: 'documents', label: '文档管理', icon: FileText },
    { key: 'search', label: '知识检索', icon: Search },
  ] as const

  return (
    <div className="h-full flex flex-col bg-white">
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setError('')
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'bases' && (
          <div className="h-full flex">
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">知识库列表</h3>
                <button
                  onClick={() => {
                    setCreateBaseForm({ name: '', description: '' })
                    setModalType('create-base')
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新建
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : bases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无知识库，点击右上角创建</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {bases.map((base) => (
                    <div key={base.id}>
                      <div
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                          selectedBase?.id === base.id
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          toggleBaseExpand(base.id)
                          if (selectedBase?.id !== base.id) {
                            setSelectedBase(base)
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {expandedBases.has(base.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <FolderOpen className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-800">{base.name}</span>
                          {base.documentCount !== undefined && (
                            <span className="text-xs text-gray-500">
                              ({base.documentCount} 文档)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedBase(base)
                              setEditBaseForm({
                                name: base.name,
                                description: base.description || '',
                              })
                              setModalType('edit-base')
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBase(base.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {expandedBases.has(base.id) && base.description && (
                        <div className="px-12 py-2 text-sm text-gray-500 bg-gray-50">
                          {base.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedBase ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      {selectedBase.name}
                    </h3>
                    <button
                      onClick={() => {
                        fetchBaseStats(selectedBase.id)
                      }}
                      disabled={statsLoading}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {statsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                  ) : baseStats ? (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-blue-600">文档总数</span>
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                          {baseStats.documentCount}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Layers className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-purple-600">分块总数</span>
                        </div>
                        <div className="text-xl font-bold text-purple-700">
                          {baseStats.chunkCount}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600">已完成</span>
                        </div>
                        <div className="text-xl font-bold text-green-700">
                          {baseStats.completedCount}
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Loader2 className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs text-yellow-600">待处理</span>
                        </div>
                        <div className="text-xl font-bold text-yellow-700">
                          {baseStats.pendingCount}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {baseStats && (baseStats.completedCount + baseStats.pendingCount + baseStats.failedCount > 0) && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>向量化进度</span>
                        <span>
                          {baseStats.completedCount}/{baseStats.documentCount}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                          style={{
                            width: `${baseStats.documentCount > 0 
                              ? (baseStats.completedCount / baseStats.documentCount) * 100 
                              : 0
                            }%`,
                          }}
                        />
                      </div>
                      {baseStats.failedCount > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          {baseStats.failedCount} 个文档向量化失败
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setUploadDocForm({ name: '', content: '', type: 'md' })
                      setUploadFile(null)
                      setModalType('upload-doc')
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors mb-4"
                  >
                    <Upload className="w-4 h-4" />
                    上传文档
                  </button>

                  {documents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>暂无文档，点击上方上传</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getDocumentTypeIcon(doc.type)}
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.size)} · 分块数: {doc.chunkCount || 0}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(doc.vectorStatus)}
                            {doc.vectorStatus === 'failed' && (
                              <button
                                onClick={() => handleRevectorize(doc.id)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                              >
                                <RefreshCw className="w-3 h-3" />
                                重试
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedDocument(doc)
                                setModalType('doc-detail')
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>请选择一个知识库查看详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="h-full flex">
            <div className="w-48 border-r border-gray-200 overflow-y-auto">
              <div className="p-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">知识库</h4>
                <div className="space-y-1">
                  {bases.map((base) => (
                    <button
                      key={base.id}
                      onClick={() => {
                        setSelectedBase(base)
                        fetchDocuments(base.id)
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
                        selectedBase?.id === base.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      {base.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {selectedBase ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">
                      {selectedBase.name}
                    </h3>
                    <button
                      onClick={() => {
                        fetchBaseStats(selectedBase.id)
                      }}
                      disabled={statsLoading}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {statsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                  ) : baseStats ? (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-blue-600">文档总数</span>
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                          {baseStats.documentCount}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Layers className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-purple-600">分块总数</span>
                        </div>
                        <div className="text-xl font-bold text-purple-700">
                          {baseStats.chunkCount}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600">已完成</span>
                        </div>
                        <div className="text-xl font-bold text-green-700">
                          {baseStats.completedCount}
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Loader2 className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs text-yellow-600">待处理</span>
                        </div>
                        <div className="text-xl font-bold text-yellow-700">
                          {baseStats.pendingCount}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {baseStats && (baseStats.completedCount + baseStats.pendingCount + baseStats.failedCount > 0) && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>向量化进度</span>
                        <span>
                          {baseStats.completedCount}/{baseStats.documentCount}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                          style={{
                            width: `${baseStats.documentCount > 0 
                              ? (baseStats.completedCount / baseStats.documentCount) * 100 
                              : 0
                            }%`,
                          }}
                        />
                      </div>
                      {baseStats.failedCount > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          {baseStats.failedCount} 个文档向量化失败
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setUploadDocForm({ name: '', content: '', type: 'md' })
                        setUploadFile(null)
                        setModalType('upload-doc')
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      上传文档
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>暂无文档</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getDocumentTypeIcon(doc.type)}
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.size)} · 分块数: {doc.chunkCount || 0}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(doc.vectorStatus)}
                            {doc.vectorStatus === 'failed' && (
                              <button
                                onClick={() => handleRevectorize(doc.id)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                              >
                                <RefreshCw className="w-3 h-3" />
                                重试
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedDocument(doc)
                                setModalType('doc-detail')
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>请从左侧选择知识库</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="h-full p-4 flex flex-col">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择知识库
                </label>
                <select
                  value={searchBaseId || ''}
                  onChange={(e) =>
                    setSearchBaseId(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择知识库</option>
                  {bases.map((base) => (
                    <option key={base.id} value={base.id}>
                      {base.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索关键词
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="输入搜索关键词..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    搜索
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 mt-4 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>搜索结果将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600">
                          相似度: {(result.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {result.content}
                      </p>
                      {result.metadata && Object.keys(result.metadata).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            来源: {typeof result.metadata.source === 'string' ? result.metadata.source : '未知'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalType === 'create-base' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">新建知识库</h2>
              <button
                onClick={() => setModalType(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  知识库名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createBaseForm.name}
                  onChange={(e) =>
                    setCreateBaseForm({ ...createBaseForm, name: e.target.value })
                  }
                  placeholder="输入知识库名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={createBaseForm.description}
                  onChange={(e) =>
                    setCreateBaseForm({ ...createBaseForm, description: e.target.value })
                  }
                  placeholder="输入知识库描述"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateBase}
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    创建中
                  </span>
                ) : (
                  '创建'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'edit-base' && selectedBase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">编辑知识库</h2>
              <button
                onClick={() => setModalType(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  知识库名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editBaseForm.name}
                  onChange={(e) =>
                    setEditBaseForm({ ...editBaseForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={editBaseForm.description}
                  onChange={(e) =>
                    setEditBaseForm({ ...editBaseForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEditBase}
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    更新中
                  </span>
                ) : (
                  '更新'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'upload-doc' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">上传文档</h2>
              <button
                onClick={() => setModalType(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上传方式
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUploadFile(null)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      !uploadFile
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    文本输入
                  </button>
                  <button
                    onClick={() => {
                      setUploadFile(null)
                      const fileInput = document.getElementById('doc-file-input') as HTMLInputElement
                      fileInput.click()
                    }}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      uploadFile
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    文件上传
                  </button>
                  <input
                    id="doc-file-input"
                    type="file"
                    accept=".md,.txt,.json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUploadFile(e.target.files[0])
                        setUploadDocForm({
                          ...uploadDocForm,
                          name: e.target.files[0].name,
                        })
                      }
                    }}
                  />
                </div>
              </div>

              {uploadFile ? (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    已选择文件: <span className="font-medium">{uploadFile.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    文件大小: {formatFileSize(uploadFile.size)}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      文档名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadDocForm.name}
                      onChange={(e) =>
                        setUploadDocForm({ ...uploadDocForm, name: e.target.value })
                      }
                      placeholder="输入文档名称"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      文档类型
                    </label>
                    <select
                      value={uploadDocForm.type}
                      onChange={(e) =>
                        setUploadDocForm({
                          ...uploadDocForm,
                          type: e.target.value as 'md' | 'api' | 'requirement',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="md">Markdown 文档</option>
                      <option value="api">API 文档</option>
                      <option value="requirement">需求文档</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      文档内容 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={uploadDocForm.content}
                      onChange={(e) =>
                        setUploadDocForm({ ...uploadDocForm, content: e.target.value })
                      }
                      placeholder="输入文档内容..."
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={uploadFile ? handleUploadFileDocument : handleUploadTextDocument}
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    上传中
                  </span>
                ) : (
                  '上传'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'doc-detail' && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getDocumentTypeIcon(selectedDocument.type)}
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedDocument.name}
                </h2>
                {getStatusBadge(selectedDocument.vectorStatus)}
              </div>
              <button
                onClick={() => setModalType(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  分块数: {selectedDocument.chunkCount || 0} | 文件大小:{' '}
                  {formatFileSize(selectedDocument.size)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {selectedDocument.content}
                </pre>
              </div>

              {selectedDocument.errorMessage && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 font-medium">向量化失败原因:</p>
                  <p className="text-sm text-red-600 mt-1">
                    {selectedDocument.errorMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              {selectedDocument.vectorStatus === 'failed' && (
                <button
                  onClick={() => handleRevectorize(selectedDocument.id)}
                  disabled={loading}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新向量化
                </button>
              )}
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
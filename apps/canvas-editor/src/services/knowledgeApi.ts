/**
 * 知识库 API 服务
 * 提供知识库管理、文档上传、检索等 API 调用
 */

import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
})

// 请求拦截器添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ==================== 类型定义 ====================

export interface KnowledgeBase {
  id: number
  name: string
  description?: string
  embeddingModel?: string
  dimension: number
  documentCount: number
  isActive: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface KnowledgeDocument {
  id: number
  knowledgeBaseId: number
  name: string
  content?: string
  type: 'md' | 'api' | 'requirement'
  size?: number
  vectorStatus: 'pending' | 'processing' | 'completed' | 'failed'
  chunkCount: number
  metadata?: Record<string, any>
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentChunk {
  id: number
  documentId: number
  chunkIndex: number
  content: string
  metadata?: Record<string, any>
  vectorId?: string
  createdAt: string
}

export interface SearchResult {
  id: string
  content: string
  metadata?: Record<string, any>
  score: number
}

// ==================== 知识库管理 API ====================

/**
 * 创建知识库
 */
export const createKnowledgeBase = async (data: {
  name: string
  description?: string
  embeddingModel?: string
  dimension?: number
}): Promise<KnowledgeBase> => {
  const response = await api.post('/knowledge/bases', data)
  return response.data.data || response.data
}

/**
 * 获取所有知识库
 */
export const getKnowledgeBases = async (): Promise<KnowledgeBase[]> => {
  const response = await api.get('/knowledge/bases')
  return response.data.data || []
}

/**
 * 获取知识库详情
 */
export const getKnowledgeBase = async (id: number): Promise<KnowledgeBase> => {
  const response = await api.get(`/knowledge/bases/${id}`)
  return response.data.data || response.data
}

/**
 * 更新知识库
 */
export const updateKnowledgeBase = async (
  id: number,
  data: Partial<KnowledgeBase>
): Promise<KnowledgeBase> => {
  const response = await api.put(`/knowledge/bases/${id}`, data)
  return response.data.data || response.data
}

/**
 * 删除知识库
 */
export const deleteKnowledgeBase = async (id: number): Promise<void> => {
  await api.delete(`/knowledge/bases/${id}`)
}

// ==================== 文档管理 API ====================

/**
 * 上传文档（文本内容）
 */
export const uploadDocument = async (data: {
  knowledgeBaseId: number
  name: string
  content: string
  type: 'md' | 'api' | 'requirement'
  metadata?: Record<string, any>
}): Promise<KnowledgeDocument> => {
  const response = await api.post('/knowledge/documents/upload', data)
  return response.data.data || response.data
}

/**
 * 上传文档（文件）
 */
export const uploadDocumentFile = async (
  knowledgeBaseId: number,
  type: 'md' | 'api' | 'requirement',
  file: File
): Promise<KnowledgeDocument> => {
  const formData = new FormData()
  formData.append('knowledgeBaseId', knowledgeBaseId.toString())
  formData.append('type', type)
  formData.append('file', file)

  const response = await api.post('/knowledge/documents/upload-file', formData)
  return response.data.data || response.data
}

/**
 * 获取知识库的文档列表
 */
export const getDocuments = async (knowledgeBaseId: number): Promise<KnowledgeDocument[]> => {
  const response = await api.get('/knowledge/documents', {
    params: { knowledgeBaseId },
  })
  return response.data.data || []
}

/**
 * 获取文档详情
 */
export const getDocument = async (id: number): Promise<KnowledgeDocument> => {
  const response = await api.get(`/knowledge/documents/${id}`)
  return response.data.data || response.data
}

/**
 * 删除文档
 */
export const deleteDocument = async (id: number): Promise<void> => {
  await api.delete(`/knowledge/documents/${id}`)
}

// ==================== 检索功能 API ====================

/**
 * 检索知识库
 */
export const searchKnowledge = async (data: {
  knowledgeBaseId: number
  query: string
  topK?: number
  threshold?: number
}): Promise<SearchResult[]> => {
  const response = await api.post('/knowledge/search', data)
  return response.data.data || []
}

/**
 * 获取文档分块预览
 */
export const getDocumentChunks = async (
  documentId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<{ chunks: DocumentChunk[]; total: number }> => {
  const response = await api.get(`/knowledge/chunks/${documentId}`, {
    params: { page, pageSize },
  })
  return response.data.data || response.data
}

/**
 * 清空知识库所有向量
 */
export const clearKnowledgeBaseVectors = async (knowledgeBaseId: number): Promise<void> => {
  await api.post(`/knowledge/bases/${knowledgeBaseId}/clear-vectors`)
}

/**
 * 获取知识库统计信息
 */
export interface KnowledgeBaseStats {
  documentCount: number
  chunkCount: number
  pendingCount: number
  completedCount: number
  failedCount: number
}

export const getKnowledgeBaseStats = async (knowledgeBaseId: number): Promise<KnowledgeBaseStats> => {
  const response = await api.get(`/knowledge/bases/${knowledgeBaseId}/stats`)
  return response.data.data || response.data
}

/**
 * 混合检索（向量+关键词）
 */
export const hybridSearchKnowledge = async (data: {
  knowledgeBaseId: number
  query: string
  topK?: number
  threshold?: number
}): Promise<SearchResult[]> => {
  const response = await api.post('/knowledge/hybrid-search', data)
  return response.data.data || []
}

/**
 * 重新向量化文档
 */
export const revectorizeDocument = async (documentId: number): Promise<KnowledgeDocument> => {
  const response = await api.post(`/knowledge/documents/${documentId}/revectorize`)
  return response.data.data || response.data
}

/**
 * 获取向量化日志
 */
export interface VectorizationLog {
  id: number
  documentId: string
  documentName: string
  documentType: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  stage: string
  startTime: string
  endTime?: string
  duration?: number
  chunkCount: number
  vectorCount: number
  error?: string
  metadata?: Record<string, any>
  createdAt: string
}

export const getVectorizationLogs = async (documentId?: string): Promise<VectorizationLog[]> => {
  const response = await api.get('/knowledge/logs', {
    params: documentId ? { documentId } : {},
  })
  return response.data.data || []
}

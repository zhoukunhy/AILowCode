const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

function getCacheKey(url: string, method: string = 'GET', body?: any): string {
  return `${method}:${url}:${body ? JSON.stringify(body) : ''}`
}

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }
  return null
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const apiClient = {
  async get<T>(url: string, options?: RequestInit & { useCache?: boolean }): Promise<T> {
    const cacheKey = getCacheKey(url, 'GET')
    
    // 检查缓存
    if (options?.useCache !== false) {
      const cached = getCachedData<T>(cacheKey)
      if (cached) {
        console.log(`[API Cache] Using cached data for ${url}`)
        return cached
      }
    }

    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      ...options,
    })
    
    const data = await response.json()
    
    // 缓存成功响应
    if (response.ok && options?.useCache !== false) {
      setCachedData(cacheKey, data)
    }
    
    return data
  },

  async post<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
      ...options,
    })
    return response.json()
  },

  async put<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
      ...options,
    })
    return response.json()
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      ...options,
    })
    return response.json()
  },
}

// 保留原有 API 兼容
export const projectApi = {
  async createProject(name: string, description?: string) {
    return apiClient.post('/api/projects', { name, description })
  },

  async getProject(id: string) {
    return apiClient.get(`/api/projects/${id}`)
  },

  async updateProject(id: string, data: { name?: string; description?: string }) {
    return apiClient.put(`/api/projects/${id}`, data)
  },

  async deleteProject(id: string) {
    return apiClient.delete(`/api/projects/${id}`)
  },

  async getAllProjects() {
    return apiClient.get('/api/projects')
  },
}

export const pageApi = {
  async createPage(projectId: string, name: string, canvasJson?: any) {
    return apiClient.post(`/api/projects/${projectId}/pages`, { name, canvasJson })
  },

  async getPage(projectId: string, pageId: string) {
    return apiClient.get(`/api/projects/${projectId}/pages/${pageId}`)
  },

  async updatePage(projectId: string, pageId: string, data: { name?: string; canvasJson?: any }) {
    return apiClient.put(`/api/projects/${projectId}/pages/${pageId}`, data)
  },

  async saveCanvas(projectId: string, pageId: string, canvasJson: any) {
    return apiClient.put(`/api/projects/${projectId}/pages/${pageId}/canvas`, { canvasJson })
  },

  async deletePage(projectId: string, pageId: string) {
    return apiClient.delete(`/api/projects/${projectId}/pages/${pageId}`)
  },

  async getPages(projectId: string) {
    return apiClient.get(`/api/projects/${projectId}/pages`)
  },

  async exportCanvas(projectId: string, pageId: string) {
    return apiClient.get(`/api/projects/${projectId}/pages/${pageId}/export`)
  },

  async importCanvas(projectId: string, data: { name: string; canvasJson: any }) {
    return apiClient.post(`/api/projects/${projectId}/pages/import`, data)
  },
}

// AI Agent API 响应类型
export interface GeneratePageResponse {
  sessionId?: string
  success: boolean
  schema?: any
  error?: string
  message?: string
  logs?: any[]
  duration?: number
}

// 独立画布页面 API（不依赖项目）
export interface StreamEvent {
  event: 'step' | 'progress' | 'schema' | 'complete' | 'error'
  data: {
    name?: string
    message?: string
    progress?: number
    schema?: any
    success?: boolean
    logs?: any[]
    duration?: number
  }
}

// AI Agent API
export const agentApi = {
  async generatePage(requirement: string, knowledgeBaseIds?: number[], sessionId?: string, metadata?: Record<string, any>): Promise<GeneratePageResponse> {
    return apiClient.post('/api/agent/generate-page', {
      requirement,
      knowledgeBaseIds: knowledgeBaseIds || [],
      sessionId,
      metadata,
    })
  },

  async generatePageStream(
    requirement: string,
    knowledgeBaseIds?: number[],
    sessionId?: string,
    metadata?: Record<string, any>,
    onEvent?: (event: StreamEvent) => void
  ): Promise<GeneratePageResponse> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token')
      const xhr = new XMLHttpRequest()
      
      xhr.open('POST', `${BASE_URL}/api/agent/generate-page/stream`)
      xhr.setRequestHeader('Content-Type', 'application/json')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      let buffer = ''

      xhr.onprogress = () => {
        const newData = xhr.responseText.substring(buffer.length)
        buffer = xhr.responseText

        const events = newData.split('\n\n')
        for (const eventStr of events) {
          if (!eventStr.trim()) continue

          let event: StreamEvent = { event: 'progress', data: {} }
          let currentEventName: StreamEvent['event'] = 'progress'

          const lines = eventStr.split('\n')
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEventName = line.substring(7) as StreamEvent['event']
            } else if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6))
                event = { event: currentEventName, data }
              } catch {
                continue
              }
            }
          }

          if (event.event === 'complete') {
            resolve({ success: true, schema: event.data.schema })
          } else if (event.event === 'error') {
            reject(new Error(event.data.message))
          } else if (onEvent) {
            onEvent(event)
          }
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const remainingEvents = buffer.split('\n\n').filter(e => e.trim())
            for (const eventStr of remainingEvents) {
              let event: StreamEvent = { event: 'progress', data: {} }
              let currentEventName: StreamEvent['event'] = 'progress'

              const lines = eventStr.split('\n')
              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  currentEventName = line.substring(7) as StreamEvent['event']
                } else if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.substring(6))
                    event = { event: currentEventName, data }
                  } catch {
                    continue
                  }
                }
              }

              if (event.event === 'complete') {
                resolve({ success: true, schema: event.data.schema })
                return
              } else if (event.event === 'error') {
                reject(new Error(event.data.message))
                return
              }
            }
          } catch (e) {
            reject(e)
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error('Network error'))
      }

      xhr.send(JSON.stringify({
        requirement,
        knowledgeBaseIds: knowledgeBaseIds || [],
        sessionId,
        metadata,
      }))
    })
  },

  async getSession(sessionId: string) {
    return apiClient.get(`/api/agent/sessions/${sessionId}`)
  },

  async querySessions(params?: {
    sessionId?: string
    status?: string
    agentType?: string
    page?: number
    pageSize?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.sessionId) queryParams.set('sessionId', params.sessionId)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.agentType) queryParams.set('agentType', params.agentType)
    if (params?.page) queryParams.set('page', String(params.page))
    if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize))
    return apiClient.get(`/api/agent/sessions?${queryParams.toString()}`)
  },

  async deleteSession(sessionId: string) {
    return apiClient.delete(`/api/agent/sessions/${sessionId}`)
  },
}

export interface GeneratedFile {
  path: string
  content: string
}

export interface GenerateCodeResponse {
  sessionId: string
  success: boolean
  files: GeneratedFile[]
  fileCount: number
  duration: number
  error?: string
  ragRetrievalTime?: number
  optimizedFiles?: number
}

export interface GenerationLog {
  sessionId: string
  generationType: string
  schema: string
  fileCount: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: string
  endTime?: string
  duration?: number
  errorMessage?: string
  createdAt: string
}

export const codegenApi = {
  async generateCode(
    schema: any,
    type: 'frontend' | 'backend' | 'fullstack',
    framework?: string,
    sessionId?: string,
    enableRAG?: boolean,
    enableOptimization?: boolean
  ): Promise<GenerateCodeResponse> {
    return apiClient.post('/api/codegen/generate', {
      schema,
      type,
      framework,
      sessionId,
      enableRAG,
      enableOptimization,
    })
  },

  async downloadCode(
    schema: any,
    type: 'frontend' | 'backend' | 'fullstack',
    framework?: string
  ): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/api/codegen/download`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ schema, type, framework }),
    })
    return response.blob()
  },

  async getGenerationLog(sessionId: string): Promise<GenerationLog> {
    return apiClient.get(`/api/codegen/logs/${sessionId}`)
  },

  async queryLogs(page: number = 1, pageSize: number = 10): Promise<{
    logs: GenerationLog[]
    total: number
  }> {
    return apiClient.get(`/api/codegen/logs?page=${page}&pageSize=${pageSize}`)
  },
}

export const canvasPageApi = {
  async createPage(name: string, canvasJson?: any, config?: Partial<{
    width: number
    height: number
    backgroundColor: string
    gridSize: number
    showGrid: boolean
    snapToGrid: boolean
  }>) {
    return apiClient.post('/api/canvas-pages', { name, canvasJson, ...config })
  },

  async getPage(id: string | number) {
    return apiClient.get(`/api/canvas-pages/${id}`)
  },

  async updatePage(id: string | number, data: { name?: string; canvasJson?: any }) {
    return apiClient.put(`/api/canvas-pages/${id}`, data)
  },

  async saveCanvas(id: string | number, canvasJson: any) {
    return apiClient.put(`/api/canvas-pages/${id}/canvas`, { canvasJson })
  },

  async deletePage(id: string | number) {
    return apiClient.delete(`/api/canvas-pages/${id}`)
  },

  async getPages(page: number = 1, pageSize: number = 10) {
    return apiClient.get(`/api/canvas-pages?page=${page}&pageSize=${pageSize}`)
  },

  async duplicatePage(id: string | number, newName: string) {
    return apiClient.post(`/api/canvas-pages/${id}/duplicate`, { newName })
  },

  async exportPage(id: string | number) {
    return apiClient.get(`/api/canvas-pages/${id}/export`)
  },

  async importPage(data: { name: string; canvasJson: any }) {
    return apiClient.post('/api/canvas-pages/import', data)
  },
}

export interface KnowledgeBase {
  id: number
  name: string
  description?: string
  embeddingModel?: string
  dimension?: number
  isActive?: boolean
  documentCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface KnowledgeDocument {
  id: number
  knowledgeBaseId: number
  name: string
  content: string
  type: 'md' | 'api' | 'requirement'
  vectorStatus: 'pending' | 'processing' | 'completed' | 'failed'
  chunkCount?: number
  size?: number
  errorMessage?: string
  createdAt?: string
  updatedAt?: string
}

export interface SearchResult {
  id: string
  content: string
  metadata: Record<string, unknown>
  score: number
}

export interface KnowledgeBaseStats {
  documentCount: number
  chunkCount: number
  pendingCount: number
  completedCount: number
  failedCount: number
}

export const knowledgeApi = {
  async createKnowledgeBase(data: {
    name: string
    description?: string
    embeddingModel?: string
    dimension?: number
    isActive?: boolean
  }) {
    return apiClient.post('/api/knowledge/bases', data)
  },

  async getAllKnowledgeBases() {
    return apiClient.get('/api/knowledge/bases')
  },

  async getKnowledgeBaseById(id: number) {
    return apiClient.get(`/api/knowledge/bases/${id}`)
  },

  async updateKnowledgeBase(id: number, data: {
    name?: string
    description?: string
    embeddingModel?: string
    dimension?: number
    isActive?: boolean
  }) {
    return apiClient.put(`/api/knowledge/bases/${id}`, data)
  },

  async deleteKnowledgeBase(id: number) {
    return apiClient.delete(`/api/knowledge/bases/${id}`)
  },

  async uploadDocument(data: {
    knowledgeBaseId: number
    name: string
    content: string
    type: 'md' | 'api' | 'requirement'
    metadata?: Record<string, any>
  }) {
    return apiClient.post('/api/knowledge/documents/upload', data)
  },

  async uploadDocumentFile(file: File, knowledgeBaseId: number, type: 'md' | 'api' | 'requirement') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('knowledgeBaseId', String(knowledgeBaseId))
    formData.append('type', type)

    const response = await fetch(`${BASE_URL}/api/knowledge/documents/upload-file`, {
      method: 'POST',
      headers: {
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
      },
      body: formData,
    })
    return response.json()
  },

  async getDocumentsByKnowledgeBase(knowledgeBaseId: number) {
    return apiClient.get(`/api/knowledge/documents?knowledgeBaseId=${knowledgeBaseId}`)
  },

  async getDocumentById(id: number) {
    return apiClient.get(`/api/knowledge/documents/${id}`)
  },

  async deleteDocument(id: number) {
    return apiClient.delete(`/api/knowledge/documents/${id}`)
  },

  async searchKnowledge(data: {
    knowledgeBaseId: number
    query: string
    topK?: number
    threshold?: number
  }) {
    return apiClient.post('/api/knowledge/search', data)
  },

  async hybridSearchKnowledge(data: {
    knowledgeBaseId: number
    query: string
    topK?: number
    threshold?: number
  }) {
    return apiClient.post('/api/knowledge/hybrid-search', data)
  },

  async getDocumentChunks(documentId: number, page: number = 1, pageSize: number = 10) {
    return apiClient.get(`/api/knowledge/chunks/${documentId}?page=${page}&pageSize=${pageSize}`)
  },

  async clearKnowledgeBaseVectors(id: number) {
    return apiClient.post(`/api/knowledge/bases/${id}/clear-vectors`, {})
  },

  async getKnowledgeBaseStats(id: number) {
    return apiClient.get(`/api/knowledge/bases/${id}/stats`)
  },

  async revectorizeDocument(id: number) {
    return apiClient.post(`/api/knowledge/documents/${id}/revectorize`, {})
  },

  async getVectorizationLogs(documentId?: string) {
    const url = documentId
      ? `/api/knowledge/logs?documentId=${documentId}`
      : '/api/knowledge/logs'
    return apiClient.get(url)
  },
}

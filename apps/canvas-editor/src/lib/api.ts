const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const apiClient = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      ...options,
    })
    return response.json()
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
  success: boolean
  schema?: any
  error?: string
  message?: string
}

// 独立画布页面 API（不依赖项目）
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

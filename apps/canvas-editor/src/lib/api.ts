const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const apiClient = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    })
    return response.json()
  },

  async post<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      ...options,
    })
    return response.json()
  },

  async put<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      ...options,
    })
    return response.json()
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
      ...options,
    })
    return response.json()
  },
}

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
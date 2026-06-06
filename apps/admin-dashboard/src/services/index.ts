import api from './api'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  email: string
}

export interface LoginResponse {
  access_token: string
  user: {
    id: number
    username: string
    email: string
    role: string
    avatar?: string
  }
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  status: string
  avatarUrl?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: number
  name: string
  description?: string
  status: string
  visibility: string
  userId: number
  version: string
  createdAt: string
  updatedAt: string
}

export interface PageParams {
  page?: number
  pageSize?: number
}

export interface UserListParams extends PageParams {
  username?: string
  email?: string
  role?: string
}

export interface ProjectListParams extends PageParams {
  name?: string
  status?: string
}

export const authApi = {
  login: (params: LoginParams) => api.post<LoginResponse>('/auth/login', params),
  register: (params: RegisterParams) => api.post('/auth/register', params),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get<User>('/auth/profile'),
  refreshToken: () => api.post<{ access_token: string }>('/auth/refresh'),
}

export const userApi = {
  getList: (params?: UserListParams) => api.get('/users', { params }),
  getDetail: (id: number) => api.get<User>(`/users/${id}`),
  update: (id: number, data: Partial<User>) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
}

export const projectApi = {
  getList: (params?: ProjectListParams) => api.get('/projects', { params }),
  getDetail: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => api.post<Project>('/projects', data),
  update: (id: number, data: Partial<Project>) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
}

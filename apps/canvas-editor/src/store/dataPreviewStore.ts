import { create } from 'zustand'
import { generateId } from '@ai-lowcode/common-util'

export interface PreviewData {
  bindingId: string
  componentId: string
  dataSourceId: string
  data: any[]
  fields: string[]
  total: number
  loading: boolean
  error?: string
  lastUpdated: Date
}

export interface DataSourceInfo {
  id: string | number
  name: string
  type: 'mysql' | 'http' | 'postgres' | 'mongodb'
  config: Record<string, any>
  status: 'connected' | 'disconnected' | 'connecting' | 'pending'
  connectionStatus?: string
}

export interface DataSourceField {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
}

interface DataPreviewState {
  previewData: Map<string, PreviewData>
  dataSources: DataSourceInfo[]
  activeDataSourceId: string | null
  
  // 数据源操作
  addDataSource: (info: Omit<DataSourceInfo, 'id' | 'status'>) => void
  removeDataSource: (id: string) => void
  updateDataSource: (id: string, updates: Partial<DataSourceInfo>) => void
  setActiveDataSource: (id: string | null) => void
  
  // 预览操作
  fetchPreviewData: (componentId: string, dataSourceId: string, queryConfig: QueryConfig) => Promise<void>
  setPreviewData: (componentId: string, data: PreviewData) => void
  clearPreviewData: (componentId: string) => void
  refreshPreviewData: (componentId: string) => Promise<void>
  
  // 获取数据
  getPreviewData: (componentId: string) => PreviewData | undefined
  getFieldsByDataSource: (dataSourceId: string) => Promise<DataSourceField[]>
  getMockData: (dataSourceId: string, fieldName?: string) => any
  
  // 加载数据源
  loadDataSources: () => Promise<void>
}

export interface QueryConfig {
  type: 'table' | 'query' | 'endpoint'
  tableName?: string
  query?: string
  endpoint?: string
  method?: string
  params?: Record<string, any>
  pagination?: { page: number; pageSize: number }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const useDataPreviewStore = create<DataPreviewState>((set, get) => ({
  previewData: new Map(),
  dataSources: [],
  activeDataSourceId: null,

  addDataSource: async (info) => {
    try {
      const response = await fetch(`${API_BASE}/data-source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(info),
      })

      if (!response.ok) {
        throw new Error('创建数据源失败')
      }

      const newDataSource = await response.json()
      set((state) => ({
        dataSources: [...state.dataSources, newDataSource],
      }))
    } catch (error) {
      console.error('创建数据源失败:', error)
      throw error
    }
  },

  removeDataSource: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/data-source/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      })

      if (!response.ok) {
        throw new Error('删除数据源失败')
      }

      set((state) => ({
        dataSources: state.dataSources.filter((ds) => ds.id !== id),
        previewData: new Map([...state.previewData].filter(([_, data]) => data.dataSourceId !== id)),
      }))
    } catch (error) {
      console.error('删除数据源失败:', error)
      throw error
    }
  },

  updateDataSource: async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/data-source/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('更新数据源失败')
      }

      const updatedDataSource = await response.json()
      set((state) => ({
        dataSources: state.dataSources.map((ds) =>
          ds.id === id ? updatedDataSource : ds
        ),
      }))
    } catch (error) {
      console.error('更新数据源失败:', error)
      throw error
    }
  },

  setActiveDataSource: (id) => {
    set({ activeDataSourceId: id })
  },

  fetchPreviewData: async (componentId, dataSourceId, queryConfig) => {
    const bindingId = `${componentId}-${dataSourceId}`
    
    set((state) => {
      const currentPreview = state.previewData.get(componentId)
      state.previewData.set(componentId, {
        ...currentPreview,
        bindingId,
        componentId,
        dataSourceId,
        data: [],
        fields: [],
        total: 0,
        loading: true,
        error: undefined,
        lastUpdated: new Date(),
      })
      return { previewData: new Map(state.previewData) }
    })

    try {
      const response = await fetch(`${API_BASE}/data-source/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          dataSourceId: parseInt(dataSourceId),
          queryConfig,
        }),
      })

      if (!response.ok) {
        throw new Error('获取预览数据失败')
      }

      const result = await response.json()

      set((state) => {
        state.previewData.set(componentId, {
          bindingId,
          componentId,
          dataSourceId,
          data: result.rows || [],
          fields: (result.fields || []).map((f: any) => f.name),
          total: result.total || 0,
          loading: false,
          lastUpdated: new Date(),
        })
        return { previewData: new Map(state.previewData) }
      })
    } catch (error: any) {
      console.error('获取预览数据失败:', error)
      set((state) => {
        state.previewData.set(componentId, {
          bindingId,
          componentId,
          dataSourceId,
          data: [],
          fields: [],
          total: 0,
          loading: false,
          error: error.message || '获取数据失败',
          lastUpdated: new Date(),
        })
        return { previewData: new Map(state.previewData) }
      })
    }
  },

  setPreviewData: (componentId, data) => {
    set((state) => {
      state.previewData.set(componentId, { ...data, lastUpdated: new Date() })
      return { previewData: new Map(state.previewData) }
    })
  },

  clearPreviewData: (componentId) => {
    set((state) => {
      state.previewData.delete(componentId)
      return { previewData: new Map(state.previewData) }
    })
  },

  refreshPreviewData: async (componentId) => {
    const previewData = get().previewData.get(componentId)
    if (previewData) {
      await get().fetchPreviewData(
        componentId,
        previewData.dataSourceId,
        { pagination: { page: 1, pageSize: 10 } }
      )
    }
  },

  getPreviewData: (componentId) => {
    return get().previewData.get(componentId)
  },

  getFieldsByDataSource: async (dataSourceId) => {
    try {
      const response = await fetch(`${API_BASE}/data-source/${dataSourceId}/metadata`, {
        headers: getAuthHeader(),
      })

      if (!response.ok) {
        throw new Error('获取字段信息失败')
      }

      const result = await response.json()
      return result.fields || []
    } catch (error) {
      console.error('获取字段信息失败:', error)
      return []
    }
  },

  getMockData: (dataSourceId, fieldName) => {
    const previewData = get().previewData.get(dataSourceId)
    if (!previewData) return []
    
    if (fieldName) {
      return previewData.data.map((row) => row[fieldName])
    }
    return previewData.data
  },

  loadDataSources: async () => {
    try {
      const response = await fetch(`${API_BASE}/data-source`, {
        headers: getAuthHeader(),
      })

      if (!response.ok) {
        throw new Error('加载数据源失败')
      }

      const dataSources = await response.json()
      const mappedSources: DataSourceInfo[] = dataSources.map((ds: any) => ({
        id: ds.id,
        name: ds.name,
        type: ds.type,
        config: ds.config,
        status: ds.connectionStatus === 'connected' ? 'connected' : 'disconnected',
        connectionStatus: ds.connectionStatus,
      }))

      set({ dataSources: mappedSources })
    } catch (error) {
      console.error('加载数据源失败:', error)
    }
  },
}))

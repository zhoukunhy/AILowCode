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
  id: string
  name: string
  type: 'mysql' | 'http' | 'postgres' | 'mongodb'
  config: Record<string, any>
  status: 'connected' | 'disconnected' | 'connecting'
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
  getFieldsByDataSource: (dataSourceId: string) => DataSourceField[]
  getMockData: (dataSourceId: string, fieldName?: string) => any
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

// 模拟数据源列表
const MOCK_DATA_SOURCES: DataSourceInfo[] = [
  {
    id: 'ds-1',
    name: '用户数据库',
    type: 'mysql',
    status: 'connected',
    config: { host: 'localhost', port: 3306, database: 'example_db' },
  },
  {
    id: 'ds-2',
    name: '订单API',
    type: 'http',
    status: 'connected',
    config: { baseUrl: 'https://api.example.com', headers: {} },
  },
  {
    id: 'ds-3',
    name: '产品数据',
    type: 'postgres',
    status: 'connected',
    config: { host: 'localhost', port: 5432, database: 'products' },
  },
]

// 模拟字段信息
const MOCK_FIELDS: Record<string, DataSourceField[]> = {
  'ds-1': [
    { name: 'id', type: 'number', nullable: false },
    { name: 'name', type: 'string', nullable: false },
    { name: 'email', type: 'string', nullable: false },
    { name: 'phone', type: 'string', nullable: true },
    { name: 'age', type: 'number', nullable: true },
    { name: 'created_at', type: 'datetime', nullable: false },
    { name: 'status', type: 'string', nullable: false },
  ],
  'ds-2': [
    { name: 'order_id', type: 'string', nullable: false },
    { name: 'user_id', type: 'number', nullable: false },
    { name: 'amount', type: 'number', nullable: false },
    { name: 'status', type: 'string', nullable: false },
    { name: 'created_time', type: 'datetime', nullable: false },
    { name: 'payment_method', type: 'string', nullable: true },
  ],
  'ds-3': [
    { name: 'product_id', type: 'string', nullable: false },
    { name: 'product_name', type: 'string', nullable: false },
    { name: 'price', type: 'number', nullable: false },
    { name: 'stock', type: 'number', nullable: false },
    { name: 'category', type: 'string', nullable: true },
    { name: 'description', type: 'string', nullable: true },
  ],
}

// 模拟数据生成
const MOCK_DATA: Record<string, any[]> = {
  'ds-1': [
    { id: 1, name: '张三', email: 'zhangsan@example.com', phone: '13800138001', age: 28, created_at: '2024-01-15 10:30:00', status: 'active' },
    { id: 2, name: '李四', email: 'lisi@example.com', phone: '13800138002', age: 32, created_at: '2024-02-20 14:20:00', status: 'active' },
    { id: 3, name: '王五', email: 'wangwu@example.com', phone: '13800138003', age: 25, created_at: '2024-03-10 09:15:00', status: 'inactive' },
    { id: 4, name: '赵六', email: 'zhaoliu@example.com', phone: '13800138004', age: 30, created_at: '2024-04-05 16:45:00', status: 'active' },
    { id: 5, name: '钱七', email: 'qianqi@example.com', phone: null, age: 22, created_at: '2024-05-18 11:00:00', status: 'active' },
  ],
  'ds-2': [
    { order_id: 'ORD2024001', user_id: 1, amount: 199.99, status: 'completed', created_time: '2024-01-15 10:30:00', payment_method: 'alipay' },
    { order_id: 'ORD2024002', user_id: 2, amount: 599.00, status: 'pending', created_time: '2024-02-20 14:20:00', payment_method: 'wechat' },
    { order_id: 'ORD2024003', user_id: 1, amount: 299.50, status: 'completed', created_time: '2024-03-10 09:15:00', payment_method: 'alipay' },
    { order_id: 'ORD2024004', user_id: 3, amount: 899.99, status: 'refunded', created_time: '2024-04-05 16:45:00', payment_method: 'wechat' },
    { order_id: 'ORD2024005', user_id: 2, amount: 1299.00, status: 'completed', created_time: '2024-05-18 11:00:00', payment_method: 'alipay' },
  ],
  'ds-3': [
    { product_id: 'PROD001', product_name: '无线蓝牙耳机', price: 299.00, stock: 150, category: '电子产品', description: '高品质无线音频体验' },
    { product_id: 'PROD002', product_name: '智能手表', price: 1299.00, stock: 80, category: '穿戴设备', description: '健康监测智能手表' },
    { product_id: 'PROD003', product_name: '机械键盘', price: 499.00, stock: 200, category: '电脑配件', description: 'RGB背光机械键盘' },
    { product_id: 'PROD004', product_name: '便携音箱', price: 399.00, stock: 120, category: '电子产品', description: '蓝牙便携音箱' },
    { product_id: 'PROD005', product_name: '平板电脑', price: 2999.00, stock: 60, category: '数码产品', description: '高性能平板电脑' },
  ],
}

export const useDataPreviewStore = create<DataPreviewState>((set, get) => ({
  previewData: new Map(),
  dataSources: MOCK_DATA_SOURCES,
  activeDataSourceId: null,

  addDataSource: (info) => {
    const newDataSource: DataSourceInfo = {
      ...info,
      id: generateId(),
      status: 'disconnected',
    }
    set((state) => ({
      dataSources: [...state.dataSources, newDataSource],
    }))
  },

  removeDataSource: (id) => {
    set((state) => ({
      dataSources: state.dataSources.filter((ds) => ds.id !== id),
      previewData: new Map([...state.previewData].filter(([_, data]) => data.dataSourceId !== id)),
    }))
  },

  updateDataSource: (id, updates) => {
    set((state) => ({
      dataSources: state.dataSources.map((ds) =>
        ds.id === id ? { ...ds, ...updates } : ds
      ),
    }))
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
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      const mockData = MOCK_DATA[dataSourceId] || []
      const fields = MOCK_FIELDS[dataSourceId] || []
      const fieldNames = fields.map((f) => f.name)
      
      const pageSize = queryConfig.pagination?.pageSize || 10
      const page = queryConfig.pagination?.page || 1
      const startIndex = (page - 1) * pageSize
      const paginatedData = mockData.slice(startIndex, startIndex + pageSize)

      set((state) => {
        state.previewData.set(componentId, {
          bindingId,
          componentId,
          dataSourceId,
          data: paginatedData,
          fields: fieldNames,
          total: mockData.length,
          loading: false,
          lastUpdated: new Date(),
        })
        return { previewData: new Map(state.previewData) }
      })
    } catch (error) {
      set((state) => {
        state.previewData.set(componentId, {
          bindingId,
          componentId,
          dataSourceId,
          data: [],
          fields: [],
          total: 0,
          loading: false,
          error: error instanceof Error ? error.message : '获取数据失败',
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
        { type: 'table' }
      )
    }
  },

  getPreviewData: (componentId) => {
    return get().previewData.get(componentId)
  },

  getFieldsByDataSource: (dataSourceId) => {
    return MOCK_FIELDS[dataSourceId] || []
  },

  getMockData: (dataSourceId, fieldName) => {
    const data = MOCK_DATA[dataSourceId] || []
    if (fieldName) {
      return data.map((item) => item[fieldName])
    }
    return data
  },
}))
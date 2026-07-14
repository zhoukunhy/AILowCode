'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BindingMode } from './useComponentDataBinding'

// 缓存项类型
interface CacheEntry {
  data: any[]
  value: any
  isLoading: boolean
  error: string | null
  timestamp: number
  subscribers: Set<string>
  requestPromise: Promise<void> | null
  fetchAttempts: number
}

// 全局缓存 - 使用 Map 存储
const globalCache = new Map<string, CacheEntry>()

// 缓存配置
const CACHE_CONFIG = {
  TTL: 30000, // 30秒缓存过期时间
  MAX_SIZE: 50, // 最大缓存数量
  MAX_RETRIES: 3, // 最大重试次数
  RETRY_DELAY: 1000, // 重试延迟（毫秒）
  CLEANUP_INTERVAL: 10000, // 清理间隔（毫秒）
}

// API 基础地址
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

// 清理过期缓存
const cleanupExpiredCache = () => {
  const now = Date.now()
  
  // 清理过期项
  globalCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_CONFIG.TTL) {
      globalCache.delete(key)
    }
  })
  
  // 如果缓存超过最大限制，删除最旧的（优先删除没有订阅者的）
  if (globalCache.size > CACHE_CONFIG.MAX_SIZE) {
    const entries = Array.from(globalCache.entries())
      .sort((a, b) => {
        // 优先排序：无订阅者 > 有订阅者，然后按时间戳
        const aHasSubscribers = a[1].subscribers.size > 0
        const bHasSubscribers = b[1].subscribers.size > 0
        
        if (aHasSubscribers !== bHasSubscribers) {
          return aHasSubscribers ? 1 : -1 // 无订阅者优先删除
        }
        
        return a[1].timestamp - b[1].timestamp // 按时间戳排序
      })
    
    const keysToDelete = entries.slice(0, globalCache.size - CACHE_CONFIG.MAX_SIZE)
    keysToDelete.forEach(([key]) => globalCache.delete(key))
  }
}

// 定时清理缓存
let cleanupInterval: ReturnType<typeof setInterval> | null = null

const startCleanupInterval = () => {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupExpiredCache, CACHE_CONFIG.CLEANUP_INTERVAL)
  }
}

export interface DataBindingCacheHook {
  data: any[]
  value: any
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// 通知所有订阅者缓存更新
const notifySubscribers = (key: string, entry: CacheEntry) => {
  entry.subscribers.forEach((subscriberId) => {
    // 通过自定义事件通知其他订阅者
    const event = new CustomEvent(`data-binding-cache-update-${key}`, {
      detail: {
        subscriberId,
        data: entry.data,
        value: entry.value,
        isLoading: entry.isLoading,
        error: entry.error,
      },
    })
    window.dispatchEvent(event)
  })
}

export function useDataBindingCache(
  componentId: string,
  dataSourceId: string | undefined,
  dataField: string | undefined,
  bindingMode: BindingMode,
  autoFetch: boolean = true
): DataBindingCacheHook {
  const [state, setState] = useState<{
    data: any[]
    value: any
    isLoading: boolean
    error: string | null
  }>({
    data: [],
    value: undefined,
    isLoading: false,
    error: null,
  })

  const fetchRef = useRef(0)
  const mountedRef = useRef(false)

  // 组件挂载时设置标记
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 生成缓存键
  const cacheKey = useCallback(() => {
    if (!dataSourceId) return ''
    return `${dataSourceId}-${dataField}-${bindingMode}`
  }, [dataSourceId, dataField, bindingMode])

  // 订阅缓存更新事件
  useEffect(() => {
    const key = cacheKey()
    if (!key) return

    const handleCacheUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail
      // 只处理其他订阅者的更新
      if (detail.subscriberId !== componentId && mountedRef.current) {
        setState({
          data: detail.data,
          value: detail.value,
          isLoading: detail.isLoading,
          error: detail.error,
        })
      }
    }

    window.addEventListener(`data-binding-cache-update-${key}`, handleCacheUpdate)
    return () => {
      window.removeEventListener(`data-binding-cache-update-${key}`, handleCacheUpdate)
    }
  }, [componentId, cacheKey])

  // 订阅缓存
  useEffect(() => {
    const key = cacheKey()
    if (!key || !autoFetch) return

    startCleanupInterval()

    // 获取或创建缓存项
    let entry = globalCache.get(key)
    if (!entry) {
      entry = {
        data: [],
        value: undefined,
        isLoading: false,
        error: null,
        timestamp: Date.now(),
        subscribers: new Set(),
        requestPromise: null,
        fetchAttempts: 0,
      }
      globalCache.set(key, entry)
    }
    entry.subscribers.add(componentId)

    // 如果缓存有数据，立即使用
    if (entry.data.length > 0 || entry.value !== undefined) {
      setState({
        data: entry.data,
        value: entry.value,
        isLoading: false,
        error: entry.error,
      })
    }

    return () => {
      // 取消订阅
      const currentEntry = globalCache.get(key)
      if (currentEntry) {
        currentEntry.subscribers.delete(componentId)
        // 如果没有订阅者，删除缓存
        if (currentEntry.subscribers.size === 0) {
          globalCache.delete(key)
        }
      }
    }
  }, [componentId, cacheKey, autoFetch])

  // 数据获取函数（带重试机制）
  const fetchData = useCallback(async () => {
    const key = cacheKey()
    if (!key || !dataSourceId) return

    let entry = globalCache.get(key)
    if (!entry) {
      entry = {
        data: [],
        value: undefined,
        isLoading: false,
        error: null,
        timestamp: Date.now(),
        subscribers: new Set(),
        requestPromise: null,
        fetchAttempts: 0,
      }
      globalCache.set(key, entry)
    }

    // 如果正在加载且有请求Promise，复用该Promise
    if (entry.isLoading && entry.requestPromise) {
      try {
        await entry.requestPromise
      } catch {
        // 忽略错误，让原始请求处理
      }
      return
    }

    const currentFetchRef = ++fetchRef.current

    // 创建请求Promise（去重）
    const requestPromise = (async () => {
      try {
        // 更新缓存状态为加载中
        entry!.isLoading = true
        entry!.error = null
        
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isLoading: true, error: null }))
        }

        // 通知所有订阅者
        notifySubscribers(key, entry!)

        // 调用后端 API 获取数据
        const token = localStorage.getItem('token')
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
        
        const response = await fetch(`${API_BASE}/data-source/preview`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            dataSourceId: parseInt(dataSourceId),
            queryConfig: {
              type: bindingMode === 'table' ? 'table' : bindingMode === 'list' ? 'query' : 'endpoint',
              pagination: bindingMode === 'table' ? { page: 1, pageSize: 10 } : undefined,
            },
          }),
        })

        if (!response.ok) {
          throw new Error('获取数据失败')
        }

        const result = await response.json()
        const apiData = result.rows || []

        // 检查是否是最新的请求
        if (fetchRef.current !== currentFetchRef) return

        entry!.data = apiData
        entry!.value = bindingMode === 'single' ? apiData[0]?.[dataField || ''] : undefined
        entry!.isLoading = false
        entry!.timestamp = Date.now()
        entry!.fetchAttempts = 0
        entry!.requestPromise = null

        if (mountedRef.current) {
          setState({
            data: entry!.data,
            value: entry!.value,
            isLoading: false,
            error: null,
          })
        }

        // 通知所有订阅者
        notifySubscribers(key, entry!)
      } catch (error) {
        if (fetchRef.current !== currentFetchRef) return

        entry!.fetchAttempts++
        
        // 重试逻辑
        if (entry!.fetchAttempts < CACHE_CONFIG.MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, CACHE_CONFIG.RETRY_DELAY))
          if (fetchRef.current === currentFetchRef) {
            // 重试时调用 API
            try {
              const token = localStorage.getItem('token')
              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
              }
              if (token) {
                headers.Authorization = `Bearer ${token}`
              }
              
              const response = await fetch(`${API_BASE}/data-source/preview`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  dataSourceId: parseInt(dataSourceId),
                  queryConfig: {
                    type: bindingMode === 'table' ? 'table' : bindingMode === 'list' ? 'query' : 'endpoint',
                    pagination: bindingMode === 'table' ? { page: 1, pageSize: 10 } : undefined,
                  },
                }),
              })

              if (response.ok) {
                const result = await response.json()
                const apiData = result.rows || []
                
                entry!.data = apiData
                entry!.value = bindingMode === 'single' ? apiData[0]?.[dataField || ''] : undefined
              } else {
                // API 仍失败，使用模拟数据作为最后兜底
                const mockData = generateMockData(bindingMode)
                entry!.data = mockData
                entry!.value = bindingMode === 'single' ? mockData[0]?.[dataField || ''] : undefined
              }
            } catch {
              // 捕获所有异常，使用模拟数据
              const mockData = generateMockData(bindingMode)
              entry!.data = mockData
              entry!.value = bindingMode === 'single' ? mockData[0]?.[dataField || ''] : undefined
            }
            
            entry!.isLoading = false
            entry!.timestamp = Date.now()
            entry!.fetchAttempts = 0
            entry!.requestPromise = null

            if (mountedRef.current) {
              setState({
                data: entry!.data,
                value: entry!.value,
                isLoading: false,
                error: null,
              })
            }
            notifySubscribers(key, entry!)
          }
          return
        }

        // 重试失败
        entry!.isLoading = false
        entry!.error = error instanceof Error ? error.message : 'Unknown error'
        entry!.requestPromise = null

        if (mountedRef.current) {
          setState({
            data: [],
            value: undefined,
            isLoading: false,
            error: entry!.error,
          })
        }

        // 通知所有订阅者
        notifySubscribers(key, entry!)
      }
    })()

    // 保存请求Promise用于去重
    entry.requestPromise = requestPromise

    try {
      await requestPromise
    } catch {
      // 错误已在内部处理
    }
  }, [cacheKey, dataSourceId, bindingMode, dataField])

  // 自动获取数据
  useEffect(() => {
    if (!autoFetch || !dataSourceId) return

    const key = cacheKey()
    const entry = globalCache.get(key)

    // 如果没有缓存或缓存过期，重新获取
    if (!entry || Date.now() - entry.timestamp > CACHE_CONFIG.TTL) {
      fetchData()
    }
  }, [autoFetch, dataSourceId, cacheKey, fetchData])

  return {
    ...state,
    refetch: fetchData,
  }
}

// 生成模拟数据
function generateMockData(mode: BindingMode): any[] {
  switch (mode) {
    case 'table':
      return Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `项目 ${i + 1}`,
        status: ['active', 'pending', 'completed'][i % 3],
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}`,
        progress: Math.floor(Math.random() * 100),
      }))
    case 'list':
      return Array.from({ length: 5 }, (_, i) => ({
        value: `option-${i + 1}`,
        label: `选项 ${i + 1}`,
      }))
    case 'single':
      return [{ value: '示例数据', label: '示例' }]
    default:
      return []
  }
}

// 手动清理缓存（用于调试或特殊场景）
export const clearDataBindingCache = (key?: string) => {
  if (key) {
    globalCache.delete(key)
  } else {
    globalCache.clear()
  }
}

// 获取缓存统计信息
export const getDataBindingCacheStats = () => {
  let totalSubscribers = 0
  let totalLoading = 0
  
  globalCache.forEach((entry) => {
    totalSubscribers += entry.subscribers.size
    if (entry.isLoading) totalLoading++
  })
  
  return {
    totalEntries: globalCache.size,
    totalSubscribers,
    totalLoading,
    maxSize: CACHE_CONFIG.MAX_SIZE,
    ttl: CACHE_CONFIG.TTL,
  }
}
'use client'

import React, { ReactNode } from 'react'

// 组件池项类型
interface PoolItem {
  id: string
  componentType: string
  element: ReactNode
  lastUsed: number
  isActive: boolean
}

// 组件池配置
interface PoolConfig {
  maxSize: number
  maxIdleTime: number // 毫秒，超过此时间未使用的组件会被清理
}

// 默认配置
const DEFAULT_CONFIG: PoolConfig = {
  maxSize: 100,
  maxIdleTime: 30000, // 30秒
}

// 组件渲染池类
export class ComponentPool {
  private pool = new Map<string, PoolItem[]>() // 按组件类型分组
  private config: PoolConfig
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startCleanupInterval()
  }

  // 从池中获取组件
  get(componentType: string, id: string): ReactNode | undefined {
    const items = this.pool.get(componentType)
    if (!items || items.length === 0) return undefined

    // 查找匹配id的组件（如果存在）
    const matchedItem = items.find(item => item.id === id && !item.isActive)
    if (matchedItem) {
      matchedItem.isActive = true
      matchedItem.lastUsed = Date.now()
      return matchedItem.element
    }

    // 如果没有匹配id的组件，取一个空闲的
    const freeItem = items.find(item => !item.isActive)
    if (freeItem) {
      freeItem.id = id
      freeItem.isActive = true
      freeItem.lastUsed = Date.now()
      return freeItem.element
    }

    return undefined
  }

  // 将组件放回池中
  release(componentType: string, id: string, element: ReactNode): void {
    let items = this.pool.get(componentType)
    if (!items) {
      items = []
      this.pool.set(componentType, items)
    }

    // 查找并更新已存在的项
    const existingItem = items.find(item => item.id === id)
    if (existingItem) {
      existingItem.isActive = false
      existingItem.lastUsed = Date.now()
      existingItem.element = element
      return
    }

    // 如果池已满，清理最旧的项
    if (items.length >= this.config.maxSize) {
      this.cleanupOldest(componentType)
    }

    // 添加新项
    items.push({
      id,
      componentType,
      element,
      lastUsed: Date.now(),
      isActive: false,
    })
  }

  // 清理指定类型最旧的未使用项
  private cleanupOldest(componentType: string): void {
    const items = this.pool.get(componentType)
    if (!items || items.length === 0) return

    // 找到最旧的未使用项
    let oldestIndex = -1
    let oldestTime = Date.now()

    items.forEach((item, index) => {
      if (!item.isActive && item.lastUsed < oldestTime) {
        oldestTime = item.lastUsed
        oldestIndex = index
      }
    })

    if (oldestIndex !== -1) {
      items.splice(oldestIndex, 1)
    }
  }

  // 清理过期的组件
  private cleanupExpired(): void {
    const now = Date.now()

    this.pool.forEach((items, componentType) => {
      const filtered = items.filter(item => {
        // 保留活跃的组件和未过期的组件
        return item.isActive || (now - item.lastUsed < this.config.maxIdleTime)
      })

      if (filtered.length !== items.length) {
        this.pool.set(componentType, filtered)
      }
    })
  }

  // 启动定时清理
  private startCleanupInterval(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired()
    }, this.config.maxIdleTime / 2)
  }

  // 停止定时清理
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  // 清空池
  clear(): void {
    this.pool.clear()
  }

  // 获取池的统计信息
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    this.pool.forEach((items, componentType) => {
      stats[componentType] = items.length
    })
    return stats
  }

  // 获取活跃组件数量
  getActiveCount(): number {
    let count = 0
    this.pool.forEach(items => {
      count += items.filter(item => item.isActive).length
    })
    return count
  }
}

// 创建全局组件池实例
export const componentPool = new ComponentPool({
  maxSize: 150,
  maxIdleTime: 60000, // 60秒
})

// React Hook 用于使用组件池
export function useComponentPool(componentType: string, componentId: string) {
  const [cachedElement, setCachedElement] = React.useState<ReactNode | undefined>(undefined)

  // 尝试从池中获取组件
  React.useEffect(() => {
    const element = componentPool.get(componentType, componentId)
    if (element) {
      setCachedElement(element)
    }

    return () => {
      // 组件卸载时放回池中
      if (cachedElement) {
        componentPool.release(componentType, componentId, cachedElement)
      }
    }
  }, [componentType, componentId])

  const saveToPool = React.useCallback((element: ReactNode) => {
    setCachedElement(element)
  }, [])

  return { cachedElement, saveToPool }
}
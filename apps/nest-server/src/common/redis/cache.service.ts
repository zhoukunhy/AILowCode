/**
 * Redis 缓存服务
 * 提供缓存穿透处理、热点页面缓存、分布式锁功能
 */
import { Injectable, Logger } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  
  // 布隆过滤器模拟（用于缓存穿透处理）
  private bloomFilters = new Map<string, Set<string>>()
  
  // 热点数据缓存键前缀
  private readonly HOT_KEY_PREFIX = 'hot:'
  private readonly PAGE_PREFIX = 'page:'
  private readonly DATA_SOURCE_PREFIX = 'ds:'
  private readonly LOCK_PREFIX = 'lock:'

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key)
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error)
      return undefined
    }
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl)
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error)
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key)
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error)
    }
  }

  /**
   * 清除所有缓存
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset()
    } catch (error) {
      this.logger.error('清除缓存失败', error)
    }
  }

  // ==================== 缓存穿透处理 ====================

  /**
   * 初始化布隆过滤器
   */
  initBloomFilter(filterName: string): void {
    if (!this.bloomFilters.has(filterName)) {
      this.bloomFilters.set(filterName, new Set())
    }
  }

  /**
   * 检查布隆过滤器
   */
  checkBloomFilter(filterName: string, key: string): boolean {
    const filter = this.bloomFilters.get(filterName)
    return filter ? filter.has(key) : false
  }

  /**
   * 添加到布隆过滤器
   */
  addToBloomFilter(filterName: string, key: string): void {
    const filter = this.bloomFilters.get(filterName)
    if (filter) {
      filter.add(key)
    }
  }

  /**
   * 缓存穿透保护查询
   */
  async getWithPenetrationProtection<T>(
    filterName: string,
    cacheKey: string,
    fallback: () => Promise<T | null>,
    ttl?: number
  ): Promise<T | null> {
    // 先检查布隆过滤器
    if (!this.checkBloomFilter(filterName, cacheKey)) {
      return null
    }

    // 尝试从缓存获取
    const cached = await this.get<T>(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // 从数据源获取
    const result = await fallback()
    
    if (result !== null) {
      // 更新缓存
      await this.set(cacheKey, result, ttl)
      // 添加到布隆过滤器
      this.addToBloomFilter(filterName, cacheKey)
    }

    return result
  }

  // ==================== 热点页面缓存 ====================

  /**
   * 缓存页面数据
   */
  async cachePage(pageId: string, data: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    const key = `${this.PAGE_PREFIX}${pageId}`
    await this.set(key, data, ttl)
    this.logger.debug(`页面缓存已更新: ${pageId}`)
  }

  /**
   * 获取缓存的页面数据
   */
  async getCachedPage(pageId: string): Promise<any | undefined> {
    const key = `${this.PAGE_PREFIX}${pageId}`
    return this.get(key)
  }

  /**
   * 删除页面缓存
   */
  async invalidatePage(pageId: string): Promise<void> {
    const key = `${this.PAGE_PREFIX}${pageId}`
    await this.del(key)
    this.logger.debug(`页面缓存已失效: ${pageId}`)
  }

  /**
   * 缓存热点数据
   */
  async cacheHotData(key: string, data: any, ttl: number = 10 * 60 * 1000): Promise<void> {
    const cacheKey = `${this.HOT_KEY_PREFIX}${key}`
    await this.set(cacheKey, data, ttl)
    this.logger.debug(`热点数据缓存已更新: ${key}`)
  }

  /**
   * 获取热点数据
   */
  async getHotData(key: string): Promise<any | undefined> {
    const cacheKey = `${this.HOT_KEY_PREFIX}${key}`
    return this.get(cacheKey)
  }

  // ==================== 分布式锁 ====================

  /**
   * 获取分布式锁
   * @param key 锁的名称
   * @param ttl 锁的过期时间（毫秒）
   * @returns 是否获取成功
   */
  async acquireLock(key: string, ttl: number = 30000): Promise<boolean> {
    const lockKey = `${this.LOCK_PREFIX}${key}`
    const now = Date.now()
    const lockValue = `${now}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // 使用 SET NX 实现分布式锁
      const result = await (this.cacheManager.store as any).set(lockKey, lockValue, {
        ttl: Math.ceil(ttl / 1000),
        nx: true,
      })
      
      return result === 'OK' || result === true
    } catch (error) {
      this.logger.error(`获取锁失败: ${key}`, error)
      return false
    }
  }

  /**
   * 释放分布式锁
   */
  async releaseLock(key: string): Promise<void> {
    const lockKey = `${this.LOCK_PREFIX}${key}`
    await this.del(lockKey)
    this.logger.debug(`锁已释放: ${key}`)
  }

  /**
   * 带锁执行操作
   */
  async executeWithLock<T>(
    lockKey: string,
    operation: () => Promise<T>,
    ttl: number = 30000
  ): Promise<T | null> {
    const acquired = await this.acquireLock(lockKey, ttl)
    
    if (!acquired) {
      this.logger.warn(`获取锁失败，操作被拒绝: ${lockKey}`)
      return null
    }

    try {
      return await operation()
    } finally {
      await this.releaseLock(lockKey)
    }
  }

  // ==================== 数据源缓存 ====================

  /**
   * 缓存数据源配置
   */
  async cacheDataSource(dsId: string, config: any): Promise<void> {
    const key = `${this.DATA_SOURCE_PREFIX}${dsId}`
    await this.set(key, config, 10 * 60 * 1000) // 10分钟
  }

  /**
   * 获取缓存的数据源配置
   */
  async getCachedDataSource(dsId: string): Promise<any | undefined> {
    const key = `${this.DATA_SOURCE_PREFIX}${dsId}`
    return this.get(key)
  }

  /**
   * 失效数据源缓存
   */
  async invalidateDataSource(dsId: string): Promise<void> {
    const key = `${this.DATA_SOURCE_PREFIX}${dsId}`
    await this.del(key)
  }

  // ==================== 缓存统计 ====================

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<any> {
    try {
      const store = this.cacheManager.store as any
      const stats = store.getStats ? await store.getStats() : {}
      return {
        bloomFilters: this.bloomFilters.size,
        ...stats,
      }
    } catch (error) {
      this.logger.error('获取缓存统计失败', error)
      return null
    }
  }
}

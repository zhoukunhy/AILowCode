/**
 * 缓存服务单元测试
 */
import { Test, TestingModule } from '@nestjs/testing'
import { CacheService } from '../redis/cache.service'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

describe('CacheService', () => {
  let service: CacheService
  let mockCacheManager: any

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      store: {
        set: jest.fn().mockResolvedValue('OK'),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile()

    service = module.get<CacheService>(CacheService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('基本缓存操作', () => {
    it('should get and set cache', async () => {
      const key = 'test-key'
      const value = { data: 'test' }

      mockCacheManager.get.mockResolvedValue(value)
      mockCacheManager.set.mockResolvedValue(undefined)

      await service.set(key, value)
      const result = await service.get(key)

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, undefined)
      expect(mockCacheManager.get).toHaveBeenCalledWith(key)
      expect(result).toEqual(value)
    })

    it('should delete cache', async () => {
      const key = 'test-key'

      await service.del(key)

      expect(mockCacheManager.del).toHaveBeenCalledWith(key)
    })
  })

  describe('布隆过滤器', () => {
    it('should initialize bloom filter', () => {
      service.initBloomFilter('test-filter')
      
      // 检查过滤器是否初始化
      expect(service['bloomFilters'].has('test-filter')).toBe(true)
    })

    it('should check and add to bloom filter', () => {
      service.initBloomFilter('test-filter')
      
      const key = 'test-key'
      
      // 初始时不在过滤器中
      expect(service.checkBloomFilter('test-filter', key)).toBe(false)
      
      // 添加到过滤器
      service.addToBloomFilter('test-filter', key)
      
      // 现在应该在过滤器中
      expect(service.checkBloomFilter('test-filter', key)).toBe(true)
    })
  })

  describe('缓存穿透保护', () => {
    it('should return null when key not in bloom filter', async () => {
      service.initBloomFilter('test-filter')
      
      const fallback = jest.fn().mockResolvedValue('fallback-value')
      
      const result = await service.getWithPenetrationProtection(
        'test-filter',
        'non-existent-key',
        fallback
      )
      
      expect(result).toBe(null)
      expect(fallback).not.toHaveBeenCalled()
    })

    it('should call fallback when key in bloom filter but not in cache', async () => {
      service.initBloomFilter('test-filter')
      service.addToBloomFilter('test-filter', 'existing-key')
      
      mockCacheManager.get.mockResolvedValue(undefined)
      const fallback = jest.fn().mockResolvedValue('fallback-value')
      
      const result = await service.getWithPenetrationProtection(
        'test-filter',
        'existing-key',
        fallback,
        1000
      )
      
      expect(fallback).toHaveBeenCalled()
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'existing-key',
        'fallback-value',
        1000
      )
      expect(result).toBe('fallback-value')
    })
  })

  describe('分布式锁', () => {
    it('should acquire and release lock', async () => {
      mockCacheManager.store.set.mockResolvedValue('OK')
      
      const lockKey = 'test-lock'
      const acquired = await service.acquireLock(lockKey, 30000)
      
      expect(acquired).toBe(true)
      expect(mockCacheManager.store.set).toHaveBeenCalled()
      
      await service.releaseLock(lockKey)
      expect(mockCacheManager.del).toHaveBeenCalledWith(`lock:${lockKey}`)
    })

    it('should execute operation with lock', async () => {
      mockCacheManager.store.set.mockResolvedValue('OK')
      
      const operation = jest.fn().mockResolvedValue('operation-result')
      
      const result = await service.executeWithLock('test-lock', operation)
      
      expect(result).toBe('operation-result')
      expect(operation).toHaveBeenCalled()
      expect(mockCacheManager.del).toHaveBeenCalled()
    })

    it('should return null when lock cannot be acquired', async () => {
      mockCacheManager.store.set.mockResolvedValue(null)
      
      const operation = jest.fn().mockResolvedValue('operation-result')
      
      const result = await service.executeWithLock('test-lock', operation)
      
      expect(result).toBe(null)
      expect(operation).not.toHaveBeenCalled()
    })
  })
})

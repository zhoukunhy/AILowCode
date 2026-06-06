/**
 * 数据源核心模块单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { MySQLDataSource, createMySQLDataSource } from './MySQLDataSource'
import { HttpDataSource, createHttpDataSource } from './HttpDataSource'
import { DataSourceManager, createDataSourceManager } from './DataSourceManager'
import { DatabaseConfig, HttpConfig } from './types'

describe('MySQLDataSource', () => {
  let dataSource: MySQLDataSource

  const config: DatabaseConfig = {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'test',
    password: 'test',
    database: 'test_db',
  }

  beforeEach(() => {
    dataSource = createMySQLDataSource(config)
  })

  it('should be defined', () => {
    expect(dataSource).toBeDefined()
  })

  it('should connect successfully', async () => {
    await expect(dataSource.connect()).resolves.not.toThrow()
  })

  it('should be connected after connect', async () => {
    await dataSource.connect()
    expect(dataSource.isConnected()).toBe(true)
  })

  it('should disconnect successfully', async () => {
    await dataSource.connect()
    await dataSource.disconnect()
    // 由于是模拟实现，这里检查内部状态
    expect(dataSource['connection']).toBeNull()
  })

  it('should get tables', async () => {
    await dataSource.connect()
    const tables = await dataSource.getTables()
    expect(Array.isArray(tables)).toBe(true)
  })

  it('should preview table data', async () => {
    await dataSource.connect()
    const result = await dataSource.previewTable('users', 10)
    expect(result.rows).toBeDefined()
    expect(result.rowCount).toBeDefined()
  })
})

describe('HttpDataSource', () => {
  let dataSource: HttpDataSource

  const config: HttpConfig = {
    type: 'http',
    baseUrl: 'https://api.example.com',
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  }

  beforeEach(() => {
    dataSource = createHttpDataSource(config)
  })

  it('should be defined', () => {
    expect(dataSource).toBeDefined()
  })

  it('should validate connection', async () => {
    const result = await dataSource.validateConnection()
    expect(result.success).toBeDefined()
  })

  it('should get endpoints', async () => {
    const endpoints = await dataSource.getEndpoints()
    expect(Array.isArray(endpoints)).toBe(true)
    expect(endpoints.length).toBeGreaterThan(0)
  })

  it('should preview data', async () => {
    const result = await dataSource.previewData('/users', 'GET')
    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('should fetch data with pagination', async () => {
    const result = await dataSource.fetchData(
      '/users',
      'GET',
      undefined,
      { page: 1, pageSize: 10 }
    )
    expect(result.rows).toBeDefined()
    expect(result.rowCount).toBeDefined()
  })
})

describe('DataSourceManager', () => {
  let manager: DataSourceManager

  const mysqlConfig: DatabaseConfig = {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'test',
    password: 'test',
    database: 'test_db',
  }

  const httpConfig: HttpConfig = {
    type: 'http',
    baseUrl: 'https://api.example.com',
  }

  beforeEach(() => {
    manager = createDataSourceManager()
  })

  afterEach(async () => {
    // 清理所有数据源
    const sources = manager.listDataSources()
    for (const source of sources) {
      await manager.removeDataSource(source.id)
    }
  })

  it('should be defined', () => {
    expect(manager).toBeDefined()
  })

  it('should register MySQL data source', async () => {
    const success = await manager.registerDataSource('mysql-test', 'mysql', mysqlConfig)
    expect(success).toBe(true)
    
    const dataSource = manager.getDataSource('mysql-test')
    expect(dataSource).toBeDefined()
  })

  it('should register HTTP data source', async () => {
    const success = await manager.registerDataSource('http-test', 'http', httpConfig)
    expect(success).toBe(true)
    
    const dataSource = manager.getDataSource('http-test')
    expect(dataSource).toBeDefined()
  })

  it('should list all data sources', async () => {
    await manager.registerDataSource('mysql-test', 'mysql', mysqlConfig)
    await manager.registerDataSource('http-test', 'http', httpConfig)
    
    const sources = manager.listDataSources()
    expect(sources.length).toBe(2)
  })

  it('should create and get bindings', () => {
    const binding = {
      id: 'binding-1',
      dataSourceId: 'test-ds',
      componentId: 'comp-1',
      fieldMapping: { name: 'name' },
      queryConfig: { type: 'table', tableName: 'users' },
    }
    
    manager.createBinding(binding)
    
    const bindings = manager.getComponentBindings('comp-1')
    expect(bindings.length).toBe(1)
    expect(bindings[0].id).toBe('binding-1')
  })

  it('should validate data source', async () => {
    const result = await manager.validateDataSource('mysql', mysqlConfig)
    expect(result.success).toBe(true)
  })

  it('should remove data source', async () => {
    await manager.registerDataSource('test-ds', 'mysql', mysqlConfig)
    
    const before = manager.listDataSources().length
    await manager.removeDataSource('test-ds')
    const after = manager.listDataSources().length
    
    expect(after).toBe(before - 1)
  })
})

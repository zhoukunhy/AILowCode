/**
 * 数据源管理器
 * 统一管理多种数据源，提供绑定和预览功能
 */
import { DataSourceType, DatabaseConfig, HttpConfig, DataSourceBinding, PreviewResult, QueryConfig } from './types'
import { MySQLDataSource } from './MySQLDataSource'
import { HttpDataSource } from './HttpDataSource'

export class DataSourceManager {
  private dataSources: Map<string, DataSourceInstance> = new Map()
  private bindings: Map<string, DataSourceBinding> = new Map()

  /**
   * 注册数据源
   */
  async registerDataSource(
    id: string,
    type: DataSourceType,
    config: DatabaseConfig | HttpConfig
  ): Promise<boolean> {
    try {
      let instance: DataSourceInstance

      switch (type) {
        case 'mysql':
          instance = {
            type: 'mysql',
            config: config as DatabaseConfig,
            connector: new MySQLDataSource(config as DatabaseConfig),
          }
          await instance.connector.connect()
          break
        
        case 'http':
        case 'rest':
          instance = {
            type: 'http',
            config: config as HttpConfig,
            connector: new HttpDataSource(config as HttpConfig),
          }
          break
        
        default:
          throw new Error(`不支持的数据源类型: ${type}`)
      }

      this.dataSources.set(id, instance)
      console.log(`数据源注册成功: ${id}`)
      return true
    } catch (error: any) {
      console.error(`数据源注册失败: ${id}`, error)
      throw error
    }
  }

  /**
   * 获取数据源
   */
  getDataSource(id: string): DataSourceInstance | undefined {
    return this.dataSources.get(id)
  }

  /**
   * 移除数据源
   */
  async removeDataSource(id: string): Promise<void> {
    const instance = this.dataSources.get(id)
    if (instance) {
      if (instance.type === 'mysql') {
        await instance.connector.disconnect()
      }
      this.dataSources.delete(id)
      console.log(`数据源已移除: ${id}`)
    }
  }

  /**
   * 获取所有数据源列表
   */
  listDataSources(): Array<{ id: string; type: DataSourceType; config: any }> {
    const result: Array<{ id: string; type: DataSourceType; config: any }> = []
    
    for (const [id, instance] of this.dataSources) {
      result.push({
        id,
        type: instance.type,
        config: instance.config,
      })
    }
    
    return result
  }

  /**
   * 创建数据源绑定
   */
  createBinding(binding: DataSourceBinding): void {
    this.bindings.set(binding.id, binding)
    console.log(`创建数据源绑定: ${binding.id}`)
  }

  /**
   * 获取组件的绑定
   */
  getComponentBindings(componentId: string): DataSourceBinding[] {
    return Array.from(this.bindings.values())
      .filter(b => b.componentId === componentId)
  }

  /**
   * 移除绑定
   */
  removeBinding(bindingId: string): void {
    this.bindings.delete(bindingId)
    console.log(`移除数据源绑定: ${bindingId}`)
  }

  /**
   * 预览数据
   */
  async previewData(bindingId: string): Promise<PreviewResult> {
    const binding = this.bindings.get(bindingId)
    if (!binding) {
      throw new Error(`绑定不存在: ${bindingId}`)
    }

    const instance = this.dataSources.get(binding.dataSourceId)
    if (!instance) {
      throw new Error(`数据源不存在: ${binding.dataSourceId}`)
    }

    const startTime = Date.now()

    try {
      const result = await this.executeQuery(instance, binding.queryConfig)
      
      const executionTime = Date.now() - startTime
      
      return {
        success: true,
        data: result.rows,
        total: result.rowCount,
        fields: result.fields,
        executionTime,
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime
      
      return {
        success: false,
        data: [],
        total: 0,
        error: error.message,
        executionTime,
      }
    }
  }

  /**
   * 执行查询
   */
  async executeQuery(instance: DataSourceInstance, queryConfig: QueryConfig): Promise<any> {
    if (instance.type === 'mysql') {
      const connector = instance.connector as MySQLDataSource
      
      if (queryConfig.type === 'table') {
        return connector.previewTable(queryConfig.tableName!, queryConfig.pagination?.pageSize || 10)
      } else if (queryConfig.type === 'query') {
        return connector.query(queryConfig.query!)
      }
    } else if (instance.type === 'http') {
      const connector = instance.connector as HttpDataSource
      
      return connector.fetchData(
        queryConfig.endpoint!,
        queryConfig.method || 'GET',
        queryConfig.params,
        queryConfig.pagination
      )
    }

    throw new Error('不支持的查询类型')
  }

  /**
   * 获取表元数据
   */
  async getTableMetadata(dataSourceId: string, tableName?: string): Promise<any> {
    const instance = this.dataSources.get(dataSourceId)
    if (!instance) {
      throw new Error(`数据源不存在: ${dataSourceId}`)
    }

    if (instance.type === 'mysql') {
      const connector = instance.connector as MySQLDataSource
      
      if (tableName) {
        return connector.getTableMetadata(tableName)
      } else {
        return connector.getAllTableMetadata()
      }
    } else if (instance.type === 'http') {
      const connector = instance.connector as HttpDataSource
      return connector.getEndpoints()
    }

    throw new Error('不支持的数据源类型')
  }

  /**
   * 验证数据源配置
   */
  async validateDataSource(type: DataSourceType, config: DatabaseConfig | HttpConfig): Promise<{ success: boolean; error?: string }> {
    try {
      switch (type) {
        case 'mysql':
          const mysql = new MySQLDataSource(config as DatabaseConfig)
          await mysql.connect()
          await mysql.disconnect()
          return { success: true }
        
        case 'http':
          const http = new HttpDataSource(config as HttpConfig)
          const result = await http.validateConnection()
          return result
        
        default:
          return { success: true }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

/**
 * 数据源实例
 */
interface DataSourceInstance {
  type: DataSourceType
  config: DatabaseConfig | HttpConfig
  connector: any
}

/**
 * 创建数据源管理器
 */
export function createDataSourceManager(): DataSourceManager {
  return new DataSourceManager()
}

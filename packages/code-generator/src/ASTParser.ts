/**
 * AST 解析器
 * 遍历画布组件 JSON，提取数据源绑定关系和组件结构
 */
import type { PageSchema, ComponentSchema } from '@ai-lowcode/lang-ai-core'
import { DataSourceBinding, TableDefinition, ColumnDefinition } from './types'

/**
 * 解析画布 Schema，提取数据源和组件信息
 */
export class ASTParser {
  private schema: PageSchema
  private dataSources: Map<string, DataSourceBinding> = new Map()
  private tables: Map<string, TableDefinition> = new Map()

  constructor(schema: PageSchema) {
    this.schema = schema
  }

  /**
   * 解析整个 Schema
   */
  parse(): {
    dataSources: DataSourceBinding[]
    tables: TableDefinition[]
    components: ComponentAnalysis[]
  } {
    this.dataSources.clear()
    this.tables.clear()

    const components = this.traverseComponents(this.schema.children || [])

    return {
      dataSources: Array.from(this.dataSources.values()),
      tables: Array.from(this.tables.values()),
      components,
    }
  }

  /**
   * 遍历组件树
   */
  private traverseComponents(components: ComponentSchema[]): ComponentAnalysis[] {
    const results: ComponentAnalysis[] = []

    for (const component of components) {
      const analysis = this.analyzeComponent(component)
      results.push(analysis)

      // 递归处理子组件
      if (component.children && component.children.length > 0) {
        const childResults = this.traverseComponents(component.children)
        results.push(...childResults)
      }
    }

    return results
  }

  /**
   * 分析单个组件
   */
  private analyzeComponent(component: ComponentSchema): ComponentAnalysis {
    const analysis: ComponentAnalysis = {
      id: component.id,
      type: component.type,
      props: component.props || {},
      dataBindings: [],
      tableName: null,
    }

    // 检查数据源绑定
    if (component.props?.dataSource) {
      const binding = this.extractDataSourceBinding(component)
      if (binding) {
        analysis.dataBindings.push(binding)
        this.dataSources.set(component.id, binding)

        // 如果绑定到数据库，提取表结构
        if (binding.sourceType === 'database' && binding.modelName) {
          const table = this.extractTableDefinition(component, binding)
          if (table) {
            this.tables.set(table.name, table)
            analysis.tableName = table.name
          }
        }
      }
    }

    return analysis
  }

  /**
   * 提取数据源绑定
   */
  private extractDataSourceBinding(component: ComponentSchema): DataSourceBinding | null {
    const dataSource = component.props?.dataSource
    
    if (!dataSource) return null

    if (typeof dataSource === 'string') {
      // 简单字符串格式: "api:/users" 或 "database:User"
      const parts = dataSource.split(':')
      if (parts.length === 2) {
        const [sourceType, value] = parts
        if (sourceType === 'api') {
          return {
            sourceType: 'api',
            endpoint: value,
            method: 'GET',
          }
        } else if (sourceType === 'database') {
          return {
            sourceType: 'database',
            modelName: value,
          }
        }
      }
    } else if (typeof dataSource === 'object') {
      // 对象格式
      return {
        sourceType: dataSource.sourceType || 'api',
        endpoint: dataSource.endpoint,
        method: dataSource.method || 'GET',
        modelName: dataSource.modelName,
        fieldMapping: dataSource.fieldMapping,
      }
    }

    return null
  }

  /**
   * 从组件提取表定义
   */
  private extractTableDefinition(
    component: ComponentSchema,
    binding: DataSourceBinding
  ): TableDefinition | null {
    if (!binding.modelName) return null

    const fields = component.props?.fields || []
    
    const columns: ColumnDefinition[] = [
      {
        name: 'id',
        type: 'SERIAL',
        nullable: false,
        primary: true,
        autoIncrement: true,
      },
    ]

    for (const field of fields) {
      const colType = this.mapFieldType(field.type)
      columns.push({
        name: field.name,
        type: colType,
        nullable: field.required !== false,
        default: field.defaultValue,
        primary: false,
      })
    }

    return {
      name: binding.modelName.toLowerCase() + 's',
      columns,
      constraints: [{ type: 'primary', columnNames: ['id'] }],
    }
  }

  /**
   * 映射字段类型到 SQL 类型
   */
  private mapFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'number': 'INTEGER',
      'float': 'FLOAT',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'email': 'VARCHAR(255)',
      'password': 'VARCHAR(255)',
      'select': 'VARCHAR(100)',
      'textarea': 'TEXT',
    }
    return typeMap[type] || 'VARCHAR(255)'
  }

  /**
   * 获取所有数据源
   */
  getDataSources(): DataSourceBinding[] {
    return Array.from(this.dataSources.values())
  }

  /**
   * 获取所有表定义
   */
  getTables(): TableDefinition[] {
    return Array.from(this.tables.values())
  }
}

/**
 * 组件分析结果
 */
export interface ComponentAnalysis {
  id: string
  type: string
  props: Record<string, any>
  dataBindings: DataSourceBinding[]
  tableName: string | null
}

/**
 * 创建 AST 解析器
 */
export function createASTParser(schema: PageSchema): ASTParser {
  return new ASTParser(schema)
}

/**
 * 画布操作工具集
 * 提供画布组件管理、数据源绑定和样式设置功能
 */

import { z } from 'zod'

// ==================== 工具输入/输出 Schema ====================

/**
 * 添加组件工具 Schema
 */
export const AddComponentInputSchema = z.object({
  canvasId: z.string().describe('画布ID'),
  componentType: z.string().describe('组件类型（如 Button, Input, Table, Card）'),
  x: z.number().describe('X 坐标'),
  y: z.number().describe('Y 坐标'),
  width: z.number().optional().describe('宽度'),
  height: z.number().optional().describe('高度'),
  props: z.record(z.any()).optional().describe('组件属性'),
})

export type AddComponentInput = z.infer<typeof AddComponentInputSchema>

export interface AddComponentOutput {
  success: boolean
  componentId: string
  message: string
}

/**
 * 绑定数据源工具 Schema
 */
export const BindDataSourceInputSchema = z.object({
  canvasId: z.string().describe('画布ID'),
  componentId: z.string().describe('组件ID'),
  dataSourceId: z.string().describe('数据源ID'),
  fieldMapping: z.record(z.string()).describe('字段映射（组件属性 -> 数据源字段）'),
  queryConfig: z.object({
    type: z.enum(['table', 'query', 'endpoint']).describe('查询类型'),
    tableName: z.string().optional().describe('表名'),
    query: z.string().optional().describe('SQL 查询语句'),
    endpoint: z.string().optional().describe('API 端点'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional().describe('HTTP 方法'),
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
    }).optional().describe('分页配置'),
  }).describe('查询配置'),
})

export type BindDataSourceInput = z.infer<typeof BindDataSourceInputSchema>

export interface BindDataSourceOutput {
  success: boolean
  bindingId: string
  message: string
}

/**
 * 设置样式工具 Schema
 */
export const SetStyleInputSchema = z.object({
  canvasId: z.string().describe('画布ID'),
  componentId: z.string().describe('组件ID'),
  style: z.object({
    width: z.string().optional().describe('宽度'),
    height: z.string().optional().describe('高度'),
    backgroundColor: z.string().optional().describe('背景颜色'),
    color: z.string().optional().describe('文字颜色'),
    fontSize: z.string().optional().describe('字体大小'),
    fontWeight: z.string().optional().describe('字体粗细'),
    padding: z.string().optional().describe('内边距'),
    margin: z.string().optional().describe('外边距'),
    borderRadius: z.string().optional().describe('圆角'),
    border: z.string().optional().describe('边框'),
    flex: z.string().optional().describe('Flex 布局'),
    grid: z.string().optional().describe('Grid 布局'),
    display: z.string().optional().describe('显示方式'),
    position: z.string().optional().describe('定位方式'),
  }).describe('样式对象'),
})

export type SetStyleInput = z.infer<typeof SetStyleInputSchema>

export interface SetStyleOutput {
  success: boolean
  componentId: string
  message: string
}

// ==================== 工具实现 ====================

/**
 * 添加组件工具
 * 
 * 注意：当前为模拟实现阶段，仅生成唯一 ID 并返回成功消息。
 * 后续迭代将对接实际的 CanvasService 或数据库操作。
 */
export class AddComponentTool {
  name = 'addComponent'
  description = '向画布添加组件，支持指定位置和属性'
  inputSchema = AddComponentInputSchema

  constructor() {}

  async execute(input: AddComponentInput): Promise<AddComponentOutput> {
    // TODO: 对接 CanvasService.addComponent() 或数据库持久化
    const { canvasId, componentType, x, y, width, height, props } = input
    
    const componentId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      success: true,
      componentId,
      message: `已在画布 ${canvasId} 的 (${x}, ${y}) 位置添加 ${componentType} 组件`,
    }
  }
}

/**
 * 创建添加组件工具工厂函数
 */
export function createAddComponentTool(): AddComponentTool {
  return new AddComponentTool()
}

/**
 * 绑定数据源工具
 * 
 * 注意：当前为模拟实现阶段，仅生成唯一绑定 ID 并返回成功消息。
 * 后续迭代将对接实际的 DataSourceService 或数据库持久化。
 */
export class BindDataSourceTool {
  name = 'bindDataSource'
  description = '为画布组件绑定数据源，支持字段映射和查询配置'
  inputSchema = BindDataSourceInputSchema

  constructor() {}

  async execute(input: BindDataSourceInput): Promise<BindDataSourceOutput> {
    // TODO: 对接 DataSourceService.bindComponent() 或数据库持久化
    const { canvasId, componentId, dataSourceId, fieldMapping, queryConfig } = input
    
    const bindingId = `binding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      success: true,
      bindingId,
      message: `已为组件 ${componentId} 绑定数据源 ${dataSourceId}`,
    }
  }
}

/**
 * 创建绑定数据源工具工厂函数
 */
export function createBindDataSourceTool(): BindDataSourceTool {
  return new BindDataSourceTool()
}

/**
 * 设置样式工具
 * 
 * 注意：当前为模拟实现阶段，仅计算已应用的样式属性数量并返回成功消息。
 * 后续迭代将对接实际的 ComponentService.updateStyle() 或数据库持久化。
 */
export class SetStyleTool {
  name = 'setStyle'
  description = '为画布组件设置样式，支持 Flex/Grid 布局和常规 CSS 属性'
  inputSchema = SetStyleInputSchema

  constructor() {}

  async execute(input: SetStyleInput): Promise<SetStyleOutput> {
    // TODO: 对接 ComponentService.updateStyle() 或数据库持久化
    const { canvasId, componentId, style } = input

    const appliedStyles = Object.keys(style).filter((key) => style[key as keyof typeof style] !== undefined)

    return {
      success: true,
      componentId,
      message: `已为组件 ${componentId} 应用 ${appliedStyles.length} 个样式属性`,
    }
  }
}

/**
 * 创建设置样式工具工厂函数
 */
export function createSetStyleTool(): SetStyleTool {
  return new SetStyleTool()
}

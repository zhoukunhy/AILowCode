/**
 * 画布服务（MCP 集成版）
 * 提供画布管理功能，集成 MCP 工具调用能力
 * 支持通过 MCP 工具分析数据模型、测试 API、生成后端代码
 */
import { Injectable, Logger } from '@nestjs/common'
import { MCPService } from '../../mcp/mcp.service'

export interface Canvas {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  componentCount: number
  menuName?: string
  dataModel?: string
  status: 'draft' | 'published' | 'archived'
  dataModelId?: string
}

@Injectable()
export class CanvasService {
  private readonly logger = new Logger(CanvasService.name)

  private canvases: Canvas[] = [
    { id: '1', name: '首页画布', description: '网站首页展示画布', createdAt: '2024-01-15 10:30', updatedAt: '2024-01-15 14:20', componentCount: 15, menuName: '首页', dataModel: '用户数据', status: 'published' },
    { id: '2', name: '用户管理画布', description: '用户列表管理页面', createdAt: '2024-01-14 09:15', updatedAt: '2024-01-14 16:45', componentCount: 23, menuName: '用户管理', dataModel: '用户模型', status: 'published' },
    { id: '3', name: '订单管理画布', description: '订单列表和详情', createdAt: '2024-01-13 11:00', updatedAt: '2024-01-13 15:30', componentCount: 18, status: 'draft' },
    { id: '4', name: '数据统计画布', description: '数据可视化仪表盘', createdAt: '2024-01-12 08:30', updatedAt: '2024-01-12 12:00', componentCount: 32, menuName: '数据统计', dataModel: '统计数据', status: 'published' },
    { id: '5', name: '产品管理画布', description: '产品展示页面', createdAt: '2024-01-11 14:00', updatedAt: '2024-01-11 17:30', componentCount: 12, dataModel: '产品模型', status: 'draft' },
  ]

  constructor(private readonly mcpService: MCPService) {}

  findAll(): Canvas[] {
    return this.canvases
  }

  findOne(id: string): Canvas | undefined {
    return this.canvases.find((c) => c.id === id)
  }

  create(canvas: Omit<Canvas, 'id' | 'createdAt' | 'updatedAt'>): Canvas {
    const newCanvas: Canvas = {
      ...canvas,
      id: String(Date.now()),
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
    }
    this.canvases.push(newCanvas)
    return newCanvas
  }

  update(id: string, updates: Partial<Canvas>): Canvas | undefined {
    const index = this.canvases.findIndex((c) => c.id === id)
    if (index === -1) return undefined

    this.canvases[index] = {
      ...this.canvases[index],
      ...updates,
      updatedAt: new Date().toLocaleString('zh-CN'),
    }
    return this.canvases[index]
  }

  delete(id: string): boolean {
    const initialLength = this.canvases.length
    this.canvases = this.canvases.filter((c) => c.id !== id)
    return this.canvases.length !== initialLength
  }

  copy(id: string): Canvas | undefined {
    const original = this.findOne(id)
    if (!original) return undefined

    const copied: Canvas = {
      ...original,
      id: String(Date.now()),
      name: `${original.name} (副本)`,
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
      status: 'draft',
    }
    this.canvases.push(copied)
    return copied
  }

  updateDataModel(id: string, dataModelId: string): Canvas | undefined {
    const canvas = this.findOne(id)
    if (!canvas) return undefined

    return this.update(id, { dataModelId })
  }

  // ==================== MCP 工具集成 ====================

  /**
   * 分析画布关联的数据模型
   * 调用 MCP SQL_DDL 工具获取数据库表结构信息
   * @param canvasId - 画布ID
   * @param tableName - 表名
   * @returns DDL 分析结果
   */
  async analyzeDataModel(canvasId: string, tableName: string): Promise<any> {
    const canvas = this.findOne(canvasId)
    if (!canvas) {
      throw new Error('画布不存在')
    }

    this.logger.log(`画布 ${canvasId} 调用 MCP SQL_DDL 工具分析表: ${tableName}`)

    try {
      const result = await this.mcpService.callTool('SQL_DDL', {
        tableName,
        action: 'describe',
      })

      // 将分析结果保存到 MCP 上下文，便于后续 AI 生成使用
      const sessionId = `canvas_${canvasId}_model`
      await this.mcpService.addMessage(sessionId, {
        role: 'tool',
        content: JSON.stringify(result),
        toolCallId: 'sql_ddl_describe',
      })

      return {
        success: true,
        canvasId,
        tableName,
        result,
        message: '数据模型分析完成',
      }
    } catch (error: any) {
      this.logger.error(`数据模型分析失败: ${error.message}`)
      return {
        success: false,
        canvasId,
        tableName,
        error: error.message,
      }
    }
  }

  /**
   * 测试画布关联的 API 端点
   * 调用 MCP Http_Test 工具验证 API 可用性
   * @param canvasId - 画布ID
   * @param endpoint - API 端点配置
   * @returns HTTP 测试结果
   */
  async testApiEndpoint(
    canvasId: string,
    endpoint: { url: string; method?: string; headers?: Record<string, string>; body?: any }
  ): Promise<any> {
    const canvas = this.findOne(canvasId)
    if (!canvas) {
      throw new Error('画布不存在')
    }

    this.logger.log(`画布 ${canvasId} 调用 MCP Http_Test 工具测试 API: ${endpoint.url}`)

    try {
      const result = await this.mcpService.callTool('Http_Test', {
        url: endpoint.url,
        method: endpoint.method || 'GET',
        headers: endpoint.headers || {},
        body: endpoint.body,
      })

      return {
        success: true,
        canvasId,
        endpoint: endpoint.url,
        result,
        message: 'API 测试完成',
      }
    } catch (error: any) {
      this.logger.error(`API 测试失败: ${error.message}`)
      return {
        success: false,
        canvasId,
        endpoint: endpoint.url,
        error: error.message,
      }
    }
  }

  /**
   * 为画布生成后端代码
   * 调用 MCP Nest_Crud 工具生成 NestJS CRUD 模块
   * @param canvasId - 画布ID
   * @param entityName - 实体名称
   * @param fields - 字段定义
   * @returns 生成的代码
   */
  async generateBackendCode(
    canvasId: string,
    entityName: string,
    fields: Array<{ name: string; type: string; required: boolean }>
  ): Promise<any> {
    const canvas = this.findOne(canvasId)
    if (!canvas) {
      throw new Error('画布不存在')
    }

    this.logger.log(`画布 ${canvasId} 调用 MCP Nest_Crud 工具生成后端代码: ${entityName}`)

    try {
      const result = await this.mcpService.callTool('Nest_Crud', {
        entityName,
        fields,
      })

      // 将生成的代码保存到 MCP 上下文
      const sessionId = `canvas_${canvasId}_codegen`
      await this.mcpService.addMessage(sessionId, {
        role: 'tool',
        content: `为 ${entityName} 生成了 NestJS CRUD 代码`,
        toolCallId: 'nest_crud_generate',
      })
      await this.mcpService.setMetadata(sessionId, {
        generatedCode: result,
        entityName,
        canvasId,
      })

      return {
        success: true,
        canvasId,
        entityName,
        result,
        message: '后端代码生成完成',
      }
    } catch (error: any) {
      this.logger.error(`后端代码生成失败: ${error.message}`)
      return {
        success: false,
        canvasId,
        entityName,
        error: error.message,
      }
    }
  }

  /**
   * 获取画布的 MCP 工具执行历史
   * @param canvasId - 画布ID
   * @returns MCP 消息历史
   */
  async getToolHistory(canvasId: string): Promise<any[]> {
    const sessionId = `canvas_${canvasId}_model`
    return this.mcpService.getMessages(sessionId).catch(() => [])
  }
}

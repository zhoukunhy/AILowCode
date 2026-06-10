import { Injectable } from '@nestjs/common'

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
  private canvases: Canvas[] = [
    { id: '1', name: '首页画布', description: '网站首页展示画布', createdAt: '2024-01-15 10:30', updatedAt: '2024-01-15 14:20', componentCount: 15, menuName: '首页', dataModel: '用户数据', status: 'published' },
    { id: '2', name: '用户管理画布', description: '用户列表管理页面', createdAt: '2024-01-14 09:15', updatedAt: '2024-01-14 16:45', componentCount: 23, menuName: '用户管理', dataModel: '用户模型', status: 'published' },
    { id: '3', name: '订单管理画布', description: '订单列表和详情', createdAt: '2024-01-13 11:00', updatedAt: '2024-01-13 15:30', componentCount: 18, status: 'draft' },
    { id: '4', name: '数据统计画布', description: '数据可视化仪表盘', createdAt: '2024-01-12 08:30', updatedAt: '2024-01-12 12:00', componentCount: 32, menuName: '数据统计', dataModel: '统计数据', status: 'published' },
    { id: '5', name: '产品管理画布', description: '产品展示页面', createdAt: '2024-01-11 14:00', updatedAt: '2024-01-11 17:30', componentCount: 12, dataModel: '产品模型', status: 'draft' },
  ]

  findAll(): Canvas[] {
    return this.canvases
  }

  findOne(id: string): Canvas | undefined {
    return this.canvases.find(c => c.id === id)
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
    const index = this.canvases.findIndex(c => c.id === id)
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
    this.canvases = this.canvases.filter(c => c.id !== id)
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
}

import type { CustomComponentDefinition } from '@ai-lowcode/shared-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * 自定义组件 API 服务
 */
export const customComponentApi = {
  /**
   * 创建自定义组件
   */
  async create(definition: Partial<CustomComponentDefinition>): Promise<CustomComponentDefinition> {
    const response = await fetch(`${API_BASE}/api/custom-components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(definition),
    })

    if (!response.ok) {
      throw new Error('创建组件失败')
    }

    return response.json()
  },

  /**
   * 更新自定义组件
   */
  async update(
    componentId: string,
    updates: Partial<CustomComponentDefinition>
  ): Promise<CustomComponentDefinition> {
    const response = await fetch(`${API_BASE}/api/custom-components/${componentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('更新组件失败')
    }

    return response.json()
  },

  /**
   * 获取用户的自定义组件列表
   */
  async findAll(): Promise<CustomComponentDefinition[]> {
    const response = await fetch(`${API_BASE}/api/custom-components`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取组件列表失败')
    }

    const entities = await response.json()
    return entities.map(entityToDefinition)
  },

  /**
   * 获取所有已发布的组件
   */
  async findAllPublished(): Promise<CustomComponentDefinition[]> {
    const response = await fetch(`${API_BASE}/api/custom-components/published`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取公开组件失败')
    }

    const entities = await response.json()
    return entities.map(entityToDefinition)
  },

  /**
   * 获取组件详情
   */
  async findOne(componentId: string): Promise<CustomComponentDefinition> {
    const response = await fetch(`${API_BASE}/api/custom-components/${componentId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取组件详情失败')
    }

    const entity = await response.json()
    return entityToDefinition(entity)
  },

  /**
   * 删除组件
   */
  async remove(componentId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/custom-components/${componentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('删除组件失败')
    }
  },

  /**
   * 发布组件
   */
  async publish(componentId: string): Promise<CustomComponentDefinition> {
    const response = await fetch(`${API_BASE}/api/custom-components/${componentId}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('发布组件失败')
    }

    const entity = await response.json()
    return entityToDefinition(entity)
  },

  /**
   * 取消发布组件
   */
  async unpublish(componentId: string): Promise<CustomComponentDefinition> {
    const response = await fetch(`${API_BASE}/api/custom-components/${componentId}/unpublish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('取消发布失败')
    }

    const entity = await response.json()
    return entityToDefinition(entity)
  },

  /**
   * 复制组件
   */
  async copy(componentId: string, newName?: string): Promise<CustomComponentDefinition> {
    const url = `${API_BASE}/api/custom-components/${componentId}/copy${newName ? `?name=${encodeURIComponent(newName)}` : ''}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('复制组件失败')
    }

    const entity = await response.json()
    return entityToDefinition(entity)
  },

  /**
   * 搜索组件
   */
  async search(query: string): Promise<CustomComponentDefinition[]> {
    const response = await fetch(`${API_BASE}/api/custom-components/search?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('搜索组件失败')
    }

    const entities = await response.json()
    return entities.map(entityToDefinition)
  },

  /**
   * 按分类获取组件
   */
  async findByCategory(category: string): Promise<CustomComponentDefinition[]> {
    const response = await fetch(`${API_BASE}/api/custom-components/category/${category}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取分类组件失败')
    }

    const entities = await response.json()
    return entities.map(entityToDefinition)
  },

  /**
   * 获取组件统计信息
   */
  async getStats(): Promise<{
    total: number
    draft: number
    published: number
    deprecated: number
  }> {
    const response = await fetch(`${API_BASE}/api/custom-components/stats`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取统计信息失败')
    }

    return response.json()
  },
}

/**
 * 将数据库实体转换为前端定义格式
 */
function entityToDefinition(entity: any): CustomComponentDefinition {
  return {
    id: entity.componentId,
    name: entity.name,
    displayName: entity.displayName,
    description: entity.description,
    category: entity.category,
    icon: entity.icon,
    version: entity.version,
    author: entity.author,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    status: entity.status,
    template: entity.template,
    propsSchema: entity.propsSchema,
    events: entity.events,
    dataSource: entity.dataSource,
    dependencies: entity.dependencies?.split(',').filter(Boolean) || [],
    tags: entity.tags?.split(',').filter(Boolean) || [],
  }
}

/**
 * 获取认证 Token
 */
function getAuthToken(): string {
  // 从 localStorage 或 cookie 中获取 token
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || ''
  }
  return ''
}
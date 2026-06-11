/**
 * RBAC 权限管理模块
 * 用户、角色、菜单权限管理
 */



/**
 * 角色定义
 */
export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: string[]
  isSystem?: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * 权限定义
 */
export interface Permission {
  id: string
  name: string
  code: string
  type: 'menu' | 'button' | 'api'
  parentId?: number
  path?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description?: string
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: string
  name: string
  path?: string
  icon?: string
  parentId?: string
  order: number
  permissions: string[]
  children?: MenuItem[]
}

/**
 * 用户角色关联
 */
export interface UserRole {
  userId: string
  roleId: string
  assignedAt: Date
  assignedBy?: string
}

/**
 * 角色权限分配
 */
export interface RolePermission {
  roleId: string
  permissionId: string
  grantedAt: Date
  grantedBy?: string
}

/**
 * 预定义角色
 */
export const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '超级管理员',
    code: 'super_admin',
    description: '拥有系统所有权限',
    permissions: ['*'],
    isSystem: true,
  },
  {
    name: '管理员',
    code: 'admin',
    description: '拥有大部分管理权限',
    permissions: [
      'user:read', 'user:write', 'user:delete',
      'role:read', 'role:write',
      'project:read', 'project:write', 'project:delete',
      'page:read', 'page:write', 'page:delete',
      'knowledge:read', 'knowledge:write',
      'ai:config',
    ],
    isSystem: true,
  },
  {
    name: '普通用户',
    code: 'user',
    description: '基础用户权限',
    permissions: [
      'project:read', 'project:write',
      'page:read', 'page:write',
      'knowledge:read',
    ],
    isSystem: true,
  },
  {
    name: '访客',
    code: 'guest',
    description: '只读权限',
    permissions: [
      'project:read',
      'page:read',
    ],
    isSystem: true,
  },
]

/**
 * 预定义权限
 */
export const DEFAULT_PERMISSIONS: Omit<Permission, 'id'>[] = [
  // 用户管理
  { name: '查看用户', code: 'user:read', type: 'button' },
  { name: '编辑用户', code: 'user:write', type: 'button' },
  { name: '删除用户', code: 'user:delete', type: 'button' },
  // 角色管理
  { name: '查看角色', code: 'role:read', type: 'button' },
  { name: '编辑角色', code: 'role:write', type: 'button' },
  // 项目管理
  { name: '查看项目', code: 'project:read', type: 'button' },
  { name: '编辑项目', code: 'project:write', type: 'button' },
  { name: '删除项目', code: 'project:delete', type: 'button' },
  // 页面管理
  { name: '查看页面', code: 'page:read', type: 'button' },
  { name: '编辑页面', code: 'page:write', type: 'button' },
  { name: '删除页面', code: 'page:delete', type: 'button' },
  // 知识库
  { name: '查看知识库', code: 'knowledge:read', type: 'button' },
  { name: '编辑知识库', code: 'knowledge:write', type: 'button' },
  // AI 配置
  { name: 'AI 配置', code: 'ai:config', type: 'button' },
]

/**
 * 预定义菜单
 */
export const DEFAULT_MENUS: Omit<MenuItem, 'id'>[] = [
  {
    name: '仪表盘',
    path: '/dashboard',
    icon: '📊',
    order: 1,
    permissions: ['project:read'],
  },
  {
    name: '项目管理',
    path: '/projects',
    icon: '📁',
    order: 2,
    permissions: ['project:read', 'project:write'],
    children: [
      { id: 'project-list', name: '项目列表', path: '/projects/list', order: 1, permissions: ['project:read'] },
      { id: 'project-create', name: '创建项目', path: '/projects/create', order: 2, permissions: ['project:write'] },
    ] as MenuItem[],
  },
  {
    name: '画布编辑',
    path: '/canvas',
    icon: '🎨',
    order: 3,
    permissions: ['page:read', 'page:write'],
  },
  {
    name: '知识库',
    path: '/knowledge',
    icon: '📚',
    order: 4,
    permissions: ['knowledge:read', 'knowledge:write'],
  },
  {
    name: 'AI 助手',
    path: '/ai-assistant',
    icon: '🤖',
    order: 5,
    permissions: ['*'],
  },
  {
    name: '系统管理',
    path: '/admin',
    icon: '⚙️',
    order: 6,
    permissions: ['user:read', 'role:read'],
    children: [
      { id: 'admin-users', name: '用户管理', path: '/admin/users', order: 1, permissions: ['user:read', 'user:write'] },
      { id: 'admin-roles', name: '角色管理', path: '/admin/roles', order: 2, permissions: ['role:read', 'role:write'] },
      { id: 'admin-ai-config', name: 'AI 配置', path: '/admin/ai-config', order: 3, permissions: ['ai:config'] },
    ] as MenuItem[],
  },
]

/**
 * 权限检查服务
 */
export class PermissionService {
  /**
   * 检查用户是否有权限
   */
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // 超级权限
    if (userPermissions.includes('*')) {
      return true
    }
    return userPermissions.includes(requiredPermission)
  }

  /**
   * 检查用户是否有所有指定权限
   */
  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(p => this.hasPermission(userPermissions, p))
  }

  /**
   * 检查用户是否有任一指定权限
   */
  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(p => this.hasPermission(userPermissions, p))
  }

  /**
   * 获取用户可访问的菜单
   */
  getAccessibleMenus(menus: MenuItem[], userPermissions: string[]): MenuItem[] {
    const result: MenuItem[] = []

    for (const menu of menus) {
      const accessibleChildren = menu.children
        ? this.getAccessibleMenus(menu.children, userPermissions)
        : []

      // 如果有子菜单，检查子菜单
      if (menu.children) {
        if (accessibleChildren.length > 0) {
          result.push({
            ...menu,
            children: accessibleChildren,
          })
        }
      }
      // 如果没有子菜单，检查自身权限
      else {
        if (this.hasAnyPermission(userPermissions, menu.permissions)) {
          result.push(menu)
        }
      }
    }

    return result
  }

  /**
   * 过滤菜单权限
   */
  filterMenuPermissions(menus: MenuItem[], userPermissions: string[]): string[] {
    const accessibleMenus = this.getAccessibleMenus(menus, userPermissions)
    const permissions: string[] = []

    const extractPermissions = (items: MenuItem[]) => {
      for (const item of items) {
        permissions.push(...item.permissions)
        if (item.children) {
          extractPermissions(item.children)
        }
      }
    }

    extractPermissions(accessibleMenus)
    return [...new Set(permissions)]
  }
}

/**
 * 创建权限服务
 */
export function createPermissionService(): PermissionService {
  return new PermissionService()
}

'use client'

import React, { useState } from 'react'

// 权限类型
interface Permission {
  id: string
  name: string
  key: string
  description: string
  category: string
}

// 角色类型
interface Role {
  id: string
  name: string
  key: string
  description: string
  color: string
  userCount: number
  permissions: string[]
}

// 权限列表
const allPermissions: Permission[] = [
  // 用户权限
  { id: '1', name: '查看用户', key: 'user:view', description: '查看用户列表', category: '用户管理' },
  { id: '2', name: '创建用户', key: 'user:create', description: '创建新用户', category: '用户管理' },
  { id: '3', name: '编辑用户', key: 'user:edit', description: '编辑用户信息', category: '用户管理' },
  { id: '4', name: '删除用户', key: 'user:delete', description: '删除用户', category: '用户管理' },
  
  // 角色权限
  { id: '5', name: '查看角色', key: 'role:view', description: '查看角色列表', category: '角色权限' },
  { id: '6', name: '创建角色', key: 'role:create', description: '创建新角色', category: '角色权限' },
  { id: '7', name: '编辑角色', key: 'role:edit', description: '编辑角色信息', category: '角色权限' },
  { id: '8', name: '删除角色', key: 'role:delete', description: '删除角色', category: '角色权限' },
  
  // 项目权限
  { id: '9', name: '查看项目', key: 'project:view', description: '查看项目列表', category: '项目管理' },
  { id: '10', name: '创建项目', key: 'project:create', description: '创建新项目', category: '项目管理' },
  { id: '11', name: '编辑项目', key: 'project:edit', description: '编辑项目信息', category: '项目管理' },
  { id: '12', name: '删除项目', key: 'project:delete', description: '删除项目', category: '项目管理' },
  { id: '13', name: '导出项目', key: 'project:export', description: '导出项目代码', category: '项目管理' },
  
  // 知识库权限
  { id: '14', name: '查看知识库', key: 'knowledge:view', description: '查看知识库', category: '知识库' },
  { id: '15', name: '上传文档', key: 'knowledge:upload', description: '上传文档', category: '知识库' },
  { id: '16', name: '删除文档', key: 'knowledge:delete', description: '删除文档', category: '知识库' },
  
  // AI 权限
  { id: '17', name: '使用 AI 生成', key: 'ai:generate', description: '使用 AI 代码生成', category: 'AI 功能' },
  { id: '18', name: '使用 AI 优化', key: 'ai:optimize', description: '使用 AI 代码优化', category: 'AI 功能' },
  { id: '19', name: '使用 AI 重构', key: 'ai:refactor', description: '使用 AI 代码重构', category: 'AI 功能' },
  { id: '20', name: '管理 AI 配置', key: 'ai:config', description: '管理 AI 配置', category: 'AI 功能' },
  
  // 系统权限
  { id: '21', name: '系统设置', key: 'system:config', description: '系统设置', category: '系统' },
  { id: '22', name: '查看日志', key: 'system:log', description: '查看系统日志', category: '系统' },
]

// 模拟角色数据
const mockRoles: Role[] = [
  {
    id: '1',
    name: '超级管理员',
    key: 'super_admin',
    description: '拥有系统所有权限',
    color: 'red',
    userCount: 2,
    permissions: allPermissions.map((p) => p.key),
  },
  {
    id: '2',
    name: '管理员',
    key: 'admin',
    description: '拥有大部分管理权限',
    color: 'purple',
    userCount: 5,
    permissions: [
      'user:view', 'user:create', 'user:edit',
      'role:view',
      'project:view', 'project:create', 'project:edit', 'project:delete',
      'knowledge:view', 'knowledge:upload', 'knowledge:delete',
      'ai:generate', 'ai:optimize', 'ai:refactor',
    ],
  },
  {
    id: '3',
    name: '普通用户',
    key: 'user',
    description: '可以使用大部分功能',
    color: 'blue',
    userCount: 128,
    permissions: [
      'project:view', 'project:create', 'project:edit',
      'knowledge:view',
      'ai:generate', 'ai:optimize', 'ai:refactor',
    ],
  },
  {
    id: '4',
    name: '访客',
    key: 'guest',
    description: '只有查看权限',
    color: 'gray',
    userCount: 15,
    permissions: [
      'project:view',
      'knowledge:view',
    ],
  },
]

// 权限分类
const permissionCategories = [
  '用户管理',
  '角色权限',
  '项目管理',
  '知识库',
  'AI 功能',
  '系统',
]

// 角色颜色映射
const getRoleColor = (color: string) => {
  switch (color) {
    case 'red':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'purple':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'blue':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'gray':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(permissionCategories)

  // 切换分类展开/收起
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  // 切换角色权限
  const togglePermission = (permissionKey: string) => {
    if (!selectedRole) return
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== selectedRole.id) return role
        const hasPermission = role.permissions.includes(permissionKey)
        return {
          ...role,
          permissions: hasPermission
            ? role.permissions.filter((p) => p !== permissionKey)
            : [...role.permissions, permissionKey],
        }
      })
    )
    setSelectedRole((prev) => {
      if (!prev) return null
      const hasPermission = prev.permissions.includes(permissionKey)
      return {
        ...prev,
        permissions: hasPermission
          ? prev.permissions.filter((p) => p !== permissionKey)
          : [...prev.permissions, permissionKey],
      }
    })
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">角色权限管理</h1>
          <p className="text-gray-500 mt-1">管理系统角色和权限配置</p>
        </div>
        <button
          onClick={() => setShowRoleModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建角色</span>
        </button>
      </div>

      {/* 角色卡片列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
              selectedRole?.id === role.id
                ? 'border-blue-500 ring-2 ring-blue-100'
                : 'border-transparent'
            }`}
            onClick={() => setSelectedRole(role)}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(
                  role.color
                )}`}
              >
                {role.name}
              </div>
              <div className="text-2xl">
                {role.color === 'red' && '👑'}
                {role.color === 'purple' && '⭐'}
                {role.color === 'blue' && '👤'}
                {role.color === 'gray' && '👁️'}
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">{role.description}</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                <span className="font-medium text-gray-700">{role.userCount}</span> 个用户
              </span>
              <span className="text-gray-500">
                <span className="font-medium text-gray-700">{role.permissions.length}</span> 项权限
              </span>
            </div>

            {/* 权限预览 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 4).map((permKey) => {
                  const perm = allPermissions.find((p) => p.key === permKey)
                  return (
                    <span
                      key={permKey}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {perm?.name || permKey}
                    </span>
                  )
                })}
                {role.permissions.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    +{role.permissions.length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 权限配置面板 */}
      {selectedRole && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{selectedRole.name} - 权限配置</h2>
              <p className="text-sm text-gray-500 mt-1">
                勾选该角色拥有的权限，共 {selectedRole.permissions.length} 项权限
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRoles((prev) =>
                    prev.map((r) =>
                      r.id === selectedRole.id
                        ? { ...r, permissions: allPermissions.map((p) => p.key) }
                        : r
                    )
                  )
                  setSelectedRole((prev) =>
                    prev ? { ...prev, permissions: allPermissions.map((p) => p.key) } : null
                  )
                }}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                全选
              </button>
              <button
                onClick={() => {
                  const defaultPerms = selectedRole.key === 'super_admin'
                    ? allPermissions.map((p) => p.key)
                    : selectedRole.key === 'guest'
                    ? ['project:view', 'knowledge:view']
                    : []
                  setRoles((prev) =>
                    prev.map((r) => (r.id === selectedRole.id ? { ...r, permissions: defaultPerms } : r))
                  )
                  setSelectedRole((prev) => (prev ? { ...prev, permissions: defaultPerms } : null))
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          {/* 权限分类 */}
          <div className="space-y-4">
            {permissionCategories.map((category) => {
              const categoryPermissions = allPermissions.filter((p) => p.category === category)
              const isExpanded = expandedCategories.includes(category)
              const checkedCount = categoryPermissions.filter((p) =>
                selectedRole.permissions.includes(p.key)
              ).length

              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 分类标题 */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800">{category}</span>
                      <span className="text-sm text-gray-500">
                        ({checkedCount}/{categoryPermissions.length})
                      </span>
                    </div>
                    <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {/* 权限列表 */}
                  {isExpanded && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryPermissions.map((permission) => {
                        const isChecked = selectedRole.permissions.includes(permission.key)
                        return (
                          <label
                            key={permission.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isChecked
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(permission.key)}
                              className="mt-1 w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800">{permission.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {permission.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                                {permission.key}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!selectedRole && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">选择要配置的角色</h3>
          <p className="text-gray-500">点击上方的角色卡片开始配置权限</p>
        </div>
      )}

      {/* 创建角色弹窗 */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新建角色</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色名称
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入角色名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色标识
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入角色标识（英文）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色描述
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="请输入角色描述"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

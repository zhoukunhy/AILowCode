'use client'

import React, { useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { Role, Permission, User } from '@ai-lowcode/shared-types'

interface RoleFormData {
  name: string
  code: string
  description: string
  permissions: string[]
}

interface RoleManagePanelProps {
  onClose?: () => void
}

/**
 * 角色管理面板
 */
export function RoleManagePanel({ onClose }: RoleManagePanelProps) {
  const { user: currentUser } = useAuthStore()
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    code: '',
    description: '',
    permissions: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 预定义权限列表
  const permissionGroups = [
    {
      label: '用户管理',
      permissions: [
        { code: 'user:read', name: '查看用户' },
        { code: 'user:write', name: '编辑用户' },
        { code: 'user:delete', name: '删除用户' },
      ],
    },
    {
      label: '角色管理',
      permissions: [
        { code: 'role:read', name: '查看角色' },
        { code: 'role:write', name: '编辑角色' },
      ],
    },
    {
      label: '项目管理',
      permissions: [
        { code: 'project:read', name: '查看项目' },
        { code: 'project:write', name: '编辑项目' },
        { code: 'project:delete', name: '删除项目' },
      ],
    },
    {
      label: '页面管理',
      permissions: [
        { code: 'page:read', name: '查看页面' },
        { code: 'page:write', name: '编辑页面' },
        { code: 'page:delete', name: '删除页面' },
      ],
    },
    {
      label: '知识库',
      permissions: [
        { code: 'knowledge:read', name: '查看知识库' },
        { code: 'knowledge:write', name: '编辑知识库' },
      ],
    },
    {
      label: 'AI 配置',
      permissions: [
        { code: 'ai:config', name: 'AI 配置' },
      ],
    },
  ]

  // 加载角色列表
  const loadRoles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // TODO: 调用 API 获取角色列表
      const mockRoles: Role[] = [
        {
          id: '1',
          name: '超级管理员',
          code: 'super_admin',
          description: '拥有系统所有权限',
          permissions: ['*'],
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: '管理员',
          code: 'admin',
          description: '拥有大部分管理权限',
          permissions: ['user:read', 'user:write', 'role:read'],
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: '普通用户',
          code: 'user',
          description: '基础用户权限',
          permissions: ['project:read', 'page:read'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      setRoles(mockRoles)
    } catch (err) {
      setError('加载角色列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 选择角色
  const handleSelectRole = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
      permissions: role.permissions,
    })
    setIsEditing(false)
  }

  // 新建角色
  const handleCreateRole = () => {
    setSelectedRole(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      permissions: [],
    })
    setIsEditing(true)
  }

  // 编辑角色
  const handleEditRole = () => {
    if (!selectedRole || selectedRole.isSystem) {
      return
    }
    setIsEditing(true)
  }

  // 保存角色
  const handleSaveRole = async () => {
    if (!formData.name || !formData.code) {
      setError('请填写角色名称和代码')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // TODO: 调用 API 保存角色
      console.log('保存角色:', formData)
      await loadRoles()
      setIsEditing(false)
    } catch (err) {
      setError('保存角色失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除角色
  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystem) {
      setError('系统角色不能删除')
      return
    }

    if (!confirm('确定要删除这个角色吗？')) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      // TODO: 调用 API 删除角色
      console.log('删除角色:', roleId)
      await loadRoles()
      setSelectedRole(null)
    } catch (err) {
      setError('删除角色失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换权限
  const handleTogglePermission = (permissionCode: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionCode)
        ? prev.permissions.filter(p => p !== permissionCode)
        : [...prev.permissions, permissionCode],
    }))
  }

  // 全选分组权限
  const handleToggleGroupPermissions = (groupPermissions: string[], checked: boolean) => {
    setFormData(prev => {
      const others = prev.permissions.filter(p => !groupPermissions.includes(p))
      return {
        ...prev,
        permissions: checked ? [...others, ...groupPermissions] : others,
      }
    })
  }

  return (
    <div className="flex h-full">
      {/* 左侧角色列表 */}
      <div className="w-72 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium">角色管理</h2>
          <button
            onClick={handleCreateRole}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + 新建
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && roles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">加载中...</div>
          ) : roles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">暂无角色</div>
          ) : (
            roles.map(role => (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{role.name}</span>
                  {role.isSystem && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">系统</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">{role.description}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {role.permissions.length} 个权限
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧角色详情/编辑 */}
      <div className="flex-1 flex flex-col">
        {isEditing ? (
          // 编辑模式
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {selectedRole ? '编辑角色' : '新建角色'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    角色名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={selectedRole?.isSystem}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="请输入角色名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    角色代码 *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    disabled={selectedRole?.isSystem}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="如: admin, user, guest"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入角色描述"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    权限配置
                  </label>
                  <div className="space-y-4">
                    {permissionGroups.map(group => {
                      const groupPermissionCodes = group.permissions.map(p => p.code)
                      const allChecked = groupPermissionCodes.every(
                        code => formData.permissions.includes(code)
                      )
                      const someChecked = groupPermissionCodes.some(
                        code => formData.permissions.includes(code)
                      )

                      return (
                        <div key={group.label} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id={`group-${group.label}`}
                              checked={allChecked}
                              ref={input => {
                                if (input) input.indeterminate = someChecked && !allChecked
                              }}
                              onChange={e => handleToggleGroupPermissions(groupPermissionCodes, e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label
                              htmlFor={`group-${group.label}`}
                              className="ml-2 text-sm font-medium text-gray-700"
                            >
                              {group.label}
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-6">
                            {group.permissions.map(permission => (
                              <label
                                key={permission.code}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer transition-colors"
                                style={{
                                  backgroundColor: formData.permissions.includes(permission.code)
                                    ? '#dbeafe'
                                    : '#f3f4f6',
                                  color: formData.permissions.includes(permission.code)
                                    ? '#1e40af'
                                    : '#6b7280',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(permission.code)}
                                  onChange={() => handleTogglePermission(permission.code)}
                                  className="sr-only"
                                />
                                {permission.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : selectedRole ? (
          // 查看模式
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium">角色详情</h3>
              {!selectedRole.isSystem && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEditRole}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteRole(selectedRole.id)}
                    className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-1">角色名称</h4>
                <p className="text-lg">{selectedRole.name}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-1">角色代码</h4>
                <p className="text-lg font-mono">{selectedRole.code}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-1">描述</h4>
                <p className="text-gray-700">{selectedRole.description || '-'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">拥有的权限</h4>
                {selectedRole.permissions.includes('*') ? (
                  <span className="inline px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    超级管理员（所有权限）
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedRole.permissions.map(permission => (
                      <span
                        key={permission}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // 未选择
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">👈 请选择一个角色</p>
              <p className="text-sm">或点击"新建"创建新角色</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RoleManagePanel

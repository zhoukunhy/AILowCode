'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

interface Permission {
  id: number
  name: string
  code: string
  type: string
  description?: string
  category?: string
  parentId?: number
  path?: string
  method?: string
}

interface Role {
  id: number
  name: string
  code: string
  description?: string
  status: string
  isSystem: boolean
  permissions: Permission[]
  menus?: any[]
  createdAt: string
  updatedAt: string
}

const categoryColors: Record<string, string> = {
  '用户管理': 'bg-blue-100 text-blue-700',
  '角色权限': 'bg-purple-100 text-purple-700',
  '项目管理': 'bg-green-100 text-green-700',
  '知识库': 'bg-yellow-100 text-yellow-700',
  'AI 功能': 'bg-pink-100 text-pink-700',
  '系统': 'bg-gray-100 text-gray-700',
}

const permissionCategories = [
  '用户管理',
  '角色权限',
  '项目管理',
  '知识库',
  'AI 功能',
  '系统',
]

async function fetchRoles(): Promise<Role[]> {
  const res = await fetch(`${API_BASE}/roles`, { headers: getAuthHeaders() })
  const data = await res.json()
  return data.data || []
}

async function fetchPermissions(): Promise<Permission[]> {
  const res = await fetch(`${API_BASE}/roles/permissions/tree`, { headers: getAuthHeaders() })
  const data = await res.json()
  return flattenPermissions(data.data || [])
}

function flattenPermissions(permissions: any[]): Permission[] {
  const result: Permission[] = []
  for (const p of permissions) {
    result.push({
      id: p.id,
      name: p.name,
      code: p.code,
      type: p.type,
      description: p.description,
      category: p.category,
      parentId: p.parentId,
    })
    if (p.children && p.children.length > 0) {
      result.push(...flattenPermissions(p.children))
    }
  }
  return result
}

async function createRole(name: string, code: string, description: string): Promise<Role> {
  const res = await fetch(`${API_BASE}/roles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, code, description }),
  })
  const data = await res.json()
  return data.data || data
}

async function assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
  await fetch(`${API_BASE}/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissionIds }),
  })
}

async function deleteRole(id: number): Promise<void> {
  await fetch(`${API_BASE}/roles/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
}

function getRoleColor(color: string): string {
  const colors: Record<string, string> = {
    red: 'bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[color] || colors.blue
}

function getRoleEmoji(color: string): string {
  const emojis: Record<string, string> = {
    red: '👑',
    purple: '⭐',
    blue: '👤',
    green: '👤',
    yellow: '👤',
    gray: '👁️',
  }
  return emojis[color] || '👤'
}

function getRoleColorFromCode(code: string): string {
  if (code.includes('super')) return 'red'
  if (code.includes('admin')) return 'purple'
  if (code.includes('user')) return 'blue'
  return 'gray'
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(permissionCategories)

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesData, permsData] = await Promise.all([fetchRoles(), fetchPermissions()])
      setRoles(rolesData)
      setAllPermissions(permsData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const togglePermission = async (permissionId: number) => {
    if (!selectedRole) return
    const hasPerm = selectedRole.permissions.some((p) => p.id === permissionId)
    const newPerms = hasPerm
      ? selectedRole.permissions.filter((p) => p.id !== permissionId)
      : [...selectedRole.permissions, allPermissions.find((p) => p.id === permissionId)!]
    
    const updatedRole = { ...selectedRole, permissions: newPerms }
    setSelectedRole(updatedRole)
    setRoles((prev) => prev.map((r) => (r.id === selectedRole.id ? updatedRole : r)))
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    try {
      setSaving(true)
      const permissionIds = selectedRole.permissions.map((p) => p.id)
      await assignPermissions(selectedRole.id, permissionIds)
      await loadData()
      alert('保存成功')
    } catch (error) {
      console.error('保存权限失败:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRole = async (name: string, code: string, description: string) => {
    try {
      setSaving(true)
      await createRole(name, code, description)
      await loadData()
      setShowRoleModal(false)
    } catch (error) {
      console.error('创建角色失败:', error)
      alert('创建失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      alert('系统角色不能删除')
      return
    }
    if (!confirm(`确定要删除角色 "${role.name}" 吗？`)) return
    try {
      await deleteRole(role.id)
      if (selectedRole?.id === role.id) setSelectedRole(null)
      await loadData()
    } catch (error) {
      console.error('删除角色失败:', error)
      alert('删除失败')
    }
  }

  const getPermissionsByCategory = (category: string) => {
    return allPermissions.filter((p) => p.category === category)
  }

  const isPermissionChecked = (permissionId: number) => {
    return selectedRole?.permissions.some((p) => p.id === permissionId) || false
  }

  const getCategoryPermissionCount = (category: string) => {
    const categoryPerms = getPermissionsByCategory(category)
    const checkedCount = categoryPerms.filter((p) => isPermissionChecked(p.id)).length
    return `${checkedCount}/${categoryPerms.length}`
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">角色权限管理</h1>
          <p className="text-gray-500 mt-1">管理系统角色和权限配置</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowRoleModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            新建角色
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {roles.map((role) => {
          const color = getRoleColorFromCode(role.code)
          return (
            <div
              key={role.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
                selectedRole?.id === role.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent'
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(color)}`}>
                  {role.name}
                </div>
                <div className="text-2xl">{getRoleEmoji(color)}</div>
              </div>
              <p className="text-sm text-gray-500 mb-4">{role.description || '暂无描述'}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  <span className="font-medium text-gray-700">{role.isSystem ? '系统' : '自定义'}</span>
                </span>
                <span className="text-gray-500">
                  <span className="font-medium text-gray-700">{role.permissions.length}</span> 项权限
                </span>
              </div>
              {!role.isSystem && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                  className="mt-3 text-xs text-red-500 hover:text-red-700"
                >
                  删除角色
                </button>
              )}
            </div>
          )
        })}
      </div>

      {selectedRole && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{selectedRole.name} - 权限配置</h2>
              <p className="text-sm text-gray-500 mt-1">
                勾选该角色拥有的权限，共 {selectedRole.permissions.length} 项权限
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRole(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                保存权限
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {permissionCategories.map((category) => {
              const categoryPerms = getPermissionsByCategory(category)
              if (categoryPerms.length === 0) return null
              const isExpanded = expandedCategories.includes(category)
              return (
                <div key={category} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[category] || 'bg-gray-100 text-gray-700'}`}>
                        {category}
                      </span>
                      <span className="text-sm text-gray-500">{getCategoryPermissionCount(category)}</span>
                    </div>
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {categoryPerms.map((perm) => (
                        <label key={perm.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPermissionChecked(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-700 truncate">{perm.name}</div>
                            <div className="text-xs text-gray-400 truncate">{perm.code}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showRoleModal && (
        <CreateRoleModal onClose={() => setShowRoleModal(false)} onCreate={handleCreateRole} saving={saving} />
      )}
    </div>
  )
}

interface CreateRoleModalProps {
  onClose: () => void
  onCreate: (name: string, code: string, description: string) => Promise<void>
  saving: boolean
}

function CreateRoleModal({ onClose, onCreate, saving }: CreateRoleModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      alert('请填写角色名称和代码')
      return
    }
    await onCreate(name, code, description)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">新建角色</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：运营管理员"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色代码</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s/g, '_'))}
              placeholder="如：operator_admin"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="角色描述（可选）"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            取消
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}

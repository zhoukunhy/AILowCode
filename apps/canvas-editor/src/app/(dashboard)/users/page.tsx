'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

interface User {
  id: number
  username: string
  email: string
  role?: string
  roleId?: number
  status: string
  avatarUrl?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  aiCallCount?: number
  aiCallLimit?: number
}

interface Role {
  id: number
  name: string
  code: string
}

const roleOptions = ['全部', '超级管理员', '管理员', '普通用户', '访客']
const statusOptions = ['全部', 'active', 'disabled']

async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() })
  const data = await res.json()
  return data.data || []
}

async function fetchRoles(): Promise<Role[]> {
  const res = await fetch(`${API_BASE}/roles`, { headers: getAuthHeaders() })
  const data = await res.json()
  return data.data || []
}

async function createUser(username: string, password: string, email: string): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, password, email }),
  })
  const data = await res.json()
  return data.data || data
}

async function updateUser(id: number, data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  const result = await res.json()
  return result.data || result
}

async function deleteUser(id: number): Promise<void> {
  await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
}

function getRoleDisplayName(role?: string): string {
  if (!role) return '普通用户'
  if (role.includes('super') || role.includes('admin')) return '管理员'
  return '普通用户'
}

function getRoleColor(role?: string): string {
  const name = getRoleDisplayName(role)
  switch (name) {
    case '超级管理员':
      return 'bg-red-100 text-red-700'
    case '管理员':
      return 'bg-purple-100 text-purple-700'
    case '普通用户':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function getStatusColor(status: string): string {
  return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState('全部')
  const [selectedStatus, setSelectedStatus] = useState('全部')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUserRole, setSelectedUserRole] = useState<string>('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, rolesData] = await Promise.all([fetchUsers(), fetchRoles()])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = users.filter((user) => {
    const displayRole = getRoleDisplayName(user.role)
    const matchRole = selectedRole === '全部' || displayRole === selectedRole
    const matchStatus = selectedStatus === '全部' || user.status === selectedStatus
    const matchKeyword =
      user.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      user.email.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchRole && matchStatus && matchKeyword
  })

  const handleEditRole = (user: User) => {
    setSelectedUser(user)
    setSelectedUserRole(user.roleId?.toString() || '')
    setShowRoleModal(true)
  }

  const handleSaveRole = async () => {
    if (!selectedUser) return
    try {
      setSaving(true)
      await updateUser(selectedUser.id, { roleId: parseInt(selectedUserRole) || undefined })
      await loadData()
      setShowRoleModal(false)
    } catch (error) {
      console.error('更新角色失败:', error)
      alert('更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateUser = async (username: string, password: string, email: string) => {
    try {
      setSaving(true)
      await createUser(username, password, email)
      await loadData()
      setShowCreateModal(false)
    } catch (error) {
      console.error('创建用户失败:', error)
      alert('创建失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`确定要删除用户 "${user.username}" 吗？`)) return
    try {
      await deleteUser(user.id)
      await loadData()
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除失败')
    }
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
          <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
          <p className="text-gray-500 mt-1">管理系统用户和权限</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            添加用户
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索用户名或邮箱..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">角色:</span>
            {roleOptions.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedRole === role ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">状态:</span>
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status === '全部' ? status : status === 'active' ? '启用' : '禁用'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{user.username}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                {user.status === 'active' ? '启用' : '禁用'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">角色</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">AI 调用</span>
                <span className="text-gray-700">
                  {user.aiCallCount || 0} / {user.aiCallLimit || 100}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">创建时间</span>
                <span className="text-gray-700">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEditRole(user)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
              >
                设置角色
              </button>
              <button
                onClick={() => handleDeleteUser(user)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无用户</p>
        </div>
      )}

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateUser} saving={saving} />
      )}

      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">设置用户角色 - {selectedUser.username}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择角色</label>
                <select
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">普通用户</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                disabled={saving}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface CreateUserModalProps {
  onClose: () => void
  onCreate: (username: string, password: string, email: string) => Promise<void>
  saving: boolean
}

function CreateUserModal({ onClose, onCreate, saving }: CreateUserModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim() || !email.trim()) {
      alert('请填写所有字段')
      return
    }
    await onCreate(username, password, email)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">添加用户</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}

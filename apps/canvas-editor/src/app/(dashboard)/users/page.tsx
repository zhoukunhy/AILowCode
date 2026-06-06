'use client'

import React, { useState } from 'react'

// 用户类型
interface User {
  id: string
  username: string
  email: string
  role: '超级管理员' | '管理员' | '普通用户' | '访客'
  status: '启用' | '禁用'
  avatar?: string
  lastLogin?: string
  createdAt: string
  projects: number
}

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: '超级管理员',
    status: '启用',
    lastLogin: '2024-01-15 10:30',
    createdAt: '2023-01-01',
    projects: 12,
  },
  {
    id: '2',
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    role: '管理员',
    status: '启用',
    lastLogin: '2024-01-15 09:15',
    createdAt: '2023-03-15',
    projects: 8,
  },
  {
    id: '3',
    username: 'lisi',
    email: 'lisi@example.com',
    role: '普通用户',
    status: '启用',
    lastLogin: '2024-01-14 16:45',
    createdAt: '2023-06-20',
    projects: 5,
  },
  {
    id: '4',
    username: 'wangwu',
    email: 'wangwu@example.com',
    role: '普通用户',
    status: '禁用',
    lastLogin: '2024-01-10 11:20',
    createdAt: '2023-08-01',
    projects: 3,
  },
  {
    id: '5',
    username: 'zhaoliu',
    email: 'zhaoliu@example.com',
    role: '访客',
    status: '启用',
    lastLogin: '2024-01-13 14:30',
    createdAt: '2023-12-01',
    projects: 1,
  },
  {
    id: '6',
    username: 'qianqi',
    email: 'qianqi@example.com',
    role: '管理员',
    status: '启用',
    lastLogin: '2024-01-15 08:00',
    createdAt: '2023-02-10',
    projects: 10,
  },
]

// 角色选项
const roleOptions = ['全部', '超级管理员', '管理员', '普通用户', '访客']
const statusOptions = ['全部', '启用', '禁用']

export default function UsersPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedRole, setSelectedRole] = useState('全部')
  const [selectedStatus, setSelectedStatus] = useState('全部')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // 过滤用户
  const filteredUsers = mockUsers.filter((user) => {
    const matchRole = selectedRole === '全部' || user.role === selectedRole
    const matchStatus = selectedStatus === '全部' || user.status === selectedStatus
    const matchKeyword =
      user.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      user.email.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchRole && matchStatus && matchKeyword
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case '超级管理员':
        return 'bg-red-100 text-red-700'
      case '管理员':
        return 'bg-purple-100 text-purple-700'
      case '普通用户':
        return 'bg-blue-100 text-blue-700'
      case '访客':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    return status === '启用'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700'
  }

  const handleEditRole = (user: User) => {
    setSelectedUser(user)
    setShowRoleModal(true)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
          <p className="text-gray-500 mt-1">管理系统用户和权限</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>添加用户</span>
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索用户名或邮箱..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* 角色筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">角色:</span>
            {roleOptions.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedRole === role
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">状态:</span>
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* 视图切换 */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <span>▦</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <span>☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* 用户列表/网格 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              {/* 用户头像和信息 */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl text-white font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 truncate">{user.username}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              {/* 角色标签 */}
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <span>📦</span> {user.projects} 个项目
                </span>
              </div>

              {/* 底部信息 */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    最后登录: {user.lastLogin || '从未'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditRole(user)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      编辑
                    </button>
                    <button className="text-gray-500 hover:text-gray-700">
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  用户
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  角色
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  状态
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  项目数
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  最后登录
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{user.projects}</td>
                  <td className="py-4 px-6 text-gray-500 text-sm">
                    {user.lastLogin || '从未'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRole(user)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        编辑
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 空状态 */}
      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无用户</h3>
          <p className="text-gray-500 mb-4">添加您的第一个用户</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            添加用户
          </button>
        </div>
      )}

      {/* 创建用户弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">添加用户</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入邮箱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option>普通用户</option>
                  <option>管理员</option>
                  <option>超级管理员</option>
                  <option>访客</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
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

      {/* 编辑角色弹窗 */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">编辑用户角色</h3>
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl text-white font-bold">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800">{selectedUser.username}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择角色
              </label>
              <div className="space-y-2">
                {['超级管理员', '管理员', '普通用户', '访客'].map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      defaultChecked={selectedUser.role === role}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{role}</p>
                      <p className="text-xs text-gray-500">
                        {role === '超级管理员' && '拥有系统所有权限'}
                        {role === '管理员' && '拥有大部分管理权限'}
                        {role === '普通用户' && '可以使用大部分功能'}
                        {role === '访客' && '只有查看权限'}
                      </p>
                    </div>
                  </label>
                ))}
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
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// 项目类型
interface Project {
  id: string
  name: string
  description: string
  owner: string
  members: number
  components: number
  pages: number
  status: '草稿' | '进行中' | '已完成' | '已归档'
  createdAt: string
  updatedAt: string
  thumbnail?: string
}

// 模拟数据
const mockProjects: Project[] = [
  {
    id: '1',
    name: '电商后台管理系统',
    description: '包含商品管理、订单管理、用户管理等功能的后台系统',
    owner: '张三',
    members: 5,
    components: 128,
    pages: 15,
    status: '进行中',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'CRM 客户管理系统',
    description: '客户关系管理系统，包含线索、商机、合同等功能',
    owner: '李四',
    members: 3,
    components: 256,
    pages: 22,
    status: '已完成',
    createdAt: '2023-12-15',
    updatedAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'OA 办公自动化系统',
    description: '企业办公自动化系统，包含审批、考勤、文档等功能',
    owner: '王五',
    members: 8,
    components: 89,
    pages: 12,
    status: '草稿',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-13',
  },
  {
    id: '4',
    name: '供应链管理系统',
    description: '采购、库存、物流等供应链全流程管理',
    owner: '赵六',
    members: 4,
    components: 178,
    pages: 18,
    status: '进行中',
    createdAt: '2023-11-20',
    updatedAt: '2024-01-14',
  },
  {
    id: '5',
    name: '人力资源管理系统',
    description: '招聘、培训、绩效、薪酬等人力资源全模块管理',
    owner: '钱七',
    members: 6,
    components: 312,
    pages: 28,
    status: '已完成',
    createdAt: '2023-10-01',
    updatedAt: '2024-01-05',
  },
  {
    id: '6',
    name: '财务管理系统',
    description: '会计核算、预算管理、资金管理等财务功能',
    owner: '孙八',
    members: 2,
    components: 145,
    pages: 16,
    status: '已归档',
    createdAt: '2023-06-01',
    updatedAt: '2023-12-31',
  },
]

// 状态选项
const statusOptions = ['全部', '草稿', '进行中', '已完成', '已归档']

export default function ProjectsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedStatus, setSelectedStatus] = useState('全部')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  // 过滤项目
  const filteredProjects = mockProjects.filter((project) => {
    const matchStatus = selectedStatus === '全部' || project.status === selectedStatus
    const matchKeyword = project.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      project.description.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchStatus && matchKeyword
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-700'
      case '进行中':
        return 'bg-blue-100 text-blue-700'
      case '草稿':
        return 'bg-gray-100 text-gray-700'
      case '已归档':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return
    // TODO: 调用创建项目 API
    console.log('创建项目:', { name: newProjectName, description: newProjectDesc })
    setShowCreateModal(false)
    setNewProjectName('')
    setNewProjectDesc('')
    router.push('/editor/new')
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">项目管理</h1>
          <p className="text-gray-500 mt-1">管理您的所有画布项目</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建项目</span>
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
                placeholder="搜索项目名称或描述..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
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

      {/* 项目列表/网格 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/editor/${project.id}`)}
            >
              {/* 缩略图 */}
              <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-6xl opacity-50">📁</span>
              </div>

              {/* 内容 */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-800 truncate">{project.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {project.description}
                </p>

                {/* 统计信息 */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <span>📦</span> {project.components}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📄</span> {project.pages}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>👥</span> {project.members}
                  </span>
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                      {project.owner[0]}
                    </div>
                    <span className="text-sm text-gray-600">{project.owner}</span>
                  </div>
                  <span className="text-xs text-gray-400">{project.updatedAt}</span>
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
                  项目名称
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  状态
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  组件
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  页面
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  成员
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  负责人
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  更新日期
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/editor/${project.id}`)}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg mr-3">
                        📁
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{project.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{project.components}</td>
                  <td className="py-4 px-6 text-gray-600">{project.pages}</td>
                  <td className="py-4 px-6 text-gray-600">{project.members}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                        {project.owner[0]}
                      </div>
                      <span className="text-sm text-gray-600">{project.owner}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm">{project.updatedAt}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        编辑
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                        更多
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
      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无项目</h3>
          <p className="text-gray-500 mb-4">创建您的第一个项目开始吧</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            新建项目
          </button>
        </div>
      )}

      {/* 创建项目弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新建项目</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  项目名称
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入项目名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  项目描述
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="请输入项目描述（可选）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

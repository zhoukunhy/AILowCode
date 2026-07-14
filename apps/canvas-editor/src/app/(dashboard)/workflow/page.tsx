'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient as api } from '@/lib/api'


interface WorkflowListProps {
  processes: { id: string; name: string; description?: string; status: string; createdAt: string }[]
  total: number
  page: number
  pageSize: number
}

export default function WorkflowListPage() {
  const [workflows, setWorkflows] = useState<WorkflowListProps>({
    processes: [],
    total: 0,
    page: 1,
    pageSize: 10,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      const url = `/workflow/processes?page=${workflows.page}&pageSize=${workflows.pageSize}`
      const res = await api.get(url)
      const response = res as unknown as { data?: { items: any[]; total: number; page: number; pageSize: number } }
      if (response?.data?.items) {
        setWorkflows({
          processes: response.data.items,
          total: response.data.total || 0,
          page: response.data.page || 1,
          pageSize: response.data.pageSize || 10,
        })
      }
    } catch {
      console.error('Failed to fetch workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除流程 "${name}" 吗？`)) return

    try {
      await api.delete(`/workflow/processes/${id}`)
      setWorkflows((prev) => ({
        ...prev,
        processes: prev.processes.filter((p) => p.id !== id),
        total: prev.total - 1,
      }))
    } catch (error) {
      console.error('Failed to delete workflow:', error)
    }
  }

  const handlePageChange = (page: number) => {
    setWorkflows((prev) => ({ ...prev, page }))
    fetchWorkflows()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">流程编排</h1>
          <p className="text-gray-500 mt-1">管理和设计业务审批流程</p>
        </div>
        <Link
          href="/workflow/new"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + 新建流程
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  流程名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workflows.processes.map((process) => (
                <tr key={process.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/workflow/${process.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {process.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {process.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      process.status === 'active' ? 'bg-green-100 text-green-700' :
                      process.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {process.status === 'active' ? '已启用' :
                       process.status === 'inactive' ? '已禁用' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {new Date(process.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/workflow/${process.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </Link>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDelete(process.id, process.name)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {workflows.total > workflows.pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              显示 {((workflows.page - 1) * workflows.pageSize) + 1} - {Math.min(workflows.page * workflows.pageSize, workflows.total)} 条，共 {workflows.total} 条
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(workflows.page - 1)}
                disabled={workflows.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {Array.from({ length: Math.ceil(workflows.total / workflows.pageSize) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === workflows.page
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(workflows.page + 1)}
                disabled={workflows.page >= Math.ceil(workflows.total / workflows.pageSize)}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
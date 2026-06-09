'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Eye, Edit2, Trash2, Copy, FileText, Calendar, Grid3x3 } from 'lucide-react'
import { pageApi, projectApi } from '@/lib/api'

interface PageItem {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface ProjectDetail {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams<{ projectId: string }>()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      if (!params.projectId) return
      setLoading(true)
      try {
        const [projectRes, pagesRes] = await Promise.all([
          projectApi.getProject(params.projectId),
          pageApi.getPages(params.projectId),
        ])
        setProject(projectRes as ProjectDetail)
        setPages((pagesRes as any).list || [])
        setError('')
      } catch (err) {
        setError('加载项目信息失败')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.projectId])

  const handleNewPage = () => {
    router.push(`/editor/new?projectId=${params.projectId}`)
  }

  const handleViewPage = (pageId: string) => {
    router.push(`/editor/${pageId}?projectId=${params.projectId}&mode=view`)
  }

  const handleEditPage = (pageId: string) => {
    router.push(`/editor/${pageId}?projectId=${params.projectId}`)
  }

  const handleDuplicatePage = async (_pageId: string, name: string) => {
    try {
      const newName = `${name} (副本)`
      await pageApi.createPage(params.projectId!, newName)
      setPages(prev => [...prev, { id: Date.now().toString(), name: newName, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
    } catch {
      alert('复制页面失败')
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('确定要删除这个页面吗？')) return
    try {
      await pageApi.deletePage(params.projectId!, pageId)
      setPages(prev => prev.filter(p => p.id !== pageId))
    } catch {
      alert('删除页面失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{project?.description || '暂无描述'}</p>
            </div>
          </div>
          <button
            onClick={handleNewPage}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建画布
          </button>
        </div>

        {/* 项目信息卡片 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-blue-600" />
            项目概览
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{pages.length}</div>
              <div className="text-sm text-gray-500">画布数量</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">活跃</div>
              <div className="text-sm text-gray-500">状态</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                {new Date(project?.createdAt || '').toLocaleDateString('zh-CN')}
              </div>
              <div className="text-sm text-gray-500">创建时间</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                {new Date(project?.updatedAt || '').toLocaleDateString('zh-CN')}
              </div>
              <div className="text-sm text-gray-500">更新时间</div>
            </div>
          </div>
        </div>

        {/* 画布列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              画布列表
            </h2>
          </div>
          
          {pages.length === 0 ? (
            <div className="py-12 text-center">
              <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无画布</p>
              <button
                onClick={handleNewPage}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建第一个画布
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{page.name}</h3>
                      <p className="text-sm text-gray-500">
                        更新于 {new Date(page.updatedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewPage(page.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                      title="预览"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditPage(page.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicatePage(page.id, page.name)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                      title="复制"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
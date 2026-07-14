'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 画布类型
interface CanvasItem {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  componentCount: number
  menuName?: string
  dataModel?: string
  status: 'draft' | 'published' | 'archived'
}

interface MenuItem {
  id: string
  name: string
  parentId?: string
  mountable?: boolean
}

// 数据模型类型
interface DataModel {
  id: string
  name: string
  type: string
}

export default function CanvasManagementPage() {
  const router = useRouter()
  const [canvases, setCanvases] = useState<CanvasItem[]>([])
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'menu' | 'dataModel' | null>(null)
  const [selectedCanvas, setSelectedCanvas] = useState<CanvasItem | null>(null)
  const [selectedMenuId, setSelectedMenuId] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')
  
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchCanvases()
  }, [searchKeyword, statusFilter, currentPage, pageSize])

  useEffect(() => {
    fetchMenus()
    fetchDataModels()
  }, [])

  const fetchCanvases = async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('pageSize', String(pageSize))
      if (searchKeyword) params.set('name', searchKeyword)
      if (statusFilter) params.set('status', statusFilter)
      
      const response = await fetch(`http://localhost:3002/api/canvas-pages?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const result = await response.json()
        const pageList = result.data?.list || result.data || []
        setTotal(result.data?.total || 0)
        const mappedCanvases: CanvasItem[] = pageList.map((page: any) => ({
          id: String(page.id),
          name: page.name || '未命名页面',
          description: page.description || `画布 ${page.id}`,
          createdAt: page.createdAt ? new Date(page.createdAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
          updatedAt: page.updatedAt ? new Date(page.updatedAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
          componentCount: page.canvasJson?.length || 0,
          menuName: page.menuName || '',
          dataModel: page.dataModel || '',
          status: page.status || 'draft',
        }))
        setCanvases(mappedCanvases)
      } else {
        console.error('获取画布列表失败:', response.status)
        setCanvases([])
        setTotal(0)
      }
    } catch (error) {
      console.error('获取画布列表失败:', error)
      setCanvases([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/menus', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        // 只显示可挂载的菜单
        const allMenus = data.data || []
        const mountableMenus = allMenus.filter((menu: any) => menu.mountable !== false)
        setMenus(mountableMenus)
      }
    } catch (error) {
      console.error('获取菜单列表失败:', error)
      setMenus([
        { id: '1', name: '首页', parentId: undefined, mountable: true },
        { id: '2', name: '用户管理', parentId: undefined, mountable: true },
        { id: '3', name: '订单管理', parentId: undefined, mountable: true },
        { id: '4', name: '数据统计', parentId: undefined, mountable: true },
        { id: '5', name: '产品管理', parentId: undefined, mountable: true },
      ])
    }
  }

  const fetchDataModels = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/data-source', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setDataModels((data.data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.type || 'database'
        })))
      }
    } catch (error) {
      console.error('获取数据模型失败:', error)
      setDataModels([
        { id: '1', name: '用户数据', type: 'MySQL' },
        { id: '2', name: '用户模型', type: 'MySQL' },
        { id: '3', name: '订单数据', type: 'MySQL' },
        { id: '4', name: '统计数据', type: 'API' },
        { id: '5', name: '产品模型', type: 'MySQL' },
      ])
    }
  }

  // 编辑画布
  const handleEdit = (canvas: CanvasItem) => {
    router.push(`/editor/${canvas.id}`)
  }

  // 拷贝画布
  const handleCopy = async (canvas: CanvasItem) => {
    try {
      const response = await fetch(`http://localhost:3002/api/canvas-pages/${canvas.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ newName: `${canvas.name} (副本)` }),
      })
      if (response.ok) {
        const result = await response.json()
        if (result.code === 200) {
          fetchCanvases()
        } else {
          alert('拷贝失败: ' + (result.msg || '未知错误'))
        }
      } else {
        alert(`拷贝失败: HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('拷贝画布失败:', error)
      alert('拷贝失败: 网络错误')
    }
  }

  // 删除画布
  const handleDelete = async (canvasId: string) => {
    if (confirm('确定要删除这个画布吗？')) {
      try {
        const response = await fetch(`http://localhost:3002/api/canvas-pages/${canvasId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (response.ok) {
          const result = await response.json()
          if (result.code === 200) {
            setCanvases(canvases.filter(c => c.id !== canvasId))
          } else {
            alert('删除失败: ' + (result.msg || '未知错误'))
          }
        } else {
          alert(`删除失败: HTTP ${response.status}`)
        }
      } catch (error) {
        console.error('删除画布失败:', error)
        alert('删除失败: 网络错误')
      }
    }
  }

  // 打开挂载菜单弹窗
  const openMenuModal = (canvas: CanvasItem) => {
    setSelectedCanvas(canvas)
    setSelectedMenuId(canvas.menuName ? menus.find(m => m.name === canvas.menuName)?.id || '' : '')
    setActiveModal('menu')
  }

  // 打开关联数据模型弹窗
  const openDataModelModal = (canvas: CanvasItem) => {
    setSelectedCanvas(canvas)
    setSelectedModelId(canvas.dataModel ? dataModels.find(m => m.name === canvas.dataModel)?.id || '' : '')
    setActiveModal('dataModel')
  }

  // 保存菜单关联
  const saveMenuAssociation = async () => {
    if (!selectedCanvas || !selectedMenuId) return
    
    try {
      await fetch(`http://localhost:3002/api/menus/${selectedMenuId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ pageId: selectedCanvas.id }),
      })
      
      setCanvases(canvases.map(c => 
        c.id === selectedCanvas.id 
          ? { ...c, menuName: menus.find(m => m.id === selectedMenuId)?.name || '' }
          : c
      ))
    } catch (error) {
      console.error('关联菜单失败:', error)
    }
    
    setActiveModal(null)
    setSelectedCanvas(null)
  }

  // 保存数据模型关联
  const saveDataModelAssociation = async () => {
    if (!selectedCanvas || !selectedModelId) return
    
    try {
      await fetch(`http://localhost:3002/api/canvas-pages/${selectedCanvas.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          name: selectedCanvas.name,
          dataModel: dataModels.find(m => m.id === selectedModelId)?.name || '' 
        }),
      })
      
      setCanvases(canvases.map(c => 
        c.id === selectedCanvas.id 
          ? { ...c, dataModel: dataModels.find(m => m.id === selectedModelId)?.name || '' }
          : c
      ))
    } catch (error) {
      console.error('关联数据模型失败:', error)
    }
    
    setActiveModal(null)
    setSelectedCanvas(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700'
      case 'draft':
        return 'bg-yellow-100 text-yellow-700'
      case 'archived':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return '已发布'
      case 'draft':
        return '草稿'
      case 'archived':
        return '已归档'
      default:
        return status
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* 固定头部 */}
      <div className="flex-shrink-0 p-6 pb-0">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">画布管理</h1>
          <p className="text-gray-500 mt-1">管理和维护系统中的画布页面</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索画布..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已归档</option>
            </select>
          </div>
          <button
            onClick={() => router.push('/editor/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            <span>新建画布</span>
          </button>
        </div>
      </div>

      {/* 可滚动区域 */}
      <div className="flex-1 px-6 pb-6 flex flex-col min-h-0">
        {/* 画布列表容器 - 可滚动 */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">画布名称</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">描述</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">组件数</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">关联菜单</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">数据模型</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">状态</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">更新时间</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {canvases.map((canvas) => (
                <tr key={canvas.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg mr-3">
                        🎨
                      </div>
                      <span className="font-medium text-gray-800">{canvas.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm max-w-xs truncate" title={canvas.description}>
                    {canvas.description || '-'}
                  </td>
                  <td className="py-4 px-6 text-gray-600">{canvas.componentCount}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {canvas.menuName || '-'}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {canvas.dataModel || '-'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(canvas.status)}`}>
                      {getStatusLabel(canvas.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm">{canvas.updatedAt}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(canvas)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleCopy(canvas)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="拷贝"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => openMenuModal(canvas)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="挂载菜单"
                      >
                        📌
                      </button>
                      <button
                        onClick={() => openDataModelModal(canvas)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="关联数据模型"
                      >
                        📊
                      </button>
                      <button
                        onClick={() => handleDelete(canvas.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && canvases.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <p>暂无画布数据</p>
          </div>
        )}
        </div>

        {/* 分页 - 固定在底部 */}
        {!loading && total > pageSize && (
          <div className="mt-4 px-6 py-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between flex-shrink-0">
            <span className="text-sm text-gray-500">
              共 {total} 条，显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} 条
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← 上一页
              </button>
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(total / pageSize), currentPage + 1))}
                disabled={currentPage === Math.ceil(total / pageSize)}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 挂载菜单弹窗 */}
      {activeModal === 'menu' && selectedCanvas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">挂载菜单</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">为画布「{selectedCanvas.name}」选择要挂载的菜单：</p>
              <select
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">选择菜单</option>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.parentId ? `└ ${menu.name}` : menu.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveMenuAssociation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认挂载
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关联数据模型弹窗 */}
      {activeModal === 'dataModel' && selectedCanvas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">关联数据模型</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">为画布「{selectedCanvas.name}」选择要关联的数据模型：</p>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">选择数据模型</option>
                {dataModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveDataModelAssociation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认关联
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

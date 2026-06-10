'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MenuItem {
  id: string
  name: string
  icon?: string
  path?: string
  parentId?: string
  sortOrder: number
  status: boolean
  description?: string
  pageId?: string
  createdAt: string
  updatedAt: string
}

export default function MenuManagementPage() {
  const router = useRouter()
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    path: '',
    parentId: '',
    sortOrder: 0,
    status: true,
    description: '',
    pageId: '',
  })

  const fetchMenus = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3002/api/menus', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMenus(data)
      }
    } catch (error) {
      console.error('获取菜单列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  const handleAddMenu = () => {
    setEditingMenu(null)
    setFormData({
      name: '',
      icon: '',
      path: '',
      parentId: '',
      sortOrder: 0,
      status: true,
      description: '',
      pageId: '',
    })
    setShowModal(true)
  }

  const handleEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      icon: menu.icon || '',
      path: menu.path || '',
      parentId: menu.parentId || '',
      sortOrder: menu.sortOrder,
      status: menu.status,
      description: menu.description || '',
      pageId: menu.pageId || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      const url = editingMenu ? `http://localhost:3002/api/menus/${editingMenu.id}` : 'http://localhost:3002/api/menus'
      const method = editingMenu ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        fetchMenus()
      }
    } catch (error) {
      console.error('保存菜单失败:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个菜单吗？')) {
      try {
        const response = await fetch(`http://localhost:3002/api/menus/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (response.ok) {
          fetchMenus()
        }
      } catch (error) {
        console.error('删除菜单失败:', error)
      }
    }
  }

  const handleNavigateToEditor = (menu: MenuItem) => {
    if (menu.pageId) {
      router.push(`/editor/${menu.pageId}`)
    } else {
      router.push('/editor/new')
    }
  }

  const parentMenus = menus.filter(m => !m.parentId)

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">菜单管理</h1>
          <p className="text-gray-500 mt-1">管理系统菜单和页面路由</p>
        </div>
        <button
          onClick={handleAddMenu}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>新增菜单</span>
        </button>
      </div>

      {/* 菜单列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    菜单名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    图标
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    路径
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    父菜单
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    关联页面
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menus.map((menu) => {
                  const parentMenu = parentMenus.find(p => p.id === menu.parentId)
                  return (
                    <tr key={menu.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {menu.parentId && <span className="w-4"></span>}
                          <span className="font-medium text-gray-900">{menu.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xl">{menu.icon}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {menu.path || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {parentMenu?.name || '顶级菜单'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {menu.pageId ? (
                          <button
                            onClick={() => handleNavigateToEditor(menu)}
                            className="text-blue-500 hover:text-blue-700 text-sm underline"
                          >
                            编辑页面
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">未关联</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          menu.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {menu.status ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditMenu(menu)}
                          className="text-blue-500 hover:text-blue-700 mr-3"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(menu.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingMenu ? '编辑菜单' : '新增菜单'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">菜单名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图标</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入emoji图标，如 📊"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">路径</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/dashboard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">父菜单</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">顶级菜单</option>
                  {parentMenus.map((menu) => (
                    <option key={menu.id} value={menu.id}>{menu.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联页面ID</label>
                <input
                  type="text"
                  value={formData.pageId}
                  onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="页面UUID"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">启用</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {editingMenu ? '保存修改' : '创建菜单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
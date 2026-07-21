'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MenuItem {
  id: string
  name: string
  icon?: string
  path?: string
  parentId?: string | null
  sortOrder: number
  status: boolean
  description?: string
  pageId?: string
  mountable?: boolean
  createdAt: string
  updatedAt: string
  children?: MenuItem[]
}

interface PageOption {
  id: string
  name: string
}

export default function MenuManagementPage() {
  const router = useRouter()
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [pages, setPages] = useState<PageOption[]>([])
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    path: '',
    parentId: '',
    sortOrder: 0,
    status: true,
    mountable: true,
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
        const result = await response.json()
        const menuList = result.data || []
        setMenus(buildMenuTree(menuList))
      }
    } catch (error) {
      console.error('获取菜单列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildMenuTree = (menuList: MenuItem[]): MenuItem[] => {
    const menuMap = new Map<string, MenuItem>()
    const rootMenus: MenuItem[] = []

    for (const menu of menuList) {
      menuMap.set(menu.id, { ...menu, children: [] })
    }

    for (const menu of menuList) {
      const item = menuMap.get(menu.id)!
      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId)!
        if (!parent.children) parent.children = []
        parent.children.push(item)
      } else {
        rootMenus.push(item)
      }
    }

    rootMenus.sort((a, b) => a.sortOrder - b.sortOrder)
    for (const menu of rootMenus) {
      menu.children?.sort((a, b) => a.sortOrder - b.sortOrder)
    }

    return rootMenus
  }

  const fetchPages = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/canvas-pages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const result = await response.json()
        const pageList = result.list || result.data || []
        setPages(pageList.map((page: any) => ({
          id: page.id,
          name: page.name,
        })))
      }
    } catch (error) {
      console.error('获取页面列表失败:', error)
    }
  }

  useEffect(() => {
    fetchMenus()
    fetchPages()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAddMenu = (parentId?: string) => {
    setEditingMenu(null)
    setFormData({
      name: '',
      icon: '',
      path: '',
      parentId: parentId || '',
      sortOrder: 0,
      status: true,
      mountable: true,
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
      mountable: menu.mountable !== undefined ? menu.mountable : true,
      description: menu.description || '',
      pageId: menu.pageId || '',
    })
    setShowModal(true)
  }

  const notifyMenuChange = () => {
    const channel = new BroadcastChannel('menu-updates')
    channel.postMessage({ type: 'menu-changed' })
    channel.close()
    localStorage.setItem('menu-update-trigger', Date.now().toString())
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
        notifyMenuChange()
      }
    } catch (error) {
      console.error('保存菜单失败:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个菜单吗？删除后其子菜单将变为顶级菜单。')) {
      try {
        const response = await fetch(`http://localhost:3002/api/menus/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (response.ok) {
          fetchMenus()
          notifyMenuChange()
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

  const renderMenuTree = (items: MenuItem[], depth: number = 0) => {
    return items.map((menu) => {
      const hasChildren = menu.children && menu.children.length > 0
      const isExpanded = expandedIds.has(menu.id)

      return (
        <div key={menu.id}>
          <div
            className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors ${
              menu.status ? 'text-gray-800' : 'text-gray-400'
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleExpand(menu.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <span className="w-4 flex-shrink-0" />}
            
            <span className="text-lg flex-shrink-0">{menu.icon || '📄'}</span>
            
            <span className={`font-medium flex-1 truncate ${!menu.status ? 'line-through' : ''}`}>
              {menu.name}
            </span>
            
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
              menu.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {menu.status ? '启用' : '禁用'}
            </span>

            <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleNavigateToEditor(menu)}
                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                title="编辑页面"
              >
                📝
              </button>
              <button
                onClick={() => handleAddMenu(menu.id)}
                className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                title="添加子菜单"
              >
                +
              </button>
              <button
                onClick={() => handleEditMenu(menu)}
                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                title="编辑菜单"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(menu.id)}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="删除菜单"
              >
                🗑️
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div>
              {renderMenuTree(menu.children!, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  const getAllMenus = (items: MenuItem[]): MenuItem[] => {
    const all: MenuItem[] = []
    for (const item of items) {
      if (!item.parentId) all.push(item)
      if (item.children) {
        all.push(...getAllMenus(item.children))
      }
    }
    return all
  }

  const allMenus = getAllMenus(menus)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">菜单管理</h1>
          <p className="text-gray-500 mt-1">管理系统菜单和页面路由（树形结构）</p>
        </div>
        <button
          onClick={() => handleAddMenu()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>新增菜单</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-gray-600">启用</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
                <span className="text-gray-600">禁用</span>
              </div>
              <div className="flex items-center gap-2">
                <span>▶</span>
                <span className="text-gray-600">点击展开/折叠</span>
              </div>
            </div>
          </div>

          <div className="p-2">
            {menus.length > 0 ? (
              renderMenuTree(menus)
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🌲</div>
                <p>暂无菜单数据</p>
                <p className="text-sm mt-1">点击上方按钮添加菜单</p>
              </div>
            )}
          </div>
        </div>
      )}

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
                  {allMenus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {'└─ '.repeat(getMenuDepth(menu))}{menu.name}
                    </option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">关联页面</label>
                <select
                  value={formData.pageId}
                  onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">不关联页面</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.mountable}
                    onChange={(e) => setFormData({ ...formData, mountable: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">可挂载</span>
                  <span className="text-xs text-gray-400">(允许画布挂载到此菜单)</span>
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

function getMenuDepth(menu: MenuItem): number {
  let depth = 0
  let current = menu
  while (current.parentId) {
    depth++
    current = { parentId: null, id: '', name: '', sortOrder: 0, status: true, createdAt: '', updatedAt: '' }
  }
  return depth
}

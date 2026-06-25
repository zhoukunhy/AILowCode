'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AiAssistantFloatingButton } from '@/components/AiAssistantFloatingButton'

interface MenuItem {
  id: string
  name: string
  icon?: string
  path?: string
  parentId?: string | null
  sortOrder: number
  status: boolean
  children?: MenuItem[]
}

interface UserInfo {
  id: string
  username: string
  email: string
  role: string
}

const defaultMenus: MenuItem[] = [
  {
    id: 'dashboard',
    name: '仪表盘',
    icon: '📊',
    path: '/dashboard',
    parentId: null,
    sortOrder: 1,
    status: true,
  },
  {
    id: 'editor-group',
    name: '画布编辑器',
    icon: '🎨',
    parentId: null,
    sortOrder: 2,
    status: true,
    children: [
      { id: 'editor', name: '画布编辑', icon: '🖼️', path: '/editor', parentId: 'editor-group', sortOrder: 1, status: true },
      { id: 'canvas', name: '画布管理', icon: '�', path: '/canvas', parentId: 'editor-group', sortOrder: 2, status: true },
      { id: 'ai-codegen', name: 'AI代码生成', icon: '💻', path: '/ai-codegen', parentId: 'editor-group', sortOrder: 3, status: true },
      { id: 'knowledge', name: '知识库', icon: '📚', path: '/knowledge', parentId: 'editor-group', sortOrder: 4, status: true },
    ],
  },
  {
    id: 'data-group',
    name: '数据管理',
    icon: '📦',
    parentId: null,
    sortOrder: 3,
    status: true,
    children: [
      { id: 'data-management', name: '数据源管理', icon: '�', path: '/data-management', parentId: 'data-group', sortOrder: 1, status: true },
      { id: 'data-modeling', name: '数据建模', icon: '🔧', path: '/data-modeling', parentId: 'data-group', sortOrder: 2, status: true },
    ],
  },
  {
    id: 'workflow',
    name: '流程编排',
    icon: '🔄',
    path: '/workflow',
    parentId: null,
    sortOrder: 4,
    status: true,
  },
  {
    id: 'system-group',
    name: '系统管理',
    icon: '⚙️',
    parentId: null,
    sortOrder: 5,
    status: true,
    children: [
      { id: 'users', name: '用户管理', icon: '👥', path: '/users', parentId: 'system-group', sortOrder: 1, status: true },
      { id: 'roles', name: '角色权限', icon: '🔐', path: '/roles', parentId: 'system-group', sortOrder: 2, status: true },
      { id: 'menus', name: '菜单管理', icon: '📋', path: '/menus', parentId: 'system-group', sortOrder: 3, status: true },
      { id: 'settings', name: '系统设置', icon: '⚙️', path: '/settings', parentId: 'system-group', sortOrder: 4, status: true },
    ],
  },
  {
    id: 'mcp-group',
    name: 'MCP 管理',
    icon: '🤖',
    parentId: null,
    sortOrder: 6,
    status: true,
    children: [
      { id: 'mcp-tools', name: '工具管理', icon: '🔧', path: '/mcp-tools', parentId: 'mcp-group', sortOrder: 1, status: true },
      { id: 'mcp-prompts', name: '提示词管理', icon: '📝', path: '/mcp-prompts', parentId: 'mcp-group', sortOrder: 2, status: true },
    ],
  },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [selectedMainMenu, setSelectedMainMenu] = useState<string>('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }, [])

  useEffect(() => {
    fetchMenus()

    const channel = new BroadcastChannel('menu-updates')
    channel.onmessage = (event) => {
      if (event.data.type === 'menu-changed') {
        fetchMenus()
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'menu-update-trigger') {
        fetchMenus()
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      channel.close()
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const fetchMenus = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/menus/tree', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const result = await response.json()
        const menuTree = result.data || []
        if (menuTree.length > 0) {
          setMenus(menuTree)
        } else {
          setMenus(defaultMenus)
        }
      } else {
        const listResponse = await fetch('http://localhost:3002/api/menus', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (listResponse.ok) {
          const listResult = await listResponse.json()
          const menuList = listResult.data || []
          if (menuList.length > 0) {
            const tree = buildMenuTree(menuList)
            setMenus(tree)
          } else {
            setMenus(defaultMenus)
          }
        } else {
          setMenus(defaultMenus)
        }
      }
    } catch (error) {
      console.error('获取菜单失败:', error)
      setMenus(defaultMenus)
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const isActive = (path?: string) => {
    if (!path) return false
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const findSelectedMainMenu = () => {
    for (const menu of menus) {
      if (isActive(menu.path)) return menu.id
      if (menu.children) {
        for (const child of menu.children) {
          if (isActive(child.path)) return menu.id
        }
      }
    }
    return menus[0]?.id || ''
  }

  useEffect(() => {
    const selected = findSelectedMainMenu()
    setSelectedMainMenu(selected)
  }, [pathname, menus])

  const getSelectedMainMenuData = () => {
    return menus.find(m => m.id === selectedMainMenu)
  }

  const handleMainMenuClick = (menu: MenuItem) => {
    setSelectedMainMenu(menu.id)
    setIsMobileMenuOpen(false)
    if (menu.path) {
      router.push(menu.path)
    } else if (menu.children && menu.children.length > 0) {
      router.push(menu.children[0].path!)
    }
  }

  const handleSubMenuClick = (menu: MenuItem) => {
    setIsMobileMenuOpen(false)
    if (menu.path) {
      router.push(menu.path)
    }
  }

  const getCurrentMenuLabel = () => {
    for (const menu of menus) {
      if (isActive(menu.path)) return menu.name
      if (menu.children) {
        for (const child of menu.children) {
          if (isActive(child.path)) return child.name
        }
      }
    }
    return '首页'
  }

  return (
    <div className="flex h-screen bg-gray-50 flex-col">
      {/* 顶部导航栏 - 一级菜单 */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4 flex-1">
          <div
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
              🎨
            </div>
            <span className="font-bold text-gray-800">CanvasCode</span>
          </div>

          {/* 一级菜单 */}
          <nav className="flex gap-1 ml-8">
            {menus.map((menu) => {
              const isSelected = selectedMainMenu === menu.id
              return (
                <button
                  key={menu.id}
                  onClick={() => handleMainMenuClick(menu)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={menu.name}
                >
                  <span className="flex items-center gap-2">
                    <span>{menu.icon}</span>
                    <span>{menu.name}</span>
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <span>🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <span>❓</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.username || '用户'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-800">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div
                  onClick={() => {
                    setShowUserMenu(false)
                    router.push('/settings')
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  ⚙️ 个人设置
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  🚪 退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧边栏 - 二级菜单 */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          style={{ top: '64px' }}
          suppressHydrationWarning
        >
          <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">
              {getSelectedMainMenuData()?.name || '菜单'}
            </span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {(() => {
              const mainMenu = getSelectedMainMenuData()
              if (!mainMenu) return null

              if (mainMenu.children && mainMenu.children.length > 0) {
                return mainMenu.children
                  .filter(m => m.status)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSubMenuClick(item)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{item.icon || '📄'}</span>
                      {!isCollapsed && <span className="font-medium">{item.name}</span>}
                    </div>
                  ))
              }

              return (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm">暂无子菜单</p>
                </div>
              )
            })()}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{user?.username || '用户'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.role || '角色'}</p>
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="退出登录"
                >
                  🚪
                </button>
              )}
            </div>
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            style={{ top: '64px' }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* 主内容区 */}
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`} suppressHydrationWarning>
          <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              ☰
            </button>
            <div className="text-sm text-gray-500">
              {getCurrentMenuLabel()}
            </div>
          </div>

          <main className="h-[calc(100vh-64px-48px)] overflow-auto" suppressHydrationWarning>
            {children}
          </main>
        </div>
      </div>

      <AiAssistantFloatingButton />
    </div>
  )
}

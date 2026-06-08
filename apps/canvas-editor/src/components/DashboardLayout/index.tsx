'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AiAssistantFloatingButton } from '@/components/AiAssistantFloatingButton'

// 菜单项类型
interface MenuItem {
  id: string
  label: string
  icon: string
  path: string
  children?: MenuItem[]
}

// 用户类型
interface UserInfo {
  id: string
  username: string
  email: string
  role: string
}

// 菜单配置
const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: '📊', path: '/dashboard' },
  { id: 'projects', label: '项目管理', icon: '📁', path: '/projects' },
  { id: 'editor', label: '画布编辑', icon: '🎨', path: '/editor' },
  { id: 'ai-codegen', label: 'AI代码生成', icon: '💻', path: '/ai-codegen' },
  { id: 'knowledge', label: '知识库', icon: '📚', path: '/knowledge' },
  { id: 'users', label: '用户管理', icon: '👥', path: '/users' },
  { id: 'roles', label: '角色权限', icon: '🔐', path: '/roles' },
  { id: 'settings', label: '系统设置', icon: '⚙️', path: '/settings' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // 获取用户信息
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

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        suppressHydrationWarning
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                🎨
              </div>
              <span className="font-bold text-gray-800">CanvasCode</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* 菜单 */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setIsMobileMenuOpen(false)
                router.push(item.path)
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* 底部用户信息 */}
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

      {/* 移动端遮罩 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 主内容区 */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`} suppressHydrationWarning>
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              ☰
            </button>
            <div className="text-sm text-gray-500">
              {menuItems.find((item) => isActive(item.path))?.label || '首页'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 搜索 */}
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

            {/* 通知 */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <span>🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* 帮助 */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <span>❓</span>
            </button>

            {/* 用户菜单 */}
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

              {/* 下拉菜单 */}
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

        {/* 页面内容 */}
        <main className="h-[calc(100vh-64px)] overflow-auto" suppressHydrationWarning>
          {children}
        </main>
      </div>

      {/* AI 助手悬浮按钮 */}
      <AiAssistantFloatingButton />
    </div>
  )
}

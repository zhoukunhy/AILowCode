'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 统计数据类型
interface StatCard {
  title: string
  value: string | number
  change: string
  changeType: 'up' | 'down'
  icon: string
  color: string
}

// 最近的画布的类型
interface RecentCanvas {
  id: string
  name: string
  updatedAt: string
  status: '草稿' | '已完成' | '进行中'
  components: number
  menuName?: string
}

// AI 活动记录
interface AIActivity {
  id: string
  action: string
  model: string
  duration: string
  timestamp: string
}

// API 基础地址
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

export default function DashboardPage() {
  const router = useRouter()
  const [recentCanvases, setRecentCanvases] = useState<RecentCanvas[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatCard[]>([
    { title: '画布总数', value: 0, change: '+0%', changeType: 'up', icon: '🎨', color: 'blue' },
    { title: '活跃用户', value: 0, change: '+0%', changeType: 'up', icon: '👥', color: 'green' },
    { title: 'AI 生成次数', value: 0, change: '+0%', changeType: 'up', icon: '🤖', color: 'purple' },
    { title: '知识库文档', value: 0, change: '+0%', changeType: 'up', icon: '📚', color: 'orange' },
  ])
  const [aiActivities, setAiActivities] = useState<AIActivity[]>([])

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setStats([
            { title: '画布总数', value: data.canvasCount || 0, change: data.canvasChange || '+0%', changeType: data.canvasChange?.startsWith('-') ? 'down' : 'up', icon: '🎨', color: 'blue' },
            { title: '活跃用户', value: data.activeUsers || 0, change: data.usersChange || '+0%', changeType: data.usersChange?.startsWith('-') ? 'down' : 'up', icon: '👥', color: 'green' },
            { title: 'AI 生成次数', value: data.aiGenerationCount || 0, change: data.aiChange || '+0%', changeType: data.aiChange?.startsWith('-') ? 'down' : 'up', icon: '🤖', color: 'purple' },
            { title: '知识库文档', value: data.knowledgeDocCount || 0, change: data.knowledgeChange || '+0%', changeType: data.knowledgeChange?.startsWith('-') ? 'down' : 'up', icon: '📚', color: 'orange' },
          ])
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }

    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/dashboard/activities?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setAiActivities(data.activities || [])
        }
      } catch (error) {
        console.error('获取 AI 活动记录失败:', error)
      }
    }

    fetchStats()
    fetchActivities()
  }, [])

  // 获取最近创建的画布 - 延迟加载避免阻塞页面渲染
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecentCanvases()
    }, 200) // 延迟200ms加载，让页面先渲染
    
    return () => clearTimeout(timer)
  }, [])

  const fetchRecentCanvases = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/menus?sort=createdAt&order=desc&limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        // 将菜单数据映射为画布数据
        const canvases: RecentCanvas[] = (data.data || []).slice(0, 5).map((menu: any, index: number) => ({
          id: menu.pageId || `canvas-${index}`,
          name: menu.name,
          updatedAt: new Date(menu.createdAt).toLocaleString('zh-CN'),
          status: menu.status ? '进行中' : '草稿',
          components: 0,
          menuName: menu.name,
        }))
        setRecentCanvases(canvases)
      }
    } catch (error) {
      console.error('获取画布列表失败:', error)
      // 使用默认数据
      setRecentCanvases([
        { id: '1', name: '首页画布', updatedAt: '2024-01-15 10:30', status: '进行中', components: 45, menuName: '首页' },
        { id: '2', name: '用户管理画布', updatedAt: '2024-01-14 16:20', status: '已完成', components: 128, menuName: '用户管理' },
        { id: '3', name: '仪表盘画布', updatedAt: '2024-01-13 09:15', status: '草稿', components: 12, menuName: '仪表盘' },
        { id: '4', name: '订单管理画布', updatedAt: '2024-01-12 14:45', status: '进行中', components: 67, menuName: '订单管理' },
        { id: '5', name: '数据统计画布', updatedAt: '2024-01-11 11:00', status: '已完成', components: 89, menuName: '数据统计' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-700'
      case '进行中':
        return 'bg-blue-100 text-blue-700'
      case '草稿':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500'
      case 'green':
        return 'bg-green-500'
      case 'purple':
        return 'bg-purple-500'
      case 'orange':
        return 'bg-orange-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来！以下是系统概览。</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {typeof stat.value === 'number' 
                    ? stat.value.toLocaleString() 
                    : stat.value}
                </p>
                <div className="flex items-center mt-2">
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">较上周</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl ${getColorClasses(stat.color)} flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近创建的画布 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">最近创建的画布</h2>
            <button
              onClick={() => router.push('/menus')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              查看全部 →
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">画布名称</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">关联菜单</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">状态</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">创建时间</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCanvases.map((canvas) => (
                    <tr
                      key={canvas.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg mr-3">
                            🎨
                          </div>
                          <span className="font-medium text-gray-800">{canvas.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{canvas.menuName || '-'}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            canvas.status
                          )}`}
                        >
                          {canvas.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-sm">{canvas.updatedAt}</td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => router.push(`/editor/${canvas.id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* AI 活动记录 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">AI 活动</h2>
          </div>
          <div className="p-4">
            {aiActivities.length === 0 ? (
              <div className="text-center text-gray-500 py-8">暂无 AI 活动记录</div>
            ) : (
              aiActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start py-3 border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm mr-3 flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {activity.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.model}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{activity.duration}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">{activity.timestamp}</span>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              查看全部活动 →
            </button>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/menus')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-xl">
            ➕
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-800">新建画布</p>
            <p className="text-xs text-gray-500">创建新画布页面</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/knowledge')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-xl">
            📚
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-800">知识库</p>
            <p className="text-xs text-gray-500">管理 RAG 知识库</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/users')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-xl">
            👥
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-800">用户管理</p>
            <p className="text-xs text-gray-500">管理系统用户</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/settings')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-xl">
            ⚙️
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-800">系统设置</p>
            <p className="text-xs text-gray-500">配置系统参数</p>
          </div>
        </button>
      </div>
    </div>
  )
}

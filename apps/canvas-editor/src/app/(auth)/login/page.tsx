'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 默认账号配置
const DEFAULT_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: '超级管理员', email: 'admin@example.com' },
  { username: 'user', password: 'user123', role: '普通用户', email: 'user@example.com' },
  { username: 'guest', password: 'guest123', role: '访客', email: 'guest@example.com' },
]

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 确保组件只在客户端渲染
  useEffect(() => {
    setMounted(true)
    // 检查是否已登录
    const token = localStorage.getItem('token')
    if (token) {
      router.replace('/dashboard')
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!isLogin) {
        // 注册逻辑
        if (formData.password !== formData.confirmPassword) {
          setError('两次密码输入不一致')
          setLoading(false)
          return
        }
        if (formData.password.length < 6) {
          setError('密码长度至少6位')
          setLoading(false)
          return
        }
        // 模拟注册成功
        const newUser = {
          id: Date.now().toString(),
          username: formData.username,
          email: formData.email,
          role: '普通用户',
        }
        localStorage.setItem('token', `token-${Date.now()}`)
        localStorage.setItem('user', JSON.stringify(newUser))
        router.push('/dashboard')
        return
      }

      // 登录逻辑 - 验证默认账号
      const username = formData.username.trim()
      const password = formData.password.trim()
      
      console.log('登录尝试:', { username, password })
      console.log('默认账号:', DEFAULT_ACCOUNTS)
      
      const account = DEFAULT_ACCOUNTS.find(
        (acc) => acc.username === username && acc.password === password
      )

      console.log('匹配结果:', account)

      if (account) {
        // 登录成功
        const user = {
          id: Date.now().toString(),
          username: account.username,
          email: account.email,
          role: account.role,
        }
        localStorage.setItem('token', `token-${Date.now()}`)
        localStorage.setItem('user', JSON.stringify(user))
        router.push('/dashboard')
      } else {
        setError('用户名或密码错误')
      }
    } catch (err) {
      setError('操作失败，请重试')
      console.error('登录错误:', err)
    } finally {
      setLoading(false)
    }
  }

  // 服务端渲染时显示加载状态
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-xl mb-4">
            <span className="text-3xl">🎨</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">CanvasCode</h1>
          <p className="text-gray-500 mt-1">AI 智能低代码画布平台</p>
        </div>

        {/* 标签页切换 */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError('') }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              isLogin
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError('') }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              !isLogin
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            注册
          </button>
        </div>

        {/* 默认账号提示 */}
        {isLogin && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-1">测试账号：</p>
            <div className="text-blue-600 space-y-1">
              <p>管理员: admin / admin123</p>
              <p>用户: user / user123</p>
              <p>访客: guest / guest123</p>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600 mb-2">快速登录：</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, username: 'admin', password: 'admin123' })
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  管理员
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, username: 'user', password: 'user123' })
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  普通用户
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, username: 'guest', password: 'guest123' })
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  访客
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="请输入用户名"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="请输入邮箱"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="请输入密码"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="请再次输入密码"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        {/* 第三方登录 */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button 
              type="button"
              className="flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>🌐</span>
              <span className="text-sm text-gray-600">GitHub</span>
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>📧</span>
              <span className="text-sm text-gray-600">企业微信</span>
            </button>
          </div>
        </div>

        {/* 忘记密码 */}
        {isLogin && (
          <div className="mt-4 text-center">
            <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
              忘记密码？
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

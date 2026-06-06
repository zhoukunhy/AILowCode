'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 检查是否已登录
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h1 className="text-2xl font-bold text-gray-800">CanvasCode</h1>
        <p className="text-gray-500 mt-2">AI 智能低代码画布平台</p>
        <p className="text-gray-400 mt-4">加载中...</p>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { RuntimeRenderer } from '@/components/RuntimeRenderer'
import '@/components/RuntimeRenderer/renderers'

interface CanvasData {
  components: any[]
  currentPage: any
}

export default function RuntimePage() {
  const params = useParams<{ pageId: string }>()
  const pageId = params.pageId
  
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCanvasData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        if (!token) {
          throw new Error('未登录')
        }

        const response = await fetch(`/api/canvas-pages/${pageId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('获取画布数据失败')
        }

        const data = await response.json()
        const result = data.data || data
        
        setCanvasData({
          components: Array.isArray(result.canvasJson) ? result.canvasJson : [],
          currentPage: {
            backgroundColor: result.backgroundColor || '#ffffff',
            width: result.width || 1920,
            height: result.height || 1080,
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }

    if (pageId) {
      fetchCanvasData()
    }
  }, [pageId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">
          <div className="text-4xl mb-4">❌</div>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!canvasData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">
          <div className="text-4xl mb-4">📋</div>
          <p>暂无数据</p>
        </div>
      </div>
    )
  }

  return <RuntimeRenderer components={canvasData.components} currentPage={canvasData.currentPage} />
}
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

interface PerformanceMetrics {
  fps: number
  componentCount: number
  visibleCount: number
  renderTime: number
  memoryUsage: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    componentCount: 0,
    visibleCount: 0,
    renderTime: 0,
    memoryUsage: 0,
  })
  
  const frameTimes = useRef<number[]>([])
  const lastTime = useRef<number>(0)
  const components = useCanvasStore((state) => state.components)

  useEffect(() => {
    const measurePerformance = (timestamp: number) => {
      if (lastTime.current > 0) {
        const frameTime = timestamp - lastTime.current
        frameTimes.current.push(frameTime)
        
        // 只保留最近60帧的数据
        if (frameTimes.current.length > 60) {
          frameTimes.current.shift()
        }
        
        // 计算平均帧率
        const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length
        const fps = Math.round(1000 / avgFrameTime)
        
        // 估算渲染时间
        const renderTime = Math.round(avgFrameTime * 100) / 100
        
        // 估算内存使用
        const memoryUsage = typeof performance !== 'undefined' && (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0
        
        setMetrics(prev => ({
          ...prev,
          fps,
          renderTime,
          memoryUsage,
          componentCount: components.length,
        }))
      }
      
      lastTime.current = timestamp
      requestAnimationFrame(measurePerformance)
    }
    
    const animationId = requestAnimationFrame(measurePerformance)
    
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [components.length])

  const getFpsColor = () => {
    if (metrics.fps >= 55) return 'text-green-500'
    if (metrics.fps >= 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getMemoryColor = () => {
    if (metrics.memoryUsage < 100) return 'text-green-500'
    if (metrics.memoryUsage < 200) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/90 text-white px-4 py-2 rounded-lg text-xs font-mono backdrop-blur-sm z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">FPS:</span>
          <span className={getFpsColor()}>{metrics.fps}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">组件:</span>
          <span className="text-blue-400">{metrics.componentCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">渲染:</span>
          <span className="text-purple-400">{metrics.renderTime}ms</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">内存:</span>
          <span className={getMemoryColor()}>{metrics.memoryUsage}MB</span>
        </div>
      </div>
    </div>
  )
}
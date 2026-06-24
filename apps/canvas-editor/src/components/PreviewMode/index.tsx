'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import type { ComponentConfig, PageConfig } from '@/store/canvasStore'

interface PreviewModeProps {
  onClose: () => void
  projectId: string
}

export function PreviewMode({ onClose, projectId }: PreviewModeProps) {
  const components = useCanvasStore((state) => state.components)
  const currentPage = useCanvasStore((state) => state.currentPage)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const deviceSizes = {
    desktop: { width: '100%', height: '100%', label: '桌面端' },
    tablet: { width: '768px', height: '1024px', label: '平板' },
    mobile: { width: '375px', height: '667px', label: '手机' },
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const currentDevice = deviceSizes[previewMode]

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col" ref={containerRef}>
      {/* 顶部工具栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-medium">页面预览</h2>
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            {Object.entries(deviceSizes).map(([mode, config]) => (
              <button
                key={mode}
                onClick={() => {
                  setPreviewMode(mode as any)
                  setZoom(100)
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  previewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 缩放控制 */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="px-2 py-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
              disabled={zoom <= 50}
            >
              −
            </button>
            <span className="px-2 text-gray-300 text-sm min-w-[3rem] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="px-2 py-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
              disabled={zoom >= 150}
            >
              +
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors text-xs"
            >
              重置
            </button>
          </div>

          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>🔄</span>
            <span className="text-sm">刷新</span>
          </button>

          {/* 全屏按钮 */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors flex items-center gap-1"
          >
            {isFullscreen ? <span>⛶</span> : <span>⛶</span>}
            <span className="text-sm">{isFullscreen ? '退出全屏' : '全屏'}</span>
          </button>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
          >
            <span>✕</span>
            <span className="text-sm">关闭</span>
          </button>
        </div>
      </div>

      {/* 预览内容区域 */}
      <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-8">
        <div
          className="bg-white shadow-2xl transition-all duration-300"
          style={{
            width: currentDevice.width,
            height: currentDevice.height,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
        >
          {/* 设备框架 */}
          {previewMode === 'mobile' && (
            <div className="relative w-full h-full bg-black rounded-[3rem] p-3">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-10" />
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                <PreviewContent components={components} currentPage={currentPage} refreshKey={refreshKey} />
              </div>
            </div>
          )}
          {previewMode === 'tablet' && (
            <div className="relative w-full h-full bg-black rounded-2xl p-4">
              <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                <PreviewContent components={components} currentPage={currentPage} refreshKey={refreshKey} />
              </div>
            </div>
          )}
          {previewMode === 'desktop' && (
            <div className="w-full h-full bg-white overflow-auto">
              <PreviewContent components={components} currentPage={currentPage} refreshKey={refreshKey} />
            </div>
          )}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>组件数量: {components.length}</span>
          <span>画布尺寸: {currentPage.width} × {currentPage.height}</span>
          <span>设备: {currentDevice.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>缩放: {zoom}%</span>
          <span>项目ID: {projectId}</span>
        </div>
      </div>
    </div>
  )
}

interface PreviewContentProps {
  components: ComponentConfig[]
  currentPage: PageConfig
  refreshKey: number
}

function PreviewContent({ components, currentPage, refreshKey }: PreviewContentProps) {
  return (
    <div
      key={refreshKey}
      className="relative w-full h-full"
      style={{
        backgroundColor: currentPage.backgroundColor,
        minWidth: currentPage.width,
        minHeight: currentPage.height,
      }}
    >
      {components.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <p>暂无组件</p>
          </div>
        </div>
      ) : (
        components.map((component) => (
          <div
            key={component.id}
            className="absolute"
            style={{
              left: component.x,
              top: component.y,
              width: component.width,
              height: component.height,
              zIndex: component.zIndex,
              opacity: component.opacity,
              transform: `rotate(${component.rotation}deg)`,
              visibility: component.visible ? 'visible' : 'hidden',
            }}
          >
            {/* 简化的预览渲染 */}
            <div className="w-full h-full bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-sm text-blue-600">
              {component.type}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
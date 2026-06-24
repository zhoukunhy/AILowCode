'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import type { ComponentConfig } from '@/store/canvasStore'

interface DeviceConfig {
  id: string
  name: string
  width: number
  height: number
  icon: string
  scale: number
}

const DEVICES: DeviceConfig[] = [
  {
    id: 'mobile-s',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    icon: '📱',
    scale: 0.8,
  },
  {
    id: 'mobile-m',
    name: 'iPhone 12',
    width: 390,
    height: 844,
    icon: '📱',
    scale: 0.75,
  },
  {
    id: 'mobile-l',
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    icon: '📱',
    scale: 0.7,
  },
  {
    id: 'tablet',
    name: 'iPad',
    width: 768,
    height: 1024,
    icon: '📲',
    scale: 0.6,
  },
  {
    id: 'desktop',
    name: '桌面端',
    width: 1920,
    height: 1080,
    icon: '🖥️',
    scale: 0.4,
  },
]

interface MobileAdaptationProps {
  onClose: () => void
}

export function MobileAdaptation({ onClose }: MobileAdaptationProps) {
  const components = useCanvasStore((state) => state.components)
  const currentPage = useCanvasStore((state) => state.currentPage)
  const updateComponent = useCanvasStore((state) => state.updateComponent)
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(DEVICES[0])
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(100)

  const currentWidth = orientation === 'portrait' ? selectedDevice.width : selectedDevice.height
  const currentHeight = orientation === 'portrait' ? selectedDevice.height : selectedDevice.width

  const handleComponentClick = (componentId: string) => {
    setSelectedComponentId(componentId)
  }

  const handleComponentStyleChange = (property: string, value: string | number) => {
    if (!selectedComponentId) return
    updateComponent(selectedComponentId, {
      props: {
        ...components.find(c => c.id === selectedComponentId)?.props,
        [property]: value,
      },
    })
  }

  const selectedComponent = components.find(c => c.id === selectedComponentId)

  const renderComponent = (component: ComponentConfig) => {
    const isSelected = selectedComponentId === component.id
    
    return (
      <div
        key={component.id}
        className={`absolute cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-blue-300'
        }`}
        style={{
          left: `${(component.x / currentPage.width) * 100}%`,
          top: `${(component.y / currentPage.height) * 100}%`,
          width: `${(component.width / currentPage.width) * 100}%`,
          height: `${(component.height / currentPage.height) * 100}%`,
          zIndex: component.zIndex,
          opacity: component.opacity,
          transform: `rotate(${component.rotation}deg)`,
          visibility: component.visible ? 'visible' : 'hidden',
        }}
        onClick={() => handleComponentClick(component.id)}
      >
        {/* 简化的组件渲染 */}
        <div className="w-full h-full bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600">
          {component.type}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-medium">移动端适配</h2>
          
          {/* 设备选择 */}
          <div className="flex items-center gap-2">
            {DEVICES.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedDevice.id === device.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{device.icon}</span>
                <span>{device.name}</span>
              </button>
            ))}
          </div>

          {/* 方向切换 */}
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setOrientation('portrait')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                orientation === 'portrait'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              竖屏
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                orientation === 'landscape'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              横屏
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showGrid ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showGrid ? '📐' : '📐'}
            网格
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 设备预览区域 */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-8 overflow-auto">
          <div
            className="bg-black rounded-3xl p-3 shadow-2xl transition-all duration-300"
            style={{
              width: currentWidth * selectedDevice.scale * (zoom / 100),
              height: currentHeight * selectedDevice.scale * (zoom / 100),
            }}
          >
            {/* 设备屏幕 */}
            <div
              className="bg-white rounded-2xl overflow-hidden relative"
              style={{
                width: currentWidth * selectedDevice.scale * (zoom / 100) - 24,
                height: currentHeight * selectedDevice.scale * (zoom / 100) - 24,
              }}
            >
              {/* 网格背景 */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }}
                />
              )}

              {/* 组件渲染 */}
              <div className="relative w-full h-full">
                {components.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📱</div>
                      <p className="text-sm">暂无组件</p>
                    </div>
                  </div>
                ) : (
                  components.map(renderComponent)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-white font-medium mb-4">设备信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>设备名称</span>
                <span className="text-white">{selectedDevice.name}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>屏幕尺寸</span>
                <span className="text-white">
                  {currentWidth} × {currentHeight}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>方向</span>
                <span className="text-white">{orientation === 'portrait' ? '竖屏' : '横屏'}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>缩放比例</span>
                <span className="text-white">{(selectedDevice.scale * zoom / 100).toFixed(2)}x</span>
              </div>
            </div>

            {/* 缩放控制 */}
            <div className="mt-6">
              <h4 className="text-white font-medium mb-3">缩放控制</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="flex-1 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-2 bg-gray-700 text-white rounded min-w-[60px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="flex-1 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* 选中组件属性 */}
            {selectedComponent && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-white font-medium mb-4">组件属性</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">组件类型</label>
                    <div className="px-3 py-2 bg-gray-700 text-white rounded text-sm">
                      {selectedComponent.type}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">宽度 (%)</label>
                    <input
                      type="number"
                      value={((selectedComponent.width / currentPage.width) * 100).toFixed(1)}
                      onChange={(e) => handleComponentStyleChange('width', (parseFloat(e.target.value) / 100) * currentPage.width)}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">高度 (%)</label>
                    <input
                      type="number"
                      value={((selectedComponent.height / currentPage.height) * 100).toFixed(1)}
                      onChange={(e) => handleComponentStyleChange('height', (parseFloat(e.target.value) / 100) * currentPage.height)}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">水平位置 (%)</label>
                    <input
                      type="number"
                      value={((selectedComponent.x / currentPage.width) * 100).toFixed(1)}
                      onChange={(e) => handleComponentStyleChange('x', (parseFloat(e.target.value) / 100) * currentPage.width)}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">垂直位置 (%)</label>
                    <input
                      type="number"
                      value={((selectedComponent.y / currentPage.height) * 100).toFixed(1)}
                      onChange={(e) => handleComponentStyleChange('y', (parseFloat(e.target.value) / 100) * currentPage.height)}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 适配建议 */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-white font-medium mb-4">适配建议</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">💡</span>
                  <span>使用百分比布局而非固定像素</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">💡</span>
                  <span>考虑不同设备的安全区域</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">💡</span>
                  <span>测试触摸交互区域是否足够大</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">💡</span>
                  <span>检查字体大小在小屏幕上的可读性</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
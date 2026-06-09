'use client'

import React from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { PropertyForm } from './PropertyForm'
import { DataSourceBinding } from './DataSourceBinding'
import { DataPreviewPanel } from '../DataPreviewPanel'

export function PropertyPanel() {
  // 使用选择器获取状态，确保正确响应变化
  const selectedId = useCanvasStore((state) => state.selectedId)
  const components = useCanvasStore((state) => state.components)
  const componentList = useCanvasStore((state) => state.componentList)
  const currentPage = useCanvasStore((state) => state.currentPage)
  const updateCurrentPage = useCanvasStore((state) => state.updateCurrentPage)
  const updateComponent = useCanvasStore((state) => state.updateComponent)
  const updateComponentProps = useCanvasStore((state) => state.updateComponentProps)

  const selectedComponent = components.find(c => c.id === selectedId)
  const componentMeta = componentList.find(m => m.type === selectedComponent?.type)

  // 页面设置
  const handlePageSettingChange = (key: string, value: any) => {
    updateCurrentPage({ [key]: value })
  }

  // 组件样式设置
  const handleStyleChange = (key: string, value: any) => {
    if (selectedId) {
      updateComponent(selectedId, { [key]: value })
    }
  }

  // 组件属性设置
  const handlePropsChange = (props: Record<string, any>) => {
    if (selectedId) {
      updateComponentProps(selectedId, props)
    }
  }

  if (!selectedComponent) {
    // 显示页面设置
    return (
      <div className="bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden" style={{ width: '100%' }}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">页面设置</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              画布宽度
            </label>
            <input
              type="number"
              value={currentPage.width}
              onChange={(e) => handlePageSettingChange('width', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              画布高度
            </label>
            <input
              type="number"
              value={currentPage.height}
              onChange={(e) => handlePageSettingChange('height', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              栅格大小
            </label>
            <input
              type="number"
              value={currentPage.gridSize}
              onChange={(e) => handlePageSettingChange('gridSize', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              吸附对齐
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentPage.snapToGrid}
                onChange={(e) => handlePageSettingChange('snapToGrid', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              显示栅格
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentPage.showGrid}
                onChange={(e) => handlePageSettingChange('showGrid', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              背景颜色
            </label>
            <input
              type="color"
              value={currentPage.backgroundColor}
              onChange={(e) => handlePageSettingChange('backgroundColor', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden" style={{ width: '100%' }}>
      {/* 组件信息 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">{selectedComponent.name}</h3>
        <p className="text-sm text-gray-500 mt-1">类型: {selectedComponent.type}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 位置尺寸 */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700">
            位置与尺寸
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">X</label>
                <input
                  type="number"
                  value={selectedComponent.x}
                  onChange={(e) => handleStyleChange('x', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Y</label>
                <input
                  type="number"
                  value={selectedComponent.y}
                  onChange={(e) => handleStyleChange('y', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">宽度</label>
                <input
                  type="number"
                  value={selectedComponent.width}
                  onChange={(e) => handleStyleChange('width', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">高度</label>
                <input
                  type="number"
                  value={selectedComponent.height}
                  onChange={(e) => handleStyleChange('height', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 变换 */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700">
            变换
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">旋转</label>
                <input
                  type="number"
                  value={selectedComponent.rotation}
                  onChange={(e) => handleStyleChange('rotation', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">透明度</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedComponent.opacity}
                  onChange={(e) => handleStyleChange('opacity', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedComponent.visible}
                  onChange={(e) => handleStyleChange('visible', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">可见</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedComponent.locked}
                  onChange={(e) => handleStyleChange('locked', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">锁定</span>
              </label>
            </div>
          </div>
        </div>

        {/* 组件属性 */}
        {componentMeta && (
          <div>
            <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700">
              组件属性
            </div>
            <PropertyForm
              schema={componentMeta.schema}
              values={selectedComponent.props}
              onChange={handlePropsChange}
            />
          </div>
        )}
        
        {/* 数据源绑定 */}
        <DataSourceBinding />
        
        {/* 数据预览 */}
        <DataPreviewPanel />
      </div>
    </div>
  )
}

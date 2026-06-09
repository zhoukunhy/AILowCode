'use client'

import React from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { ImportExportButton } from './ImportExportButton'

export function ComponentToolbar() {
  const selectedId = useCanvasStore((state) => state.selectedId)
  const selectedIds = useCanvasStore((state) => state.selectedIds)
  const components = useCanvasStore((state) => state.components)
  const removeComponent = useCanvasStore((state) => state.removeComponent)
  const moveComponentToFront = useCanvasStore((state) => state.moveComponentToFront)
  const moveComponentToBack = useCanvasStore((state) => state.moveComponentToBack)
  const moveComponentUp = useCanvasStore((state) => state.moveComponentUp)
  const moveComponentDown = useCanvasStore((state) => state.moveComponentDown)
  const alignLeft = useCanvasStore((state) => state.alignLeft)
  const alignRight = useCanvasStore((state) => state.alignRight)
  const alignTop = useCanvasStore((state) => state.alignTop)
  const alignBottom = useCanvasStore((state) => state.alignBottom)
  const alignCenter = useCanvasStore((state) => state.alignCenter)
  const alignMiddle = useCanvasStore((state) => state.alignMiddle)
  const zoomIn = useCanvasStore((state) => state.zoomIn)
  const zoomOut = useCanvasStore((state) => state.zoomOut)
  const resetZoom = useCanvasStore((state) => state.resetZoom)
  const zoom = useCanvasStore((state) => state.zoom)

  const selectedComponent = components.find(c => c.id === selectedId)
  const hasSelection = selectedIds.length > 0

  return (
    <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-3">
        {hasSelection ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">
              {selectedIds.length > 1 
                ? `已选择 ${selectedIds.length} 个组件` 
                : selectedComponent?.name}
            </span>
            {selectedComponent && selectedIds.length === 1 && (
              <span className="text-xs text-gray-400">Z轴: {selectedComponent.zIndex}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-500">请选择一个组件</span>
        )}
        
        <div className="w-px h-6 bg-gray-200" />
        
        {/* 缩放控制 */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="缩小"
          >
            -
          </button>
          <span className="text-xs text-gray-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="放大"
          >
            +
          </button>
          <button
            onClick={resetZoom}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="重置缩放"
          >
            1:1
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-200" />
        
        {/* 导入导出 */}
        <ImportExportButton />
      </div>
      
      <div className="flex items-center gap-1">
        {/* 层级控制 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => selectedId && moveComponentToFront(selectedId)}
            disabled={!selectedId}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="置顶"
          >
            ⬆️
          </button>
          <button
            onClick={() => selectedId && moveComponentUp(selectedId)}
            disabled={!selectedId}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="上移一层"
          >
            ↑
          </button>
          <button
            onClick={() => selectedId && moveComponentDown(selectedId)}
            disabled={!selectedId}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="下移一层"
          >
            ↓
          </button>
          <button
            onClick={() => selectedId && moveComponentToBack(selectedId)}
            disabled={!selectedId}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="置底"
          >
            ⬇️
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
        
        {/* 对齐控制 */}
        <div className="flex items-center gap-1">
          <button
            onClick={alignLeft}
            disabled={selectedIds.length < 2}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="左对齐"
          >
            ←
          </button>
          <button
            onClick={alignCenter}
            disabled={selectedIds.length < 2}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="水平居中"
          >
            ⟷
          </button>
          <button
            onClick={alignRight}
            disabled={selectedIds.length < 2}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="右对齐"
          >
            →
          </button>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            onClick={alignTop}
            disabled={selectedIds.length < 2}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="顶部对齐"
          >
            ↑
          </button>
          <button
            onClick={alignMiddle}
            disabled={selectedIds.length < 2}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="垂直居中"
          >
            ⟹
          </button>
          <button
            onClick={alignBottom}
            disabled={selectedIds.length < 2}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="底部对齐"
          >
            ↓
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
        
        {/* 删除按钮 */}
        <button
          onClick={() => {
            if (selectedIds.length > 1) {
              selectedIds.forEach(id => removeComponent(id))
            } else if (selectedId) {
              removeComponent(selectedId)
            }
          }}
          disabled={!hasSelection}
          className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="删除"
        >
          🗑️ 删除
        </button>
      </div>
    </div>
  )
}

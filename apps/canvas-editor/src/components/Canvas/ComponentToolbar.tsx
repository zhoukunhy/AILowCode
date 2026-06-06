'use client'

import React from 'react'
import { useCanvasStore } from '@/store/canvasStore'

export function ComponentToolbar() {
  const { 
    selectedId, 
    components, 
    removeComponent,
    moveComponentToFront,
    moveComponentToBack,
    moveComponentUp,
    moveComponentDown,
  } = useCanvasStore()

  const selectedComponent = components.find(c => c.id === selectedId)

  if (!selectedComponent) {
    return (
      <div className="p-4 bg-white border-b border-gray-200 text-sm text-gray-500 text-center">
        请选择一个组件
      </div>
    )
  }

  return (
    <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">{selectedComponent.name}</span>
        <span className="text-xs text-gray-400">Z轴: {selectedComponent.zIndex}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => moveComponentToFront(selectedId!)}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="置顶"
        >
          ⬆️ 置顶
        </button>
        <button
          onClick={() => moveComponentToBack(selectedId!)}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="置底"
        >
          ⬇️ 置底
        </button>
        <button
          onClick={() => moveComponentUp(selectedId!)}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="上移一层"
        >
          ↑
        </button>
        <button
          onClick={() => moveComponentDown(selectedId!)}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="下移一层"
        >
          ↓
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button
          onClick={() => removeComponent(selectedId!)}
          className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
          title="删除"
        >
          🗑️ 删除
        </button>
      </div>
    </div>
  )
}

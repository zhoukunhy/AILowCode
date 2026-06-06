'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import KnowledgePanel from '@/components/KnowledgePanel'

export function Sidebar() {
  const { componentList } = useCanvasStore()
  const [activeTab, setActiveTab] = useState<'components' | 'knowledge'>('components')

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('componentType', componentType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden" style={{ width: '100%' }}>
      {/* 标签页切换 */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'components'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('components')}
        >
          📦 组件库
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'knowledge'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('knowledge')}
        >
          📚 知识库
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'components' ? (
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <h2 className="text-lg font-bold mb-4 pb-2 border-b border-gray-100">组件列表</h2>
            <div className="flex-1 overflow-y-auto space-y-2">
              {componentList.map((comp) => (
                <div
                  key={comp.type}
                  className="p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all flex items-center gap-3 active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => handleDragStart(e, comp.type)}
                >
                  <span className="text-2xl">{comp.icon}</span>
                  <span className="font-medium text-gray-700">{comp.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500 text-center">
                拖拽组件到画布
              </div>
            </div>
          </div>
        ) : (
          <KnowledgePanel />
        )}
      </div>
    </div>
  )
}

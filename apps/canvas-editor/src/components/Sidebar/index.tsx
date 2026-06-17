'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

export function Sidebar() {
  const componentList = useCanvasStore((state) => state.componentList)
  const [expandedCategory, setExpandedCategory] = useState<string>('form')

  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('componentType', componentType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const groupedComponents = {
    layout: componentList.filter(c => 
      ['card', 'divider', 'space', 'tabs', 'modal', 'drawer', 'steps', 'timeline', 
       'tree', 'carousel', 'pagination'].includes(c.type)
    ),
    formData: componentList.filter(c => 
      ['input', 'textarea', 'select', 'checkbox', 'radio', 'switch', 'datepicker', 
       'daterange', 'timepicker', 'numberInput', 'passwordInput', 'emailInput', 
       'phoneInput', 'slider', 'rate', 'cascader', 'transfer', 'form', 'table', 
       'list'].includes(c.type)
    ),
    interaction: componentList.filter(c => 
      ['button', 'text', 'heading', 'image', 'avatar', 'tag', 'badge', 'alert', 
       'tooltip', 'popover'].includes(c.type)
    ),
    business: componentList.filter(c => 
      ['approval', 'flowNode', 'condition'].includes(c.type)
    ),
    integration: componentList.filter(c => 
      ['upload', 'apiConnector', 'payment', 'map'].includes(c.type)
    ),
  }

  const categoryLabels = {
    layout: '布局物料',
    formData: '表单与数据物料',
    interaction: '交互与反馈物料',
    business: '业务流程物料',
    integration: '集成与工具物料',
  }

  return (
    <div className="bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden" style={{ width: '100%' }}>
      <div className="flex border-b border-gray-200" suppressHydrationWarning>
        <button
          className="flex-1 px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50"
        >
          组件库
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-4 flex flex-col h-full overflow-hidden">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-gray-100">组件列表</h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            {Object.entries(groupedComponents).map(([category, components]) => (
              <div key={category}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? '' : category)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                  <span className="text-gray-400 text-xs">
                    {expandedCategory === category ? '▼' : '▶'}
                  </span>
                </button>
                {expandedCategory === category && (
                  <div className="mt-2 space-y-2 pl-2">
                    {components.map((comp) => (
                      <div
                        key={comp.type}
                        className="p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all flex items-center gap-3 active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleDragStart(e, comp.type)}
                      >
                        <span className="text-2xl">{comp.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-700 truncate">{comp.name}</div>
                          <div className="text-xs text-gray-400">{comp.defaultWidth} × {comp.defaultHeight}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500 text-center">
              拖拽组件到画布
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              共 {componentList.length} 个组件
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

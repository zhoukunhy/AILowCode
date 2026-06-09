'use client'

import React from 'react'
import { NodeType } from '@ai-lowcode/shared-types'

interface NodeItem {
  type: NodeType
  name: string
  description: string
  color: string
}

const nodeTypes: NodeItem[] = [
  { type: 'start', name: '开始', description: '流程起始节点', color: '#10B981' },
  { type: 'approve', name: '审批', description: '审批节点', color: '#3B82F6' },
  { type: 'condition', name: '条件', description: '条件判断节点', color: '#F59E0B' },
  { type: 'fork', name: '分支', description: '并行分支节点', color: '#8B5CF6' },
  { type: 'join', name: '合并', description: '合并节点', color: '#EC4899' },
  { type: 'action', name: '动作', description: '执行动作节点', color: '#06B6D4' },
  { type: 'end', name: '结束', description: '流程结束节点', color: '#EF4444' },
]

const getNodeIcon = (type: NodeType): string => {
  const icons: Record<NodeType, string> = {
    start: '▶',
    approve: '✓',
    condition: '?',
    fork: '↕',
    join: '⟳',
    end: '■',
    action: '⚡',
  }
  return icons[type]
}

export function NodePalette() {
  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('nodeType', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">流程节点</h2>
        <p className="text-sm text-gray-500 mt-1">拖拽节点到画布</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {nodeTypes.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-gray-100 transition-colors active:cursor-grabbing"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: item.color }}
              >
                {getNodeIcon(item.type)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.name}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>提示：</strong>按住 Shift 键点击节点可以创建连接线
          </p>
        </div>
      </div>
    </div>
  )
}
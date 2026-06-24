'use client'

import React from 'react'
import { Switch, Select, Input, Space } from 'antd'
import { useCanvasStore } from '@/store/canvasStore'
import type { ConditionalRenderConfig, LoopRenderConfig } from '@/store/canvasStore'

const OPERATORS = [
  { value: '==', label: '等于 (==)' },
  { value: '!=', label: '不等于 (!=)' },
  { value: '>', label: '大于 (>)' },
  { value: '<', label: '小于 (<)' },
  { value: '>=', label: '大于等于 (>=)' },
  { value: '<=', label: '小于等于 (<=)' },
  { value: 'contains', label: '包含' },
  { value: 'isEmpty', label: '为空' },
  { value: 'isNotEmpty', label: '不为空' },
]

export function RenderLogic() {
  const selectedId = useCanvasStore((state) => state.selectedId)
  const components = useCanvasStore((state) => state.components)
  const updateComponent = useCanvasStore((state) => state.updateComponent)

  const selectedComponent = components.find((c) => c.id === selectedId)

  const handleConditionalChange = (key: string, value: any) => {
    if (selectedId && selectedComponent) {
      const config: ConditionalRenderConfig = selectedComponent.conditionalRender || {
        enabled: false,
        condition: '',
        operator: '==',
        leftValue: '',
        rightValue: '',
        showIfTrue: true,
      }
      updateComponent(selectedId, {
        conditionalRender: { ...config, [key]: value },
      })
    }
  }

  const handleLoopChange = (key: string, value: any) => {
    if (selectedId && selectedComponent) {
      const config: LoopRenderConfig = selectedComponent.loopRender || {
        enabled: false,
        dataSource: '',
        itemKey: 'id',
        itemName: 'item',
      }
      updateComponent(selectedId, {
        loopRender: { ...config, [key]: value },
      })
    }
  }

  if (!selectedComponent) return null

  return (
    <div className="border-b border-gray-200">
      <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700">
        渲染逻辑
      </div>
      <div className="p-4">
        {/* 条件渲染 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">条件渲染</span>
            <Switch
              checked={selectedComponent.conditionalRender?.enabled || false}
              onChange={(checked) => handleConditionalChange('enabled', checked)}
            />
          </div>

          {selectedComponent.conditionalRender?.enabled && (
            <div className="ml-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={selectedComponent.conditionalRender.leftValue}
                  onChange={(e) => handleConditionalChange('leftValue', e.target.value)}
                  placeholder="左侧值（变量或表达式）"
                  style={{ flex: 1 }}
                />
                <Select
                  value={selectedComponent.conditionalRender.operator}
                  onChange={(value) => handleConditionalChange('operator', value)}
                  options={OPERATORS}
                  style={{ width: 150 }}
                />
                <Input
                  value={selectedComponent.conditionalRender.rightValue}
                  onChange={(e) => handleConditionalChange('rightValue', e.target.value)}
                  placeholder="右侧值"
                  style={{ flex: 1 }}
                  disabled={['isEmpty', 'isNotEmpty'].includes(selectedComponent.conditionalRender.operator)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">满足条件时：</span>
                <Select
                  value={selectedComponent.conditionalRender.showIfTrue}
                  onChange={(value) => handleConditionalChange('showIfTrue', value)}
                  options={[
                    { value: true, label: '显示组件' },
                    { value: false, label: '隐藏组件' },
                  ]}
                  style={{ width: 150 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 循环渲染 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">循环渲染</span>
            <Switch
              checked={selectedComponent.loopRender?.enabled || false}
              onChange={(checked) => handleLoopChange('enabled', checked)}
            />
          </div>

          {selectedComponent.loopRender?.enabled && (
            <div className="ml-4 space-y-3">
              <Space style={{ width: '100%' }} direction="vertical">
                <Input
                  value={selectedComponent.loopRender.dataSource}
                  onChange={(e) => handleLoopChange('dataSource', e.target.value)}
                  placeholder="数据源（变量名或表达式）"
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={selectedComponent.loopRender.itemKey}
                    onChange={(e) => handleLoopChange('itemKey', e.target.value)}
                    placeholder="唯一标识字段"
                    style={{ width: 150 }}
                  />
                  <span className="text-sm text-gray-400">→</span>
                  <Input
                    value={selectedComponent.loopRender.itemName}
                    onChange={(e) => handleLoopChange('itemName', e.target.value)}
                    placeholder="循环变量名"
                    style={{ width: 150 }}
                  />
                </div>
              </Space>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
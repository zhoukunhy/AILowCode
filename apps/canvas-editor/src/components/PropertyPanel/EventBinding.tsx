'use client'

import React, { useState } from 'react'
import { Button, Select, Tag, Space, Input } from 'antd'

const { TextArea } = Input
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useCanvasStore } from '@/store/canvasStore'
import { customComponentRegistry } from '@/services/CustomComponentRegistry'
import type { CustomEventDefinition } from '@ai-lowcode/shared-types'

const ACTION_TYPES = [
  { value: 'navigate', label: '页面跳转' },
  { value: 'showToast', label: '显示提示' },
  { value: 'callApi', label: '调用API' },
  { value: 'setVariable', label: '设置变量' },
  { value: 'emitEvent', label: '触发事件' },
  { value: 'custom', label: '自定义代码' },
]

export function EventBinding() {
  const selectedId = useCanvasStore((state) => state.selectedId)
  const components = useCanvasStore((state) => state.components)
  const updateComponentProps = useCanvasStore((state) => state.updateComponentProps)

  const selectedComponent = components.find((c) => c.id === selectedId)
  const [eventBindings, setEventBindings] = useState<Record<string, EventBindingConfig>>({})

  React.useEffect(() => {
    if (selectedComponent?.props.eventBindings) {
      setEventBindings(selectedComponent.props.eventBindings)
    } else {
      setEventBindings({})
    }
  }, [selectedComponent?.props.eventBindings])

  const getComponentEvents = (): CustomEventDefinition[] => {
    if (selectedComponent?.type.startsWith('custom-')) {
      const definition = customComponentRegistry.getDefinition(selectedComponent.type)
      return definition?.events || []
    }
    return []
  }

  const availableEvents = getComponentEvents()

  const handleAddBinding = (eventName: string) => {
    if (!eventBindings[eventName]) {
      setEventBindings((prev) => ({
        ...prev,
        [eventName]: {
          actionType: 'showToast',
          actionConfig: JSON.stringify({ message: '事件触发' }, null, 2),
        },
      }))
    }
  }

  const handleRemoveBinding = (eventName: string) => {
    setEventBindings((prev) => {
      const newBindings = { ...prev }
      delete newBindings[eventName]
      return newBindings
    })
  }

  const handleBindingChange = (eventName: string, key: string, value: any) => {
    setEventBindings((prev) => ({
      ...prev,
      [eventName]: {
        ...prev[eventName],
        [key]: value,
      },
    }))
  }

  const handleSaveBindings = () => {
    if (selectedId) {
      updateComponentProps(selectedId, { eventBindings })
    }
  }

  if (availableEvents.length === 0) {
    return null
  }

  return (
    <div className="border-b border-gray-200">
      <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span>事件绑定</span>
        <Button type="text" size="small" onClick={handleSaveBindings}>
          保存绑定
        </Button>
      </div>
      <div className="p-4">
        {availableEvents.map((event) => (
          <div key={event.name} className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag color="blue">{event.title}</Tag>
                <span className="text-sm text-gray-600">{event.name}</span>
                {event.description && (
                  <span className="text-xs text-gray-400">{event.description}</span>
                )}
              </div>
              {!eventBindings[event.name] ? (
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => handleAddBinding(event.name)}
                >
                  添加绑定
                </Button>
              ) : (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => handleRemoveBinding(event.name)}
                >
                  删除
                </Button>
              )}
            </div>

            {eventBindings[event.name] && (
              <div className="ml-4 p-3 bg-gray-50 rounded">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Select
                    value={eventBindings[event.name].actionType}
                    onChange={(value) => handleBindingChange(event.name, 'actionType', value)}
                    options={ACTION_TYPES}
                    style={{ width: '100%' }}
                    placeholder="选择动作类型"
                  />
                  <TextArea
                    value={eventBindings[event.name].actionConfig}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleBindingChange(event.name, 'actionConfig', e.target.value)}
                    placeholder="动作配置（JSON格式）"
                    rows={4}
                    style={{ fontFamily: 'monospace' }}
                  />
                  {event.params && event.params.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">可用参数：</span>
                      {event.params.map((p) => (
                        <span key={p.name} className="ml-2">
                          <code>${p.name}</code>
                          {p.description && <span className="ml-1">({p.description})</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </Space>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface EventBindingConfig {
  actionType: string
  actionConfig: string
}
'use client'

import React, { useState, useCallback } from 'react'
import { Button, Input, Select, Tabs, Card, Space, Tag, Switch, InputNumber, ColorPicker, message } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, EyeOutlined, AppstoreOutlined } from '@ant-design/icons'
import type {
  CustomComponentDefinition,
  CustomPropDefinition,
  CustomPropSchema,
  CustomEventDefinition,
  VisualTemplateConfig,
  CodeTemplateConfig,
} from '@ai-lowcode/shared-types'
import { customComponentRegistry } from '@/services/CustomComponentRegistry'
import { generateId } from '@ai-lowcode/common-util'

const { TextArea } = Input

interface CustomComponentEditorProps {
  initialDefinition?: CustomComponentDefinition
  onSave: (definition: CustomComponentDefinition) => void
  onCancel: () => void
}

/**
 * 自定义组件编辑器
 */
export function CustomComponentEditor({ initialDefinition, onSave, onCancel }: CustomComponentEditorProps) {
  // 基本信息
  const [name, setName] = useState(initialDefinition?.name || '')
  const [displayName, setDisplayName] = useState(initialDefinition?.displayName || '')
  const [description, setDescription] = useState(initialDefinition?.description || '')
  const [category, setCategory] = useState(initialDefinition?.category || 'custom')
  const [icon, setIcon] = useState(initialDefinition?.icon || '🔧')
  const [tags, setTags] = useState<string[]>(initialDefinition?.tags || [])

  // 模板类型
  const [templateType, setTemplateType] = useState<'visual' | 'code'>(initialDefinition?.template.type || 'visual')

  // 属性定义
  const [propsSchema, setPropsSchema] = useState<CustomPropSchema>(
    initialDefinition?.propsSchema || { properties: {}, required: [] }
  )

  // 事件定义
  const [events, setEvents] = useState<CustomEventDefinition[]>(initialDefinition?.events || [])

  // 可视化模板配置
  const [visualConfig, setVisualConfig] = useState<VisualTemplateConfig>(
    initialDefinition?.template.visualConfig || {
      children: [],
      layout: { type: 'flex', direction: 'row', gap: 10 },
    }
  )

  // 代码模板配置
  const [codeConfig, setCodeConfig] = useState<CodeTemplateConfig>(
    initialDefinition?.template.codeConfig || { renderCode: '' }
  )

  // 预览状态
  const [showPreview, setShowPreview] = useState(false)

  // 添加属性
  const addProperty = useCallback(() => {
    const propId = `prop_${generateId()}`
    setPropsSchema(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [propId]: {
          type: 'string',
          title: '新属性',
          default: '',
          bindable: true,
          visible: true,
        },
      },
    }))
  }, [])

  // 更新属性
  const updateProperty = useCallback((propId: string, updates: Partial<CustomPropDefinition>) => {
    setPropsSchema(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [propId]: {
          ...prev.properties[propId],
          ...updates,
        },
      },
    }))
  }, [])

  // 删除属性
  const deleteProperty = useCallback((propId: string) => {
    setPropsSchema(prev => {
      const newProperties = { ...prev.properties }
      delete newProperties[propId]
      return {
        ...prev,
        properties: newProperties,
        required: prev.required?.filter(r => r !== propId) || [],
      }
    })
  }, [])

  // 设置必填属性
  const setRequired = useCallback((propId: string, required: boolean) => {
    setPropsSchema(prev => ({
      ...prev,
      required: required
        ? [...(prev.required || []), propId]
        : prev.required?.filter(r => r !== propId) || [],
    }))
  }, [])

  // 添加事件
  const addEvent = useCallback(() => {
    setEvents(prev => [
      ...prev,
      {
        name: `onEvent${prev.length + 1}`,
        title: '新事件',
      },
    ])
  }, [])

  // 更新事件
  const updateEvent = useCallback((index: number, updates: Partial<CustomEventDefinition>) => {
    setEvents(prev => {
      const newEvents = [...prev]
      newEvents[index] = { ...newEvents[index], ...updates }
      return newEvents
    })
  }, [])

  // 删除事件
  const deleteEvent = useCallback((index: number) => {
    setEvents(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 保存组件定义
  const handleSave = useCallback(() => {
    if (!name || !displayName) {
      message.error('请填写组件名称和显示名称')
      return
    }

    if (Object.keys(propsSchema.properties).length === 0) {
      message.error('请至少定义一个属性')
      return
    }

    const definition: CustomComponentDefinition = {
      id: initialDefinition?.id || `custom_${generateId()}`,
      name,
      displayName,
      description,
      category,
      icon,
      version: initialDefinition?.version || '1.0.0',
      author: 'user',
      createdAt: initialDefinition?.createdAt || new Date(),
      updatedAt: new Date(),
      status: 'published',
      template: {
        type: templateType,
        visualConfig: templateType === 'visual' ? visualConfig : undefined,
        codeConfig: templateType === 'code' ? codeConfig : undefined,
      },
      propsSchema,
      events,
      tags,
    }

    // 验证并注册
    customComponentRegistry.register(definition)
    onSave(definition)
    message.success('组件保存成功')
  }, [
    name,
    displayName,
    description,
    category,
    icon,
    tags,
    templateType,
    propsSchema,
    events,
    visualConfig,
    codeConfig,
    initialDefinition,
    onSave,
  ])

  // 渲染属性编辑器
  const renderPropsEditor = () => (
    <div className="props-editor">
      <Button type="dashed" icon={<PlusOutlined />} onClick={addProperty} block>
        添加属性
      </Button>

      <div className="props-list" style={{ marginTop: 16 }}>
        {Object.entries(propsSchema.properties).map(([propId, propDef]) => (
          <Card key={propId} size="small" style={{ marginBottom: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Input
                  value={propDef.title}
                  onChange={e => updateProperty(propId, { title: e.target.value })}
                  placeholder="属性名称"
                  style={{ width: 150 }}
                />
                <Select
                  value={propDef.type}
                  onChange={value => updateProperty(propId, { type: value })}
                  style={{ width: 120 }}
                  options={[
                    { label: '字符串', value: 'string' },
                    { label: '数字', value: 'number' },
                    { label: '布尔', value: 'boolean' },
                    { label: '数组', value: 'array' },
                    { label: '对象', value: 'object' },
                    { label: '颜色', value: 'color' },
                    { label: '选择', value: 'select' },
                    { label: '日期', value: 'date' },
                  ]}
                />
                <Switch
                  checked={propsSchema.required?.includes(propId)}
                  onChange={checked => setRequired(propId, checked)}
                  checkedChildren="必填"
                  unCheckedChildren="可选"
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteProperty(propId)}
                />
              </Space>

              <Input
                value={propDef.default}
                onChange={e => updateProperty(propId, { default: e.target.value })}
                placeholder="默认值"
              />

              <TextArea
                value={propDef.description}
                onChange={e => updateProperty(propId, { description: e.target.value })}
                placeholder="属性描述"
                rows={2}
              />

              {propDef.type === 'select' && (
                <Input
                  value={propDef.enum?.map(e => e.value).join(',')}
                  onChange={e =>
                    updateProperty(propId, {
                      enum: e.target.value.split(',').map(v => ({ label: v, value: v })),
                    })
                  }
                  placeholder="选项值（逗号分隔）"
                />
              )}

              <Space>
                <Switch
                  checked={propDef.bindable}
                  onChange={checked => updateProperty(propId, { bindable: checked })}
                  checkedChildren="可绑定"
                  unCheckedChildren="不可绑定"
                />
                <Switch
                  checked={propDef.visible}
                  onChange={checked => updateProperty(propId, { visible: checked })}
                  checkedChildren="显示"
                  unCheckedChildren="隐藏"
                />
              </Space>
            </Space>
          </Card>
        ))}
      </div>
    </div>
  )

  // 渲染事件编辑器
  const renderEventsEditor = () => (
    <div className="events-editor">
      <Button type="dashed" icon={<PlusOutlined />} onClick={addEvent} block>
        添加事件
      </Button>

      <div className="events-list" style={{ marginTop: 16 }}>
        {events.map((event, index) => (
          <Card key={index} size="small" style={{ marginBottom: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Input
                  value={event.name}
                  onChange={e => updateEvent(index, { name: e.target.value })}
                  placeholder="事件名称"
                  style={{ width: 150 }}
                />
                <Input
                  value={event.title}
                  onChange={e => updateEvent(index, { title: e.target.value })}
                  placeholder="事件标题"
                  style={{ width: 150 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteEvent(index)}
                />
              </Space>

              <TextArea
                value={event.description}
                onChange={e => updateEvent(index, { description: e.target.value })}
                placeholder="事件描述"
                rows={2}
              />
            </Space>
          </Card>
        ))}
      </div>
    </div>
  )

  // 渲染可视化模板编辑器
  const renderVisualTemplateEditor = () => (
    <div className="visual-template-editor">
      <Card title="布局配置" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            value={visualConfig.layout.type}
            onChange={value =>
              setVisualConfig(prev => ({
                ...prev,
                layout: { ...prev.layout, type: value },
              }))
            }
            style={{ width: '100%' }}
            options={[
              { label: 'Flex 布局', value: 'flex' },
              { label: 'Grid 布局', value: 'grid' },
              { label: '绝对定位', value: 'absolute' },
            ]}
          />

          {visualConfig.layout.type === 'flex' && (
            <Space>
              <Select
                value={visualConfig.layout.direction}
                onChange={value =>
                  setVisualConfig(prev => ({
                    ...prev,
                    layout: { ...prev.layout, direction: value },
                  }))
                }
                options={[
                  { label: '水平排列', value: 'row' },
                  { label: '垂直排列', value: 'column' },
                ]}
              />
              <InputNumber
                value={visualConfig.layout.gap}
                onChange={value =>
                  setVisualConfig(prev => ({
                    ...prev,
                    layout: { ...prev.layout, gap: value || 10 },
                  }))
                }
                min={0}
                max={100}
                placeholder="间距"
              />
            </Space>
          )}
        </Space>
      </Card>

      <Card title="容器样式" size="small" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <ColorPicker
            value={visualConfig.containerStyle?.backgroundColor}
            onChange={color =>
              setVisualConfig(prev => ({
                ...prev,
                containerStyle: {
                  ...prev.containerStyle,
                  backgroundColor: color.toHexString(),
                },
              }))
            }
            showText
          />
          <InputNumber
            value={visualConfig.containerStyle?.borderRadius}
            onChange={value =>
              setVisualConfig(prev => ({
                ...prev,
                containerStyle: {
                  ...prev.containerStyle,
                  borderRadius: value || 0,
                },
              }))
            }
            min={0}
            max={50}
            placeholder="圆角"
          />
        </Space>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Button type="primary" icon={<AppstoreOutlined />}>
          添加子组件（从画布选择）
        </Button>
      </div>
    </div>
  )

  // 渲染代码模板编辑器
  const renderCodeTemplateEditor = () => (
    <div className="code-template-editor">
      <Card title="渲染代码" size="small">
        <TextArea
          value={codeConfig.renderCode}
          onChange={e =>
            setCodeConfig(prev => ({
              ...prev,
              renderCode: e.target.value,
            }))
          }
          placeholder="输入组件渲染代码（React）"
          rows={10}
        />
      </Card>

      <Card title="样式代码" size="small" style={{ marginTop: 16 }}>
        <TextArea
          value={codeConfig.styleCode}
          onChange={e =>
            setCodeConfig(prev => ({
              ...prev,
              styleCode: e.target.value,
            }))
          }
          placeholder="输入 CSS 样式代码"
          rows={5}
        />
      </Card>

      <Card title="逻辑代码" size="small" style={{ marginTop: 16 }}>
        <TextArea
          value={codeConfig.logicCode}
          onChange={e =>
            setCodeConfig(prev => ({
              ...prev,
              logicCode: e.target.value,
            }))
          }
          placeholder="输入组件逻辑代码（hooks、事件处理等）"
          rows={5}
        />
      </Card>
    </div>
  )

  return (
    <div className="custom-component-editor">
      <div className="editor-header" style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
            保存组件
          </Button>
          <Button icon={<EyeOutlined />} onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? '关闭预览' : '预览组件'}
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </div>

      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="组件名称（唯一标识）"
                    addonBefore="名称"
                  />
                  <Input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="显示名称"
                    addonBefore="显示名"
                  />
                  <TextArea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="组件描述"
                    rows={3}
                  />
                  <Select
                    value={category}
                    onChange={setCategory}
                    style={{ width: '100%' }}
                    options={[
                      { label: '自定义组件', value: 'custom' },
                      { label: '表单组件', value: 'form' },
                      { label: '布局组件', value: 'layout' },
                      { label: '业务组件', value: 'business' },
                    ]}
                  />
                  <Input
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    placeholder="组件图标（emoji）"
                    addonBefore="图标"
                  />
                  <div>
                    <span style={{ marginRight: 8 }}>标签：</span>
                    {tags.map((tag, index) => (
                      <Tag
                        key={tag}
                        closable
                        onClose={() => setTags(prev => prev.filter((_, i) => i !== index))}
                      >
                        {tag}
                      </Tag>
                    ))}
                    <Input
                      style={{ width: 100 }}
                      placeholder="添加标签"
                      onPressEnter={e => {
                        const value = (e.target as HTMLInputElement).value
                        if (value && !tags.includes(value)) {
                          setTags(prev => [...prev, value])
                        }
                      }}
                    />
                  </div>
                </Space>
              </Card>
            ),
          },
          {
            key: 'props',
            label: '属性定义',
            children: renderPropsEditor(),
          },
          {
            key: 'events',
            label: '事件定义',
            children: renderEventsEditor(),
          },
          {
            key: 'template',
            label: '组件模板',
            children: (
              <div>
                <Select
                  value={templateType}
                  onChange={setTemplateType}
                  style={{ width: 200, marginBottom: 16 }}
                  options={[
                    { label: '可视化模板', value: 'visual' },
                    { label: '代码模板', value: 'code' },
                  ]}
                />
                {templateType === 'visual' && renderVisualTemplateEditor()}
                {templateType === 'code' && renderCodeTemplateEditor()}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
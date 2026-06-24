'use client'

import React, { useState, useCallback } from 'react'
import { Button, Input, Select, Tabs, Card, Space, Tag, Switch, InputNumber, ColorPicker, message, Modal, List } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, EyeOutlined, AppstoreOutlined, UpOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons'
import type {
  CustomComponentDefinition,
  CustomPropDefinition,
  CustomPropSchema,
  CustomEventDefinition,
  VisualTemplateConfig,
  CodeTemplateConfig,
  CanvasComponent,
} from '@ai-lowcode/shared-types'
import { customComponentRegistry } from '@/services/CustomComponentRegistry'
import { generateId } from '@ai-lowcode/common-util'

const { TextArea } = Input

interface ComponentMeta {
  type: string
  name: string
  icon: string
  defaultWidth: number
  defaultHeight: number
  defaultProps: Record<string, any>
}

const AVAILABLE_COMPONENTS: ComponentMeta[] = [
  { type: 'text', name: '文本', icon: '🔤', defaultWidth: 200, defaultHeight: 30, defaultProps: { content: '文本内容', fontSize: 14, fontWeight: 'normal', color: '#333' } },
  { type: 'button', name: '按钮', icon: '🔘', defaultWidth: 120, defaultHeight: 40, defaultProps: { text: '按钮', type: 'primary' } },
  { type: 'input', name: '输入框', icon: '📝', defaultWidth: 240, defaultHeight: 40, defaultProps: { label: '标签', placeholder: '请输入内容', value: '' } },
  { type: 'select', name: '下拉选择', icon: '📋', defaultWidth: 240, defaultHeight: 40, defaultProps: { label: '标签', placeholder: '请选择', options: [] } },
  { type: 'checkbox', name: '复选框', icon: '☑️', defaultWidth: 200, defaultHeight: 32, defaultProps: { label: '选项', checked: false } },
  { type: 'radio', name: '单选框', icon: '⚫', defaultWidth: 200, defaultHeight: 32, defaultProps: { label: '选项', checked: false } },
  { type: 'switch', name: '开关', icon: '🔌', defaultWidth: 80, defaultHeight: 32, defaultProps: { checked: false } },
  { type: 'datepicker', name: '日期选择', icon: '📅', defaultWidth: 200, defaultHeight: 40, defaultProps: { label: '日期', value: '' } },
  { type: 'textarea', name: '多行文本', icon: '📄', defaultWidth: 300, defaultHeight: 100, defaultProps: { label: '标签', placeholder: '请输入内容', value: '' } },
  { type: 'numberinput', name: '数字输入', icon: '🔢', defaultWidth: 150, defaultHeight: 40, defaultProps: { label: '数字', value: 0 } },
  { type: 'slider', name: '滑块', icon: '🎚️', defaultWidth: 300, defaultHeight: 40, defaultProps: { label: '滑块', min: 0, max: 100, value: 50 } },
  { type: 'rate', name: '评分', icon: '⭐', defaultWidth: 200, defaultHeight: 40, defaultProps: { count: 5, value: 0 } },
  { type: 'avatar', name: '头像', icon: '👤', defaultWidth: 48, defaultHeight: 48, defaultProps: { src: '', size: 'default', shape: 'circle' } },
  { type: 'tag', name: '标签', icon: '🏷️', defaultWidth: 80, defaultHeight: 28, defaultProps: { label: '标签', color: 'blue' } },
  { type: 'badge', name: '徽标', icon: '🔴', defaultWidth: 80, defaultHeight: 32, defaultProps: { count: 0, dot: false } },
  { type: 'divider', name: '分割线', icon: '➖', defaultWidth: 200, defaultHeight: 16, defaultProps: { orientation: 'horizontal' } },
  { type: 'space', name: '间距', icon: '〰️', defaultWidth: 200, defaultHeight: 40, defaultProps: { direction: 'horizontal', size: 'middle' } },
]

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

  // 组件选择弹窗状态
  const [showComponentPicker, setShowComponentPicker] = useState(false)

  // 选中的子组件索引（用于编辑属性）
  const [selectedChildIndex, setSelectedChildIndex] = useState<number | null>(null)

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

  // 添加子组件
  const addChildComponent = useCallback((componentType: string) => {
    const componentMeta = AVAILABLE_COMPONENTS.find(c => c.type === componentType)
    if (!componentMeta) return

    const newChild: CanvasComponent = {
      id: `child_${generateId()}`,
      type: componentType,
      props: { ...componentMeta.defaultProps },
      schema: {
        width: componentMeta.defaultWidth,
        height: componentMeta.defaultHeight,
        x: 0,
        y: 0,
      },
    }

    setVisualConfig(prev => ({
      ...prev,
      children: [...prev.children, newChild],
    }))

    setShowComponentPicker(false)
    message.success(`已添加 ${componentMeta.name} 组件`)
  }, [])

  // 删除子组件
  const deleteChildComponent = useCallback((index: number) => {
    setVisualConfig(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }))
    if (selectedChildIndex === index) {
      setSelectedChildIndex(null)
    }
  }, [selectedChildIndex])

  // 更新子组件属性
  const updateChildComponent = useCallback((index: number, updates: Partial<CanvasComponent>) => {
    setVisualConfig(prev => {
      const newChildren = [...prev.children]
      newChildren[index] = { ...newChildren[index], ...updates }
      return {
        ...prev,
        children: newChildren,
      }
    })
  }, [])

  // 移动子组件顺序
  const moveChildComponent = useCallback((index: number, direction: 'up' | 'down') => {
    setVisualConfig(prev => {
      const newChildren = [...prev.children]
      const newIndex = direction === 'up' ? index - 1 : index + 1

      if (newIndex >= 0 && newIndex < newChildren.length) {
        ;[newChildren[index], newChildren[newIndex]] = [newChildren[newIndex], newChildren[index]]
        if (selectedChildIndex === index) {
          setSelectedChildIndex(newIndex)
        } else if (selectedChildIndex === newIndex) {
          setSelectedChildIndex(index)
        }
      }

      return {
        ...prev,
        children: newChildren,
      }
    })
  }, [selectedChildIndex])

  // 获取子组件的显示名称和图标
  const getChildComponentInfo = useCallback((type: string): ComponentMeta => {
    const componentMeta = AVAILABLE_COMPONENTS.find(c => c.type === type)
    return componentMeta || {
      type,
      name: type,
      icon: '📦',
      defaultWidth: 100,
      defaultHeight: 40,
      defaultProps: {},
    }
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

  const CHILD_EVENTS = [
    { value: 'onClick', label: '点击' },
    { value: 'onChange', label: '值变化' },
    { value: 'onBlur', label: '失焦' },
    { value: 'onFocus', label: '聚焦' },
    { value: 'onMouseEnter', label: '鼠标进入' },
    { value: 'onMouseLeave', label: '鼠标离开' },
    { value: 'onDoubleClick', label: '双击' },
    { value: 'onKeyDown', label: '键盘按下' },
  ]

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

              {(templateType === 'visual' && visualConfig.children.length > 0) && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 8 }}>
                    子组件事件绑定
                  </div>
                  <Space style={{ width: '100%' }}>
                    <Select
                      value={event.childComponentId}
                      onChange={value => updateEvent(index, { childComponentId: value || undefined })}
                      placeholder="选择子组件"
                      style={{ flex: 1 }}
                      options={visualConfig.children.map(child => ({
                        value: child.id,
                        label: `${getChildComponentInfo(child.type).icon} ${getChildComponentInfo(child.type).name}`,
                      }))}
                    />
                    <Select
                      value={event.childEventName}
                      onChange={value => updateEvent(index, { childEventName: value || undefined })}
                      placeholder="选择事件"
                      style={{ flex: 1 }}
                      options={CHILD_EVENTS}
                      disabled={!event.childComponentId}
                    />
                  </Space>
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 8 }}>
                  事件参数
                </div>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {(event.params || []).map((param, paramIndex) => (
                    <Space key={paramIndex} style={{ width: '100%' }}>
                      <Input
                        value={param.name}
                        onChange={e => {
                          const newParams = [...(event.params || [])]
                          newParams[paramIndex] = { ...newParams[paramIndex], name: e.target.value }
                          updateEvent(index, { params: newParams })
                        }}
                        placeholder="参数名"
                        style={{ width: 100 }}
                      />
                      <Select
                        value={param.type}
                        onChange={value => {
                          const newParams = [...(event.params || [])]
                          newParams[paramIndex] = { ...newParams[paramIndex], type: value }
                          updateEvent(index, { params: newParams })
                        }}
                        style={{ width: 100 }}
                        options={[
                          { value: 'string', label: '字符串' },
                          { value: 'number', label: '数字' },
                          { value: 'boolean', label: '布尔' },
                          { value: 'object', label: '对象' },
                          { value: 'any', label: '任意' },
                        ]}
                      />
                      <Input
                        value={param.description}
                        onChange={e => {
                          const newParams = [...(event.params || [])]
                          newParams[paramIndex] = { ...newParams[paramIndex], description: e.target.value }
                          updateEvent(index, { params: newParams })
                        }}
                        placeholder="参数描述"
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          const newParams = (event.params || []).filter((_, i) => i !== paramIndex)
                          updateEvent(index, { params: newParams })
                        }}
                      />
                    </Space>
                  ))}
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const newParams = [
                        ...(event.params || []),
                        { name: `param${(event.params || []).length + 1}`, type: 'string' },
                      ]
                      updateEvent(index, { params: newParams })
                    }}
                  >
                    添加参数
                  </Button>
                </Space>
              </div>
            </Space>
          </Card>
        ))}
      </div>
    </div>
  )

  // 渲染子组件属性编辑器
  const renderChildPropsEditor = () => {
    if (selectedChildIndex === null) return null

    const child = visualConfig.children[selectedChildIndex]
    if (!child) return null

    const componentMeta = getChildComponentInfo(child.type)

    return (
      <Card title={`${componentMeta.icon} ${componentMeta.name} 属性配置`} size="small" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {Object.entries(child.props).map(([propKey, propValue]) => (
            <div key={propKey}>
              <span style={{ marginRight: 8, fontWeight: 500 }}>{propKey}:</span>
              {typeof propValue === 'boolean' ? (
                <Switch
                  checked={propValue}
                  onChange={checked =>
                    updateChildComponent(selectedChildIndex!, {
                      props: { ...child.props, [propKey]: checked },
                    })
                  }
                />
              ) : (
                <Input
                  value={String(propValue)}
                  onChange={e =>
                    updateChildComponent(selectedChildIndex!, {
                      props: { ...child.props, [propKey]: e.target.value },
                    })
                  }
                  style={{ width: 200 }}
                  placeholder={propKey}
                />
              )}
            </div>
          ))}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <span style={{ marginRight: 8, fontWeight: 500 }}>组件尺寸:</span>
            <InputNumber
              value={child.schema.width}
              onChange={value =>
                updateChildComponent(selectedChildIndex!, {
                  schema: { ...child.schema, width: value || componentMeta.defaultWidth },
                })
              }
              min={10}
              max={1000}
              placeholder="宽度"
              style={{ width: 100 }}
            />
            <span style={{ margin: '0 8px' }}>×</span>
            <InputNumber
              value={child.schema.height}
              onChange={value =>
                updateChildComponent(selectedChildIndex!, {
                  schema: { ...child.schema, height: value || componentMeta.defaultHeight },
                })
              }
              min={10}
              max={1000}
              placeholder="高度"
              style={{ width: 100 }}
            />
          </div>
        </Space>
      </Card>
    )
  }

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

      <Card title="子组件列表" size="small" style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Button type="primary" icon={<AppstoreOutlined />} onClick={() => setShowComponentPicker(true)}>
            添加子组件
          </Button>
        </div>

        {visualConfig.children.length === 0 ? (
          <div className="empty-state" style={{ padding: 40, textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div>暂无子组件，点击上方按钮添加</div>
          </div>
        ) : (
          <List
            dataSource={visualConfig.children}
            renderItem={(child, index) => {
              const componentInfo = getChildComponentInfo(child.type)
              const isSelected = selectedChildIndex === index

              return (
                <List.Item
                  key={child.id}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedChildIndex(isSelected ? null : index)}
                  actions={[
                    <Button
                      key="up"
                      type="text"
                      icon={<UpOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        moveChildComponent(index, 'up')
                      }}
                      disabled={index === 0}
                    />,
                    <Button
                      key="down"
                      type="text"
                      icon={<DownOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        moveChildComponent(index, 'down')
                      }}
                      disabled={index === visualConfig.children.length - 1}
                    />,
                    <Button
                      key="settings"
                      type="text"
                      icon={<SettingOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedChildIndex(index)
                      }}
                    />,
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChildComponent(index)
                      }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 20 }}>{componentInfo.icon}</span>}
                    title={
                      <span>
                        {componentInfo.name}
                        {isSelected && <Tag color="blue" style={{ marginLeft: 8 }}>已选中</Tag>}
                      </span>
                    }
                    description={`类型: ${child.type} | ID: ${child.id.slice(-8)}`}
                  />
                </List.Item>
              )
            }}
          />
        )}
      </Card>

      {renderChildPropsEditor()}
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

      <Modal
        title="选择子组件"
        open={showComponentPicker}
        onCancel={() => setShowComponentPicker(false)}
        footer={null}
        width={600}
      >
        <div className="component-picker">
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: '#666', fontSize: 14 }}>从组件库中选择要添加到可视化模板的子组件：</span>
          </div>
          <div className="component-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {AVAILABLE_COMPONENTS.map((component) => (
              <div
                key={component.type}
                className="component-item cursor-pointer border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                onClick={() => addChildComponent(component.type)}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{component.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{component.name}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{component.type}</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
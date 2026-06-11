'use client'

import React, { useMemo, useCallback, useState, useEffect } from 'react'
import { Group, Rect, Text, Line } from 'react-konva'
import { ComponentConfig } from '@/store/canvasStore'
import { useComponentDataBinding, BindingMode } from '@/hooks/useComponentDataBinding'
import { componentPool } from '@/utils/ComponentPool'

interface OptimizedComponentRendererProps {
  component: ComponentConfig
  isSelected: boolean
  onSelect: (e: any) => void
  onDragMove: (newX: number, newY: number) => void
  onTransform: (attrs: any) => void
}

// 渲染按钮组件
const RenderButton = React.memo(({ component }: { component: ComponentConfig }) => {
  const getButtonColor = (type: string) => {
    const colors: Record<string, string> = {
      primary: '#1890ff',
      default: '#fff',
      ghost: 'transparent',
      dashed: '#fff',
      text: 'transparent',
      link: 'transparent',
    }
    return colors[type] || colors.default
  }

  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={component.width}
        height={component.height}
        fill={getButtonColor(component.props.type)}
        stroke={component.props.type !== 'primary' ? '#d9d9d9' : '#1890ff'}
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={component.width / 2}
        y={component.height / 2}
        text={component.props.text}
        fontSize={14}
        fill={component.props.type === 'primary' ? '#fff' : '#333'}
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2}
        offsetY={component.height / 2}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component.props
  const n = next.component.props
  return prev.component.width === next.component.width &&
         prev.component.height === next.component.height &&
         p.type === n.type &&
         p.text === n.text
})

// 渲染输入框组件
const RenderInput = React.memo(({ component }: { component: ComponentConfig }) => {
  const getBindingMode = (): BindingMode => {
    switch (component.type) {
      case 'table':
        return 'table'
      case 'select':
        return 'list'
      case 'input':
      case 'textarea':
        return 'single'
      default:
        return 'single'
    }
  }

  const { value, isLoading, error } = useComponentDataBinding(component.id, {
    bindingMode: getBindingMode(),
    autoFetch: true,
  })

  const getDisplayValue = () => {
    if (component.props.dataSourceId && component.props.dataField && value !== undefined) {
      return value
    }
    return component.props.value ?? ''
  }

  const labelWidth = component.props.label ? 80 : 0
  const inputWidth = component.width - labelWidth
  const displayValue = getDisplayValue()

  return (
    <Group>
      {component.props.label && (
        <Text
          x={0}
          y={component.height / 2}
          text={component.props.label}
          fontSize={14}
          fill="#333"
          align="left"
          verticalAlign="middle"
          offsetY={component.height / 2}
          width={labelWidth - 8}
        />
      )}
      
      <Rect
        x={labelWidth}
        y={0}
        width={inputWidth}
        height={component.height}
        fill="#fff"
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={4}
      />
      
      {component.props.dataSourceId && (
        <Rect
          x={labelWidth + 4}
          y={component.height - 8}
          width={6}
          height={6}
          fill={isLoading ? '#1890ff' : error ? '#ff4d4f' : '#52c41a'}
          cornerRadius={3}
        />
      )}
      
      <Text
        x={labelWidth + 8 + (component.props.dataSourceId ? 8 : 0)}
        y={component.height / 2}
        text={displayValue || component.props.placeholder}
        fontSize={14}
        fill={displayValue ? '#333' : '#bfbfbf'}
        align="left"
        verticalAlign="middle"
        offsetY={component.height / 2}
        width={inputWidth - 16 - (component.props.dataSourceId ? 12 : 0)}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.dataSourceId === n.props.dataSourceId &&
         p.props.dataField === n.props.dataField
})

// 渲染文本组件
const RenderText = React.memo(({ component }: { component: ComponentConfig }) => (
  <Group>
    <Text
      x={0}
      y={0}
      width={component.width}
      text={component.props.content}
      fontSize={component.props.fontSize}
      fontWeight={component.props.fontWeight}
      fill={component.props.color}
      align="left"
      verticalAlign="middle"
    />
  </Group>
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.props.content === n.props.content &&
         p.props.fontSize === n.props.fontSize &&
         p.props.fontWeight === n.props.fontWeight &&
         p.props.color === n.props.color
})

// 渲染卡片组件
const RenderCard = React.memo(({ component }: { component: ComponentConfig }) => (
  <Group>
    <Rect
      x={0}
      y={0}
      width={component.width}
      height={component.height}
      fill="#fff"
      stroke="#e8e8e8"
      strokeWidth={1}
      cornerRadius={4}
    />
    <Rect
      x={0}
      y={0}
      width={component.width}
      height={48}
      fill="#fafafa"
      cornerRadius={[4, 4, 0, 0]}
    />
    <Text
      x={16}
      y={24}
      text={component.props.title}
      fontSize={16}
      fontWeight="bold"
      fill="#333"
      verticalAlign="middle"
      offsetY={24}
    />
    <Text
      x={16}
      y={64}
      text={component.props.content}
      fontSize={14}
      fill="#666"
    />
  </Group>
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.title === n.props.title &&
         p.props.content === n.props.content
})

// 渲染表格组件
const RenderTable = React.memo(({ component }: { component: ComponentConfig }) => {
  const { value, data, isLoading, error } = useComponentDataBinding(component.id, {
    bindingMode: 'table',
    autoFetch: true,
  })

  const { columns = 4, rows = 5 } = component.props
  const displayRows = data.length > 0 ? Math.min(data.length + 1, rows) : rows
  const displayColumns = data.length > 0 && data[0] ? Math.min(Object.keys(data[0]).length, columns) : columns
  const cellWidth = component.width / displayColumns
  const cellHeight = component.height / displayRows

  const tableElements = useMemo(() => {
    const elements: JSX.Element[] = []

    for (let i = 0; i <= displayRows; i++) {
      elements.push(
        <Line
          key={`h-${i}`}
          points={[0, i * cellHeight, component.width, i * cellHeight]}
          stroke={i === 0 || i === displayRows ? '#d9d9d9' : '#e8e8e8'}
          strokeWidth={i === 0 || i === displayRows ? 2 : 1}
        />
      )
    }

    for (let i = 0; i <= displayColumns; i++) {
      elements.push(
        <Line
          key={`v-${i}`}
          points={[i * cellWidth, 0, i * cellWidth, component.height]}
          stroke={i === 0 || i === displayColumns ? '#d9d9d9' : '#e8e8e8'}
          strokeWidth={i === 0 || i === displayColumns ? 2 : 1}
        />
      )
    }

    if (data.length > 0 && data[0]) {
      const fieldNames = Object.keys(data[0]).slice(0, displayColumns)
      
      elements.push(
        <Rect
          key="header-bg"
          x={0}
          y={0}
          width={component.width}
          height={cellHeight}
          fill="#fafafa"
        />
      )
      
      fieldNames.forEach((field, idx) => {
        elements.push(
          <Text
            key={`header-${idx}`}
            x={idx * cellWidth + 8}
            y={cellHeight / 2}
            text={field}
            fontSize={12}
            fontWeight="bold"
            fill="#333"
            align="left"
            verticalAlign="middle"
            offsetY={cellHeight / 2}
            width={cellWidth - 16}
          />
        )
      })

      data.slice(0, displayRows - 1).forEach((row, rowIdx) => {
        fieldNames.forEach((field, colIdx) => {
          const cellValue = row[field] !== undefined ? String(row[field]) : ''
          elements.push(
            <Text
              key={`data-${rowIdx}-${colIdx}`}
              x={colIdx * cellWidth + 8}
              y={(rowIdx + 1) * cellHeight + cellHeight / 2}
              text={cellValue}
              fontSize={12}
              fill="#666"
              align="left"
              verticalAlign="middle"
              offsetY={cellHeight / 2}
              width={cellWidth - 16}
            />
          )
        })
      })
    } else {
      elements.push(
        <Text
          key="empty"
          x={component.width / 2}
          y={component.height / 2}
          text={isLoading ? '加载中...' : component.props.dataSourceId ? '暂无数据' : '表格组件'}
          fontSize={12}
          fill="#999"
          align="center"
          verticalAlign="middle"
          offsetX={component.width / 2}
          offsetY={component.height / 2}
        />
      )
    }

    if (component.props.dataSourceId) {
      elements.push(
        <Rect
          key="binding-indicator"
          x={component.width - 12}
          y={component.height - 12}
          width={8}
          height={8}
          fill={isLoading ? '#1890ff' : error ? '#ff4d4f' : '#52c41a'}
          cornerRadius={4}
        />
      )
    }

    return elements
  }, [component.width, component.height, displayRows, displayColumns, cellWidth, cellHeight, data, isLoading, error, component.props.dataSourceId])

  return <Group>{tableElements}</Group>
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.columns === n.props.columns &&
         p.props.rows === n.props.rows &&
         p.props.dataSourceId === n.props.dataSourceId
})

// 渲染其他简单组件
const RenderOther = React.memo(({ component }: { component: ComponentConfig }) => {
  switch (component.type) {
    case 'checkbox':
      return (
        <Group>
          <Rect
            x={0}
            y={component.height / 2 - 10}
            width={20}
            height={20}
            fill={component.props.checked ? '#1890ff' : '#fff'}
            stroke="#d9d9d9"
            strokeWidth={1}
            cornerRadius={4}
          />
          {component.props.checked && (
            <Text
              x={4}
              y={component.height / 2 - 4}
              text="✓"
              fontSize={14}
              fill="#fff"
              verticalAlign="middle"
            />
          )}
          <Text
            x={28}
            y={component.height / 2}
            text={component.props.label}
            fontSize={14}
            fill="#333"
            verticalAlign="middle"
            offsetY={component.height / 2}
          />
        </Group>
      )
    
    case 'radio':
      return (
        <Group>
          <Rect
            x={0}
            y={component.height / 2 - 8}
            width={16}
            height={16}
            fill={component.props.value ? '#1890ff' : '#fff'}
            stroke="#d9d9d9"
            strokeWidth={1}
            cornerRadius={8}
          />
          {component.props.value && (
            <Rect
              x={4}
              y={component.height / 2 - 4}
              width={8}
              height={8}
              fill="#fff"
              cornerRadius={4}
            />
          )}
          <Text
            x={24}
            y={component.height / 2}
            text={component.props.label}
            fontSize={14}
            fill="#333"
            verticalAlign="middle"
            offsetY={component.height / 2}
          />
        </Group>
      )
    
    case 'modal':
      return (
        <Group>
          <Rect
            x={0}
            y={0}
            width={component.width}
            height={component.height}
            fill="#fff"
            stroke="#d9d9d9"
            strokeWidth={1}
            cornerRadius={4}
          />
          <Rect
            x={0}
            y={0}
            width={component.width}
            height={48}
            fill="#fafafa"
            cornerRadius={[4, 4, 0, 0]}
          />
          <Text
            x={16}
            y={24}
            text={component.props.title}
            fontSize={16}
            fontWeight="bold"
            fill="#333"
            verticalAlign="middle"
            offsetY={24}
          />
          <Text
            x={component.width - 40}
            y={24}
            text="✕"
            fontSize={20}
            fill="#999"
            verticalAlign="middle"
            offsetY={24}
          />
        </Group>
      )
    
    default:
      return (
        <Rect
          x={0}
          y={0}
          width={component.width}
          height={component.height}
          fill="#f0f0f0"
          stroke="#d9d9d9"
          strokeWidth={1}
        />
      )
  }
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.type === n.type &&
         p.width === n.width &&
         p.height === n.height &&
         JSON.stringify(p.props) === JSON.stringify(n.props)
})

// 渲染器映射
const renderers: Record<string, React.ComponentType<{ component: ComponentConfig }>> = {
  button: RenderButton,
  input: RenderInput,
  text: RenderText,
  card: RenderCard,
  table: RenderTable,
  checkbox: RenderOther,
  radio: RenderOther,
  modal: RenderOther,
}

// 获取组件渲染器
const getRenderer = (type: string): React.ComponentType<{ component: ComponentConfig }> => {
  return renderers[type] || RenderOther
}

// 主渲染组件
export const OptimizedComponentRenderer = React.memo(({
  component,
  isSelected,
  onSelect,
  onDragMove,
  onTransform,
}: OptimizedComponentRendererProps) => {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false)
    }
  }, [])

  const renderer = useMemo(() => getRenderer(component.type), [component.type])

  const renderComponent = useMemo(() => {
    // 对于静态组件尝试从池中获取
    if (!component.hasAnimation && !component.hasInteractiveState) {
      const cachedElement = componentPool.get(component.type, component.id)
      if (cachedElement) {
        return cachedElement
      }
    }

    const element = React.createElement(renderer, { component })
    
    // 将静态组件放入池中
    if (!component.hasAnimation && !component.hasInteractiveState && isMounted) {
      componentPool.release(component.type, component.id, element)
    }

    return element
  }, [component, renderer, isMounted])

  // 创建选择框渲染函数（独立缓存）
  const selectionRect = useMemo(() => {
    if (!isSelected) return null
    return (
      <Rect
        x={-2}
        y={-2}
        width={component.width + 4}
        height={component.height + 4}
        stroke="#1890ff"
        strokeWidth={2}
        strokeScaleEnabled={false}
        fill="transparent"
      />
    )
  }, [isSelected, component.width, component.height])

  const handleDragMove = useCallback((e: any) => {
    onDragMove(e.target.x(), e.target.y())
  }, [onDragMove])

  const handleClick = useCallback((e: any) => {
    onSelect(e)
  }, [onSelect])

  if (!isMounted) return null

  return (
    <Group
      x={component.x}
      y={component.y}
      width={component.width}
      height={component.height}
      zIndex={component.zIndex}
      onClick={handleClick}
      onTap={handleClick}
      draggable={!component.locked}
      onDragMove={handleDragMove}
      opacity={component.opacity}
      rotation={component.rotation}
      visible={component.visible}
    >
      {renderComponent}
      {selectionRect}
    </Group>
  )
}, (prevProps, nextProps) => {
  if (prevProps.component.id !== nextProps.component.id) return false
  if (prevProps.isSelected !== nextProps.isSelected) return false
  if (prevProps.component.x !== nextProps.component.x) return false
  if (prevProps.component.y !== nextProps.component.y) return false
  if (prevProps.component.zIndex !== nextProps.component.zIndex) return false
  if (prevProps.component.locked !== nextProps.component.locked) return false
  if (prevProps.component.opacity !== nextProps.component.opacity) return false
  if (prevProps.component.rotation !== nextProps.component.rotation) return false
  if (prevProps.component.visible !== nextProps.component.visible) return false
  
  // 对于静态组件，检查props是否变化
  const prevStatic = !prevProps.component.hasAnimation && !prevProps.component.hasInteractiveState
  const nextStatic = !nextProps.component.hasAnimation && !nextProps.component.hasInteractiveState
  
  if (prevStatic && nextStatic) {
    // 深度比较props
    return JSON.stringify(prevProps.component.props) === JSON.stringify(nextProps.component.props)
  }
  
  return true
})
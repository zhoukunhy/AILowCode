'use client'

import React, { useMemo, useCallback, useState, useEffect } from 'react'
import { Group, Rect, Text, Line, Circle } from 'react-konva'
import { ComponentConfig } from '@/store/canvasStore'
import { useComponentDataBinding, BindingMode } from '@/hooks/useComponentDataBinding'
import { CustomComponentRenderer } from './CustomComponentRenderer'
import { customComponentRegistry } from '@/services/CustomComponentRegistry'

interface OptimizedComponentRendererProps {
  component: ComponentConfig
  isSelected: boolean
  onSelect: (e: any) => void
  onDragMove: (newX: number, newY: number) => void
  onDragStart: () => void
  onDragEnd: () => void
  onTransform: (attrs: any) => void
}

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

  const labelWidth = component.props.label ? component.props.label.length * 14 + 8 : 0
  const inputWidth = component.width - labelWidth - (component.props.label ? 4 : 0)
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
          offsetY={7}
        />
      )}
      
      <Rect
        x={labelWidth + (component.props.label ? 4 : 0)}
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
          x={labelWidth + 8}
          y={component.height - 8}
          width={6}
          height={6}
          fill={isLoading ? '#1890ff' : error ? '#ff4d4f' : '#52c41a'}
          cornerRadius={3}
        />
      )}
      
      <Text
        x={labelWidth + 12 + (component.props.dataSourceId ? 8 : 0)}
        y={component.height / 2}
        text={displayValue || component.props.placeholder}
        fontSize={14}
        fill={displayValue ? '#333' : '#bfbfbf'}
        align="left"
        verticalAlign="middle"
        offsetY={7}
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

const RenderTable = React.memo(({ component }: { component: ComponentConfig }) => {
  const { data, isLoading, error } = useComponentDataBinding(component.id, {
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

const RenderTextarea = React.memo(({ component }: { component: ComponentConfig }) => {
  const labelWidth = component.props.label ? component.props.label.length * 14 + 8 : 0
  const inputWidth = component.width - labelWidth - (component.props.label ? 4 : 0)

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
          offsetY={7}
        />
      )}
      <Rect
        x={labelWidth + (component.props.label ? 4 : 0)}
        y={0}
        width={inputWidth}
        height={component.height}
        fill="#fff"
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={labelWidth + 12}
        y={component.height / 2}
        text={component.props.placeholder}
        fontSize={14}
        fill="#bfbfbf"
        align="left"
        verticalAlign="middle"
        offsetY={7}
        width={inputWidth - 16}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.placeholder === n.props.placeholder
})

const RenderSelect = React.memo(({ component }: { component: ComponentConfig }) => {
  const labelWidth = component.props.label ? component.props.label.length * 14 + 8 : 0
  const inputWidth = component.width - labelWidth - (component.props.label ? 4 : 0)

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
          offsetY={7}
        />
      )}
      <Rect
        x={labelWidth + (component.props.label ? 4 : 0)}
        y={0}
        width={inputWidth}
        height={component.height}
        fill="#fff"
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={labelWidth + 12}
        y={component.height / 2}
        text={component.props.placeholder}
        fontSize={14}
        fill="#bfbfbf"
        align="left"
        verticalAlign="middle"
        offsetY={7}
        width={inputWidth - 36}
      />
      <Text
        x={labelWidth + inputWidth + 4 - 20}
        y={component.height / 2}
        text="▼"
        fontSize={10}
        fill="#999"
        verticalAlign="middle"
        offsetY={5}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.placeholder === n.props.placeholder
})

const RenderSwitch = React.memo(({ component }: { component: ComponentConfig }) => {
  const thumbX = component.props.checked ? 20 : 2
  return (
    <Group>
      {component.props.label && (
        <Text
          x={0}
          y={component.height / 2}
          text={component.props.label}
          fontSize={14}
          fill="#333"
          verticalAlign="middle"
          offsetY={component.height / 2}
          width={component.width - 50}
        />
      )}
      <Rect
        x={component.width - 50}
        y={component.height / 2 - 10}
        width={40}
        height={20}
        fill={component.props.checked ? '#1890ff' : '#d9d9d9'}
        cornerRadius={10}
      />
      <Rect
        x={component.width - 50 + thumbX}
        y={component.height / 2 - 8}
        width={16}
        height={16}
        fill="#fff"
        cornerRadius={8}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.checked === n.props.checked
})

const RenderDatePicker = React.memo(({ component }: { component: ComponentConfig }) => {
  const labelWidth = component.props.label ? component.props.label.length * 14 + 8 : 0
  const inputWidth = component.width - labelWidth - (component.props.label ? 4 : 0)

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
          offsetY={7}
        />
      )}
      <Rect
        x={labelWidth + (component.props.label ? 4 : 0)}
        y={0}
        width={inputWidth}
        height={component.height}
        fill="#fff"
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={labelWidth + 12}
        y={component.height / 2}
        text="📅"
        fontSize={16}
        verticalAlign="middle"
        offsetY={8}
      />
      <Text
        x={labelWidth + 36}
        y={component.height / 2}
        text={component.props.placeholder}
        fontSize={14}
        fill="#bfbfbf"
        align="left"
        verticalAlign="middle"
        offsetY={7}
        width={inputWidth - 48}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.placeholder === n.props.placeholder
})

const RenderSlider = React.memo(({ component }: { component: ComponentConfig }) => {
  const { min = 0, max = 100, value = 50 } = component.props
  const percentage = ((value - min) / (max - min)) * 100
  const sliderWidth = component.width - 100

  return (
    <Group>
      <Text
        x={0}
        y={12}
        text={component.props.label}
        fontSize={14}
        fill="#333"
      />
      <Rect
        x={0}
        y={24}
        width={sliderWidth}
        height={6}
        fill="#e8e8e8"
        cornerRadius={3}
      />
      <Rect
        x={0}
        y={24}
        width={sliderWidth * (percentage / 100)}
        height={6}
        fill="#1890ff"
        cornerRadius={3}
      />
      <Circle
        x={sliderWidth * (percentage / 100)}
        y={27}
        radius={8}
        fill="#1890ff"
      />
      <Circle
        x={sliderWidth * (percentage / 100)}
        y={27}
        radius={4}
        fill="#fff"
      />
      <Text
        x={sliderWidth + 16}
        y={30}
        text={String(value)}
        fontSize={14}
        fill="#333"
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.props.label === n.props.label &&
         p.props.value === n.props.value &&
         p.props.min === n.props.min &&
         p.props.max === n.props.max
})

const RenderRate = React.memo(({ component }: { component: ComponentConfig }) => {
  const { count = 5, value = 0 } = component.props
  const stars = Array.from({ length: count }, (_, i) => (
    <Text
      key={i}
      x={i * 24}
      y={component.height / 2}
      text="★"
      fontSize={20}
      fill={i < value ? '#faad14' : '#e8e8e8'}
      verticalAlign="middle"
      offsetY={component.height / 2}
    />
  ))

  return (
    <Group>
      <Text
        x={0}
        y={12}
        text={component.props.label}
        fontSize={14}
        fill="#333"
        width={component.width}
      />
      <Group x={0} y={20}>
        {stars}
      </Group>
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.props.label === n.props.label &&
         p.props.count === n.props.count &&
         p.props.value === n.props.value
})

const RenderUpload = React.memo(({ component }: { component: ComponentConfig }) => {
  return (
    <Group>
      {component.props.label && (
        <Text
          x={0}
          y={16}
          text={component.props.label}
          fontSize={14}
          fill="#333"
          width={component.width}
        />
      )}
      <Rect
        x={0}
        y={component.props.label ? 32 : 0}
        width={component.width}
        height={component.props.label ? component.height - 32 : component.height}
        fill="#fff"
        stroke="#d9d9d9"
        strokeWidth={1}
        strokeDash={[4, 4]}
        cornerRadius={4}
      />
      <Text
        x={component.width / 2}
        y={component.height / 2}
        text="📤"
        fontSize={32}
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2}
        offsetY={component.height / 2}
      />
      <Text
        x={component.width / 2}
        y={component.height / 2 + 24}
        text={component.props.placeholder}
        fontSize={12}
        fill="#999"
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2}
        offsetY={component.height / 2 + 24}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.placeholder === n.props.placeholder
})

const RenderCheckbox = React.memo(({ component }: { component: ComponentConfig }) => (
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
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.checked === n.props.checked
})

const RenderRadio = React.memo(({ component }: { component: ComponentConfig }) => (
  <Group>
    <Circle
      x={8}
      y={component.height / 2}
      radius={8}
      fill={component.props.value ? '#1890ff' : '#fff'}
      stroke="#d9d9d9"
      strokeWidth={1}
    />
    {component.props.value && (
      <Circle
        x={8}
        y={component.height / 2}
        radius={4}
        fill="#fff"
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
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.value === n.props.value
})

const RenderModal = React.memo(({ component }: { component: ComponentConfig }) => (
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
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.title === n.props.title
})

const RenderTabs = React.memo(({ component }: { component: ComponentConfig }) => {
  const { tabs = ['标签1', '标签2'], activeTab = 0 } = component.props
  
  const tabWidth = component.width / tabs.length
  const elements: JSX.Element[] = []
  
  tabs.forEach((tab: string, idx: number) => {
    const isActive = idx === activeTab
    elements.push(
      <Rect
        key={`tab-bg-${idx}`}
        x={idx * tabWidth}
        y={0}
        width={tabWidth}
        height={36}
        fill={isActive ? '#fff' : '#f5f5f5'}
        cornerRadius={[idx === 0 ? 4 : 0, idx === tabs.length - 1 ? 4 : 0, 0, 0]}
      />,
      <Text
        key={`tab-${idx}`}
        x={idx * tabWidth + tabWidth / 2}
        y={18}
        text={tab}
        fontSize={14}
        fill={isActive ? '#1890ff' : '#666'}
        fontWeight={isActive ? 'bold' : 'normal'}
        align="center"
        verticalAlign="middle"
        offsetX={tabWidth / 2}
        offsetY={18}
      />
    )
    if (isActive) {
      elements.push(
        <Line
          key={`tab-line-${idx}`}
          points={[idx * tabWidth, 36, (idx + 1) * tabWidth, 36]}
          stroke="#1890ff"
          strokeWidth={2}
        />
      )
    }
  })
  
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
      {elements}
      <Text
        x={16}
        y={60}
        text="标签页内容区域"
        fontSize={14}
        fill="#666"
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         JSON.stringify(p.props.tabs) === JSON.stringify(n.props.tabs) &&
         p.props.activeTab === n.props.activeTab
})

const RenderDrawer = React.memo(({ component }: { component: ComponentConfig }) => (
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
    <Line
      x1={0}
      y1={0}
      x2={0}
      y2={component.height}
      stroke="#1890ff"
      strokeWidth={4}
    />
    <Rect
      x={0}
      y={0}
      width={component.width}
      height={48}
      fill="#fafafa"
      cornerRadius={[4, 0, 0, 4]}
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
  </Group>
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.title === n.props.title
})

const RenderAlert = React.memo(({ component }: { component: ComponentConfig }) => {
  const typeColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    success: { bg: '#f6ffed', border: '#b7eb8f', text: '#52c41a', icon: '✓' },
    error: { bg: '#fff2f0', border: '#ffccc7', text: '#ff4d4f', icon: '✕' },
    warning: { bg: '#fffbe6', border: '#ffe58f', text: '#faad14', icon: '⚠' },
    info: { bg: '#e6f7ff', border: '#91d5ff', text: '#1890ff', icon: 'ℹ' },
  }
  const colors = typeColors[component.props.type] || typeColors.info

  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={component.width}
        height={component.height}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={16}
        y={component.height / 2}
        text={component.props.showIcon ? colors.icon + ' ' : ''}
        fontSize={14}
        fill={colors.text}
        verticalAlign="middle"
        offsetY={component.height / 2}
      />
      <Text
        x={16 + (component.props.showIcon ? 24 : 0)}
        y={component.height / 2}
        text={component.props.message}
        fontSize={14}
        fill={colors.text}
        verticalAlign="middle"
        offsetY={component.height / 2}
        width={component.width - 32 - (component.props.showIcon ? 24 : 0)}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.type === n.props.type &&
         p.props.message === n.props.message &&
         p.props.showIcon === n.props.showIcon
})

const RenderAvatar = React.memo(({ component }: { component: ComponentConfig }) => (
  <Group>
    <Circle
      x={component.width / 2}
      y={component.height / 2}
      radius={Math.min(component.width, component.height) / 2}
      fill="#e8e8e8"
    />
    <Text
      x={component.width / 2}
      y={component.height / 2}
      text="👤"
      fontSize={Math.min(component.width, component.height) / 2}
      align="center"
      verticalAlign="middle"
      offsetX={component.width / 2}
      offsetY={component.height / 2}
    />
  </Group>
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height
})

const RenderTag = React.memo(({ component }: { component: ComponentConfig }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    blue: { bg: '#e6f7ff', text: '#1890ff' },
    red: { bg: '#fff2f0', text: '#ff4d4f' },
    green: { bg: '#f6ffed', text: '#52c41a' },
    orange: { bg: '#fff7e6', text: '#fa8c16' },
    purple: { bg: '#f9f0ff', text: '#722ed1' },
  }
  const color = colors[component.props.color] || colors.blue

  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={component.width}
        height={component.height}
        fill={color.bg}
        cornerRadius={4}
      />
      <Text
        x={component.width / 2}
        y={component.height / 2}
        text={component.props.label}
        fontSize={12}
        fill={color.text}
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2}
        offsetY={component.height / 2}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.color === n.props.color
})

const RenderBadge = React.memo(({ component }: { component: ComponentConfig }) => {
  return (
    <Group>
      <Circle
        x={component.width / 2 - 10}
        y={component.height / 2}
        radius={16}
        fill="#e8e8e8"
      />
      <Text
        x={component.width / 2 - 10}
        y={component.height / 2}
        text="🔔"
        fontSize={16}
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2 - 10}
        offsetY={component.height / 2}
      />
      {component.props.dot ? (
        <Circle
          x={component.width / 2 + 12}
          y={component.height / 2 - 10}
          radius={6}
          fill="#ff4d4f"
        />
      ) : (
        <Rect
          x={component.width / 2 + 8}
          y={component.height / 2 - 12}
          width={20}
          height={16}
          fill="#ff4d4f"
          cornerRadius={8}
        />
      )}
      {!component.props.dot && (
        <Text
          x={component.width / 2 + 18}
          y={component.height / 2 - 4}
          text={String(component.props.count || 0)}
          fontSize={10}
          fill="#fff"
          align="center"
          verticalAlign="middle"
        />
      )}
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.dot === n.props.dot &&
         p.props.count === n.props.count
})

const RenderDivider = React.memo(({ component }: { component: ComponentConfig }) => (
  <Group>
    <Line
      points={[0, component.height / 2, component.width, component.height / 2]}
      stroke="#e8e8e8"
      strokeWidth={1}
    />
  </Group>
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height
})

const RenderImage = React.memo(({ component }: { component: ComponentConfig }) => (
  <Group>
    <Rect
      x={0}
      y={0}
      width={component.width}
      height={component.height}
      fill="#f5f5f5"
      stroke="#d9d9d9"
      strokeWidth={1}
      cornerRadius={4}
    />
    <Text
      x={component.width / 2}
      y={component.height / 2}
      text="🖼️"
      fontSize={Math.min(component.width, component.height) / 3}
      align="center"
      verticalAlign="middle"
      offsetX={component.width / 2}
      offsetY={component.height / 2}
    />
    <Text
      x={component.width / 2}
      y={component.height / 2 + 30}
      text={component.props.alt || '图片'}
      fontSize={12}
      fill="#999"
      align="center"
      verticalAlign="middle"
      offsetX={component.width / 2}
      offsetY={component.height / 2 + 30}
    />
  </Group>
), (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.alt === n.props.alt
})

const RenderHeading = React.memo(({ component }: { component: ComponentConfig }) => {
  const level = component.props.level || 1
  const fontSize = level === 1 ? 28 : level === 2 ? 24 : level === 3 ? 20 : 16

  return (
    <Group>
      <Text
        x={0}
        y={component.height / 2}
        text={component.props.content}
        fontSize={fontSize}
        fontWeight="bold"
        fill={component.props.color || '#333'}
        verticalAlign="middle"
        offsetY={component.height / 2}
        width={component.width}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.content === n.props.content &&
         p.props.level === n.props.level &&
         p.props.color === n.props.color
})

const RenderPagination = React.memo(({ component }: { component: ComponentConfig }) => {
  const { total = 100 } = component.props
  const elements: JSX.Element[] = []
  
  elements.push(
    <Text
      x={0}
      y={component.height / 2}
      text={`共 ${total} 条`}
      fontSize={12}
      fill="#666"
      verticalAlign="middle"
      offsetY={component.height / 2}
    />
  )
  
  const pages = [1, 2, 3]
  let x = 80
  pages.forEach((page, idx) => {
    elements.push(
      <Rect
        key={`page-${page}`}
        x={x}
        y={component.height / 2 - 10}
        width={28}
        height={20}
        fill={idx === 0 ? '#1890ff' : '#fff'}
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={3}
      />,
      <Text
        key={`page-text-${page}`}
        x={x + 14}
        y={component.height / 2}
        text={String(page)}
        fontSize={12}
        fill={idx === 0 ? '#fff' : '#666'}
        align="center"
        verticalAlign="middle"
        offsetY={component.height / 2}
      />
    )
    x += 32
  })

  return <Group>{elements}</Group>
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.total === n.props.total
})

const RenderList = React.memo(({ component }: { component: ComponentConfig }) => {
  const { items = ['列表项1', '列表项2', '列表项3'] } = component.props
  const elements: JSX.Element[] = []

  elements.push(
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
  )

  if (component.props.title) {
    elements.push(
      <Text
        x={16}
        y={24}
        text={component.props.title}
        fontSize={14}
        fontWeight="bold"
        fill="#333"
        verticalAlign="middle"
        offsetY={24}
      />
    )
  }

  const startY = component.props.title ? 48 : 16
  items.slice(0, Math.floor((component.height - startY) / 32)).forEach((item: string, idx: number) => {
    elements.push(
      <Text
        key={idx}
        x={16}
        y={startY + idx * 32}
        text={item}
        fontSize={14}
        fill="#666"
      />
    )
  })

  return <Group>{elements}</Group>
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.title === n.props.title &&
         JSON.stringify(p.props.items) === JSON.stringify(n.props.items)
})

const RenderSteps = React.memo(({ component }: { component: ComponentConfig }) => {
  const { steps = ['步骤1', '步骤2', '步骤3'], current = 1 } = component.props
  const stepWidth = component.width / steps.length
  const elements: JSX.Element[] = []

  steps.forEach((step: string, idx: number) => {
    const isCompleted = idx < current
    const isCurrent = idx === current
    
    elements.push(
      <Circle
        key={`step-${idx}`}
        x={idx * stepWidth + stepWidth / 2}
        y={24}
        radius={12}
        fill={isCurrent ? '#1890ff' : isCompleted ? '#52c41a' : '#e8e8e8'}
      />
    )
    
    elements.push(
      <Text
        key={`step-icon-${idx}`}
        x={idx * stepWidth + stepWidth / 2}
        y={24}
        text={isCompleted ? '✓' : String(idx + 1)}
        fontSize={12}
        fill={isCurrent || isCompleted ? '#fff' : '#999'}
        align="center"
        verticalAlign="middle"
      />
    )
    
    elements.push(
      <Text
        key={`step-text-${idx}`}
        x={idx * stepWidth + stepWidth / 2}
        y={56}
        text={step}
        fontSize={12}
        fill="#666"
        align="center"
        verticalAlign="middle"
        width={stepWidth}
      />
    )
    
    if (idx < steps.length - 1) {
      elements.push(
        <Line
          key={`line-${idx}`}
          points={[
            idx * stepWidth + stepWidth / 2 + 12,
            24,
            (idx + 1) * stepWidth + stepWidth / 2 - 12,
            24
          ]}
          stroke={isCompleted ? '#52c41a' : '#e8e8e8'}
          strokeWidth={2}
        />
      )
    }
  })

  return <Group>{elements}</Group>
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         JSON.stringify(p.props.steps) === JSON.stringify(n.props.steps) &&
         p.props.current === n.props.current
})

const RenderTimeline = React.memo(({ component }: { component: ComponentConfig }) => {
  const { items = [{ title: '时间点1', content: '描述内容' }] } = component.props
  const elements: JSX.Element[] = []

  elements.push(
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
  )
  
  elements.push(
    <Line
      points={[16, 16, 16, component.height - 16]}
      stroke="#e8e8e8"
      strokeWidth={2}
    />
  )

  items.slice(0, Math.floor((component.height - 32) / 64)).forEach((item: { title: string; content: string }, idx: number) => {
    const y = 32 + idx * 64
    elements.push(
      <Circle
        key={`dot-${idx}`}
        x={16}
        y={y}
        radius={6}
        fill="#1890ff"
      />,
      <Text
        key={`title-${idx}`}
        x={32}
        y={y - 8}
        text={item.title}
        fontSize={12}
        fill="#999"
      />,
      <Text
        key={`content-${idx}`}
        x={32}
        y={y + 12}
        text={item.content}
        fontSize={14}
        fill="#333"
        width={component.width - 48}
      />
    )
  })

  return <Group>{elements}</Group>
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         JSON.stringify(p.props.items) === JSON.stringify(n.props.items)
})

const RenderCarousel = React.memo(({ component }: { component: ComponentConfig }) => {
  const { images = [] } = component.props
  
  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={component.width}
        height={component.height}
        fill="#f5f5f5"
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={component.width / 2}
        y={component.height / 2}
        text={images.length > 0 ? '🎠' : '📷'}
        fontSize={Math.min(component.width, component.height) / 4}
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2}
        offsetY={component.height / 2}
      />
      <Text
        x={component.width / 2}
        y={component.height / 2 + 40}
        text={images.length > 0 ? `${images.length} 张图片` : '轮播图组件'}
        fontSize={14}
        fill="#999"
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2}
        offsetY={component.height / 2 + 40}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.images?.length === n.props.images?.length
})

const RenderSpace = React.memo(({ component }: { component: ComponentConfig }) => {
  const elements: JSX.Element[] = []
  const itemWidth = 20
  const gap = 8
  const totalWidth = 3 * itemWidth + 2 * gap
  const startX = (component.width - totalWidth) / 2

  elements.push(
    <Rect
      x={startX}
      y={component.height / 2 - 10}
      width={itemWidth}
      height={itemWidth}
      fill="#1890ff"
      cornerRadius={4}
    />
  )
  elements.push(
    <Rect
      x={startX + itemWidth + gap}
      y={component.height / 2 - 10}
      width={itemWidth}
      height={itemWidth}
      fill="#52c41a"
      cornerRadius={4}
    />
  )
  elements.push(
    <Rect
      x={startX + 2 * itemWidth + 2 * gap}
      y={component.height / 2 - 10}
      width={itemWidth}
      height={itemWidth}
      fill="#faad14"
      cornerRadius={4}
    />
  )

  return <Group>{elements}</Group>
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height
})

const RenderTooltip = React.memo(({ component }: { component: ComponentConfig }) => {
  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={component.width}
        height={component.height}
        fill="#e8e8e8"
        cornerRadius={4}
      />
      <Text
        x={component.width / 2}
        y={component.height / 2}
        text="悬停提示"
        fontSize={12}
        fill="#666"
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2}
        offsetY={component.height / 2}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height
})

const RenderPopover = React.memo(({ component }: { component: ComponentConfig }) => {
  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={component.width}
        height={component.height}
        fill="#e6f7ff"
        cornerRadius={4}
      />
      <Text
        x={component.width / 2}
        y={component.height / 2}
        text="点击弹出"
        fontSize={12}
        fill="#1890ff"
        align="center"
        verticalAlign="middle"
        offsetX={component.width / 2}
        offsetY={component.height / 2}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height
})

const RenderCascader = React.memo(({ component }: { component: ComponentConfig }) => {
  const labelWidth = component.props.label ? component.props.label.length * 14 + 8 : 0
  const inputWidth = component.width - labelWidth - (component.props.label ? 4 : 0)

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
          offsetY={7}
        />
      )}
      <Rect
        x={labelWidth + (component.props.label ? 4 : 0)}
        y={0}
        width={inputWidth}
        height={component.height}
        fill="#fff"
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={labelWidth + 12}
        y={component.height / 2}
        text="🌲"
        fontSize={16}
        verticalAlign="middle"
        offsetY={8}
      />
      <Text
        x={labelWidth + 36}
        y={component.height / 2}
        text={component.props.placeholder}
        fontSize={14}
        fill="#bfbfbf"
        align="left"
        verticalAlign="middle"
        offsetY={7}
        width={inputWidth - 48}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.label === n.props.label &&
         p.props.placeholder === n.props.placeholder
})

const RenderTransfer = React.memo(({ component }: { component: ComponentConfig }) => {
  const leftWidth = (component.width - 40) / 2

  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={component.width}
        height={component.height}
        fill="#f5f5f5"
        cornerRadius={4}
      />
      
      <Rect
        x={0}
        y={0}
        width={leftWidth}
        height={component.height}
        fill="#fff"
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={8}
        y={20}
        text="源列表"
        fontSize={12}
        fill="#999"
      />
      
      <Rect
        x={leftWidth + 40}
        y={0}
        width={leftWidth}
        height={component.height}
        fill="#fff"
        stroke="#d9d9d9"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={leftWidth + 48}
        y={20}
        text="目标列表"
        fontSize={12}
        fill="#999"
      />
      
      <Text
        x={leftWidth + 16}
        y={component.height / 2}
        text="→"
        fontSize={16}
        fill="#999"
        align="center"
        verticalAlign="middle"
        offsetY={component.height / 2}
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height
})

const RenderForm = React.memo(({ component }: { component: ComponentConfig }) => {
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
      <Text
        x={16}
        y={32}
        text={component.props.title || '表单'}
        fontSize={16}
        fontWeight="bold"
        fill="#333"
      />
      <Rect
        x={0}
        y={48}
        width={component.width}
        height={1}
        fill="#e8e8e8"
      />
      <Text
        x={16}
        y={80}
        text="表单内容区域"
        fontSize={14}
        fill="#999"
      />
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         p.props.title === n.props.title
})

const RenderTree = React.memo(({ component }: { component: ComponentConfig }) => {
  const renderTreeNodes = (nodes: any[], x: number, y: number, level: number): JSX.Element[] => {
    const elements: JSX.Element[] = []
    let currentY = y

    nodes.forEach((node) => {
      elements.push(
        <Text
          key={`node-${x}-${currentY}`}
          x={x}
          y={currentY}
          text={node.children ? '📁' : '📄'}
          fontSize={14}
        />,
        <Text
          key={`text-${x}-${currentY}`}
          x={x + 20}
          y={currentY}
          text={node.title || '未命名'}
          fontSize={14}
          fill={node.children ? '#1890ff' : '#666'}
          width={component.width - x - 40}
        />
      )

      if (node.children && node.children.length > 0) {
        elements.push(...renderTreeNodes(node.children, x + 16, currentY + 24, level + 1))
        currentY += 24 * node.children.length
      }

      currentY += 24
    })

    return elements
  }

  const treeData = component.props.treeData || [{ title: '根节点', children: [{ title: '子节点' }] }]

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
      {renderTreeNodes(treeData, 16, 32, 0)}
    </Group>
  )
}, (prev, next) => {
  const p = prev.component
  const n = next.component
  return p.width === n.width &&
         p.height === n.height &&
         JSON.stringify(p.props.treeData) === JSON.stringify(n.props.treeData)
})



export const OptimizedComponentRenderer = React.memo(({
  component,
  isSelected,
  onSelect,
  onDragMove,
  onDragStart,
  onDragEnd,
  onTransform: _onTransform,
}: OptimizedComponentRendererProps) => {
  const [customDefinition, setCustomDefinition] = useState<any>(null)
  
  useEffect(() => {
    if (component.customComponentId) {
      const def = customComponentRegistry.getDefinition(component.customComponentId)
      setCustomDefinition(def)
    } else {
      setCustomDefinition(null)
    }
  }, [component.customComponentId])

  const isCustom = !!customDefinition

  const handleDragStart = useCallback(() => {
    onDragStart()
  }, [onDragStart])

  const handleDragEnd = useCallback(() => {
    onDragEnd()
  }, [onDragEnd])

  const handleDragMove = useCallback((e: any) => {
    if (!e || !e.target) return
    onDragMove(e.target.x(), e.target.y())
  }, [onDragMove])

  const handleClick = useCallback((e: any) => {
    if (!e) return
    onSelect(e)
  }, [onSelect])

  const renderComponentContent = () => {
    switch (component.type) {
      case 'button': return <RenderButton key="btn" component={component} />
      case 'input': return <RenderInput key="input" component={component} />
      case 'text': return <RenderText key="text" component={component} />
      case 'heading': return <RenderHeading key="heading" component={component} />
      case 'card': return <RenderCard key="card" component={component} />
      case 'table': return <RenderTable key="table" component={component} />
      case 'list': return <RenderList key="list" component={component} />
      case 'select': return <RenderSelect key="select" component={component} />
      case 'textarea': return <RenderTextarea key="textarea" component={component} />
      case 'checkbox': return <RenderCheckbox key="checkbox" component={component} />
      case 'radio': return <RenderRadio key="radio" component={component} />
      case 'switch': return <RenderSwitch key="switch" component={component} />
      case 'datepicker': return <RenderDatePicker key="datepicker" component={component} />
      case 'daterange': return <RenderDatePicker key="daterange" component={component} />
      case 'timepicker': return <RenderDatePicker key="timepicker" component={component} />
      case 'numberInput': return <RenderInput key="numberInput" component={component} />
      case 'passwordInput': return <RenderInput key="passwordInput" component={component} />
      case 'emailInput': return <RenderInput key="emailInput" component={component} />
      case 'phoneInput': return <RenderInput key="phoneInput" component={component} />
      case 'upload': return <RenderUpload key="upload" component={component} />
      case 'slider': return <RenderSlider key="slider" component={component} />
      case 'rate': return <RenderRate key="rate" component={component} />
      case 'cascader': return <RenderCascader key="cascader" component={component} />
      case 'transfer': return <RenderTransfer key="transfer" component={component} />
      case 'form': return <RenderForm key="form" component={component} />
      case 'modal': return <RenderModal key="modal" component={component} />
      case 'drawer': return <RenderDrawer key="drawer" component={component} />
      case 'alert': return <RenderAlert key="alert" component={component} />
      case 'avatar': return <RenderAvatar key="avatar" component={component} />
      case 'tag': return <RenderTag key="tag" component={component} />
      case 'badge': return <RenderBadge key="badge" component={component} />
      case 'divider': return <RenderDivider key="divider" component={component} />
      case 'image': return <RenderImage key="image" component={component} />
      case 'pagination': return <RenderPagination key="pagination" component={component} />
      case 'tabs': return <RenderTabs key="tabs" component={component} />
      case 'steps': return <RenderSteps key="steps" component={component} />
      case 'timeline': return <RenderTimeline key="timeline" component={component} />
      case 'carousel': return <RenderCarousel key="carousel" component={component} />
      case 'space': return <RenderSpace key="space" component={component} />
      case 'tooltip': return <RenderTooltip key="tooltip" component={component} />
      case 'popover': return <RenderPopover key="popover" component={component} />
      case 'tree': return <RenderTree key="tree" component={component} />
      default: return <RenderInput key="default" component={component} />
    }
  }

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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      opacity={component.opacity}
      rotation={component.rotation}
      visible={component.visible}
    >
      {isCustom ? (
        <CustomComponentRenderer
          key="custom"
          instance={{
            id: component.id,
            customComponentId: component.customComponentId!,
            version: customDefinition.version || '1.0.0',
            props: component.props,
          }}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragMove={onDragMove}
          onTransform={_onTransform}
          x={0}
          y={0}
          width={component.width}
          height={component.height}
        />
      ) : (
        renderComponentContent()
      )}
      {isSelected && !isCustom && (
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
      )}
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
  
  const prevStatic = !prevProps.component.hasAnimation && !prevProps.component.hasInteractiveState
  const nextStatic = !nextProps.component.hasAnimation && !nextProps.component.hasInteractiveState
  
  if (prevStatic && nextStatic) {
    return JSON.stringify(prevProps.component.props) === JSON.stringify(nextProps.component.props)
  }
  
  return true
})

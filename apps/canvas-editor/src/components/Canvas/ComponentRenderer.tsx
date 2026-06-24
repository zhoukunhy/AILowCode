'use client'

import React from 'react'
import { Group, Rect, Text, Line } from 'react-konva'
import { ComponentConfig } from '@/store/canvasStore'
import { useComponentDataBinding, BindingMode } from '@/hooks/useComponentDataBinding'

interface ComponentRendererProps {
  component: ComponentConfig
  isSelected: boolean
  onSelect: (e: any) => void
  onDragMove: (newX: number, newY: number) => void
  onTransform: (attrs: any) => void
  onEvent?: (eventName: string, data: any) => void
}

export function ComponentRenderer({
  component,
  isSelected,
  onSelect,
  onDragMove,
  onTransform: _onTransform,
  onEvent,
}: ComponentRendererProps) {
  // 根据组件类型确定绑定模式
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

  // 使用数据绑定Hook
  const { value, data, isLoading, error } = useComponentDataBinding(component.id, {
    bindingMode: getBindingMode(),
    autoFetch: true,
  })

  // 获取显示值（优先使用绑定数据，其次使用props）
  const getDisplayValue = (propsKey: string, fallback?: any) => {
    // 如果有数据绑定且value存在，使用绑定值
    if (component.props.dataSourceId && component.props.dataField && value !== undefined) {
      return value
    }
    // 否则使用props中的值
    return component.props[propsKey] ?? fallback
  }

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

  const renderButton = () => (
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

  const renderInput = () => {
    const labelWidth = component.props.label ? 80 : 0
    const inputWidth = component.width - labelWidth
    const displayValue = getDisplayValue('value', '')
    
    return (
      <Group>
        {/* label */}
        {component.props.label && (
          <>
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
          </>
        )}
        
        {/* 输入框 */}
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
        
        {/* 绑定状态指示器 */}
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
  }

  const renderText = () => (
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
  )

  const renderCard = () => (
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
  )

  const renderTextarea = () => {
    const labelWidth = component.props.label ? 80 : 0
    const inputWidth = component.width - labelWidth
    const displayValue = getDisplayValue('value', '')
    
    return (
      <Group>
        {/* label */}
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
        
        {/* 文本域 */}
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
        
        {/* 绑定状态指示器 */}
        {component.props.dataSourceId && (
          <Rect
            x={labelWidth + 4}
            y={component.height - 20}
            width={6}
            height={6}
            fill={isLoading ? '#1890ff' : error ? '#ff4d4f' : '#52c41a'}
            cornerRadius={3}
          />
        )}
        
        <Text
          x={labelWidth + 8 + (component.props.dataSourceId ? 8 : 0)}
          y={16}
          text={displayValue || component.props.placeholder}
          fontSize={14}
          fill={displayValue ? '#333' : '#bfbfbf'}
          align="left"
          width={inputWidth - 16 - (component.props.dataSourceId ? 12 : 0)}
          height={component.height - 36}
        />
        {/* 右下角显示行数 */}
        <Text
          x={component.width - 40}
          y={component.height - 8}
          text={`${component.props.rows || 4}行`}
          fontSize={12}
          fill="#999"
        />
      </Group>
    )
  }

  const renderSelect = () => {
    const labelWidth = component.props.label ? 80 : 0
    const inputWidth = component.width - labelWidth
    const displayValue = getDisplayValue('value', '')
    
    return (
      <Group>
        {/* label */}
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
        
        {/* 下拉框 */}
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
        
        {/* 绑定状态指示器 */}
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
          width={inputWidth - 40 - (component.props.dataSourceId ? 12 : 0)}
        />
        {/* 下拉箭头 */}
        <Text
          x={component.width - 24}
          y={component.height / 2}
          text="▼"
          fontSize={12}
          fill="#999"
          verticalAlign="middle"
          offsetY={component.height / 2}
        />
        
        {/* 数据绑定选项数量提示 */}
        {component.props.dataSourceId && data.length > 0 && (
          <Text
            x={labelWidth + inputWidth - 50}
            y={component.height - 8}
            text={`${data.length}项`}
            fontSize={11}
            fill="#666"
          />
        )}
      </Group>
    )
  }

  const renderCheckbox = () => (
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

  const renderRadio = () => (
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

  const renderTable = () => {
    const { columns = 4, rows = 5 } = component.props
    const tableElements: JSX.Element[] = []
    
    // 根据绑定数据动态确定行数和列数
    const displayRows = data.length > 0 ? Math.min(data.length + 1, rows) : rows
    const displayColumns = data.length > 0 && data[0] ? Math.min(Object.keys(data[0]).length, columns) : columns
    const cellWidth = component.width / displayColumns
    const cellHeight = component.height / displayRows

    // 绘制水平线
    for (let i = 0; i <= displayRows; i++) {
      tableElements.push(
        <Line
          key={`h-${i}`}
          points={[0, i * cellHeight, component.width, i * cellHeight]}
          stroke={i === 0 || i === displayRows ? '#d9d9d9' : '#e8e8e8'}
          strokeWidth={i === 0 || i === displayRows ? 2 : 1}
        />
      )
    }

    // 绘制垂直线
    for (let i = 0; i <= displayColumns; i++) {
      tableElements.push(
        <Line
          key={`v-${i}`}
          points={[i * cellWidth, 0, i * cellWidth, component.height]}
          stroke={i === 0 || i === displayColumns ? '#d9d9d9' : '#e8e8e8'}
          strokeWidth={i === 0 || i === displayColumns ? 2 : 1}
        />
      )
    }

    // 如果有绑定数据，渲染表头和数据
    if (data.length > 0 && data[0]) {
      const fieldNames = Object.keys(data[0]).slice(0, displayColumns)
      
      // 表头背景
      tableElements.push(
        <Rect
          key="header-bg"
          x={0}
          y={0}
          width={component.width}
          height={cellHeight}
          fill="#fafafa"
        />
      )
      
      // 表头文字
      fieldNames.forEach((field, idx) => {
        tableElements.push(
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

      // 数据行
      data.slice(0, displayRows - 1).forEach((row, rowIdx) => {
        fieldNames.forEach((field, colIdx) => {
          const cellValue = row[field] !== undefined ? String(row[field]) : ''
          tableElements.push(
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
      // 无数据时显示占位提示
      tableElements.push(
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

    // 绑定状态指示器
    if (component.props.dataSourceId) {
      tableElements.push(
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

    return <Group>{tableElements}</Group>
  }

  const renderModal = () => (
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

  const renderComponent = () => {
    switch (component.type) {
      case 'button':
        return renderButton()
      case 'input':
        return renderInput()
      case 'textarea':
        return renderTextarea()
      case 'select':
        return renderSelect()
      case 'checkbox':
        return renderCheckbox()
      case 'text':
        return renderText()
      case 'card':
        return renderCard()
      case 'radio':
        return renderRadio()
      case 'table':
        return renderTable()
      case 'modal':
        return renderModal()
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
  }

  const handleClick = (e: any) => {
    onSelect(e)
    onEvent?.('onClick', { componentId: component.id, props: component.props })
  }

  const handleDblClick = () => {
    onEvent?.('onDoubleClick', { componentId: component.id, props: component.props })
  }

  const evaluateCondition = (): boolean => {
    if (!component.conditionalRender?.enabled) return true

    const { operator, leftValue, rightValue } = component.conditionalRender

    let left = leftValue
    let right = rightValue

    if (left.startsWith('{{') && left.endsWith('}}')) {
      const propName = left.slice(2, -2).trim()
      left = component.props[propName] ?? ''
    }

    if (right.startsWith('{{') && right.endsWith('}}')) {
      const propName = right.slice(2, -2).trim()
      right = component.props[propName] ?? ''
    }

    const numLeft = Number(left)
    const numRight = Number(right)
    const isNumeric = !isNaN(numLeft) && !isNaN(numRight)

    switch (operator) {
      case '==':
        return String(left) === String(right)
      case '!=':
        return String(left) !== String(right)
      case '>':
        return isNumeric ? numLeft > numRight : false
      case '<':
        return isNumeric ? numLeft < numRight : false
      case '>=':
        return isNumeric ? numLeft >= numRight : false
      case '<=':
        return isNumeric ? numLeft <= numRight : false
      case 'contains':
        return String(left).includes(String(right))
      case 'isEmpty':
        return String(left).trim() === ''
      case 'isNotEmpty':
        return String(left).trim() !== ''
      default:
        return true
    }
  }

  const shouldRender = evaluateCondition()
  const finalVisible = component.conditionalRender?.enabled
    ? component.conditionalRender.showIfTrue === shouldRender
    : component.visible

  const renderContent = () => (
    <Group
      x={0}
      y={0}
      width={component.width}
      height={component.height}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      draggable={!component.locked}
      onDragMove={(e) => onDragMove(component.x + e.target.x(), component.y + e.target.y())}
      opacity={component.opacity}
      rotation={component.rotation}
      visible={finalVisible}
    >
      {renderComponent()}
      
      {isSelected && (
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

  if (component.loopRender?.enabled) {
    return (
      <Group x={component.x} y={component.y}>
        {renderContent()}
        <Text
          x={0}
          y={-16}
          text="🔄 循环渲染"
          fontSize={11}
          fill="#1890ff"
        />
      </Group>
    )
  }

  return (
    <Group x={component.x} y={component.y}>
      {renderContent()}
    </Group>
  )
}

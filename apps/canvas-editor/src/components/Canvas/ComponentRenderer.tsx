'use client'

import React from 'react'
import { Group, Rect, Text, Line } from 'react-konva'
import { ComponentConfig } from '@/store/canvasStore'

interface ComponentRendererProps {
  component: ComponentConfig
  isSelected: boolean
  onSelect: (e: any) => void
  onDragMove: (newX: number, newY: number) => void
  onTransform: (attrs: any) => void
}

export function ComponentRenderer({
  component,
  isSelected,
  onSelect,
  onDragMove,
  onTransform: _onTransform,
}: ComponentRendererProps) {
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

  const renderInput = () => (
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
        x={8}
        y={component.height / 2}
        text={component.props.value || component.props.placeholder}
        fontSize={14}
        fill={component.props.value ? '#333' : '#bfbfbf'}
        align="left"
        verticalAlign="middle"
        offsetY={component.height / 2}
      />
    </Group>
  )

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
    const { columns, rows } = component.props
    const cellWidth = component.width / columns
    const cellHeight = component.height / rows
    const tableElements: JSX.Element[] = []

    for (let i = 0; i <= rows; i++) {
      tableElements.push(
        <Line
          key={`h-${i}`}
          points={[0, i * cellHeight, component.width, i * cellHeight]}
          stroke="#e8e8e8"
          strokeWidth={1}
        />
      )
    }

    for (let i = 0; i <= columns; i++) {
      tableElements.push(
        <Line
          key={`v-${i}`}
          points={[i * cellWidth, 0, i * cellWidth, component.height]}
          stroke="#e8e8e8"
          strokeWidth={1}
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

  return (
    <Group
      x={component.x}
      y={component.y}
      width={component.width}
      height={component.height}
      zIndex={component.zIndex}
      onClick={onSelect}
      onTap={onSelect}
      draggable={!component.locked}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      opacity={component.opacity}
      rotation={component.rotation}
      visible={component.visible}
    >
      {renderComponent()}
      
      {/* 选中状态 - 蓝色边框 */}
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
}

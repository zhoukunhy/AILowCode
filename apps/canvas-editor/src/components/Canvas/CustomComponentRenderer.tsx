'use client'

import React, { useMemo, useCallback } from 'react'
import { Group, Rect, Text } from 'react-konva'
import type { CustomComponentInstance, CustomEventDefinition } from '@ai-lowcode/shared-types'
import { customComponentRegistry } from '@/services/CustomComponentRegistry'
import { ComponentRenderer } from './ComponentRenderer'

interface CustomComponentRendererProps {
  instance: CustomComponentInstance
  isSelected: boolean
  onSelect: (e: any) => void
  onDragMove: (newX: number, newY: number) => void
  onTransform: (attrs: any) => void
  x: number
  y: number
  width: number
  height: number
  onEvent?: (eventName: string, data: any) => void
  previewCode?: string
}

/**
 * 自定义组件渲染器
 */
export function CustomComponentRenderer({
  instance,
  isSelected,
  onSelect: _onSelect,
  onDragMove: _onDragMove,
  onTransform: _onTransform,
  x,
  y,
  width,
  height,
  onEvent,
  previewCode,
}: CustomComponentRendererProps) {
  // 获取组件定义
  const definition = useMemo(() => {
    return customComponentRegistry.getDefinition(instance.customComponentId)
  }, [instance.customComponentId])

  const handleChildEvent = useCallback((childEventName: string, data: Record<string, any>) => {
    if (!definition || !definition.events) return

    const matchingEvent: CustomEventDefinition | undefined = definition.events.find(
      (event: CustomEventDefinition) => event.childComponentId === data.componentId && event.childEventName === childEventName
    )

    if (matchingEvent) {
      onEvent?.(matchingEvent.name, {
        ...data,
        eventName: matchingEvent.name,
        params: matchingEvent.params?.reduce((acc, param) => {
          acc[param.name] = data.props[param.name]
          return acc
        }, {} as Record<string, any>),
      })
    }
  }, [definition, onEvent])

  // 渲染可视化模板组件
  const renderVisualTemplate = () => {
    if (!definition || definition.template.type !== 'visual') {
      return (
        <Group x={x} y={y}>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#f0f0f0"
            stroke="#d9d9d9"
            strokeWidth={1}
            cornerRadius={4}
          />
        </Group>
      )
    }

    const visualConfig = definition.template.visualConfig
    if (!visualConfig) {
      return (
        <Group x={x} y={y}>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#f0f0f0"
            stroke="#d9d9d9"
            strokeWidth={1}
            cornerRadius={4}
          />
        </Group>
      )
    }

    // 渲染子组件
    return (
      <Group x={x} y={y}>
        {/* 容器背景 */}
        {visualConfig.containerStyle?.backgroundColor && (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={visualConfig.containerStyle.backgroundColor}
            cornerRadius={visualConfig.containerStyle.borderRadius || 0}
          />
        )}
        
        {/* 子组件 */}
        {visualConfig.children.map((child: any, index: number) => {
          const childProps = mergeChildProps(child.props, instance.props)
          const childX = calculateChildPosition(child, index, visualConfig.layout, width, height)
          
          return (
            <ComponentRenderer
              key={child.id}
              component={{
                ...child,
                x: childX.x,
                y: childX.y,
                props: childProps,
              }}
              isSelected={false}
              onSelect={() => {}}
              onDragMove={() => {}}
              onTransform={() => {}}
              onEvent={handleChildEvent}
            />
          )
        })}
        
        {/* 选中边框 */}
        {isSelected && (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            stroke="#1890ff"
            strokeWidth={2}
            cornerRadius={4}
          />
        )}
      </Group>
    )
  }

  // 渲染代码模板组件（支持实时编译和预览）
  const renderCodeTemplate = () => {
    if (!definition || definition.template.type !== 'code') {
      return (
        <Group x={x} y={y}>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#f0f0f0"
            stroke="#d9d9d9"
            strokeWidth={1}
            cornerRadius={4}
          />
        </Group>
      )
    }

    const codeConfig = definition.template.codeConfig
    const codeToCompile = previewCode || codeConfig?.renderCode

    // 尝试编译代码
    let compilationResult = null
    if (codeToCompile && codeToCompile.trim()) {
      compilationResult = customComponentRegistry.compileCodeForPreview(codeToCompile)
    }

    // 如果有编译错误，显示错误信息
    if (compilationResult && !compilationResult.success) {
      return (
        <Group x={x} y={y}>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#fff1f0"
            stroke="#ff4d4f"
            strokeWidth={1}
            cornerRadius={4}
          />
          <Text
            x={16}
            y={24}
            text="编译错误"
            fontSize={14}
            fontWeight="bold"
            fill="#ff4d4f"
          />
          <Text
            x={16}
            y={48}
            text={compilationResult.error?.slice(0, 100) || '未知错误'}
            fontSize={12}
            fill="#ff7875"
            width={width - 32}
          />
          {isSelected && (
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              stroke="#1890ff"
              strokeWidth={2}
              cornerRadius={4}
            />
          )}
        </Group>
      )
    }

    // 如果编译成功，尝试渲染组件
    if (compilationResult && compilationResult.success && compilationResult.compiledCode) {
      try {
        const compiledOutput = compilationResult.compiledCode(instance.props)
        
        const renderContent = () => {
          if (!compiledOutput) {
            return (
              <Text
                x={width / 2}
                y={height / 2}
                text="空输出"
                fontSize={14}
                fill="#999"
                align="center"
                verticalAlign="middle"
                offsetX={width / 2}
                offsetY={height / 2}
              />
            )
          }
          
          if (typeof compiledOutput === 'string') {
            return (
              <Text
                x={width / 2}
                y={height / 2}
                text={compiledOutput.slice(0, 50)}
                fontSize={14}
                fill="#333"
                align="center"
                verticalAlign="middle"
                offsetX={width / 2}
                offsetY={height / 2}
                width={width - 32}
              />
            )
          }
          
          if (React.isValidElement(compiledOutput)) {
            const elementType = compiledOutput.type
            const props = compiledOutput.props
            
            if (typeof elementType === 'string') {
              switch (elementType) {
                case 'button':
                  return (
                    <Group>
                      <Rect
                        x={width / 2 - 60}
                        y={height / 2 - 20}
                        width={120}
                        height={40}
                        fill="#1890ff"
                        cornerRadius={4}
                      />
                      <Text
                        x={width / 2}
                        y={height / 2}
                        text={(props.children as string)?.slice(0, 20) || '按钮'}
                        fontSize={14}
                        fill="#fff"
                        align="center"
                        verticalAlign="middle"
                        offsetX={60}
                        offsetY={20}
                      />
                    </Group>
                  )
                case 'span':
                case 'div':
                  return (
                    <Text
                      x={width / 2}
                      y={height / 2}
                      text={String(props.children).slice(0, 50)}
                      fontSize={14}
                      fill="#333"
                      align="center"
                      verticalAlign="middle"
                      offsetX={width / 2}
                      offsetY={height / 2}
                      width={width - 32}
                    />
                  )
                case 'input':
                  return (
                    <Group>
                      <Rect
                        x={8}
                        y={height / 2 - 15}
                        width={width - 16}
                        height={30}
                        fill="#fff"
                        stroke="#d9d9d9"
                        strokeWidth={1}
                        cornerRadius={4}
                      />
                      <Text
                        x={20}
                        y={height / 2}
                        text={props.placeholder || '输入框'}
                        fontSize={12}
                        fill="#999"
                        verticalAlign="middle"
                        offsetY={15}
                      />
                    </Group>
                  )
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                  return (
                    <Text
                      x={width / 2}
                      y={height / 2}
                      text={String(props.children).slice(0, 50)}
                      fontSize={elementType === 'h1' ? 24 : elementType === 'h2' ? 20 : elementType === 'h3' ? 18 : 16}
                      fontWeight="bold"
                      fill="#333"
                      align="center"
                      verticalAlign="middle"
                      offsetX={width / 2}
                      offsetY={height / 2}
                      width={width - 32}
                    />
                  )
                case 'p':
                  return (
                    <Text
                      x={width / 2}
                      y={height / 2}
                      text={String(props.children).slice(0, 100)}
                      fontSize={14}
                      fill="#666"
                      align="center"
                      verticalAlign="middle"
                      offsetX={width / 2}
                      offsetY={height / 2}
                      width={width - 32}
                    />
                  )
                default:
                  return (
                    <Text
                      x={width / 2}
                      y={height / 2}
                      text={`<${elementType}>`}
                      fontSize={14}
                      fill="#1890ff"
                      align="center"
                      verticalAlign="middle"
                      offsetX={width / 2}
                      offsetY={height / 2}
                    />
                  )
              }
            }
            
            return (
              <Text
                x={width / 2}
                y={height / 2}
                text={definition.displayName}
                fontSize={14}
                fill="#333"
                align="center"
                verticalAlign="middle"
                offsetX={width / 2}
                offsetY={height / 2}
              />
            )
          }
          
          return (
            <Text
              x={width / 2}
              y={height / 2}
              text={String(compiledOutput).slice(0, 50)}
              fontSize={14}
              fill="#333"
              align="center"
              verticalAlign="middle"
              offsetX={width / 2}
              offsetY={height / 2}
              width={width - 32}
            />
          )
        }
        
        return (
          <Group x={x} y={y}>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="#fff"
              stroke="#e8e8e8"
              strokeWidth={1}
              cornerRadius={4}
            />
            
            {renderContent()}
            
            {isSelected && (
              <Rect
                x={0}
                y={0}
                width={width}
                height={height}
                stroke="#1890ff"
                strokeWidth={2}
                cornerRadius={4}
              />
            )}
          </Group>
        )
      } catch {
        return (
          <Group x={x} y={y}>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="#fff7e6"
              stroke="#fa8c16"
              strokeWidth={1}
              cornerRadius={4}
            />
            <Text
              x={16}
              y={24}
              text="运行时错误"
              fontSize={14}
              fontWeight="bold"
              fill="#fa8c16"
            />
            <Text
              x={16}
              y={48}
              text="组件运行时出现错误"
              fontSize={12}
              fill="#faad14"
              width={width - 32}
            />
            {isSelected && (
              <Rect
                x={0}
                y={0}
                width={width}
                height={height}
                stroke="#1890ff"
                strokeWidth={2}
                cornerRadius={4}
              />
            )}
          </Group>
        )
      }
    }

    // 默认占位符（当没有代码时）
    return (
      <Group x={x} y={y}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#f0f0f0"
          stroke="#d9d9d9"
          strokeWidth={1}
          cornerRadius={4}
        />
        <Text
          x={width / 2}
          y={height / 2 - 10}
          text={definition.displayName}
          fontSize={14}
          fill="#333"
          align="center"
          offsetX={width / 2}
        />
        <Text
          x={width / 2}
          y={height / 2 + 10}
          text="[代码组件]"
          fontSize={12}
          fill="#999"
          align="center"
          offsetX={width / 2}
        />
        {isSelected && (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            stroke="#1890ff"
            strokeWidth={2}
            cornerRadius={4}
          />
        )}
      </Group>
    )
  }

  // 如果组件定义不存在，显示错误提示
  if (!definition) {
    return (
      <Group x={x} y={y}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#fff1f0"
          stroke="#ff4d4f"
          strokeWidth={1}
          cornerRadius={4}
        />
        <Text
          x={width / 2}
          y={height / 2 - 10}
          text="组件未找到"
          fontSize={14}
          fill="#ff4d4f"
          align="center"
          offsetX={width / 2}
        />
        <Text
          x={width / 2}
          y={height / 2 + 10}
          text={instance.customComponentId}
          fontSize={12}
          fill="#999"
          align="center"
          offsetX={width / 2}
        />
      </Group>
    )
  }

  // 根据模板类型渲染
  if (definition.template.type === 'visual') {
    return renderVisualTemplate()
  } else {
    return renderCodeTemplate()
  }
}

/**
 * 合并子组件属性（将父组件的属性传递给子组件）
 */
function mergeChildProps(
  childProps: Record<string, any>,
  parentProps: Record<string, any>
): Record<string, any> {
  const merged = { ...childProps }

  // 如果子组件属性中有 ${parentProp} 格式的引用，替换为父组件属性值
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const parentKey = value.slice(2, -1)
      if (parentProps[parentKey] !== undefined) {
        merged[key] = parentProps[parentKey]
      }
    }
  }

  return merged
}

/**
 * 计算子组件位置（根据布局配置）
 */
function calculateChildPosition(
  child: any,
  index: number,
  layout: any,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  if (layout.type === 'absolute') {
    return { x: child.schema?.x || 0, y: child.schema?.y || 0 }
  }

  if (layout.type === 'flex') {
    const gap = layout.gap || 10
    const childWidth = child.schema?.width || 100
    const childHeight = child.schema?.height || 40

    if (layout.direction === 'row') {
      const totalWidth = (index + 1) * childWidth + index * gap
      const startX = (containerWidth - totalWidth) / 2
      return {
        x: startX + index * (childWidth + gap),
        y: (containerHeight - childHeight) / 2,
      }
    } else {
      const totalHeight = (index + 1) * childHeight + index * gap
      const startY = (containerHeight - totalHeight) / 2
      return {
        x: (containerWidth - childWidth) / 2,
        y: startY + index * (childHeight + gap),
      }
    }
  }

  return { x: 0, y: 0 }
}
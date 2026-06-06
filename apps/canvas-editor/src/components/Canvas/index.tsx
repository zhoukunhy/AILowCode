'use client'

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import { useCanvasStore } from '@/store/canvasStore'
import { CanvasGrid } from './CanvasGrid'
import { ComponentRenderer } from './ComponentRenderer'
import { ComponentToolbar } from './ComponentToolbar'

// 缓存组件渲染结果
const componentCache = new Map<string, React.ReactNode>()

export function Canvas() {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [visibleRect, setVisibleRect] = useState({ x: 0, y: 0, width: 0, height: 0 })
  
  const {
    currentPage,
    components,
    selectedId,
    addComponent,
    selectComponent,
    updateComponent,
  } = useCanvasStore()

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({
          width: Math.max(width - 32, 400),
          height: Math.max(height - 60, 300),
        })
      }
    })

    resizeObserver.observe(container)
    
    // 初始化尺寸
    const rect = container.getBoundingClientRect()
    setDimensions({
      width: Math.max(rect.width - 32, 400),
      height: Math.max(rect.height - 60, 300),
    })

    return () => resizeObserver.disconnect()
  }, [])

  // 监听容器滚动，更新可见区域
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const rect = container.getBoundingClientRect()
      const scrollLeft = container.scrollLeft
      const scrollTop = container.scrollTop
      
      setVisibleRect({
        x: scrollLeft,
        y: scrollTop,
        width: rect.width,
        height: rect.height,
      })
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // 初始化
    
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // 判断组件是否在可见区域内（带有边距）
  const isComponentVisible = useCallback((component: any, margin: number = 100) => {
    const { x, y, width, height } = visibleRect
    const compX = component.x || 0
    const compY = component.y || 0
    const compWidth = component.width || 100
    const compHeight = component.height || 100

    return (
      compX + compWidth + margin > x &&
      compX - margin < x + width &&
      compY + compHeight + margin > y &&
      compY - margin < y + height
    )
  }, [visibleRect])

  // 按zIndex排序组件
  const sortedComponents = useMemo(() => {
    return [...components].sort((a, b) => a.zIndex - b.zIndex)
  }, [components])

  // 过滤可见组件（懒加载）
  const visibleComponents = useMemo(() => {
    if (components.length < 50) {
      return sortedComponents // 少量组件时不启用懒加载
    }
    return sortedComponents.filter(component => isComponentVisible(component))
  }, [sortedComponents, isComponentVisible])

  // 组件渲染缓存
  const renderCachedComponent = useCallback((component: any, isSelected: boolean, callbacks: any) => {
    const cacheKey = `${component.id}-${component.version}-${isSelected}`
    
    // 如果缓存存在且组件没有变化，直接返回缓存
    if (componentCache.has(cacheKey)) {
      const cached = componentCache.get(cacheKey)
      if (cached) return cached
    }

    // 否则渲染新组件并缓存
    const element = (
      <ComponentRenderer
        key={component.id}
        component={component}
        isSelected={isSelected}
        onSelect={callbacks.onSelect}
        onDragMove={callbacks.onDragMove}
        onTransform={callbacks.onTransform}
      />
    )

    // 只缓存静态组件（没有动画或交互状态的组件）
    if (!component.hasAnimation && !component.hasInteractiveState) {
      componentCache.set(cacheKey, element)
    }

    return element
  }, [])

  // 处理拖拽放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const componentType = e.dataTransfer.getData('componentType')
    if (!componentType) return

    const stage = stageRef.current
    if (!stage) return

    const rect = stage.getContainer().getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    addComponent(componentType, x, y)
  }, [addComponent])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // 处理画布点击 - 取消选中
  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      selectComponent(null)
    }
  }, [selectComponent])

  // 处理组件拖拽移动
  const handleComponentDragMove = useCallback((id: string, newX: number, newY: number) => {
    // 清除该组件的缓存
    componentCache.forEach((_, key) => {
      if (key.startsWith(id)) {
        componentCache.delete(key)
      }
    })

    // 栅格对齐
    let finalX = newX
    let finalY = newY
    if (currentPage.snapToGrid) {
      finalX = Math.round(newX / currentPage.gridSize) * currentPage.gridSize
      finalY = Math.round(newY / currentPage.gridSize) * currentPage.gridSize
    }
    updateComponent(id, { x: finalX, y: finalY })
  }, [currentPage, updateComponent])

  // 当组件更新时清除缓存
  useEffect(() => {
    const clearCache = () => {
      componentCache.clear()
    }

    return clearCache
  }, [components.length])

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-auto p-4 bg-gray-100"
      style={{ width: '100%', height: '100%' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ComponentToolbar />
      <div 
        className="canvas-wrapper bg-white shadow-lg rounded-lg overflow-hidden mt-2"
        style={{ width: 'fit-content', maxWidth: '100%' }}
      >
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
            <Layer>
              {/* 栅格背景 */}
              <CanvasGrid
                width={dimensions.width}
                height={dimensions.height}
                gridSize={currentPage.gridSize}
                visible={currentPage.showGrid}
              />
            </Layer>
            
            <Layer>
              {/* 渲染可见组件 */}
              {visibleComponents.map((component) => {
                const callbacks = {
                  onSelect: (e: any) => {
                    e.cancelBubble = true
                    selectComponent(component.id)
                  },
                  onDragMove: (newX: number, newY: number) => handleComponentDragMove(component.id, newX, newY),
                  onTransform: (attrs: any) => updateComponent(component.id, attrs),
                }
                
                return renderCachedComponent(component, selectedId === component.id, callbacks)
              })}
            </Layer>

            {/* 性能提示层 */}
            <Layer>
              {components.length > 50 && (
                <text
                  x={10}
                  y={20}
                  fontSize={12}
                  fill="#666"
                  opacity={0.6}
                >
                  {`${visibleComponents.length}/${components.length} 组件可见`}
                </text>
              )}
            </Layer>
          </Stage>
      </div>
    </div>
  )
}
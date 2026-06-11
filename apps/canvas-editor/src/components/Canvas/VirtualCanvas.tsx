'use client'

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import { useCanvasStore } from '@/store/canvasStore'
import { CanvasGrid } from './CanvasGrid'
import { OptimizedComponentRenderer } from './OptimizedComponentRenderer'
import { ComponentToolbar } from './ComponentToolbar'

// LRU缓存实现
class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // 更新访问顺序
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // 删除最久未访问的项
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  delete(key: K): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  keys(): IterableIterator<K> {
    return this.cache.keys()
  }
}

// 组件缓存（使用LRU）
const componentCache = new LRUCache<string, React.ReactNode>(100)

export function VirtualCanvas() {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [visibleRect, setVisibleRect] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragSelecting, setIsDragSelecting] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, { x: number; y: number }>>(new Map())
  
  const currentPage = useCanvasStore((state) => state.currentPage)
  const components = useCanvasStore((state) => state.components)
  const selectedIds = useCanvasStore((state) => state.selectedIds)
  const zoom = useCanvasStore((state) => state.zoom)
  const addComponent = useCanvasStore((state) => state.addComponent)
  const selectComponent = useCanvasStore((state) => state.selectComponent)
  const selectComponents = useCanvasStore((state) => state.selectComponents)
  const updateComponent = useCanvasStore((state) => state.updateComponent)
  const removeComponent = useCanvasStore((state) => state.removeComponent)

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

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault()
        selectedIds.forEach(id => removeComponent(id))
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        selectComponents(components.map(c => c.id))
      }

      if (e.key === 'Escape') {
        selectComponent(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, components, removeComponent, selectComponents, selectComponent])

  // 批量更新组件位置
  useEffect(() => {
    if (pendingUpdates.size === 0) return

    const timer = requestAnimationFrame(() => {
      pendingUpdates.forEach((pos, id) => {
        let finalX = pos.x
        let finalY = pos.y
        if (currentPage.snapToGrid) {
          finalX = Math.round(pos.x / currentPage.gridSize) * currentPage.gridSize
          finalY = Math.round(pos.y / currentPage.gridSize) * currentPage.gridSize
        }
        updateComponent(id, { x: finalX, y: finalY })
      })
      setPendingUpdates(new Map())
    })

    return () => cancelAnimationFrame(timer)
  }, [pendingUpdates, currentPage, updateComponent])

  // 判断组件是否在可见区域内
  const isComponentVisible = useCallback((component: any, margin: number = 150) => {
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

  // 过滤可见组件（虚拟化）
  const visibleComponents = useMemo(() => {
    if (components.length < 30) {
      return sortedComponents
    }
    return sortedComponents.filter(component => isComponentVisible(component))
  }, [sortedComponents, isComponentVisible, components.length])

  // 组件渲染缓存
  const renderCachedComponent = useCallback((component: any, isSelected: boolean, callbacks: any) => {
    const cacheKey = `${component.id}-${component.zIndex}-${isSelected}`
    
    if (componentCache.get(cacheKey)) {
      return componentCache.get(cacheKey)!
    }

    const element = (
      <OptimizedComponentRenderer
        key={component.id}
        component={component}
        isSelected={isSelected}
        onSelect={callbacks.onSelect}
        onDragMove={callbacks.onDragMove}
        onTransform={callbacks.onTransform}
      />
    )

    // 只缓存静态组件
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

  // 处理画布鼠标按下
  const handleStageMouseDown = useCallback((e: any) => {
    if (e.target !== e.target.getStage()) return
    
    const stage = stageRef.current
    if (!stage) return
    
    const pos = stage.getPointerPosition()
    if (!pos) return
    
    if (e.evt.button !== 0) return
    
    setIsDragSelecting(true)
    setDragStart(pos)
    setDragEnd(pos)
  }, [])

  // 处理画布鼠标移动
  const handleStageMouseMove = useCallback((_e: any) => {
    if (!isDragSelecting && !isDragging) return
    
    const stage = stageRef.current
    if (!stage) return
    
    const pos = stage.getPointerPosition()
    if (!pos) return
    
    if (isDragSelecting) {
      setDragEnd(pos)
    }
  }, [isDragSelecting, isDragging])

  // 处理画布鼠标释放
  const handleStageMouseUp = useCallback((e: any) => {
    if (!isDragSelecting) {
      if (e.target === e.target.getStage()) {
        selectComponent(null)
      }
      return
    }

    setIsDragSelecting(false)
    
    const startX = Math.min(dragStart.x, dragEnd.x)
    const startY = Math.min(dragStart.y, dragEnd.y)
    const endX = Math.max(dragStart.x, dragEnd.x)
    const endY = Math.max(dragStart.y, dragEnd.y)
    
    if (endX - startX > 5 && endY - startY > 5) {
      const selectedComponents = components.filter((component) => {
        return (
          component.x < endX &&
          component.x + component.width > startX &&
          component.y < endY &&
          component.y + component.height > startY
        )
      })
      
      selectComponents(selectedComponents.map((c) => c.id))
    }
  }, [isDragSelecting, dragStart, dragEnd, components, selectComponents, selectComponent])

  // 处理组件拖拽移动（批量优化）
  const handleComponentDragMove = useCallback((id: string, newX: number, newY: number) => {
    // 清除该组件的缓存
    componentCache.keys().forEach(key => {
      if (key.startsWith(id)) {
        componentCache.delete(key)
      }
    })

    if (selectedIds.length > 1) {
      const currentComponent = components.find(c => c.id === id)
      if (!currentComponent) return
      
      const deltaX = newX - currentComponent.x
      const deltaY = newY - currentComponent.y
      
      selectedIds.forEach(selectedId => {
        const comp = components.find(c => c.id === selectedId)
        if (comp) {
          let finalX = comp.x + deltaX
          let finalY = comp.y + deltaY
          if (currentPage.snapToGrid) {
            finalX = Math.round(finalX / currentPage.gridSize) * currentPage.gridSize
            finalY = Math.round(finalY / currentPage.gridSize) * currentPage.gridSize
          }
          updateComponent(selectedId, { x: finalX, y: finalY })
        }
      })
    } else {
      // 使用批量更新
      setPendingUpdates(prev => {
        const newUpdates = new Map(prev)
        newUpdates.set(id, { x: newX, y: newY })
        return newUpdates
      })
    }
  }, [currentPage, updateComponent, selectedIds, components])

  // 当组件更新时清除缓存
  useEffect(() => {
    const clearCache = () => {
      componentCache.clear()
    }
    return clearCache
  }, [components.length])

  // 计算缩放后的尺寸
  const scaledWidth = dimensions.width * zoom
  const scaledHeight = dimensions.height * zoom

  // 框选矩形属性
  const selectionRect = useMemo(() => {
    if (!isDragSelecting) return null
    const x = Math.min(dragStart.x, dragEnd.x)
    const y = Math.min(dragStart.y, dragEnd.y)
    const width = Math.abs(dragEnd.x - dragStart.x)
    const height = Math.abs(dragEnd.y - dragStart.y)
    return { x, y, width, height }
  }, [isDragSelecting, dragStart, dragEnd])

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
          width={scaledWidth}
          height={scaledHeight}
          scaleX={zoom}
          scaleY={zoom}
          onClick={handleStageMouseUp}
          onTap={handleStageMouseUp}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseUp}
        >
            <Layer>
              <CanvasGrid
                width={dimensions.width}
                height={dimensions.height}
                gridSize={currentPage.gridSize}
                visible={currentPage.showGrid}
              />
            </Layer>
            
            <Layer>
              {selectionRect && (
                <Rect
                  x={selectionRect.x}
                  y={selectionRect.y}
                  width={selectionRect.width}
                  height={selectionRect.height}
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDash={[5, 5]}
                />
              )}
            </Layer>
            
            <Layer>
              {visibleComponents.map((component) => {
                const isSelected = selectedIds.includes(component.id)
                const callbacks = {
                  onSelect: (e: any) => {
                    e.cancelBubble = true
                    const multiSelect = e.ctrlKey || e.metaKey
                    selectComponent(component.id, multiSelect)
                  },
                  onDragMove: (newX: number, newY: number) => {
                    setIsDragging(true)
                    handleComponentDragMove(component.id, newX, newY)
                  },
                  onTransform: (attrs: any) => {
                    componentCache.keys().forEach(key => {
                      if (key.startsWith(component.id)) {
                        componentCache.delete(key)
                      }
                    })
                    updateComponent(component.id, attrs)
                  },
                }
                
                return renderCachedComponent(component, isSelected, callbacks)
              })}
            </Layer>

            <Layer>
              {components.length > 30 && (
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
              <text
                x={dimensions.width - 80}
                y={20}
                fontSize={12}
                fill="#666"
                opacity={0.6}
              >
                {`${Math.round(zoom * 100)}%`}
              </text>
            </Layer>
          </Stage>
      </div>
    </div>
  )
}
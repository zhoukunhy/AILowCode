'use client'

import React, { useRef, useCallback, useMemo, useEffect, useState, useReducer } from 'react'
import { Stage, Layer, Rect, Text, Group } from 'react-konva'
import { useCanvasStore } from '@/store/canvasStore'
import { CanvasGrid } from './CanvasGrid'
import { OptimizedComponentRenderer } from './OptimizedComponentRenderer'
import { ComponentToolbar } from './ComponentToolbar'

// 批量更新状态
interface BatchUpdateState {
  updates: Map<string, { x: number; y: number }>
  isProcessing: boolean
}

type BatchUpdateAction =
  | { type: 'ADD_UPDATE'; id: string; x: number; y: number }
  | { type: 'CLEAR_UPDATES' }
  | { type: 'SET_PROCESSING'; processing: boolean }

function batchUpdateReducer(state: BatchUpdateState, action: BatchUpdateAction): BatchUpdateState {
  switch (action.type) {
    case 'ADD_UPDATE': {
      const newUpdates = new Map(state.updates)
      newUpdates.set(action.id, { x: action.x, y: action.y })
      return { ...state, updates: newUpdates }
    }
    case 'CLEAR_UPDATES':
      return { ...state, updates: new Map() }
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.processing }
    default:
      return state
  }
}

export function Canvas() {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [visibleRect, setVisibleRect] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragSelecting, setIsDragSelecting] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 })
  const [isDraggingComponent, setIsDraggingComponent] = useState(false)
  
  // 使用 useReducer 管理批量更新
  const [batchState, dispatchBatch] = useReducer(batchUpdateReducer, {
    updates: new Map(),
    isProcessing: false,
  })

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

  // 批量更新组件位置（使用 requestAnimationFrame 优化）
  useEffect(() => {
    if (batchState.updates.size === 0 || batchState.isProcessing) return

    dispatchBatch({ type: 'SET_PROCESSING', processing: true })

    const animationFrameId = requestAnimationFrame(() => {
      batchState.updates.forEach((pos, id) => {
        let finalX = pos.x
        let finalY = pos.y
        if (currentPage.snapToGrid) {
          finalX = Math.round(pos.x / currentPage.gridSize) * currentPage.gridSize
          finalY = Math.round(pos.y / currentPage.gridSize) * currentPage.gridSize
        }
        updateComponent(id, { x: finalX, y: finalY })
      })
      dispatchBatch({ type: 'CLEAR_UPDATES' })
      dispatchBatch({ type: 'SET_PROCESSING', processing: false })
    })

    return () => cancelAnimationFrame(animationFrameId)
  }, [batchState.updates, batchState.isProcessing, currentPage, updateComponent])

  // 判断组件是否在可见区域内（带有边距）
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

  // 过滤可见组件（虚拟化）- 组件数超过30启用，拖拽过程中禁用过滤
  const visibleComponents = useMemo(() => {
    if (components.length < 30 || isDraggingComponent) {
      return sortedComponents
    }
    return sortedComponents.filter(component => isComponentVisible(component))
  }, [sortedComponents, isComponentVisible, components.length, isDraggingComponent])

  

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

  // 处理画布鼠标按下 - 开始框选
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

  // 处理画布鼠标移动 - 框选
  const handleStageMouseMove = useCallback((_e: any) => {
    if (!isDragSelecting) return
    
    const stage = stageRef.current
    if (!stage) return
    
    const pos = stage.getPointerPosition()
    if (!pos) return
    
    setDragEnd(pos)
  }, [isDragSelecting])

  // 处理画布鼠标释放 - 完成框选
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

  // 处理组件拖拽移动（优化版本）
  const handleComponentDragMove = useCallback((id: string, newX: number, newY: number) => {
    // 如果多个组件被选中，一起移动（直接更新）
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
      // 单个组件移动使用批量更新
      dispatchBatch({ type: 'ADD_UPDATE', id, x: newX, y: newY })
    }
  }, [currentPage, updateComponent, selectedIds, components])

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
      className="w-full h-full overflow-auto p-4 bg-gray-100"
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
                return (
                  <OptimizedComponentRenderer
                    key={component.id}
                    component={component}
                    isSelected={isSelected}
                    onSelect={(e: any) => {
                      e.cancelBubble = true
                      const multiSelect = e.ctrlKey || e.metaKey
                      selectComponent(component.id, multiSelect)
                    }}
                    onDragStart={() => setIsDraggingComponent(true)}
                    onDragEnd={() => setIsDraggingComponent(false)}
                    onDragMove={(newX: number, newY: number) => handleComponentDragMove(component.id, newX, newY)}
                    onTransform={(attrs: any) => updateComponent(component.id, attrs)}
                  />
                )
              })}
            </Layer>

            <Layer>
              <Group>
                {components.length > 30 && (
                  <Text
                    x={10}
                    y={20}
                    fontSize={12}
                    fill="#666"
                    opacity={0.6}
                    text={`${visibleComponents.length}/${components.length} 组件可见`}
                  />
                )}
                {dimensions.width > 0 && (
                  <Text
                    x={dimensions.width - 80}
                    y={20}
                    fontSize={12}
                    fill="#666"
                    opacity={0.6}
                    text={`${Math.round(zoom * 100)}%`}
                  />
                )}
              </Group>
            </Layer>
          </Stage>
      </div>
    </div>
  )
}
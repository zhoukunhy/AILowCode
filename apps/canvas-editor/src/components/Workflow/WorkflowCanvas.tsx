'use client'

import React, { useRef, useCallback, useState, useEffect } from 'react'
import { Stage, Layer, Group, Rect, Circle, Text, Line, Arrow } from 'react-konva'
import { useWorkflowStore } from '@/store/workflowStore'
import { NodeType } from '@ai-lowcode/shared-types'

const getNodeColor = (type: NodeType): string => {
  const colors: Record<NodeType, string> = {
    start: '#10B981',
    approve: '#3B82F6',
    condition: '#F59E0B',
    fork: '#8B5CF6',
    join: '#EC4899',
    end: '#EF4444',
    action: '#06B6D4',
  }
  return colors[type]
}

const getNodeIcon = (type: NodeType): string => {
  const icons: Record<NodeType, string> = {
    start: '▶',
    approve: '✓',
    condition: '?',
    fork: '↕',
    join: '⟳',
    end: '■',
    action: '⚡',
  }
  return icons[type]
}

interface Port {
  id: string
  nodeId: string
  position: 'left' | 'right'
  x: number
  y: number
}

const getNodePorts = (node: any): Port[] => {
  const ports: Port[] = []
  const isRound = node.type === 'start' || node.type === 'end'
  
  let leftX: number
  let rightX: number
  let centerY: number

  if (isRound) {
    centerY = node.y
    leftX = node.x - node.width / 2
    rightX = node.x + node.width / 2
  } else {
    centerY = node.y + node.height / 2
    leftX = node.x
    rightX = node.x + node.width
  }

  switch (node.type) {
    case 'start':
      ports.push({
        id: `${node.id}-right`,
        nodeId: node.id,
        position: 'right',
        x: rightX,
        y: centerY,
      })
      break
    case 'end':
      ports.push({
        id: `${node.id}-left`,
        nodeId: node.id,
        position: 'left',
        x: leftX,
        y: centerY,
      })
      break
    case 'condition':
    case 'fork':
    case 'join':
      ports.push({
        id: `${node.id}-left`,
        nodeId: node.id,
        position: 'left',
        x: leftX,
        y: centerY,
      })
      ports.push({
        id: `${node.id}-right`,
        nodeId: node.id,
        position: 'right',
        x: rightX,
        y: centerY,
      })
      break
    default:
      ports.push({
        id: `${node.id}-left`,
        nodeId: node.id,
        position: 'left',
        x: leftX,
        y: centerY,
      })
      ports.push({
        id: `${node.id}-right`,
        nodeId: node.id,
        position: 'right',
        x: rightX,
        y: centerY,
      })
  }

  return ports
}

const getBezierPoints = (x1: number, y1: number, x2: number, y2: number): number[] => {
  const dx = x2 - x1
  const controlOffset = Math.min(Math.abs(dx) * 0.4, 100)

  if (dx > 0) {
    return [
      x1, y1,
      x1 + controlOffset, y1,
      x2 - controlOffset, y2,
      x2, y2,
    ]
  } else {
    return [
      x1, y1,
      x1 - controlOffset, y1,
      x2 + controlOffset, y2,
      x2, y2,
    ]
  }
}

export function WorkflowCanvas() {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [connectionLine, setConnectionLine] = useState<{ x: number; y: number } | null>(null)

  const {
    nodes,
    transitions,
    selectedNodeId,
    isConnecting,
    connectingFromNodeId,
    addNode,
    selectNode,
    moveNode,
    removeNode,
    startConnection,
    endConnection,
    cancelConnection,
    zoom,
  } = useWorkflowStore()

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault()
        removeNode(selectedNodeId)
      }
      if (e.key === 'Escape') {
        cancelConnection()
        selectNode(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, removeNode, selectNode, cancelConnection])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('nodeType') as NodeType
    if (!nodeType) return

    const stage = stageRef.current
    if (!stage) return

    const rect = stage.getContainer().getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    addNode(nodeType, x, y)
  }, [addNode, zoom])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleStageMouseDown = useCallback((e: any) => {
    if (e.target !== e.target.getStage()) return
    if (isConnecting) {
      cancelConnection()
    } else {
      selectNode(null)
    }
  }, [isConnecting, cancelConnection, selectNode])

  const handleStageMouseMove = useCallback(() => {
    if (!isConnecting || !connectingFromNodeId) return

    const stage = stageRef.current
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    setConnectionLine(pos)
  }, [isConnecting, connectingFromNodeId])

  const handleNodeMouseDown = useCallback((nodeId: string, e: any) => {
    e.cancelBubble = true
    selectNode(nodeId)

    if (e.evt.shiftKey) {
      startConnection(nodeId)
    }
  }, [selectNode, startConnection])

  const handleNodeDragEnd = useCallback((nodeId: string, e: any) => {
    const node = e.target
    const newX = node.x()
    const newY = node.y()
    moveNode(nodeId, newX, newY)
  }, [moveNode])

  const handleNodeMouseUp = useCallback((nodeId: string) => {
    if (isConnecting && connectingFromNodeId) {
      endConnection(nodeId)
    }
  }, [isConnecting, connectingFromNodeId, endConnection])

  const handlePortMouseDown = useCallback((nodeId: string, e: any) => {
    e.cancelBubble = true
    selectNode(nodeId)
    startConnection(nodeId)
  }, [selectNode, startConnection])

  const handlePortMouseUp = useCallback((nodeId: string) => {
    if (isConnecting && connectingFromNodeId) {
      endConnection(nodeId)
    }
  }, [isConnecting, connectingFromNodeId, endConnection])

  const scaledWidth = dimensions.width * zoom
  const scaledHeight = dimensions.height * zoom

  const allPorts = nodes.flatMap(getNodePorts)

  const validTransitions = transitions.filter((t) => {
    const sourceNode = nodes.find((n) => n.id === t.sourceNodeId)
    const targetNode = nodes.find((n) => n.id === t.targetNodeId)
    if (!sourceNode || !targetNode) return false
    const sourcePorts = getNodePorts(sourceNode)
    const targetPorts = getNodePorts(targetNode)
    return sourcePorts.some((p) => p.position === 'right') &&
           targetPorts.some((p) => p.position === 'left')
  })

  const connectingSourcePort = (() => {
    if (!isConnecting || !connectingFromNodeId) return null
    const sourceNode = nodes.find((n) => n.id === connectingFromNodeId)
    if (!sourceNode) return null
    const sourcePorts = getNodePorts(sourceNode)
    return sourcePorts.find((p) => p.position === 'right')
  })()

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-auto p-4 bg-gray-50"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="canvas-wrapper bg-white shadow-lg rounded-lg overflow-hidden">
        <Stage
          ref={stageRef}
          width={scaledWidth}
          height={scaledHeight}
          scaleX={zoom}
          scaleY={zoom}
          onClick={handleStageMouseDown}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
        >
          <Layer>
            <Rect
              width={dimensions.width}
              height={dimensions.height}
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth={1}
            />
            {Array.from({ length: Math.ceil(dimensions.width / 20) }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[i * 20, 0, i * 20, dimensions.height]}
                stroke="#E2E8F0"
                strokeWidth={0.5}
                opacity={0.5}
              />
            ))}
            {Array.from({ length: Math.ceil(dimensions.height / 20) }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[0, i * 20, dimensions.width, i * 20]}
                stroke="#E2E8F0"
                strokeWidth={0.5}
                opacity={0.5}
              />
            ))}
          </Layer>

          <Layer>
            {validTransitions.map((transition) => {
              const sourceNode = nodes.find((n) => n.id === transition.sourceNodeId)!
              const targetNode = nodes.find((n) => n.id === transition.targetNodeId)!
              const sourcePorts = getNodePorts(sourceNode)
              const targetPorts = getNodePorts(targetNode)
              const sourcePort = sourcePorts.find((p) => p.position === 'right')!
              const targetPort = targetPorts.find((p) => p.position === 'left')!
              const bezierPoints = getBezierPoints(sourcePort.x, sourcePort.y, targetPort.x, targetPort.y)
              const endX = bezierPoints[bezierPoints.length - 2]
              const endY = bezierPoints[bezierPoints.length - 1]
              const controlX = bezierPoints[bezierPoints.length - 4]
              const controlY = bezierPoints[bezierPoints.length - 3]
              const arrowStartX = endX + (controlX - endX) * 0.3
              const arrowStartY = endY + (controlY - endY) * 0.3

              return (
                <Group key={transition.id}>
                  <Line
                    points={bezierPoints}
                    stroke="#64748B"
                    strokeWidth={2}
                    fill="none"
                    tension={0.5}
                    lineCap="round"
                  />
                  <Arrow
                    points={[arrowStartX, arrowStartY, endX, endY]}
                    stroke="#64748B"
                    strokeWidth={2}
                    fill="#64748B"
                    pointerWidth={8}
                    pointerLength={8}
                    onClick={(e) => {
                      e.cancelBubble = true
                    }}
                  />
                </Group>
              )
            })}
            {isConnecting && connectingSourcePort && connectionLine && (
              <Line
                points={[connectingSourcePort.x, connectingSourcePort.y, connectionLine.x, connectionLine.y]}
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDash={[5, 5]}
                fill="none"
                tension={0.5}
              />
            )}
          </Layer>

          <Layer>
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id
              const color = getNodeColor(node.type)
              const icon = getNodeIcon(node.type)
              const isRound = node.type === 'start' || node.type === 'end'

              return (
                <Group key={node.id}>
                  {isRound ? (
                    <Circle
                      x={node.x}
                      y={node.y}
                      radius={node.width / 2}
                      fill={color}
                      stroke={isSelected ? '#1E40AF' : '#1F2937'}
                      strokeWidth={isSelected ? 3 : 2}
                      draggable
                      onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                      onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
                      onMouseUp={() => handleNodeMouseUp(node.id)}
                      shadowColor="rgba(0,0,0,0.2)"
                      shadowBlur={4}
                      shadowOffsetX={2}
                      shadowOffsetY={2}
                    />
                  ) : (
                    <Rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      fill={color}
                      stroke={isSelected ? '#1E40AF' : '#1F2937'}
                      strokeWidth={isSelected ? 3 : 2}
                      cornerRadius={8}
                      draggable
                      onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                      onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
                      onMouseUp={() => handleNodeMouseUp(node.id)}
                      shadowColor="rgba(0,0,0,0.2)"
                      shadowBlur={4}
                      shadowOffsetX={2}
                      shadowOffsetY={2}
                    />
                  )}
                  <Text
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2 - 8}
                    text={icon}
                    fontSize={18}
                    fill="white"
                    fontWeight="bold"
                    offsetX={8}
                    offsetY={8}
                  />
                  <Text
                    x={node.x + node.width / 2}
                    y={node.y + node.height + 4}
                    text={node.name}
                    fontSize={12}
                    fill="#374151"
                    offsetX={node.name.length * 3}
                  />
                </Group>
              )
            })}
          </Layer>

          <Layer>
            {allPorts.map((port) => {
              const node = nodes.find((n) => n.id === port.nodeId)!
              const isSelected = selectedNodeId === node.id
              const canConnectFrom = port.position === 'right' || node.type === 'end'

              return (
                <Circle
                  key={port.id}
                  x={port.x}
                  y={port.y}
                  radius={6}
                  fill={isSelected ? '#1E40AF' : '#FFFFFF'}
                  stroke={isSelected ? '#1E40AF' : '#64748B'}
                  strokeWidth={2}
                  draggable={false}
                  onMouseDown={(e) => handlePortMouseDown(port.nodeId, e)}
                  onMouseUp={() => handlePortMouseUp(port.nodeId)}
                  cursor={canConnectFrom ? 'pointer' : 'default'}
                  opacity={isSelected ? 1 : 0.7}
                />
              )
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
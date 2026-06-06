'use client'

import React from 'react'
import { Rect } from 'react-konva'

interface CanvasGridProps {
  width: number
  height: number
  gridSize: number
  visible: boolean
}

export function CanvasGrid({ width, height, gridSize, visible }: CanvasGridProps) {
  if (!visible) return null

  // 生成栅格线
  const verticalLines: JSX.Element[] = []
  const horizontalLines: JSX.Element[] = []

  // 垂直线
  for (let x = 0; x <= width; x += gridSize) {
    verticalLines.push(
      <Rect
        key={`v-${x}`}
        x={x}
        y={0}
        width={1}
        height={height}
        fill="#e5e7eb"
      />
    )
  }

  // 水平线
  for (let y = 0; y <= height; y += gridSize) {
    horizontalLines.push(
      <Rect
        key={`h-${y}`}
        x={0}
        y={y}
        width={width}
        height={1}
        fill="#e5e7eb"
      />
    )
  }

  return (
    <React.Fragment>
      {verticalLines}
      {horizontalLines}
    </React.Fragment>
  )
}

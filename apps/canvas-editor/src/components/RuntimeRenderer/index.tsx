'use client'

import React, { useMemo } from 'react'
import type { ComponentConfig, PageConfig } from '@/store/canvasStore'
import { getComponentRenderer } from './componentMap'

interface RuntimeRendererProps {
  components: ComponentConfig[]
  currentPage?: PageConfig
}

export function RuntimeRenderer({ components, currentPage }: RuntimeRendererProps) {
  const sortedComponents = useMemo(() => {
    return [...components].sort((a, b) => a.zIndex - b.zIndex)
  }, [components])

  const renderComponent = (component: ComponentConfig) => {
    if (!component.visible) return null

    const Renderer = getComponentRenderer(component.type)
    if (!Renderer) {
      return (
        <div
          key={component.id}
          className="absolute bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-500 text-sm"
          style={{
            left: component.x,
            top: component.y,
            width: component.width,
            height: component.height,
            zIndex: component.zIndex,
            opacity: component.opacity,
            transform: `rotate(${component.rotation}deg)`,
          }}
        >
          {component.type}
        </div>
      )
    }

    return (
      <Renderer
        key={component.id}
        component={component}
      />
    )
  }

  return (
    <div
      className="relative w-full min-h-screen"
      style={{
        backgroundColor: currentPage?.backgroundColor || '#ffffff',
        minWidth: currentPage?.width || 1920,
        minHeight: currentPage?.height || 1080,
      }}
    >
      {sortedComponents.map(renderComponent)}
    </div>
  )
}

export default RuntimeRenderer
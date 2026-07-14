'use client'

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useCanvasStore } from '@/store/canvasStore'
import { Sidebar } from '@/components/Sidebar'
import { Toolbar } from '@/components/Toolbar'
import { PropertyPanel } from '@/components/PropertyPanel'
import { Canvas } from '@/components/Canvas'

export default function EditorPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  
  const loadProject = useCanvasStore((state) => state.loadProject)
  const newProject = useCanvasStore((state) => state.newProject)
  const zoom = useCanvasStore((state) => state.zoom)
  const zoomIn = useCanvasStore((state) => state.zoomIn)
  const zoomOut = useCanvasStore((state) => state.zoomOut)
  const resetZoom = useCanvasStore((state) => state.resetZoom)
  const components = useCanvasStore((state) => state.components)

  useEffect(() => {
    if (projectId === 'new') {
      newProject()
    } else if (projectId) {
      loadProject(projectId)
    }
  }, [projectId, loadProject, newProject])

  const handleZoomChange = (delta: number) => {
    const newZoom = zoom + delta
    if (newZoom >= 0.25 && newZoom <= 2) {
      if (delta > 0) {
        zoomIn()
      } else {
        zoomOut()
      }
    }
  }

  return (
    <div className="flex bg-gray-50" style={{ height: 'calc(100vh - 64px - 48px)' }}>
      <div className="w-80 flex-shrink-0 overflow-hidden border-r border-gray-200 bg-white">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
          <Toolbar projectId={projectId} />
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-100">
          <Canvas />
        </div>
        
        <div className="h-10 border-t border-gray-200 bg-white px-4 flex items-center justify-center gap-4">
          <button 
            onClick={() => handleZoomChange(-0.1)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
          >
            -
          </button>
          <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => handleZoomChange(0.1)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
          >
            +
          </button>
          <button
            onClick={resetZoom}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            重置
          </button>
          <span className="text-xs text-gray-400 ml-8">
            组件数: {components.length}
          </span>
        </div>
      </div>
      
      <div className="w-80 flex-shrink-0 overflow-hidden border-l border-gray-200 bg-white">
        <PropertyPanel />
      </div>
    </div>
  )
}

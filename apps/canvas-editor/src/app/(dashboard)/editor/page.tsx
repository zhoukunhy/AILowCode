'use client'

import dynamic from 'next/dynamic'
import { Toolbar } from '@/components/Toolbar'
import { Sidebar } from '@/components/Sidebar'
import { PropertyPanel } from '@/components/PropertyPanel'

// 动态导入Canvas组件，禁用SSR
const Canvas = dynamic(
  () => import('@/components/Canvas').then((mod) => ({ default: mod.Canvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">加载画布...</div>
      </div>
    ),
  }
)

export default function EditorPage() {
  return (
    <div className="flex h-full">
      {/* 左侧边栏 */}
      <div className="w-80 flex-shrink-0 h-full overflow-hidden border-r border-gray-200">
        <Sidebar />
      </div>
      
      {/* 中间区域 */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Toolbar />
        <div className="flex-1 overflow-hidden relative">
          <Canvas />
        </div>
      </div>
      
      {/* 右侧属性面板 */}
      <div className="w-80 flex-shrink-0 h-full overflow-hidden border-l border-gray-200">
        <PropertyPanel />
      </div>
    </div>
  )
}

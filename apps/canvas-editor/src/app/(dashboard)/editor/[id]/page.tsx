'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useCanvasStore } from '@/store/canvasStore'
import { Sidebar } from '@/components/Sidebar'
import { Toolbar } from '@/components/Toolbar'
import { PropertyPanel } from '@/components/PropertyPanel'
import { PerformanceMonitor } from '@/components/Canvas/PerformanceMonitor'

export default function EditorPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  
  // 使用选择器获取状态，确保正确响应变化
  const components = useCanvasStore((state) => state.components)
  const currentPage = useCanvasStore((state) => state.currentPage)
  const addComponent = useCanvasStore((state) => state.addComponent)
  const selectComponent = useCanvasStore((state) => state.selectComponent)
  const updateComponent = useCanvasStore((state) => state.updateComponent)
  const loadProject = useCanvasStore((state) => state.loadProject)
  const [zoom, setZoom] = useState(100)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showPerformance, setShowPerformance] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // 加载项目
  useEffect(() => {
    if (projectId && projectId !== 'new') {
      loadProject(projectId)
    }
  }, [projectId, loadProject])

  // 处理拖拽开始
  const handleComponentMouseDown = useCallback((e: React.MouseEvent, componentId: string) => {
    e.stopPropagation()
    const component = components.find(c => c.id === componentId)
    if (!component || component.locked) return

    selectComponent(componentId)
    setDraggingId(componentId)
    
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [components, selectComponent])

  // 处理拖拽移动（优化：使用防抖）
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const scale = zoom / 100
    
    let newX = (e.clientX - canvasRect.left) / scale - dragOffset.x
    let newY = (e.clientY - canvasRect.top) / scale - dragOffset.y

    // 栅格对齐
    if (currentPage.snapToGrid) {
      newX = Math.round(newX / currentPage.gridSize) * currentPage.gridSize
      newY = Math.round(newY / currentPage.gridSize) * currentPage.gridSize
    }

    // 边界限制
    const canvasWidth = canvasRef.current?.clientWidth || currentPage.width
    const canvasHeight = canvasRef.current?.clientHeight || currentPage.height
    newX = Math.max(0, Math.min(newX, canvasWidth - 100))
    newY = Math.max(0, Math.min(newY, canvasHeight - 40))

    updateComponent(draggingId, { x: newX, y: newY })
  }, [draggingId, zoom, dragOffset, currentPage, updateComponent])

  // 处理拖拽结束
  const handleMouseUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  // 处理拖放
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const componentType = e.dataTransfer.getData('componentType')
    if (!componentType || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const scale = zoom / 100
    const x = (e.clientX - canvasRect.left) / scale
    const y = (e.clientY - canvasRect.top) / scale

    addComponent(componentType, x, y)
  }, [zoom, addComponent])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // 处理画布点击 - 取消选中
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectComponent(null)
    }
  }, [selectComponent])

  // 处理缩放变化
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(50, Math.min(200, newZoom)))
  }, [])

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧边栏 */}
      <div className="w-80 flex-shrink-0 h-full overflow-hidden border-r border-gray-200 bg-white">
        <Sidebar />
      </div>
      
      {/* 中间区域 */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* 工具栏 */}
        <div className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
          <Toolbar />
          <button
            onClick={() => setShowPerformance(!showPerformance)}
            className={`px-3 py-1 rounded text-sm ${
              showPerformance 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⚡ 性能监控
          </button>
        </div>
        
        {/* 性能监控面板 */}
        {showPerformance && (
          <PerformanceMonitor />
        )}
        
        {/* 画布区域 */}
        <div 
          className="flex-1 overflow-auto bg-gray-100"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            ref={canvasRef}
            className="relative bg-white shadow-lg w-full h-full" 
            style={{ 
              minWidth: currentPage.width, 
              minHeight: currentPage.height,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleCanvasClick}
          >
            {/* 网格背景 */}
            {currentPage.showGrid && (
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)`,
                  backgroundSize: `${currentPage.gridSize}px ${currentPage.gridSize}px`,
                  pointerEvents: 'none',
                }}
              />
            )}
            
            {/* 画布内容 */}
            <div className="relative w-full h-full">
              {components.length === 0 ? (
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
                    <p style={{ fontSize: '1.125rem' }}>从左侧拖拽组件到这里开始</p>
                  </div>
                </div>
              ) : (
                components.map((component) => (
                  <div
                    key={component.id}
                    className={`absolute cursor-move transition-all ${
                      draggingId === component.id ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
                    }`}
                    style={{
                      left: component.x,
                      top: component.y,
                      width: component.width,
                      height: component.height,
                      zIndex: component.zIndex,
                      opacity: component.opacity,
                      transform: `rotate(${component.rotation}deg)`,
                      visibility: component.visible ? 'visible' : 'hidden',
                      cursor: component.locked ? 'not-allowed' : 'move',
                    }}
                    onMouseDown={(e) => handleComponentMouseDown(e, component.id)}
                  >
                    {/* 组件预览 */}
                    {component.type === 'button' && (
                      <button
                        className="w-full h-full bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 transition-colors"
                      >
                        {component.props.text}
                      </button>
                    )}
                    {component.type === 'input' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">
                            {component.props.label}
                            {component.props.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                        )}
                        <input
                          type="text"
                          className="w-full h-full border border-gray-300 rounded px-3"
                          placeholder={component.props.placeholder}
                          readOnly
                        />
                      </div>
                    )}
                    {component.type === 'textarea' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <textarea
                          className="w-full h-full border border-gray-300 rounded px-3 py-2 resize-none"
                          placeholder={component.props.placeholder}
                          rows={component.props.rows || 4}
                          readOnly
                        />
                      </div>
                    )}
                    {component.type === 'select' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <select className="w-full h-full border border-gray-300 rounded px-3 bg-white" disabled>
                          <option value="">{component.props.placeholder}</option>
                          {component.props.options?.map((opt: string, idx: number) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {component.type === 'checkbox' && (
                      <div className="flex items-center h-full">
                        <input type="checkbox" disabled checked={component.props.checked} className="w-4 h-4" />
                        <span className="ml-2 text-sm text-gray-700">{component.props.label}</span>
                      </div>
                    )}
                    {component.type === 'radio' && (
                      <div className="flex flex-col h-full justify-center">
                        <span className="text-sm text-gray-600 mb-1">{component.props.label}</span>
                        {component.props.options?.map((opt: string, idx: number) => (
                          <label key={idx} className="flex items-center mb-1">
                            <input type="radio" name={`radio-${component.id}`} value={opt} defaultChecked={opt === component.props.value} disabled className="w-4 h-4" />
                            <span className="ml-2 text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {component.type === 'switch' && (
                      <div className="flex items-center h-full gap-2">
                        <span className="text-sm text-gray-700">{component.props.label}</span>
                        <div className="relative w-10 h-5 bg-gray-300 rounded-full">
                          <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${component.props.checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    )}
                    {component.type === 'datepicker' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <input type="date" className="w-full h-full border border-gray-300 rounded px-3" disabled />
                      </div>
                    )}
                    {component.type === 'daterange' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <input type="text" className="w-full h-full border border-gray-300 rounded px-3 bg-white" placeholder="yyyy-MM-dd 至 yyyy-MM-dd" readOnly />
                      </div>
                    )}
                    {component.type === 'timepicker' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <input type="time" className="w-full h-full border border-gray-300 rounded px-3" disabled />
                      </div>
                    )}
                    {component.type === 'numberInput' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <input
                          type="number"
                          className="w-full h-full border border-gray-300 rounded px-3"
                          placeholder={component.props.placeholder}
                          min={component.props.min}
                          max={component.props.max}
                          readOnly
                        />
                      </div>
                    )}
                    {component.type === 'passwordInput' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <input
                          type="password"
                          className="w-full h-full border border-gray-300 rounded px-3"
                          placeholder={component.props.placeholder}
                          readOnly
                        />
                      </div>
                    )}
                    {component.type === 'emailInput' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <input
                          type="email"
                          className="w-full h-full border border-gray-300 rounded px-3"
                          placeholder={component.props.placeholder}
                          readOnly
                        />
                      </div>
                    )}
                    {component.type === 'phoneInput' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <input
                          type="tel"
                          className="w-full h-full border border-gray-300 rounded px-3"
                          placeholder={component.props.placeholder}
                          readOnly
                        />
                      </div>
                    )}
                    {component.type === 'upload' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <div className="flex-1 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 text-sm">
                          <span className="text-2xl mb-1">📤</span>
                          <span>点击或拖拽上传</span>
                        </div>
                      </div>
                    )}
                    {component.type === 'slider' && (
                      <div className="flex flex-col w-full h-full justify-center">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{component.props.label}</span>
                          <span>{component.props.value}</span>
                        </div>
                        <input type="range" className="w-full" min={component.props.min} max={component.props.max} value={component.props.value} readOnly />
                      </div>
                    )}
                    {component.type === 'rate' && (
                      <div className="flex flex-col w-full h-full justify-center">
                        <span className="text-sm text-gray-600 mb-1">{component.props.label}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: component.props.count || 5 }).map((_, i) => (
                            <span key={i} className="text-yellow-400 text-lg">★</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {component.type === 'cascader' && (
                      <div className="flex flex-col w-full h-full">
                        {component.props.label && (
                          <label className="text-sm text-gray-600 mb-1">{component.props.label}</label>
                        )}
                        <input type="text" className="w-full h-full border border-gray-300 rounded px-3 bg-white" placeholder={component.props.placeholder} readOnly />
                      </div>
                    )}
                    {component.type === 'transfer' && (
                      <div className="w-full h-full flex gap-2 p-2 bg-gray-50 rounded">
                        <div className="flex-1 border border-gray-200 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">源列表</div>
                          {component.props.options?.map((opt: string, i: number) => (
                            <div key={i} className="text-xs py-1">☐ {opt}</div>
                          ))}
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400">→</span>
                        </div>
                        <div className="flex-1 border border-gray-200 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">目标列表</div>
                        </div>
                      </div>
                    )}
                    {component.type === 'form' && (
                      <div className="w-full h-full border border-gray-200 rounded p-4 bg-white">
                        <div className="text-base font-bold mb-4">{component.props.title}</div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className="w-24 text-sm text-gray-600">字段1:</div>
                            <input className="flex-1 h-8 border border-gray-300 rounded px-2 text-sm" placeholder="请输入" readOnly />
                          </div>
                          <div className="flex items-center">
                            <div className="w-24 text-sm text-gray-600">字段2:</div>
                            <input className="flex-1 h-8 border border-gray-300 rounded px-2 text-sm" placeholder="请输入" readOnly />
                          </div>
                        </div>
                      </div>
                    )}
                    {component.type === 'table' && (
                      <div className="w-full h-full bg-white border border-gray-200 rounded overflow-hidden flex flex-col">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-medium text-sm">
                          {component.props.title || '数据表格'}
                        </div>
                        <table className="w-full flex-1">
                          <thead className="bg-gray-50">
                            <tr>
                              {Array.from({ length: component.props.columns || 4 }).map((_, i) => (
                                <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-600 border-b border-gray-200">
                                  列{i + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: component.props.rows || 3 }).map((_, rowIdx) => (
                              <tr key={rowIdx} className={rowIdx % 2 === 1 && component.props.striped ? 'bg-gray-50' : ''}>
                                {Array.from({ length: component.props.columns || 4 }).map((_, colIdx) => (
                                  <td key={colIdx} className="px-4 py-2 text-xs text-gray-700 border-b border-gray-100">
                                    数据{rowIdx + 1}-{colIdx + 1}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {component.type === 'list' && (
                      <div className="w-full h-full bg-white border border-gray-200 rounded p-3">
                        <div className="text-sm font-medium mb-2 pb-1 border-b border-gray-100">
                          {component.props.title || '列表'}
                        </div>
                        <div className="space-y-1">
                          {component.props.items?.map((item: string, i: number) => (
                            <div key={i} className="text-xs text-gray-600 py-1 px-2 hover:bg-gray-50 rounded">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {component.type === 'pagination' && (
                      <div className="w-full h-full flex items-center justify-between px-4 bg-white border border-gray-200 rounded">
                        <span className="text-xs text-gray-600">共 {component.props.total || 100} 条</span>
                        <div className="flex items-center gap-1">
                          <button className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50" disabled>上一页</button>
                          <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded">1</button>
                          <button className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">2</button>
                          <button className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">3</button>
                          <button className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">下一页</button>
                        </div>
                        <select className="text-xs border border-gray-200 rounded px-1 py-1">
                          <option>10条/页</option>
                          <option>20条/页</option>
                        </select>
                      </div>
                    )}
                    {component.type === 'tabs' && (
                      <div className="w-full h-full bg-white border border-gray-200 rounded flex flex-col">
                        <div className="flex border-b border-gray-200">
                          {component.props.tabs?.map((tab: string, i: number) => (
                            <div
                              key={i}
                              className={`px-4 py-2 text-sm cursor-pointer border-b-2 ${
                                i === (component.props.activeTab || 0) ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'
                              }`}
                            >
                              {tab}
                            </div>
                          ))}
                        </div>
                        <div className="flex-1 p-4 text-sm text-gray-600">
                          {component.props.tabs?.[component.props.activeTab] || '标签页内容'}
                        </div>
                      </div>
                    )}
                    {component.type === 'steps' && (
                      <div className="w-full h-full flex items-center justify-between px-4">
                        {component.props.steps?.map((step: string, i: number) => (
                          <div key={i} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                i < (component.props.current || 1) ? 'bg-green-500 text-white' : i === (component.props.current || 1) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                              }`}>
                                {i < (component.props.current || 1) ? '✓' : i + 1}
                              </div>
                              <div className="text-xs mt-1 text-center">{step}</div>
                            </div>
                            {i < (component.props.steps?.length || 3) - 1 && (
                              <div className={`w-16 h-0.5 mx-2 ${i < (component.props.current || 1) ? 'bg-green-500' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {component.type === 'timeline' && (
                      <div className="w-full h-full bg-white p-4 overflow-hidden">
                        <div className="relative pl-6">
                          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
                          {component.props.items?.map((item: { title: string, content: string }, i: number) => (
                            <div key={i} className="relative mb-4">
                              <div className="absolute left-[-18px] w-3 h-3 rounded-full bg-blue-500" />
                              <div className="text-xs text-gray-500 mb-0.5">{item.title}</div>
                              <div className="text-sm text-gray-700">{item.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {component.type === 'tree' && (
                      <div className="w-full h-full bg-white border border-gray-200 rounded p-3">
                        <div className="text-sm font-medium mb-2">{component.props.title || '树形控件'}</div>
                        <div className="text-xs">
                          <div className="flex items-start">
                            <span className="mr-1">📁</span>
                            <div>
                              <div className="text-blue-600">根节点</div>
                              <div className="ml-4">
                                <div className="flex items-start"><span className="mr-1">📁</span><span>子节点1</span></div>
                                <div className="flex items-start"><span className="mr-1">📁</span><span>子节点2</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {component.type === 'carousel' && (
                      <div className="w-full h-full bg-gray-100 rounded overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">🎠</div>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                        </div>
                      </div>
                    )}
                    {component.type === 'text' && (
                      <div 
                        className="w-full h-full flex items-center"
                        style={{
                          fontSize: component.props.fontSize || 14,
                          fontWeight: component.props.fontWeight || 'normal',
                          color: component.props.color || '#333',
                          textAlign: component.props.textAlign || 'left',
                        }}
                      >
                        {component.props.content}
                      </div>
                    )}
                    {component.type === 'heading' && (
                      <div 
                        className="w-full h-full flex items-center"
                        style={{
                          fontSize: component.props.level === 1 ? '2em' : component.props.level === 2 ? '1.5em' : component.props.level === 3 ? '1.17em' : '1em',
                          fontWeight: 'bold',
                          color: component.props.color || '#333',
                        }}
                      >
                        {component.props.content}
                      </div>
                    )}
                    {component.type === 'image' && (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-gray-200 rounded overflow-hidden">
                        <div className="text-center text-gray-400">
                          <div className="text-4xl mb-2">🖼️</div>
                          <div className="text-xs">{component.props.alt || '图片'}</div>
                        </div>
                      </div>
                    )}
                    {component.type === 'card' && (
                      <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
                        <div className="text-base font-bold mb-2 pb-2 border-b border-gray-100">{component.props.title}</div>
                        <div className="flex-1 text-sm text-gray-600 overflow-hidden">{component.props.content}</div>
                      </div>
                    )}
                    {component.type === 'divider' && (
                      <div className="w-full h-full flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                    )}
                    {component.type === 'space' && (
                      <div className="w-full h-full flex gap-2 items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded"></div>
                        <div className="w-8 h-8 bg-green-500 rounded"></div>
                        <div className="w-8 h-8 bg-red-500 rounded"></div>
                      </div>
                    )}
                    {component.type === 'avatar' && (
                      <div className="w-full h-full flex items-center">
                        <div className={`w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-2xl ${
                          component.props.shape === 'square' ? 'rounded' : 'rounded-full'
                        }`}>
                          👤
                        </div>
                      </div>
                    )}
                    {component.type === 'tag' && (
                      <div className="w-full h-full flex items-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          component.props.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          component.props.color === 'red' ? 'bg-red-100 text-red-600' :
                          component.props.color === 'green' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {component.props.label}
                        </span>
                      </div>
                    )}
                    {component.type === 'badge' && (
                      <div className="w-full h-full flex items-center justify-center relative">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          🔔
                        </div>
                        {component.props.dot ? (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                        ) : (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {component.props.count || 0}
                          </span>
                        )}
                      </div>
                    )}
                    {component.type === 'alert' && (
                      <div className={`w-full h-full border rounded p-3 flex flex-col justify-center ${
                        component.props.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                        component.props.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                        component.props.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <div className="text-sm font-medium flex items-center gap-2">
                          {component.props.showIcon && <span>{component.props.type === 'success' ? '✓' : component.props.type === 'error' ? '✕' : component.props.type === 'warning' ? '⚠' : 'ℹ'}</span>}
                          {component.props.message}
                        </div>
                        {component.props.description && (
                          <div className="text-xs mt-1 opacity-75">{component.props.description}</div>
                        )}
                      </div>
                    )}
                    {component.type === 'modal' && (
                      <div className="w-full h-full bg-white border-2 border-blue-300 rounded-lg shadow-lg flex flex-col">
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 font-medium text-sm">
                          {component.props.title}
                          {component.props.closable && <span className="float-right text-gray-400 cursor-pointer">✕</span>}
                        </div>
                        <div className="flex-1 p-4 text-sm text-gray-600">{component.props.content}</div>
                      </div>
                    )}
                    {component.type === 'drawer' && (
                      <div className="w-full h-full bg-white border-l-4 border-blue-300 shadow-lg flex flex-col">
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 font-medium text-sm">
                          {component.props.title}
                          {component.props.closable && <span className="float-right text-gray-400 cursor-pointer">✕</span>}
                        </div>
                        <div className="flex-1 p-4 text-sm text-gray-600">{component.props.content}</div>
                      </div>
                    )}
                    {component.type === 'tooltip' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative group">
                          <div className="px-3 py-1 bg-gray-200 rounded text-sm cursor-help">文本</div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {component.props.content}
                          </div>
                        </div>
                      </div>
                    )}
                    {component.type === 'popover' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative group">
                          <div className="px-3 py-1 bg-blue-100 rounded text-sm cursor-pointer">点击</div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-white border border-gray-200 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity min-w-32">
                            <div className="text-sm font-medium mb-1">{component.props.title}</div>
                            <div className="text-xs text-gray-600">{component.props.content}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* 底部缩放控制 */}
        <div className="h-10 border-t border-gray-200 bg-white px-4 flex items-center justify-center gap-4">
          <button 
            onClick={() => handleZoomChange(zoom - 10)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
          >
            -
          </button>
          <span className="text-sm w-12 text-center">{zoom}%</span>
          <button 
            onClick={() => handleZoomChange(zoom + 10)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
          >
            +
          </button>
          <span className="text-xs text-gray-400 ml-8">
            组件数: {components.length}
          </span>
        </div>
      </div>
      
      {/* 右侧属性面板 */}
      <div className="w-80 flex-shrink-0 h-full overflow-hidden border-l border-gray-200 bg-white">
        <PropertyPanel />
      </div>
    </div>
  )
}
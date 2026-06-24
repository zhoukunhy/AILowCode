'use client'

import React, { useState, useEffect } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { PreviewMode } from '@/components/PreviewMode'
import { ThemeSettings } from '@/components/ThemeSettings'
import { MobileAdaptation } from '@/components/MobileAdaptation'

interface ToolbarProps {
  isViewMode?: boolean
  projectId?: string
}

export function Toolbar({ isViewMode = false, projectId = 'new' }: ToolbarProps) {
  const project = useCanvasStore((state) => state.project)
  const components = useCanvasStore((state) => state.components)
  const saveProject = useCanvasStore((state) => state.saveProject)
  const saveProjectAs = useCanvasStore((state) => state.saveProjectAs)
  const newProject = useCanvasStore((state) => state.newProject)
  const autoSave = useCanvasStore((state) => state.autoSave)
  const exportCanvasJson = useCanvasStore((state) => state.exportCanvasJson)
  const clearCanvas = useCanvasStore((state) => state.clearCanvas)
  
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState('未命名项目')
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [jsonContent, setJsonContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showThemeSettings, setShowThemeSettings] = useState(false)
  const [showMobileAdaptation, setShowMobileAdaptation] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSaveAsName(project.name)
  }, [project.name])

  useEffect(() => {
    if (!mounted) return
    const timer = setInterval(() => {
      autoSave()
    }, 10000)
    
    return () => clearInterval(timer)
  }, [autoSave, mounted])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveProject()
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAs = async () => {
    if (!saveAsName.trim()) return
    setIsSaving(true)
    try {
      await saveProjectAs(saveAsName)
      setSaveAsModalOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNew = () => {
    if (project.isDirty && !confirm('当前项目有未保存的修改，是否继续？')) {
      return
    }
    newProject()
  }

  const handleExport = () => {
    const json = exportCanvasJson()
    setJsonContent(json)
    setExportModalOpen(true)
  }

  const handleExportDownload = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name || 'canvas'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExportModalOpen(false)
  }

  const handleClearCanvas = () => {
    if (components.length === 0) return
    if (confirm('确定要清除画布上的所有组件吗？此操作无法撤销。')) {
      clearCanvas()
    }
  }

  return (
    <>
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <span>📄</span>
            <span>新建</span>
          </button>
          {!isViewMode && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving || !project.isDirty}
                className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                  project.isDirty
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>💾</span>
                <span>{isSaving ? '保存中...' : '保存'}</span>
              </button>
              <button
                onClick={() => {
                  setSaveAsName(project.name)
                  setSaveAsModalOpen(true)
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span>📂</span>
                <span>另存为</span>
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-2"></div>
              
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span>📤</span>
                <span>导出JSON</span>
              </button>
              
              <button
                onClick={handleClearCanvas}
                disabled={components.length === 0}
                className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                  components.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                <span>🗑️</span>
                <span>清除画布</span>
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-2"></div>
              
              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>👁️</span>
                <span>预览</span>
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-2"></div>
              
              <button
                onClick={() => setShowThemeSettings(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <span>🎨</span>
                <span>主题</span>
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-2"></div>
              
              <button
                onClick={() => setShowMobileAdaptation(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <span>📱</span>
                <span>移动端</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 预览模式 */}
      {showPreview && (
        <PreviewMode 
          onClose={() => setShowPreview(false)} 
          projectId={projectId}
        />
      )}

      {/* 主题设置 */}
      {showThemeSettings && (
        <ThemeSettings onClose={() => setShowThemeSettings(false)} />
      )}

      {/* 移动端适配 */}
      {showMobileAdaptation && (
        <MobileAdaptation onClose={() => setShowMobileAdaptation(false)} />
      )}

      {/* 另存为弹窗 */}
      {saveAsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">另存为项目</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目名称
              </label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入项目名称"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSaveAsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveAs}
                disabled={!saveAsName.trim() || isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导出JSON弹窗 */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">导出画布JSON</h3>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              以下是画布的JSON数据，您可以复制内容或下载文件。
            </p>
            <div className="flex-1 overflow-auto mb-4">
              <textarea
                value={jsonContent}
                readOnly
                className="w-full h-full min-h-[300px] p-3 border border-gray-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonContent)
                  alert('已复制到剪贴板')
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                复制内容
              </button>
              <button
                onClick={handleExportDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                下载文件
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
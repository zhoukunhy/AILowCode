'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

interface ToolbarProps {
  isViewMode?: boolean
}

export function Toolbar({ isViewMode = false }: ToolbarProps) {
  const project = useCanvasStore((state) => state.project)
  const saveProject = useCanvasStore((state) => state.saveProject)
  const saveProjectAs = useCanvasStore((state) => state.saveProjectAs)
  const newProject = useCanvasStore((state) => state.newProject)
  const autoSave = useCanvasStore((state) => state.autoSave)
  const newPage = useCanvasStore((state) => state.newPage)
  const switchPage = useCanvasStore((state) => state.switchPage)
  const exportCanvasJson = useCanvasStore((state) => state.exportCanvasJson)
  const importCanvasJson = useCanvasStore((state) => state.importCanvasJson)
  
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState('未命名项目')
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [jsonContent, setJsonContent] = useState('')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        importCanvasJson(content)
        setImportModalOpen(false)
        setImportError('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch {
        setImportError('无效的JSON文件格式')
      }
    }
    reader.readAsText(file)
  }

  const handleImportFromText = () => {
    if (!jsonContent.trim()) {
      setImportError('请输入JSON内容')
      return
    }
    try {
      importCanvasJson(jsonContent)
      setImportModalOpen(false)
      setJsonContent('')
      setImportError('')
    } catch {
        setImportError('无效的JSON格式')
      }
  }

  const handleImportCancel = () => {
    setImportModalOpen(false)
    setJsonContent('')
    setImportError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const currentPages = project.pages || []

  return (
    <>
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
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
                onClick={() => setImportModalOpen(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span>📥</span>
                <span>导入JSON</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 flex-shrink-0 min-w-0">
            <span className="truncate">{mounted ? project.name : '加载中...'}</span>
            {mounted && project.isDirty && <span className="ml-2 text-yellow-600">• 未保存</span>}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-xs">
              {mounted && currentPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => switchPage(page.id)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors flex-shrink-0 min-w-[60px] text-center ${
                    page.id === project.currentPageId
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page.name}
                </button>
              ))}
            </div>
            {mounted && (
              <button
                onClick={newPage}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                title="新建页面"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>

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

      {/* 导入JSON弹窗 */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">导入画布JSON</h3>
              <button
                onClick={handleImportCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {importError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                ⚠️ {importError}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                方式一：上传JSON文件
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFromFile}
                className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                方式二：粘贴JSON内容
              </label>
              <textarea
                value={jsonContent}
                onChange={(e) => {
                  setJsonContent(e.target.value)
                  setImportError('')
                }}
                className="w-full h-[200px] p-3 border border-gray-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="粘贴画布JSON内容..."
              />
            </div>
            
            <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded">
              <strong>注意：</strong>导入JSON将替换当前画布内容，请确保已保存当前工作。
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleImportCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImportFromText}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCanvasStore } from '@/store/canvasStore'
import { PreviewMode } from '@/components/PreviewMode'
import { ThemeSettings } from '@/components/ThemeSettings'
import { MobileAdaptation } from '@/components/MobileAdaptation'

interface ToolbarProps {
  isViewMode?: boolean
  projectId?: string
}

export function Toolbar({ isViewMode = false, projectId = 'new' }: ToolbarProps) {
  const router = useRouter()
  const project = useCanvasStore((state) => state.project)
  const components = useCanvasStore((state) => state.components)
  const saveProject = useCanvasStore((state) => state.saveProject)
  const saveProjectAs = useCanvasStore((state) => state.saveProjectAs)
  const newProject = useCanvasStore((state) => state.newProject)
  const autoSave = useCanvasStore((state) => state.autoSave)
  const exportCanvasJson = useCanvasStore((state) => state.exportCanvasJson)
  const generateCode = useCanvasStore((state) => state.generateCode)
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
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [generatedFiles, setGeneratedFiles] = useState<{ path: string; content: string }[]>([])
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)

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

  const handleSave = () => {
    setSaveName(project.name || '')
    setSaveModalOpen(true)
  }

  const handleSaveConfirm = async () => {
    if (!saveName.trim()) {
      alert('请输入画布名称')
      return
    }
    setIsSaving(true)
    try {
      const result = await saveProject(saveName.trim())
      if (result?.success) {
        setSaveModalOpen(false)
        alert('保存成功！')
        router.push('/canvas')
      }
    } catch {
      alert('保存失败，请重试')
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

  const handleGenerateCode = () => {
    const result = generateCode()
    setGeneratedFiles(result.files)
    if (result.files.length > 0) {
      setSelectedFile(result.files[0])
    }
    setCodeModalOpen(true)
  }

  const handleDownloadAll = () => {
    const zipContent = generatedFiles.map(file => {
      return `---${file.path}---\n${file.content}`
    }).join('\n\n')
    
    const blob = new Blob([zipContent], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name || 'canvas-page'}-code.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadSingle = () => {
    if (!selectedFile) return
    const blob = new Blob([selectedFile.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = selectedFile.path.split('/').pop() || 'file.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyCode = () => {
    if (!selectedFile) return
    navigator.clipboard.writeText(selectedFile.content)
    alert('已复制代码到剪贴板')
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
                onClick={handleGenerateCode}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <span>💻</span>
                <span>生成代码</span>
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
              
              {/* <button
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
              </button> */}
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

      {/* 保存弹窗 */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">保存画布</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画布名称
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入画布名称"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveConfirm}
                disabled={!saveName.trim() || isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
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

      {/* 生成代码弹窗 */}
      {codeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-800">生成代码</h3>
                <span className="text-xs text-gray-500">React + TypeScript + Vite</span>
              </div>
              <button
                onClick={() => setCodeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-64 border-r overflow-y-auto p-2">
                <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">项目结构</div>
                {generatedFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                      selectedFile?.path === file.path
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {file.path}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedFile?.path || '选择文件'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      disabled={!selectedFile}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      复制代码
                    </button>
                    <button
                      onClick={handleDownloadSingle}
                      disabled={!selectedFile}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下载文件
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {selectedFile ? (
                    <pre className="w-full h-full text-sm font-mono overflow-auto whitespace-pre-wrap">
                      {selectedFile.content}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      请从左侧选择一个文件查看代码
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setCodeModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <span>📦</span>
                <span>下载全部代码</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
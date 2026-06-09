'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

export function ImportExportButton() {
  const exportCanvasJson = useCanvasStore((state) => state.exportCanvasJson)
  const importCanvasJson = useCanvasStore((state) => state.importCanvasJson)
  const [showModal, setShowModal] = useState<'export' | 'import' | null>(null)
  const [importText, setImportText] = useState('')
  const [error, setError] = useState('')

  const handleExport = () => {
    const json = exportCanvasJson()
    // 创建下载链接
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'canvas-export.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowModal(null)
  }

  const handleImport = () => {
    try {
      importCanvasJson(importText)
      setShowModal(null)
      setImportText('')
      setError('')
    } catch {
      setError('导入失败：无效的JSON格式')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* 导出按钮 */}
      <button
        onClick={() => setShowModal('export')}
        className="px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-600 rounded transition-colors"
        title="导出画布"
      >
        📤 导出
      </button>

      {/* 导入按钮 */}
      <button
        onClick={() => setShowModal('import')}
        className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
        title="导入画布"
      >
        📥 导入
      </button>

      {/* 导出确认弹窗 */}
      {showModal === 'export' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-gray-800 mb-4">导出画布</h3>
            <p className="text-sm text-gray-600 mb-4">
              确定要导出当前画布的JSON配置吗？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
              >
                导出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入弹窗 */}
      {showModal === 'import' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">导入画布</h3>
            <p className="text-sm text-gray-600 mb-3">
              请粘贴画布JSON配置：
            </p>
            {error && (
              <div className="mb-3 p-3 bg-red-50 text-red-600 rounded text-sm">
                {error}
              </div>
            )}
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value)
                setError('')
              }}
              className="flex-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请粘贴JSON内容..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowModal(null)
                  setImportText('')
                  setError('')
                }}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

export function Toolbar() {
  const { 
    project, 
    saveProject, 
    saveProjectAs, 
    newProject, 
    autoSave,
    newPage,
    switchPage,
  } = useCanvasStore()
  
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState('未命名项目')
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 确保客户端渲染后状态一致
  useEffect(() => {
    setMounted(true)
    setSaveAsName(project.name)
  }, [project.name])

  // 自动保存 - 每10秒
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

  const currentPages = project.pages || []

  return (
    <>
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            📄 新建
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !project.isDirty}
            className={`px-4 py-2 rounded transition-colors ${
              project.isDirty
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? '💾 保存中...' : '💾 保存'}
          </button>
          <button
            onClick={() => {
              setSaveAsName(project.name)
              setSaveAsModalOpen(true)
            }}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            📂 另存为
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {mounted ? project.name : '加载中...'}
            {mounted && project.isDirty && <span className="ml-2 text-yellow-600">• 未保存</span>}
          </div>
          
          <div className="flex items-center gap-2">
            {mounted && currentPages.map((page) => (
              <button
                key={page.id}
                onClick={() => switchPage(page.id)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  page.id === project.currentPageId
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {page.name}
              </button>
            ))}
            {mounted && (
              <button
                onClick={newPage}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
          <div className="bg-white rounded-lg p-6 w-96">
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
    </>
  )
}


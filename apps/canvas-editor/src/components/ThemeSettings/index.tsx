'use client'

import React, { useState } from 'react'
import { useThemeStore, ThemeVariables } from '@/store/themeStore'
import { THEME_PRESETS } from '@/store/themeStore'

interface ThemeSettingsProps {
  onClose: () => void
}

export function ThemeSettings({ onClose }: ThemeSettingsProps) {
  const {
    currentTheme,
    currentPresetId,
    customThemes,
    isDarkMode,
    setPreset,
    updateThemeVariable,
    toggleDarkMode,
    saveCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
    resetTheme,
  } = useThemeStore()

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importJson, setImportJson] = useState('')

  const allPresets = [...THEME_PRESETS, ...customThemes]

  const handleColorChange = (key: keyof ThemeVariables, value: string) => {
    updateThemeVariable(key, value)
  }

  const handleSaveCustomTheme = () => {
    if (!saveName.trim()) return
    saveCustomTheme(saveName, saveDescription)
    setShowSaveModal(false)
    setSaveName('')
    setSaveDescription('')
  }

  const handleImportTheme = () => {
    try {
      importTheme(importJson)
      setShowImportModal(false)
      setImportJson('')
    } catch {
      alert('导入失败：主题格式不正确')
    }
  }

  const handleExportTheme = () => {
    const json = exportTheme()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `theme-${currentPresetId}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const colorGroups = [
    {
      title: '主色调',
      keys: ['primary', 'secondary', 'accent'] as const,
    },
    {
      title: '中性色',
      keys: ['background', 'surface', 'text', 'textSecondary', 'border'] as const,
    },
    {
      title: '功能色',
      keys: ['success', 'warning', 'error', 'info'] as const,
    },
    {
      title: '其他',
      keys: ['shadow', 'borderRadius', 'spacing'] as const,
    },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">主题设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'presets'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            预设主题
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'custom'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            自定义主题
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'presets' ? (
            <div>
              {/* 暗黑模式开关 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">暗黑模式</h3>
                    <p className="text-sm text-gray-500">切换深色主题</p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        isDarkMode ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 预设主题网格 */}
              <h3 className="font-medium text-gray-800 mb-4">选择预设主题</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setPreset(preset.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      currentPresetId === preset.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{preset.preview}</div>
                    <h4 className="font-medium text-sm text-gray-800 mb-1">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {preset.description}
                    </p>
                    {preset.id.startsWith('custom-') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`确定要删除自定义主题 "${preset.name}" 吗？`)) {
                            deleteCustomTheme(preset.id)
                          }
                        }}
                        className="mt-2 text-xs text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* 操作按钮 */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>💾</span>
                  <span>保存当前主题</span>
                </button>
                <button
                  onClick={handleExportTheme}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <span>📤</span>
                  <span>导出主题</span>
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <span>📥</span>
                  <span>导入主题</span>
                </button>
                <button
                  onClick={resetTheme}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <span>🔄</span>
                  <span>重置主题</span>
                </button>
              </div>

              {/* 颜色编辑器 */}
              {colorGroups.map((group) => (
                <div key={group.title} className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-4">{group.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.keys.map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={currentTheme[key].value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-12 h-12 rounded cursor-pointer border-0"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-800">
                            {currentTheme[key].description || key}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {currentTheme[key].value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>

      {/* 保存主题弹窗 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">保存自定义主题</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主题名称
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="输入主题名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主题描述
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="输入主题描述（可选）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCustomTheme}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入主题弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">导入主题</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                主题JSON
              </label>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-xs"
                rows={10}
                placeholder='{"presetId": "custom", "variables": {...}}'
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImportTheme}
                disabled={!importJson.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
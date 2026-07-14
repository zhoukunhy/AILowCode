'use client'

import React, { useState, useEffect } from 'react'

// 设置分类
interface SettingCategory {
  id: string
  name: string
  icon: string
}

// AI 配置接口
interface AIConfig {
  id: number
  name: string
  provider: string
  model?: string
  apiKey: string
  baseUrl?: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 设置分类
const categories: SettingCategory[] = [
  { id: 'general', name: '基本设置', icon: '⚙️' },
  { id: 'ai', name: 'AI 配置', icon: '🤖' },
  { id: 'security', name: '安全设置', icon: '🔒' },
  { id: 'notification', name: '通知设置', icon: '🔔' },
  { id: 'backup', name: '备份与恢复', icon: '💾' },
]

// API 基础地址
const API_BASE = 'http://localhost:3002/api'

// 获取认证头
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

// API 函数
async function fetchAIConfigs(): Promise<AIConfig[]> {
  const response = await fetch(`${API_BASE}/ai-config/llm`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取 AI 配置失败')
  const data = await response.json()
  return data.data || []
}

async function createAIConfig(data: {
  name: string
  provider: string
  model?: string
  apiKey: string
  baseUrl?: string
  config?: Record<string, any>
  isActive?: boolean
}): Promise<AIConfig> {
  const response = await fetch(`${API_BASE}/ai-config/llm`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('创建 AI 配置失败')
  const result = await response.json()
  return result.data || result
}

async function updateAIConfig(
  id: number,
  data: {
    name?: string
    model?: string
    apiKey?: string
    baseUrl?: string
    config?: Record<string, any>
    isActive?: boolean
  }
): Promise<void> {
  const response = await fetch(`${API_BASE}/ai-config/llm/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('更新 AI 配置失败')
}

async function deleteAIConfig(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/ai-config/llm/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('删除 AI 配置失败')
}

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('general')
  const [saved, setSaved] = useState(false)

  // 通用设置表单
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'CanvasCode',
    siteDescription: 'AI 智能低代码画布平台',
    logoUrl: '',
    contactEmail: 'admin@example.com',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
  })

  // AI 配置
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([])
  const [showCreateAIConfigModal, setShowCreateAIConfigModal] = useState(false)
  const [editingAIConfig, setEditingAIConfig] = useState<AIConfig | null>(null)
  const [aiConfigForm, setAiConfigForm] = useState({
    name: '',
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    baseUrl: '',
    isActive: true,
  })
  const [aiConfigLoading, setAiConfigLoading] = useState(false)

  // 安全设置表单
  const [securitySettings, setSecuritySettings] = useState({
    requireMFA: true,
    sessionTimeout: 30,
    passwordMinLength: 8,
    allowRegister: false,
    maxLoginAttempts: 5,
    enableAuditLog: true,
  })

  // 加载 AI 配置
  useEffect(() => {
    if (activeCategory === 'ai') {
      loadAIConfigs()
    }
  }, [activeCategory])

  const loadAIConfigs = async () => {
    try {
      setAiConfigLoading(true)
      const data = await fetchAIConfigs()
      setAiConfigs(data)
    } catch (error) {
      console.error('加载 AI 配置失败:', error)
    } finally {
      setAiConfigLoading(false)
    }
  }

  // 打开创建 AI 配置弹窗
  const handleOpenCreateAIConfigModal = () => {
    setAiConfigForm({
      name: '',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: '',
      baseUrl: '',
      isActive: true,
    })
    setEditingAIConfig(null)
    setShowCreateAIConfigModal(true)
  }

  // 打开编辑 AI 配置弹窗
  const handleOpenEditAIConfigModal = (config: AIConfig) => {
    setAiConfigForm({
      name: config.name,
      provider: config.provider,
      model: config.model || 'gpt-4',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || '',
      isActive: config.isActive,
    })
    setEditingAIConfig(config)
    setShowCreateAIConfigModal(true)
  }

  // 创建/更新 AI 配置
  const handleSaveAIConfig = async () => {
    try {
      if (editingAIConfig) {
        await updateAIConfig(editingAIConfig.id, {
          name: aiConfigForm.name,
          model: aiConfigForm.model,
          apiKey: aiConfigForm.apiKey,
          baseUrl: aiConfigForm.baseUrl || undefined,
          isActive: aiConfigForm.isActive,
        })
        setAiConfigs(
          aiConfigs.map((config) =>
            config.id === editingAIConfig.id
              ? {
                  ...config,
                  name: aiConfigForm.name,
                  model: aiConfigForm.model,
                  apiKey: aiConfigForm.apiKey,
                  baseUrl: aiConfigForm.baseUrl,
                  isActive: aiConfigForm.isActive,
                }
              : config
          )
        )
      } else {
        const newConfig = await createAIConfig({
          name: aiConfigForm.name,
          provider: aiConfigForm.provider,
          model: aiConfigForm.model,
          apiKey: aiConfigForm.apiKey,
          baseUrl: aiConfigForm.baseUrl || undefined,
          isActive: aiConfigForm.isActive,
        })
        setAiConfigs([newConfig, ...aiConfigs])
      }
      setShowCreateAIConfigModal(false)
      setEditingAIConfig(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('保存 AI 配置失败:', error)
      alert('保存 AI 配置失败，请重试')
    }
  }

  // 删除 AI 配置
  const handleDeleteAIConfig = async (id: number, name: string) => {
    if (!confirm(`确定要删除 AI 配置 "${name}" 吗？`)) return
    try {
      await deleteAIConfig(id)
      setAiConfigs(aiConfigs.filter((config) => config.id !== id))
    } catch (error) {
      console.error('删除 AI 配置失败:', error)
      alert('删除 AI 配置失败，请重试')
    }
  }

  const handleSave = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
        <p className="text-gray-500 mt-1">配置系统各项参数</p>
      </div>

      <div className="flex gap-6">
        {/* 左侧分类导航 */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 右侧设置内容 */}
        <div className="flex-1">
          {/* 基本设置 */}
          {activeCategory === 'general' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">基本设置</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      系统名称
                    </label>
                    <input
                      type="text"
                      value={generalSettings.siteName}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      联系邮箱
                    </label>
                    <input
                      type="email"
                      value={generalSettings.contactEmail}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    系统描述
                  </label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      时区
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, timezone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                      <option value="America/New_York">America/New_York (UTC-5)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      语言
                    </label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, language: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                      <option value="ja-JP">日本語</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                {saved && (
                  <span className="text-green-600 text-sm">✓ 设置已保存</span>
                )}
                <button
                  onClick={handleSave}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存设置
                </button>
              </div>
            </div>
          )}

          {/* AI 配置 */}
          {activeCategory === 'ai' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">AI 配置</h2>
                <button
                  onClick={handleOpenCreateAIConfigModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>新建配置</span>
                </button>
              </div>

              {aiConfigLoading ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4 animate-spin">⏳</div>
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiConfigs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🤖</div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">暂无 AI 配置</h3>
                      <p className="text-gray-500 mb-4">创建您的第一个 AI 配置开始吧</p>
                      <button
                        onClick={handleOpenCreateAIConfigModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        新建配置
                      </button>
                    </div>
                  ) : (
                    aiConfigs.map((config) => (
                      <div
                        key={config.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium text-gray-800">{config.name}</h3>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {config.provider}
                              </span>
                              {config.isActive && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  已启用
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="text-gray-500">模型：</span>
                                {config.model || '-'}
                              </div>
                              <div>
                                <span className="text-gray-500">Base URL：</span>
                                {config.baseUrl || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditAIConfigModal(config)}
                              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteAIConfig(config.id, config.name)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 创建/编辑 AI 配置弹窗 */}
              {showCreateAIConfigModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      {editingAIConfig ? '编辑 AI 配置' : '新建 AI 配置'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          配置名称
                        </label>
                        <input
                          type="text"
                          value={aiConfigForm.name}
                          onChange={(e) => setAiConfigForm({ ...aiConfigForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="请输入配置名称"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          提供商
                        </label>
                        <select
                          value={aiConfigForm.provider}
                          onChange={(e) => setAiConfigForm({ ...aiConfigForm, provider: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="deepseek">DeepSeek</option>
                          <option value="qwen">通义千问</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          模型名称
                        </label>
                        <input
                          type="text"
                          value={aiConfigForm.model}
                          onChange={(e) => setAiConfigForm({ ...aiConfigForm, model: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="gpt-4"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={aiConfigForm.apiKey}
                          onChange={(e) => setAiConfigForm({ ...aiConfigForm, apiKey: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="请输入 API Key"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base URL（可选）
                        </label>
                        <input
                          type="text"
                          value={aiConfigForm.baseUrl}
                          onChange={(e) => setAiConfigForm({ ...aiConfigForm, baseUrl: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="https://api.openai.com/v1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={aiConfigForm.isActive}
                          onChange={(e) => setAiConfigForm({ ...aiConfigForm, isActive: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">启用此配置</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowCreateAIConfigModal(false)
                          setEditingAIConfig(null)
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveAIConfig}
                        disabled={!aiConfigForm.name.trim() || !aiConfigForm.apiKey.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {editingAIConfig ? '保存' : '创建'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 安全设置 */}
          {activeCategory === 'security' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">安全设置</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">双因素认证</p>
                    <p className="text-sm text-gray-500">要求用户登录时使用双因素认证</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.requireMFA}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireMFA: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会话超时时间（分钟）
                  </label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: Number(e.target.value),
                      })
                    }
                    className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密码最小长度
                  </label>
                  <input
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: Number(e.target.value),
                      })
                    }
                    className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">允许新用户注册</p>
                    <p className="text-sm text-gray-500">允许新用户自行注册账号</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.allowRegister}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          allowRegister: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大登录尝试次数
                  </label>
                  <input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: Number(e.target.value),
                      })
                    }
                    className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">审计日志</p>
                    <p className="text-sm text-gray-500">记录所有用户的操作日志</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.enableAuditLog}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          enableAuditLog: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                {saved && (
                  <span className="text-green-600 text-sm">✓ 设置已保存</span>
                )}
                <button
                  onClick={handleSave}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存设置
                </button>
              </div>
            </div>
          )}

          {/* 通知设置 */}
          {activeCategory === 'notification' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">通知设置</h2>
              <p className="text-gray-500">通知功能开发中...</p>
            </div>
          )}

          {/* 备份与恢复 */}
          {activeCategory === 'backup' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">备份与恢复</h2>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">自动备份</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    系统每天自动备份一次，备份数据保留 7 天
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    立即备份
                  </button>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-4">备份历史</h3>
                  <div className="space-y-2">
                    {[
                      { date: '2024-01-15 03:00', size: '256 MB' },
                      { date: '2024-01-14 03:00', size: '248 MB' },
                      { date: '2024-01-13 03:00', size: '242 MB' },
                    ].map((backup, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💾</span>
                          <div>
                            <p className="font-medium text-gray-800">{backup.date}</p>
                            <p className="text-sm text-gray-500">{backup.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            恢复
                          </button>
                          <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            下载
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
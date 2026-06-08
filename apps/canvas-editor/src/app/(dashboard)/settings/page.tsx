'use client'

import React, { useState } from 'react'

// 设置分类
interface SettingCategory {
  id: string
  name: string
  icon: string
}

// 设置分类
const categories: SettingCategory[] = [
  { id: 'general', name: '基本设置', icon: '⚙️' },
  { id: 'ai', name: 'AI 配置', icon: '🤖' },
  { id: 'security', name: '安全设置', icon: '🔒' },
  { id: 'notification', name: '通知设置', icon: '🔔' },
  { id: 'backup', name: '备份与恢复', icon: '💾' },
]

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

  // AI 设置表单
  const [aiSettings, setAiSettings] = useState({
    openaiApiKey: 'sk-*******',
    openaiModel: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.7,
    enableRAG: true,
    vectorDb: 'chroma',
    embeddingModel: 'text-embedding-ada-002',
  })

  // 安全设置表单
  const [securitySettings, setSecuritySettings] = useState({
    requireMFA: true,
    sessionTimeout: 30,
    passwordMinLength: 8,
    allowRegister: false,
    maxLoginAttempts: 5,
    enableAuditLog: true,
  })

  const handleSave = () => {
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
                      <option value="Asia/Shanghai"> Asia/Shanghai (UTC+8)</option>
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
              <h2 className="text-lg font-bold text-gray-800 mb-6">AI 配置</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={aiSettings.openaiApiKey}
                    onChange={(e) =>
                      setAiSettings({ ...aiSettings, openaiApiKey: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    用于调用 OpenAI GPT 模型，请妥善保管不要泄露
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI 模型
                    </label>
                    <select
                      value={aiSettings.openaiModel}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, openaiModel: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Embedding 模型
                    </label>
                    <select
                      value={aiSettings.embeddingModel}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, embeddingModel: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="text-embedding-ada-002">Ada</option>
                      <option value="text-embedding-3-small">Embedding V3 Small</option>
                      <option value="text-embedding-3-large">Embedding V3 Large</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最大 Token 数
                    </label>
                    <input
                      type="number"
                      value={aiSettings.maxTokens}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, maxTokens: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={aiSettings.temperature}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, temperature: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      向量数据库
                    </label>
                    <select
                      value={aiSettings.vectorDb}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, vectorDb: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="chroma">Chroma</option>
                      <option value="milvus">Milvus</option>
                      <option value="pinecone">Pinecone</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiSettings.enableRAG}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, enableRAG: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">启用 RAG 检索增强</span>
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

'use client'

import React, { useState } from 'react'
import { Database, Shield, Settings } from 'lucide-react'

export interface MySQLConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
  poolSize: number
  connectionTimeout: number
}

export interface MySQLConfigFormProps {
  initialConfig?: Partial<MySQLConfig>
  onSubmit: (config: MySQLConfig) => void
  onCancel: () => void
}

export function MySQLConfigForm({ initialConfig, onSubmit, onCancel }: MySQLConfigFormProps) {
  const [config, setConfig] = useState<MySQLConfig>({
    host: initialConfig?.host || 'localhost',
    port: initialConfig?.port || 3306,
    username: initialConfig?.username || '',
    password: initialConfig?.password || '',
    database: initialConfig?.database || '',
    ssl: initialConfig?.ssl || false,
    poolSize: initialConfig?.poolSize || 10,
    connectionTimeout: initialConfig?.connectionTimeout || 30000,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectResult, setConnectResult] = useState<'success' | 'error' | null>(null)

  const handleChange = (field: keyof MySQLConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setConnectResult(null)
  }

  const handleTestConnection = async () => {
    setIsConnecting(true)
    setConnectResult(null)

    try {
      const response = await fetch('/api/data-source/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mysql',
          config,
        }),
      })

      const result = await response.json()
      setConnectResult(result.success ? 'success' : 'error')
    } catch {
      setConnectResult('error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSubmit = () => {
    onSubmit(config)
  }

  return (
    <div className="space-y-4">
      {/* 连接信息 */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700 mb-3">
          <Database className="w-4 h-4" />
          <span className="text-sm font-medium">MySQL 连接配置</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">主机地址</label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => handleChange('host', e.target.value)}
              placeholder="localhost"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">端口</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => handleChange('port', parseInt(e.target.value) || 3306)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 认证信息 */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 text-green-700 mb-3">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">认证信息</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">用户名</label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="root"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={config.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="******"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-gray-600 mb-1">数据库名称</label>
          <input
            type="text"
            value={config.database}
            onChange={(e) => handleChange('database', e.target.value)}
            placeholder="database_name"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 高级配置 */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2 text-purple-700 mb-3">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">高级配置</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <input
                type="checkbox"
                checked={config.ssl}
                onChange={(e) => handleChange('ssl', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              SSL 连接
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">连接池大小</label>
            <input
              type="number"
              value={config.poolSize}
              onChange={(e) => handleChange('poolSize', parseInt(e.target.value) || 10)}
              min="1"
              max="100"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">连接超时(ms)</label>
            <input
              type="number"
              value={config.connectionTimeout}
              onChange={(e) => handleChange('connectionTimeout', parseInt(e.target.value) || 30000)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 测试连接 */}
      <div className="flex gap-3">
        <button
          onClick={handleTestConnection}
          disabled={isConnecting || !config.host || !config.database || !config.username}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
            isConnecting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              测试中...
            </>
          ) : (
            <>🔌 测试连接</>
          )}
        </button>

        {connectResult && (
          <div className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
            connectResult === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {connectResult === 'success' ? '✓ 连接成功' : '✗ 连接失败'}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!config.host || !config.database || !config.username}
          className={`flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors ${
            !config.host || !config.database || !config.username
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          }`}
        >
          保存配置
        </button>
      </div>
    </div>
  )
}
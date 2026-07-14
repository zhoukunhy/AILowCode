'use client'

import React, { useState, useEffect } from 'react'

interface LlmCallLog {
  id: string
  sessionId: string
  provider: string
  model: string
  prompt: string
  response: string
  status: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
  latency: number
  errorMessage?: string
  createdAt: string
}

interface RagRetrievalLog {
  id: string
  sessionId: string
  knowledgeBaseId: string
  query: string
  results: string[]
  status: string
  latency: number
  createdAt: string
}

interface AgentSession {
  id: string
  sessionId: string
  agentType: string
  input: string
  output: string
  status: string
  nodeExecutions: number
  latency: number
  createdAt: string
}

interface DashboardStats {
  totalLlmCalls: number
  totalRagRetrievals: number
  totalAgentSessions: number
  totalTokens: number
  avgLatency: number
  successRate: number
}

const API_BASE = 'http://localhost:3002/api/logging'

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

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取统计数据失败')
  const data = await response.json()
  return data.data || {
    totalLlmCalls: 0,
    totalRagRetrievals: 0,
    totalAgentSessions: 0,
    totalTokens: 0,
    avgLatency: 0,
    successRate: 0,
  }
}

async function fetchLlmCallLogs(page: number = 1, limit: number = 20): Promise<{ data: LlmCallLog[], total: number }> {
  const response = await fetch(`${API_BASE}/llm-calls?page=${page}&limit=${limit}`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取LLM调用日志失败')
  const data = await response.json()
  return {
    data: (data.data || []).map((item: any) => ({
      id: String(item.id),
      sessionId: item.sessionId || '-',
      provider: item.provider || '-',
      model: item.model || '-',
      prompt: item.prompt || '-',
      response: item.response || '-',
      status: item.status || '-',
      totalTokens: item.totalTokens || 0,
      promptTokens: item.promptTokens || 0,
      completionTokens: item.completionTokens || 0,
      latency: item.latency || 0,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '-',
    })),
    total: data.total || 0,
  }
}

async function fetchRagLogs(page: number = 1, limit: number = 20): Promise<{ data: RagRetrievalLog[], total: number }> {
  const response = await fetch(`${API_BASE}/rag-retrievals?page=${page}&limit=${limit}`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取RAG检索日志失败')
  const data = await response.json()
  return {
    data: (data.data || []).map((item: any) => ({
      id: String(item.id),
      sessionId: item.sessionId || '-',
      knowledgeBaseId: item.knowledgeBaseId || '-',
      query: item.query || '-',
      results: item.results || [],
      status: item.status || '-',
      latency: item.latency || 0,
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '-',
    })),
    total: data.total || 0,
  }
}

async function fetchAgentSessions(page: number = 1, limit: number = 20): Promise<{ data: AgentSession[], total: number }> {
  const response = await fetch(`${API_BASE}/agent-sessions?page=${page}&limit=${limit}`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('获取Agent会话日志失败')
  const data = await response.json()
  return {
    data: (data.data || []).map((item: any) => ({
      id: String(item.id),
      sessionId: item.sessionId || '-',
      agentType: item.agentType || '-',
      input: item.input || '-',
      output: item.output || '-',
      status: item.status || '-',
      nodeExecutions: item.nodeExecutions || 0,
      latency: item.latency || 0,
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '-',
    })),
    total: data.total || 0,
  }
}

async function cleanupLogs(days: number = 30): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/cleanup?days=${days}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) return { success: false, message: '清理失败' }
  const data = await response.json()
  return { success: true, message: data.msg || '清理成功' }
}

export default function LoggingPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'llm' | 'rag' | 'agent'>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [llmLogs, setLlmLogs] = useState<LlmCallLog[]>([])
  const [ragLogs, setRagLogs] = useState<RagRetrievalLog[]>([])
  const [agentLogs, setAgentLogs] = useState<AgentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [cleanupDays, setCleanupDays] = useState(30)
  const [cleanupResult, setCleanupResult] = useState<{ success?: boolean; message?: string } | null>(null)

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard()
    } else {
      loadLogs()
    }
  }, [activeTab, currentPage])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await fetchDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('加载仪表盘失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)
      let result: { data: any[], total: number } | null = null
      
      switch (activeTab) {
        case 'llm':
          result = await fetchLlmCallLogs(currentPage, 10)
          setLlmLogs(result.data)
          break
        case 'rag':
          result = await fetchRagLogs(currentPage, 10)
          setRagLogs(result.data)
          break
        case 'agent':
          result = await fetchAgentSessions(currentPage, 10)
          setAgentLogs(result.data)
          break
      }
      
      if (result) {
        setTotalPages(Math.ceil(result.total / 10))
      }
    } catch (error) {
      console.error('加载日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanup = async () => {
    try {
      const result = await cleanupLogs(cleanupDays)
      setCleanupResult(result)
      setTimeout(() => {
        setCleanupResult(null)
        setShowCleanupModal(false)
        loadDashboard()
      }, 2000)
    } catch (error) {
      console.error('清理日志失败:', error)
      setCleanupResult({ success: false, message: '清理失败' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-700'
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return '成功'
      case 'failed':
      case 'error':
        return '失败'
      case 'pending':
        return '进行中'
      default:
        return status
    }
  }

  const tabs = [
    { key: 'dashboard', label: '仪表盘' },
    { key: 'llm', label: 'LLM调用' },
    { key: 'rag', label: 'RAG检索' },
    { key: 'agent', label: 'Agent会话' },
  ] as const

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">日志管理</h1>
          <p className="text-gray-500 mt-1">查看系统运行日志和统计信息</p>
        </div>
        <button
          onClick={() => setShowCleanupModal(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <span>🗑️</span>
          <span>清理日志</span>
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setCurrentPage(1)
            }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : activeTab === 'dashboard' && stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-blue-600">{stats.totalLlmCalls}</div>
            <div className="text-sm text-gray-500 mt-1">LLM调用次数</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-purple-600">{stats.totalRagRetrievals}</div>
            <div className="text-sm text-gray-500 mt-1">RAG检索次数</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-green-600">{stats.totalAgentSessions}</div>
            <div className="text-sm text-gray-500 mt-1">Agent会话数</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-orange-600">{stats.totalTokens.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">累计Token消耗</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-cyan-600">{stats.avgLatency}ms</div>
            <div className="text-sm text-gray-500 mt-1">平均响应时间</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-pink-600">{(stats.successRate * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-500 mt-1">成功率</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {activeTab === 'llm' && (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">时间</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">提供商</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">模型</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Token</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">延迟</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">状态</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">提示词</th>
                </tr>
              </thead>
              <tbody>
                {llmLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-500">{log.createdAt}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{log.provider}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{log.model}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{log.totalTokens}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{log.latency}ms</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusLabel(log.status)}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <p className="text-sm text-gray-600 truncate max-w-sm" title={log.prompt}>
                        {log.prompt}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'rag' && (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">时间</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">知识库</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">查询</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">结果数</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">延迟</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody>
                {ragLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-500">{log.createdAt}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{log.knowledgeBaseId}</td>
                    <td className="py-3 px-6">
                      <p className="text-sm text-gray-600 truncate max-w-sm" title={log.query}>
                        {log.query}
                      </p>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">{log.results.length}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{log.latency}ms</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusLabel(log.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'agent' && (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">时间</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Agent类型</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">输入</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">节点数</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">延迟</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody>
                {agentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-500">{log.createdAt}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{log.agentType}</td>
                    <td className="py-3 px-6">
                      <p className="text-sm text-gray-600 truncate max-w-sm" title={log.input}>
                        {log.input}
                      </p>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">{log.nodeExecutions}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{log.latency}ms</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusLabel(log.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(llmLogs.length === 0 && activeTab === 'llm') ||
           (ragLogs.length === 0 && activeTab === 'rag') ||
           (agentLogs.length === 0 && activeTab === 'agent') ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">暂无日志记录</h3>
              <p className="text-gray-500">暂无相关日志数据</p>
            </div>
          ) : null}
        </div>
      )}

      {activeTab !== 'dashboard' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = currentPage <= 3 ? i + 1 : 
                        currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                        currentPage - 2 + i
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )
          })}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}

      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">清理过期日志</h3>
            <p className="text-gray-600 mb-4">将删除指定天数前的所有日志记录，此操作不可恢复。</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">保留最近天数</label>
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Math.max(1, parseInt(e.target.value) || 30))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                min="1"
              />
            </div>
            {cleanupResult ? (
              <div className={`mb-4 p-3 rounded-lg ${cleanupResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {cleanupResult.message}
              </div>
            ) : null}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCleanupModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCleanup}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                确认清理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
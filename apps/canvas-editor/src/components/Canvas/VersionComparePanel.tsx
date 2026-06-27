'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

interface VersionComparison {
  analysis: {
    totalChanges: number
    additions: number
    removals: number
    modifications: number
  }
  differences: VersionDifference[]
}

interface VersionDifference {
  id: string
  type: 'addition' | 'removal' | 'modification'
  componentId: string
  componentName: string
  property?: string
  oldValue?: any
  newValue?: any
  description: string
  path?: string
  severity?: 'low' | 'medium' | 'high'
}

interface VersionHistory {
  id: string
  version: string
  timestamp: Date
  description?: string
  author?: string
}

interface VersionComparePanelProps {
  versions: VersionHistory[]
  onSelectVersion: (version: VersionHistory) => void
  onRollback: (version: VersionHistory) => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function VersionComparePanel({ versions, onSelectVersion, onRollback }: VersionComparePanelProps) {
  const [selectedVersions, setSelectedVersions] = useState<[VersionHistory | null, VersionHistory | null]>([null, null])
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const currentPage = useCanvasStore((state) => state.currentPage)

  const handleCompare = useCallback(async () => {
    const [from, to] = selectedVersions
    if (!from || !to) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/pages/${currentPage.id}/versions/compare?versionId1=${parseInt(from.id)}&versionId2=${parseInt(to.id)}`, {
        method: 'GET',
        headers: getAuthHeader(),
      })

      if (!response.ok) {
        throw new Error('对比失败')
      }

      const result = await response.json()
      
      const differences = result.differences?.details || {}
      const summary = result.differences?.summary || { added: 0, removed: 0, modified: 0 }

      const convertedDifferences: VersionDifference[] = []
      
      ;(differences.added || []).forEach((comp: any, index: number) => {
        convertedDifferences.push({
          id: `add-${index}`,
          type: 'addition',
          componentId: comp.id,
          componentName: comp.type || '组件',
          description: `新增组件 ${comp.type}`,
          severity: 'low',
        })
      })
      
      ;(differences.removed || []).forEach((comp: any, index: number) => {
        convertedDifferences.push({
          id: `remove-${index}`,
          type: 'removal',
          componentId: comp.id,
          componentName: comp.type || '组件',
          description: `删除组件 ${comp.type}`,
          severity: 'medium',
        })
      })
      
      ;(differences.modified || []).forEach((item: any, index: number) => {
        convertedDifferences.push({
          id: `mod-${index}`,
          type: 'modification',
          componentId: item.id,
          componentName: item.newProps?.type || item.oldProps?.type || '组件',
          description: `修改组件 ${item.newProps?.type}`,
          severity: 'low',
        })
      })

      setComparison({
        analysis: {
          totalChanges: summary.added + summary.removed + summary.modified,
          additions: summary.added,
          removals: summary.removed,
          modifications: summary.modified,
        },
        differences: convertedDifferences,
      })
    } catch (error) {
      console.error('版本对比失败:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedVersions])

  const handleVersionSelect = (index: 0 | 1, version: VersionHistory) => {
    const newSelected = [...selectedVersions] as [VersionHistory | null, VersionHistory | null]
    newSelected[index] = version
    setSelectedVersions(newSelected)
    setComparison(null)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">版本对比</h3>
        <p className="mt-1 text-sm text-gray-500">选择两个版本进行对比分析</p>
      </div>

      <div className="p-4 border-b border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">源版本</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedVersions[0]?.id || ''}
            onChange={(e) => {
              const version = versions.find(v => v.id === e.target.value)
              if (version) handleVersionSelect(0, version)
            }}
          >
            <option value="">选择版本</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.version} - {new Date(v.timestamp).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">目标版本</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedVersions[1]?.id || ''}
            onChange={(e) => {
              const version = versions.find(v => v.id === e.target.value)
              if (version) handleVersionSelect(1, version)
            }}
          >
            <option value="">选择版本</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.version} - {new Date(v.timestamp).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCompare}
          disabled={!selectedVersions[0] || !selectedVersions[1] || loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '对比中...' : '开始对比'}
        </button>
      </div>

      {comparison && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="总变更" value={comparison.analysis.totalChanges} color="blue" />
            <StatCard label="新增" value={comparison.analysis.additions} color="green" />
            <StatCard label="删除" value={comparison.analysis.removals} color="red" />
            <StatCard label="修改" value={comparison.analysis.modifications} color="yellow" />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">变更详情</h4>
            <div className="space-y-2">
              {comparison.differences.map((diff) => (
                <DifferenceItem key={diff.id} difference={diff} />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => selectedVersions[0] && onRollback(selectedVersions[0])}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              回滚到源版本
            </button>
            <button
              onClick={() => selectedVersions[1] && onSelectVersion(selectedVersions[1])}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              应用目标版本
            </button>
          </div>
        </div>
      )}

      {!comparison && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">📊</p>
            <p className="text-sm">选择两个版本开始对比</p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'yellow' }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className={`px-3 py-2 rounded-lg text-center ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  )
}

function DifferenceItem({ difference }: { difference: VersionDifference }) {
  const typeIcons = {
    addition: '➕',
    removal: '➖',
    modification: '✏️',
  }

  const severityColors = {
    low: 'text-gray-400',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-lg">{typeIcons[difference.type]}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{difference.componentName}</span>
            <span className={`text-xs font-medium ${severityColors[difference.severity || 'low']}`}>
              {(difference.severity || 'low').toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{difference.description}</p>
        </div>
      </div>
    </div>
  )
}

export function VersionHistorySidebar() {
  const [versions, setVersions] = useState<VersionHistory[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const currentPage = useCanvasStore((state) => state.currentPage)

  const loadVersions = useCallback(async () => {
    if (!currentPage.id) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/pages/${currentPage.id}/versions`, {
        headers: getAuthHeader(),
      })

      if (response.ok) {
        const result = await response.json()
        const historyVersions: VersionHistory[] = result.list?.map((v: any) => ({
          id: v.id.toString(),
          version: v.version,
          timestamp: new Date(v.createdAt),
          description: v.description,
        })) || []
        setVersions(historyVersions)
      }
    } catch (error) {
      console.error('加载版本历史失败:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage.id])

  useEffect(() => {
    if (isOpen) {
      loadVersions()
    }
  }, [isOpen, loadVersions])

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-20 z-50 p-3 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        title="版本历史"
      >
        📜
      </button>

      {isOpen && (
        <div className="fixed right-4 top-32 w-96 h-[calc(100vh-10rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <VersionComparePanel
              versions={versions}
              onSelectVersion={(v) => console.log('选择版本:', v)}
              onRollback={(v) => console.log('回滚到:', v)}
            />
          )}
        </div>
      )}
    </>
  )
}

export default VersionHistorySidebar

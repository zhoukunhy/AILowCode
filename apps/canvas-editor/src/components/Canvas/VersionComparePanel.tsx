'use client'

import React, { useState, useCallback } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

// 本地模拟类型定义
interface VersionComparison {
  analysis: {
    totalChanges: number
    additions: number
    removals: number
    modifications: number
    breakingChanges: boolean
    codeQualityImprovement: boolean
    performanceImprovement: boolean
    criticalChanges: number
  }
  differences: VersionDifference[]
  suggestions: VersionSuggestion[]
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

interface VersionSuggestion {
  id: string
  type: 'optimization' | 'warning' | 'error'
  message: string
  severity: 'low' | 'medium' | 'high'
  action?: 'accept' | 'review' | 'validate' | 'update' | 'manual'
  description?: string
  automated?: boolean
}

interface PageVersionSnapshot {
  id: string
  pageId: string
  version: string
  timestamp: Date
  pageSchema: any
  metadata: Record<string, any>
}

// 模拟版本对比服务
const createVersionCompareService = () => ({
  compare: async (_from: PageVersionSnapshot, _to: PageVersionSnapshot): Promise<VersionComparison> => {
    // 模拟对比结果
    return {
      analysis: {
        totalChanges: Math.floor(Math.random() * 10) + 1,
        additions: Math.floor(Math.random() * 5),
        removals: Math.floor(Math.random() * 3),
        modifications: Math.floor(Math.random() * 4),
        breakingChanges: Math.random() > 0.7,
        codeQualityImprovement: Math.random() > 0.5,
        performanceImprovement: Math.random() > 0.5,
        criticalChanges: Math.floor(Math.random() * 2),
      },
      differences: [
        {
          id: '1',
          type: 'addition' as const,
          componentId: 'comp-1',
          componentName: '新增按钮组件',
          description: '添加了一个新的提交按钮',
        },
        {
          id: '2',
          type: 'modification' as const,
          componentId: 'comp-2',
          componentName: '表格组件',
          property: 'columns',
          description: '修改了列配置',
        },
        {
          id: '3',
          type: 'removal' as const,
          componentId: 'comp-3',
          componentName: '旧的搜索框',
          description: '移除了过时的搜索组件',
        },
      ],
      suggestions: [
        {
          id: 's1',
          type: 'optimization' as const,
          message: '建议将按钮样式提取为全局样式变量',
          severity: 'low' as const,
        },
        {
          id: 's2',
          type: 'warning' as const,
          message: '表格列过多可能影响移动端显示',
          severity: 'medium' as const,
        },
      ],
    }
  },
  getChangeSummary: (comparison: VersionComparison) => {
    return `检测到 ${comparison.analysis.totalChanges} 个变更`
  },
})

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

/**
 * 版本对比面板
 */
export function VersionComparePanel({ versions, onSelectVersion, onRollback }: VersionComparePanelProps) {
  const [selectedVersions, setSelectedVersions] = useState<[VersionHistory | null, VersionHistory | null]>([null, null])
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentPage, components } = useCanvasStore()

  const versionService = createVersionCompareService()

  // 选择版本对比
  const handleCompare = useCallback(async () => {
    const [from, to] = selectedVersions
    if (!from || !to) return

    setLoading(true)
    try {
      // 创建当前版本的快照
      const currentSnapshot: PageVersionSnapshot = {
        id: 'current',
        pageId: currentPage.id,
        version: 'current',
        timestamp: new Date(),
        pageSchema: {
          page: currentPage,
          components,
        },
        metadata: {},
      }

      // 创建历史版本快照（这里需要从后端获取实际数据）
      const historySnapshot: PageVersionSnapshot = {
        id: from.id,
        pageId: currentPage.id,
        version: from.version,
        timestamp: from.timestamp,
        pageSchema: {}, // 实际应该从后端获取
        metadata: {},
      }

      // 执行对比
      const result = await versionService.compare(historySnapshot, currentSnapshot)
      setComparison(result)
    } catch (error) {
      console.error('版本对比失败:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedVersions, currentPage, components, versionService])

  // 选择版本
  const handleVersionSelect = (index: 0 | 1, version: VersionHistory) => {
    const newSelected = [...selectedVersions] as [VersionHistory | null, VersionHistory | null]
    newSelected[index] = version
    setSelectedVersions(newSelected)
    setComparison(null)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">版本对比</h3>
        <p className="mt-1 text-sm text-gray-500">选择两个版本进行对比分析</p>
      </div>

      {/* 版本选择 */}
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

      {/* 对比结果 */}
      {comparison && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="总变更" value={comparison.analysis.totalChanges} color="blue" />
            <StatCard label="新增" value={comparison.analysis.additions} color="green" />
            <StatCard label="删除" value={comparison.analysis.removals} color="red" />
            <StatCard label="修改" value={comparison.analysis.modifications} color="yellow" />
          </div>

          {/* 分析结果 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI 分析</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {comparison.analysis.breakingChanges && (
                <p className="text-red-600 font-medium">⚠️ 存在破坏性变更</p>
              )}
              {comparison.analysis.codeQualityImprovement && (
                <p className="text-green-600">✓ 代码质量有所提升</p>
              )}
              {comparison.analysis.performanceImprovement && (
                <p className="text-green-600">✓ 性能有所优化</p>
              )}
              {comparison.analysis.criticalChanges > 0 && (
                <p className="text-orange-600">⚠️ {comparison.analysis.criticalChanges} 个重大变更</p>
              )}
            </div>
          </div>

          {/* 变更列表 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">变更详情</h4>
            <div className="space-y-2">
              {comparison.differences.map((diff) => (
                <DifferenceItem key={diff.id} difference={diff} />
              ))}
            </div>
          </div>

          {/* AI 建议 */}
          {comparison.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">AI 优化建议</h4>
              <div className="space-y-2">
                {comparison.suggestions.map((suggestion) => (
                  <SuggestionItem key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
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

      {/* 空状态 */}
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

/**
 * 统计卡片
 */
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

/**
 * 变更项
 */
function DifferenceItem({ difference }: { difference: VersionDifference }) {
  const typeIcons = {
    addition: '➕',
    removal: '➖',
    modification: '✏️',
    move: '📦',
  }

  const severityColors = {
    low: 'text-gray-400',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-lg">{typeIcons[difference.type]}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{difference.path}</span>
            <span className={`text-xs font-medium ${severityColors[difference.severity || 'low']}`}>
              {(difference.severity || 'low').toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{difference.description}</p>
          {difference.oldValue !== undefined && difference.newValue !== undefined && (
            <div className="mt-2 flex gap-2 text-xs">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                - {JSON.stringify(difference.oldValue)}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                + {JSON.stringify(difference.newValue)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 建议项
 */
function SuggestionItem({ suggestion }: { suggestion: VersionSuggestion }) {
  const actionColors = {
    accept: 'bg-green-100 text-green-700',
    review: 'bg-yellow-100 text-yellow-700',
    validate: 'bg-blue-100 text-blue-700',
    update: 'bg-purple-100 text-purple-700',
    manual: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-start gap-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[suggestion.action || 'review']}`}>
          {(suggestion.action || 'review').toUpperCase()}
        </span>
        <div className="flex-1">
          <p className="text-sm text-gray-700">{suggestion.description}</p>
          {suggestion.automated && (
            <span className="text-xs text-green-600 mt-1">✓ 可自动处理</span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 版本历史侧边栏
 */
export function VersionHistorySidebar() {
  const [versions] = useState<VersionHistory[]>([
    { id: '1', version: 'v1.0.0', timestamp: new Date('2024-01-15'), author: '开发者1' },
    { id: '2', version: 'v1.1.0', timestamp: new Date('2024-01-20'), author: '开发者1' },
    { id: '3', version: 'v1.2.0', timestamp: new Date('2024-01-25'), author: '开发者2' },
  ])

  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-20 z-50 p-3 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        title="版本历史"
      >
        📜
      </button>

      {/* 侧边栏 */}
      {isOpen && (
        <div className="fixed right-4 top-32 w-96 h-[calc(100vh-10rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
          <VersionComparePanel
            versions={versions}
            onSelectVersion={(v) => console.log('选择版本:', v)}
            onRollback={(v) => console.log('回滚到:', v)}
          />
        </div>
      )}
    </>
  )
}

export default VersionHistorySidebar

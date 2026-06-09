'use client'

import React from 'react'
import { useWorkflowStore } from '@/store/workflowStore'

const conditionOperators = [
  { value: '==', label: '等于 (==)' },
  { value: '!=', label: '不等于 (!=)' },
  { value: '>', label: '大于 (>)' },
  { value: '<', label: '小于 (<)' },
  { value: '>=', label: '大于等于 (>=)' },
  { value: '<=', label: '小于等于 (<=)' },
  { value: 'contains', label: '包含' },
  { value: 'in', label: '在列表中' },
]

export function ConfigPanel() {
  const {
    nodes,
    transitions,
    selectedNodeId,
    selectedTransitionId,
    updateNode,
    removeNode,
    updateTransition,
    removeTransition,
    selectNode,
    selectTransition,
  } = useWorkflowStore()

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedTransition = transitions.find((t) => t.id === selectedTransitionId)

  if (!selectedNode && !selectedTransition) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">属性配置</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-gray-400 text-center">选择节点或连接线以编辑属性</p>
        </div>
      </div>
    )
  }

  if (selectedNode && selectedNodeId) {
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNode(selectedNodeId, { name: e.target.value })
    }

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNode(selectedNodeId, { description: e.target.value })
    }

    const handleConfigChange = (key: string, value: any) => {
      const newConfig = { ...selectedNode.config, [key]: value }
      updateNode(selectedNodeId, { config: newConfig })
    }

    const handleDelete = () => {
      if (confirm('确定要删除此节点吗？')) {
        removeNode(selectedNodeId)
      }
    }

    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">节点属性</h2>
          <button
            onClick={() => selectNode(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">节点类型</label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
              {selectedNode.type}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">节点名称</label>
            <input
              type="text"
              value={selectedNode.name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={selectedNode.description || ''}
              onChange={handleDescriptionChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {selectedNode.type === 'approve' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">审批人</label>
              <input
                type="text"
                value={selectedNode.config?.approver || ''}
                onChange={(e) => handleConfigChange('approver', e.target.value)}
                placeholder="输入审批人姓名或角色"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {selectedNode.type === 'condition' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">条件字段</label>
                <input
                  type="text"
                  value={selectedNode.config?.conditionField || ''}
                  onChange={(e) => handleConfigChange('conditionField', e.target.value)}
                  placeholder="如: amount, status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">条件值</label>
                <input
                  type="text"
                  value={selectedNode.config?.conditionValue || ''}
                  onChange={(e) => handleConfigChange('conditionValue', e.target.value)}
                  placeholder="条件判断的值"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {selectedNode.type === 'action' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">动作类型</label>
              <select
                value={selectedNode.config?.actionType || ''}
                onChange={(e) => handleConfigChange('actionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">选择动作类型</option>
                <option value="sendEmail">发送邮件</option>
                <option value="sendSms">发送短信</option>
                <option value="callApi">调用API</option>
                <option value="updateData">更新数据</option>
              </select>
              {selectedNode.config?.actionType && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    已选择: {selectedNode.config.actionType}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              删除节点
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedTransition && selectedTransitionId) {
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTransition(selectedTransitionId, { label: e.target.value })
    }

    const handleConditionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const currentCondition = selectedTransition.condition || { type: 'expression', value: '' }
      updateTransition(selectedTransitionId, {
        condition: { ...currentCondition, type: e.target.value as any },
      })
    }

    const handleConditionValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const currentCondition = selectedTransition.condition || { type: 'expression', value: '' }
      updateTransition(selectedTransitionId, {
        condition: { ...currentCondition, value: e.target.value },
      })
    }

    const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const currentCondition = selectedTransition.condition || { type: 'expression', value: '' }
      updateTransition(selectedTransitionId, {
        condition: { ...currentCondition, operator: e.target.value as any },
      })
    }

    const handleCompareValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const currentCondition = selectedTransition.condition || { type: 'expression', value: '' }
      updateTransition(selectedTransitionId, {
        condition: { ...currentCondition, compareValue: e.target.value },
      })
    }

    const handleDelete = () => {
      if (confirm('确定要删除此连接线吗？')) {
        removeTransition(selectedTransitionId)
      }
    }

    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">流转规则</h2>
          <button
            onClick={() => selectTransition(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
            <input
              type="text"
              value={selectedTransition.label || ''}
              onChange={handleLabelChange}
              placeholder="输入流转标签（如：是/否）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">条件配置</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">条件类型</label>
              <select
                value={selectedTransition.condition?.type || 'expression'}
                onChange={handleConditionTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="expression">表达式</option>
                <option value="script">脚本</option>
                <option value="data">数据条件</option>
              </select>
            </div>

            {(selectedTransition.condition?.type === 'expression' || !selectedTransition.condition) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">字段</label>
                  <input
                    type="text"
                    value={selectedTransition.condition?.value || ''}
                    onChange={handleConditionValueChange}
                    placeholder="如: amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">操作符</label>
                  <select
                    value={selectedTransition.condition?.operator || '=='}
                    onChange={handleOperatorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {conditionOperators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">比较值</label>
                  <input
                    type="text"
                    value={selectedTransition.condition?.compareValue || ''}
                    onChange={handleCompareValueChange}
                    placeholder="条件值"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {selectedTransition.condition?.type === 'script' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">脚本代码</label>
                <textarea
                  value={selectedTransition.condition?.value || ''}
                  onChange={handleConditionValueChange}
                  rows={4}
                  placeholder="// JavaScript 表达式\nreturn data.amount > 1000;"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                />
              </div>
            )}

            {selectedTransition.condition?.type === 'data' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">数据源</label>
                <input
                  type="text"
                  value={selectedTransition.condition?.value || ''}
                  onChange={handleConditionValueChange}
                  placeholder="数据源ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              删除连接线
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
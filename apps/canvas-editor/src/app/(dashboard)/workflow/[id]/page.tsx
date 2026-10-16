'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { NodePalette } from '@/components/Workflow/NodePalette'
import { WorkflowCanvas } from '@/components/Workflow/WorkflowCanvas'
import { ConfigPanel } from '@/components/Workflow/ConfigPanel'
import { useWorkflowStore } from '@/store/workflowStore'
import { apiClient as api } from '@/lib/api'

export default function WorkflowEditorPage() {
  const params = useParams<{ id: string }>()
  const { loadProcess, clearWorkflow, nodes, transitions, currentProcess } = useWorkflowStore()
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', status: 'draft' })

  useEffect(() => {
    if (params.id === 'new') {
      clearWorkflow()
      setLoading(false)
      return
    }

    const fetchProcess = async () => {
      try {
        const res = await api.get(`/workflow/processes/${params.id}/detail`)
        const response = res as unknown as { data?: any }
        if (response?.data) {
          loadProcess(response.data)
        }
      } catch (error) {
        console.error('Failed to load process:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProcess()
  }, [params.id, loadProcess, clearWorkflow])

  // 点击保存按钮：打开弹窗并预填当前流程信息
  const handleSave = () => {
    if (!currentProcess && nodes.length === 0) {
      setSaveStatus('请先添加节点')
      setTimeout(() => setSaveStatus(''), 3000)
      return
    }

    setForm({
      name: currentProcess?.name || '',
      description: currentProcess?.description || '',
      status: currentProcess?.status || 'draft',
    })
    setShowSaveModal(true)
  }

  // 弹窗确认：执行保存（processDefinitionId 由后端自动生成，前端不发送）
  const handleConfirmSave = async () => {
    if (!form.name.trim()) {
      setSaveStatus('请输入流程名称')
      setTimeout(() => setSaveStatus(''), 3000)
      return
    }

    try {
      setSaving(true)
      setSaveStatus('保存中...')

      const processData = {
        id: currentProcess?.id,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        creatorId: '1',
        nodes: nodes.map(({ processDefinitionId: _pid, ...rest }) => rest),
        transitions: transitions.map((t) => {
          // 后端返回的流转实体运行时可能带 processDefinitionId，统一剔除
          const { processDefinitionId: _pid, ...rest } = t as typeof t & { processDefinitionId?: string }
          return rest
        }),
      }

      const res = await api.post('/workflow/processes/save', processData)
      const response = res as unknown as { data?: any }
      if (response?.data) {
        loadProcess(response.data)
      }

      setSaveStatus('保存成功')
      setShowSaveModal(false)
    } catch {
      setSaveStatus('保存失败')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  const handleValidate = async () => {
    if (!currentProcess?.id) {
      setSaveStatus('请先保存流程')
      setTimeout(() => setSaveStatus(''), 3000)
      return
    }

    try {
      const res = await api.post(`/workflow/processes/${currentProcess.id}/validate`, {})
      const response = res as unknown as { data?: { valid?: boolean; errors?: string[] } }
      if (response?.data?.valid) {
        setSaveStatus('验证通过')
      } else {
        const errors = response?.data?.errors?.join('; ') || '验证失败'
        setSaveStatus(`验证失败: ${errors}`)
      }
    } catch {
      setSaveStatus('验证失败')
    } finally {
      setTimeout(() => setSaveStatus(''), 5000)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <NodePalette />
      
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">
              {currentProcess?.name || '流程编辑器'}
            </h1>
            {currentProcess?.status && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                currentProcess.status === 'active' ? 'bg-green-100 text-green-700' :
                currentProcess.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {currentProcess.status === 'active' ? '已启用' :
                 currentProcess.status === 'inactive' ? '已禁用' : '草稿'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className={`text-sm ${
                saveStatus.includes('成功') ? 'text-green-600' :
                saveStatus.includes('失败') ? 'text-red-600' : 'text-blue-600'
              }`}>
                {saveStatus}
              </span>
            )}
            <button
              onClick={handleValidate}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              验证流程
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              保存流程
            </button>
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden">
          <WorkflowCanvas />
        </div>
      </div>
      
      <ConfigPanel />

      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-96 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">保存流程</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  流程名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入流程名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">流程描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="请输入流程描述（可选）"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">草稿</option>
                  <option value="active">启用</option>
                  <option value="inactive">禁用</option>
                </select>
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
                onClick={handleConfirmSave}
                disabled={saving || !form.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
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

  const handleSave = async () => {
    if (!currentProcess && nodes.length === 0) {
      setSaveStatus('请先添加节点')
      setTimeout(() => setSaveStatus(''), 3000)
      return
    }

    try {
      setSaveStatus('保存中...')
      
      const processData = {
        id: currentProcess?.id,
        name: currentProcess?.name || '未命名流程',
        description: currentProcess?.description,
        status: currentProcess?.status || 'draft',
        creatorId: '1',
        nodes,
        transitions,
      }

      await api.post('/workflow/processes/save', processData)
      setSaveStatus('保存成功')
    } catch {
      setSaveStatus('保存失败')
    } finally {
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
    </div>
  )
}
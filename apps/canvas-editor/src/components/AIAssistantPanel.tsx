'use client'

import React, { useState, useCallback } from 'react'
import { Send, Sparkles, Loader2, CheckCircle, XCircle, MessageSquare, AlertCircle } from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { agentApi } from '@/lib/api'

interface Message {
  id: string
  type: 'user' | 'agent' | 'system' | 'error'
  content: string
  timestamp: Date
  status?: 'pending' | 'success' | 'error'
  details?: any
}

export function AIAssistantPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: '您好！我是AI页面生成助手。请用自然语言描述您想要创建的页面，我会帮您自动生成。\n\n例如：\n- 创建一个用户管理页面，包含表格和搜索框\n- 设计一个登录表单页面\n- 生成一个数据统计仪表盘',
      timestamp: new Date(),
    },
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  
  const newPage = useCanvasStore((state) => state.newPage)
  const importCanvasSchema = useCanvasStore((state) => state.importCanvasSchema)

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const extractPageName = (input: string): string | undefined => {
    const patterns = [
      /创建一个?(.*?)页面/i,
      /生成一个?(.*?)页面/i,
      /设计一个?(.*?)页面/i,
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    return undefined
  }

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage: Message = {
      id: generateId(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsGenerating(true)

    const agentMessage: Message = {
      id: generateId(),
      type: 'agent',
      content: '',
      timestamp: new Date(),
      status: 'pending',
    }
    setMessages(prev => [...prev, agentMessage])

    try {
      // 调用后端 AI 生成页面 API
      const response = await agentApi.generatePage(inputValue)
      
      if (response.success && response.schema) {
        // 创建新页面并导入 Schema
        newPage()
        
        // 提取页面名称
        const pageName = extractPageName(inputValue) || 'AI生成页面'
        
        // 导入生成的 Schema 到画布
        importCanvasSchema(response.schema)

        // 更新消息状态
        setMessages(prev => prev.map(msg => 
          msg.id === agentMessage.id 
            ? { ...msg, content: `已成功创建页面 "${pageName}"！\n\n生成了 ${response.schema.children?.length || 0} 个组件`, status: 'success' }
            : msg
        ))

        setMessages(prev => [...prev, {
          id: generateId(),
          type: 'system',
          content: '页面已创建！您可以在画布中继续编辑和调整组件布局。',
          timestamp: new Date(),
        }])
      } else {
        throw new Error(response.error || '生成失败')
      }
    } catch (error: any) {
      console.error('AI 生成页面失败:', error)
      setMessages(prev => prev.map(msg => 
        msg.id === agentMessage.id 
          ? { ...msg, content: `生成失败: ${error.message || '未知错误'}`, status: 'error' }
          : msg
      ))
      
      setMessages(prev => [...prev, {
        id: generateId(),
        type: 'error',
        content: '建议检查：\n1. 后端服务是否正常运行\n2. LLM API 配置是否正确\n3. 网络连接是否正常',
        timestamp: new Date(),
      }])
    } finally {
      setIsGenerating(false)
    }
  }, [inputValue, isGenerating, newPage, importCanvasSchema])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getMessageStyle = (message: Message) => {
    switch (message.type) {
      case 'user':
        return 'bg-blue-100 ml-auto max-w-[85%]'
      case 'system':
        return 'bg-gray-100 text-sm text-gray-600 italic'
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500 text-red-700'
      default:
        return 'bg-white border border-gray-200'
    }
  }

  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${isExpanded ? 'w-80' : 'w-12'}`}>
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        {isExpanded ? (
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-5 h-5" />
            AI 助手
          </span>
        ) : (
          <Sparkles className="w-5 h-5 mx-auto" />
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          {isExpanded ? (
            <span className="text-sm">◀</span>
          ) : (
            <MessageSquare className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${getMessageStyle(message)}`}
              >
                <div className="flex items-start gap-2">
                  {message.type === 'agent' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                      AI
                    </div>
                  )}
                  {message.type === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.type === 'agent' && message.status && (
                      <div className="flex items-center gap-1 mt-1">
                        {message.status === 'pending' && (
                          <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        )}
                        {message.status === 'success' && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                        {message.status === 'error' && (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className="text-xs text-gray-400">
                          {message.status === 'pending' ? '生成中...' : 
                           message.status === 'success' ? '成功' : '失败'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述您想要创建的页面..."
                disabled={isGenerating}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isGenerating}
                className={`p-2 rounded-lg transition-colors ${
                  inputValue.trim() && !isGenerating
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
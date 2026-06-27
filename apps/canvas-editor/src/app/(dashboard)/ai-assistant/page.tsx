'use client'

import React, { useState, useRef, useEffect } from 'react'

// 消息类型
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 快捷问题
const quickQuestions = [
  '如何创建一个表单页面？',
  '如何添加数据验证？',
  '如何连接数据库？',
  '如何部署项目？',
  '如何使用组件库？',
]

// API 基础地址
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是您的 AI 助手，请问有什么可以帮助您的？',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/agent/generate-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: inputValue.trim(),
          projectId: 1,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.schema ? `页面生成完成！\n\n已生成组件数量: ${data.schema.components?.length || 0}\n\n您可以在画布中查看生成的结果。` : '抱歉，我无法处理您的请求。',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error('API 请求失败')
      }
    } catch (error) {
      // 模拟AI响应作为后备
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `这是针对您问题 "${inputValue.trim()}" 的回答。\n\n我可以帮助您：\n\n1. 创建和编辑页面组件\n2. 配置数据源和API连接\n3. 实现表单验证逻辑\n4. 优化代码性能\n5. 解答技术问题\n\n请问您需要具体了解哪方面？`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 快捷问题点击
  const handleQuickQuestion = (question: string) => {
    setInputValue(question)
  }

  // 按键处理
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">🤖 AI 助手</h1>
        <p className="text-sm text-gray-500 mt-1">智能辅助开发，提升工作效率</p>
      </div>

      {/* 快捷问题 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <p className="text-sm text-gray-500 mb-2">快速提问：</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题，按 Enter 发送..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                isLoading || !inputValue.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  思考中...
                </span>
              ) : (
                <span>发送</span>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            支持 Shift + Enter 换行
          </p>
        </div>
      </div>
    </div>
  )
}
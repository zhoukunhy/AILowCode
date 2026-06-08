'use client'

import React, { useState } from 'react'

// Agent 类型定义
interface AgentType {
  id: string
  label: string
  icon: string
  description: string
  features: string[]
}

// Agent 功能状态
interface AgentFeature {
  id: string
  label: string
  status: 'completed' | 'pending' | 'processing'
  result?: string
}

// Agent 配置
const agentTypes: AgentType[] = [
  {
    id: 'ai2-page-gen',
    label: 'AI2 页面生成规划',
    icon: '🎯',
    description: 'LangGraph状态机工作流：需求解析→RAG召回→Schema生成→格式校验→输出画布JSON',
    features: [
      'AI2-1: 用户自然语言描述页面需求',
      'AI2-2: Agent自动路由RAG节点，检索项目历史页面、组件规范',
      'AI2-3: LLM生成标准化CanvasSchema，自检JSON格式，格式错误自动循环修正',
      'AI2-4: 合规JSON返回前端，画布自动渲染完整页面；全流程会话日志入库',
    ],
  },
  {
    id: 'ai3-tool-call',
    label: 'AI3 工具调用',
    icon: '🔧',
    description: 'LangGraph工具调用Agent（三大内置工具：Zod结构化定义）',
    features: [
      'AI3-工具1: SQL_DDL工具：根据业务字段描述自动生成PG建表语句并执行建表',
      'AI3-工具2: Nest_Crud工具：自动生成对应CRUD接口，写入数据源配置',
      'AI3-工具3: Http_Test工具：自动发起接口测试，校验数据源连通',
      'AI3-1: 用户描述业务字段→Agent自主决策调用工具→自动建表+生成接口+组件自动绑定数据源',
    ],
  },
  {
    id: 'ai4-error-fix',
    label: 'AI4 智能排错',
    icon: '🔍',
    description: 'LangGraph智能排错Agent',
    features: [
      'AI4-1: 画布数据源报错/接口异常时，自动收集报错堆栈',
      'AI4-2: RAG检索项目故障知识库，同类报错解决方案',
      'AI4-3: Agent生成修复建议，前端弹窗展示；解决方案自动入库扩充知识库',
    ],
  },
  {
    id: 'ai5-openapi',
    label: 'AI5 OpenAPI解析',
    icon: '📄',
    description: 'OpenAPI智能解析Agent',
    features: [
      'AI5-1: 用户导入OpenAPI文档，LangGraph解析接口信息',
      'AI5-2: 自动生成数据源配置+画布列表页面，一键完成接口接入',
    ],
  },
]

// 预设模板
const presets = [
  { id: 'user-page', label: '用户管理页面', description: '创建带筛选分页的用户管理页，包含新增弹窗' },
  { id: 'product-list', label: '商品列表页面', description: '商品列表展示，支持搜索、筛选、排序功能' },
  { id: 'order-form', label: '订单表单页面', description: '订单创建表单，包含商品选择、价格计算' },
  { id: 'dashboard', label: '数据仪表盘', description: '数据统计仪表盘，包含图表和关键指标' },
]

export default function AiCodegenPage() {
  const [selectedAgent, setSelectedAgent] = useState('ai2-page-gen')
  const [inputPrompt, setInputPrompt] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [agentFeatures, setAgentFeatures] = useState<AgentFeature[]>([])
  const [workflowSteps, setWorkflowSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  // 初始化 Agent 功能状态
  const initializeAgentFeatures = (agentId: string) => {
    const agent = agentTypes.find((a) => a.id === agentId)
    if (!agent) return

    const features: AgentFeature[] = agent.features.map((feature, index) => ({
      id: `${agentId}-feature-${index}`,
      label: feature,
      status: 'pending',
    }))
    setAgentFeatures(features)
    setWorkflowSteps([])
    setCurrentStep(0)
  }

  // 选择 Agent 时初始化
  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId)
    initializeAgentFeatures(agentId)
    setGeneratedCode('')
  }

  // 执行 Agent 工作流
  const executeAgentWorkflow = async () => {
    if (!inputPrompt.trim() || isGenerating) return

    setIsGenerating(true)
    setGeneratedCode('')

    const selectedAgentData = agentTypes.find((a) => a.id === selectedAgent)
    if (!selectedAgentData) return

    // 模拟工作流执行
    const workflow = [
      '📋 解析用户需求...',
      '🔍 检索相关知识库...',
      '🧠 LLM 生成代码...',
      '✅ 格式校验通过...',
      '📤 生成结果输出...',
    ]

    setWorkflowSteps(workflow)

    for (let i = 0; i < workflow.length; i++) {
      setCurrentStep(i)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 更新功能状态
      if (i < agentFeatures.length) {
        setAgentFeatures((prev) =>
          prev.map((feature, index) =>
            index === i ? { ...feature, status: 'processing' } : feature
          )
        )
      }
    }

    // 完成所有功能
    await new Promise((resolve) => setTimeout(resolve, 500))
    setAgentFeatures((prev) =>
      prev.map((feature) => ({ ...feature, status: 'completed' }))
    )

    // 生成结果
    const result = generateAgentResult(selectedAgent, inputPrompt)
    setGeneratedCode(result)
    setIsGenerating(false)
  }

  // 生成 Agent 结果
  const generateAgentResult = (agentId: string, prompt: string): string => {
    const cleanPrompt = prompt.trim()

    switch (agentId) {
      case 'ai2-page-gen':
        return `// AI2 页面生成规划 Agent 执行结果
// 需求: ${cleanPrompt}

{
  "canvasSchema": {
    "id": "page_${Date.now()}",
    "name": "${cleanPrompt}",
    "version": "1.0.0",
    "components": [
      {
        "id": "search-bar",
        "type": "SearchBar",
        "props": {
          "placeholder": "搜索...",
          "filters": ["name", "email", "status"]
        }
      },
      {
        "id": "data-table",
        "type": "DataTable",
        "props": {
          "dataSource": "/api/users",
          "columns": [
            { "key": "id", "title": "ID", "width": 80 },
            { "key": "name", "title": "姓名", "width": 120 },
            { "key": "email", "title": "邮箱", "width": 200 },
            { "key": "status", "title": "状态", "width": 100 },
            { "key": "createdAt", "title": "创建时间", "width": 180 }
          ],
          "pagination": {
            "pageSize": 20,
            "showSizeChanger": true
          }
        }
      },
      {
        "id": "add-modal",
        "type": "Modal",
        "props": {
          "title": "新增用户",
          "form": {
            "fields": [
              { "name": "name", "label": "姓名", "required": true },
              { "name": "email", "label": "邮箱", "required": true },
              { "name": "phone", "label": "电话" }
            ]
          }
        }
      }
    ],
    "layout": {
      "type": "vertical",
      "spacing": 16
    }
  },
  "metadata": {
    "generatedAt": new Date().toISOString(),
    "agent": "AI2-Page-Gen",
    "workflowSteps": ${workflowSteps.length}
  }
}`

      case 'ai3-tool-call':
        return `// AI3 工具调用 Agent 执行结果
// 需求: ${cleanPrompt}

=== 工具1: SQL_DDL ===
✅ 已生成建表语句并执行

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  \`name\` VARCHAR(255) NOT NULL COMMENT '姓名',
  \`email\` VARCHAR(255) UNIQUE COMMENT '邮箱',
  \`phone\` VARCHAR(20) COMMENT '电话',
  \`status\` TINYINT DEFAULT 1 COMMENT '状态',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

=== 工具2: Nest_Crud ===
✅ 已生成 CRUD 接口

- POST /api/users - 创建用户
- GET /api/users - 获取用户列表
- GET /api/users/:id - 获取用户详情
- PUT /api/users/:id - 更新用户
- DELETE /api/users/:id - 删除用户

=== 工具3: Http_Test ===
✅ 接口测试通过

GET /api/users - Status: 200 OK
Response time: 45ms

=== 数据源配置 ===
✅ 已自动配置数据源并绑定组件
DataSource ID: ds_${Date.now()}`

      case 'ai4-error-fix':
        return `// AI4 智能排错 Agent 执行结果
// 需求: ${cleanPrompt}

=== 错误分析 ===
❌ 原始错误:
TypeError: Cannot read property 'data' of undefined
  at DataTable.render (components/DataTable.tsx:45:12)

=== 根因分析 ===
🔍 问题定位:
- 组件在数据未加载完成时尝试访问 undefined.data
- 缺少空值检查和加载状态处理

=== RAG 检索结果 ===
📚 知识库匹配:
找到 3 个相似问题解决方案
- 方案1: 添加可选链操作符 (?.)
- 方案2: 使用默认值 (|| [])
- 方案3: 添加加载状态判断

=== 修复建议 ===
✅ 推荐修复方案:

// 修改前
const { data } = useQuery(['users'], fetchUsers)
return <Table data={data.rows} />

// 修改后
const { data, isLoading } = useQuery(['users'], fetchUsers)
if (isLoading) return <Loading />
return <Table data={data?.rows || []} />

=== 知识库更新 ===
✅ 解决方案已自动入库
Knowledge ID: kb_${Date.now()}`

      case 'ai5-openapi':
        return `// AI5 OpenAPI 解析 Agent 执行结果
// 需求: ${cleanPrompt}

=== OpenAPI 文档解析 ===
✅ 成功解析接口文档
- 总接口数: 12
- GET 接口: 8
- POST 接口: 3
- PUT 接口: 1

=== 数据源配置 ===
✅ 已生成数据源配置

{
  "id": "ds_openapi_${Date.now()}",
  "name": "OpenAPI 数据源",
  "type": "rest",
  "baseUrl": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer {{token}}"
  },
  "endpoints": [
    {
      "id": "get-users",
      "method": "GET",
      "path": "/users",
      "description": "获取用户列表"
    },
    {
      "id": "create-user",
      "method": "POST",
      "path": "/users",
      "description": "创建用户"
    }
  ]
}

=== 画布页面生成 ===
✅ 已生成用户列表页面

Page ID: page_${Date.now()}
Components: [SearchBar, DataTable, AddModal, EditModal]
Layout: Vertical Layout

=== 接入完成 ===
🎉 一键完成接口接入！
- 数据源配置: ✅
- 页面生成: ✅
- 组件绑定: ✅`

      default:
        return `// 代码生成结果
// 需求: ${cleanPrompt}

// AI 已根据您的需求生成相应代码
// 请查看具体实现细节`
    }
  }

  // 复制代码
  const copyCode = async () => {
    if (!generatedCode) return
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 使用预设
  const applyPreset = (preset: typeof presets[0]) => {
    setInputPrompt(preset.description)
  }

  // 获取当前选中的 Agent
  const currentAgent = agentTypes.find((a) => a.id === selectedAgent)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💻 AI 代码生成 Agent</h1>
          <p className="text-gray-500 mt-1">LangGraph 智能工作流，自动化代码生成</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：Agent 选择和输入 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Agent 选择 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🤖 选择 Agent</h3>
            <div className="space-y-3">
              {agentTypes.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentChange(agent.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedAgent === agent.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{agent.icon}</span>
                    <span className="font-medium text-gray-800">{agent.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{agent.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 预设模板 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 预设模板</h3>
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-800">{preset.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：输入和工作流 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Agent 功能列表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Agent 功能</h3>
            <div className="space-y-3">
              {currentAgent?.features.map((feature, index) => {
                const featureStatus = agentFeatures[index]?.status || 'pending'
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      featureStatus === 'completed'
                        ? 'bg-green-50 border border-green-200'
                        : featureStatus === 'processing'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span className="mt-0.5">
                      {featureStatus === 'completed' ? '✅' : featureStatus === 'processing' ? '⏳' : '⭕'}
                    </span>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 工作流进度 */}
          {isGenerating && workflowSteps.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 工作流执行</h3>
              <div className="space-y-2">
                {workflowSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index < currentStep
                        ? 'bg-green-50 text-green-700'
                        : index === currentStep
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    <span className="text-sm">{step}</span>
                    {index === currentStep && <span className="animate-spin">⏳</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">✍️ 需求描述</h3>
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="请描述您的需求，Agent 将自动执行工作流..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={4}
            />
            <button
              onClick={executeAgentWorkflow}
              disabled={isGenerating || !inputPrompt.trim()}
              className={`w-full mt-4 px-6 py-3 rounded-xl font-medium transition-colors ${
                isGenerating || !inputPrompt.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  执行中...
                </span>
              ) : (
                <span>🚀 执行 Agent</span>
              )}
            </button>
          </div>
        </div>

        {/* 右侧：结果输出 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📤 执行结果</h3>
              <button
                onClick={copyCode}
                disabled={!generatedCode}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  generatedCode
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <span>✓</span>
                    <span>已复制</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span>📋</span>
                    <span>复制</span>
                  </span>
                )}
              </button>
            </div>

            {/* 结果显示区域 */}
            <div className="bg-gray-900 rounded-xl p-4 h-[600px] overflow-auto">
              {generatedCode ? (
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  <code>{generatedCode}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🤖</div>
                    <p>选择 Agent 并输入需求描述</p>
                    <p className="text-sm mt-1">Agent 将自动执行工作流</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📖 Agent 说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-700">
          <div>
            <strong className="block mb-1">🎯 AI2 页面生成</strong>
            <p>自然语言描述 → 自动生成完整页面配置</p>
          </div>
          <div>
            <strong className="block mb-1">🔧 AI3 工具调用</strong>
            <p>自动建表 + 生成接口 + 绑定数据源</p>
          </div>
          <div>
            <strong className="block mb-1">🔍 AI4 智能排错</strong>
            <p>自动分析错误 + 提供修复方案</p>
          </div>
          <div>
            <strong className="block mb-1">📄 AI5 OpenAPI</strong>
            <p>一键解析 API 文档 + 生成页面</p>
          </div>
        </div>
      </div>
    </div>
  )
}
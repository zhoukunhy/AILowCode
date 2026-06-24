'use client'

declare global {
  interface Window {
    showSaveFilePicker?: (options: {
      suggestedName?: string
      types?: Array<{
        description: string
        accept: Record<string, string[]>
      }>
    }) => Promise<FileSystemFileHandle>
  }
}

import React, { useState, useCallback, useEffect } from 'react'
import { codegenApi, agentApi, knowledgeApi, type GeneratedFile, type GenerateCodeResponse, type KnowledgeBase } from '@/lib/api'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  content?: string
}

interface GenerationTypeOption {
  value: 'frontend' | 'backend' | 'fullstack'
  label: string
  description: string
  icon: string
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error'
  duration?: number
  details?: any
}

const generationTypes: GenerationTypeOption[] = [
  {
    value: 'frontend',
    label: '前端项目',
    description: '生成 React + TypeScript 前端项目',
    icon: '🎨',
  },
  {
    value: 'backend',
    label: '后端项目',
    description: '生成 NestJS + TypeORM 后端项目',
    icon: '⚙️',
  },
  {
    value: 'fullstack',
    label: '全栈项目',
    description: '同时生成前后端完整项目',
    icon: '🔄',
  },
]

const presets = [
  { id: 'user-page', label: '用户管理页面', description: '创建带筛选分页的用户管理页，包含新增弹窗' },
  { id: 'product-list', label: '商品列表页面', description: '商品列表展示，支持搜索、筛选、排序功能' },
  { id: 'order-form', label: '订单表单页面', description: '订单创建表单，包含商品选择、价格计算' },
  { id: 'dashboard', label: '数据仪表盘', description: '数据统计仪表盘，包含图表和关键指标' },
]

function buildFileTree(files: GeneratedFile[]): FileNode[] {
  const root: FileNode = { name: '/', path: '', type: 'folder', children: [] }
  
  for (const file of files) {
    const parts = file.path.split('/')
    let current = root
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      
      if (!current.children) current.children = []
      
      let child = current.children.find((c) => c.name === part)
      
      if (!child) {
        child = {
          name: part,
          path: current.path ? `${current.path}/${part}` : part,
          type: isFile ? 'file' : 'folder',
          ...(isFile ? { content: file.content } : { children: [] }),
        }
        current.children.push(child)
      }
      
      current = child
    }
  }
  
  return root.children || []
}

function FileTree({ files, onSelectFile, selectedPath }: { files: FileNode[]; onSelectFile: (path: string, content: string) => void; selectedPath?: string }) {
  const renderNode = (node: FileNode, depth: number = 0) => {
    const isSelected = node.path === selectedPath
    
    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'file') {
              onSelectFile(node.path, node.content || '')
            }
          }}
        >
          <span className="text-sm">
            {node.type === 'folder' ? '📁' : getFileIcon(node.name)}
          </span>
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {node.type === 'folder' && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }
  
  return <div className="space-y-0">{files.map(renderNode)}</div>
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const icons: Record<string, string> = {
    ts: '📄',
    tsx: '📘',
    js: '📜',
    jsx: '📗',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    json: '📋',
    sql: '🗄️',
    md: '📝',
    env: '🔧',
  }
  return icons[ext || ''] || '📄'
}

function CodePreview({ content, fileName }: { content: string; fileName?: string }) {
  const getLanguage = (name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      css: 'css',
      html: 'html',
      json: 'json',
      sql: 'sql',
    }
    return langMap[ext || ''] || 'typescript'
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-300 truncate">{fileName}</span>
        <span className="text-xs text-gray-500">{getLanguage(fileName)}</span>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono">
          {content || '选择文件查看代码'}
        </pre>
      </div>
    </div>
  )
}

export default function AiCodegenPage() {
  const [generationType, setGenerationType] = useState<'frontend' | 'backend' | 'fullstack'>('frontend')
  const [inputPrompt, setInputPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<GenerateCodeResponse | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [enableRAG, setEnableRAG] = useState(false)
  const [enableOptimization, setEnableOptimization] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [selectedKnowledgeBaseIds, setSelectedKnowledgeBaseIds] = useState<number[]>([])
  const [generatedSchema, setGeneratedSchema] = useState<any>(null)
  const [isKnowledgeBasesLoading, setIsKnowledgeBasesLoading] = useState(false)

  // 延迟加载知识库数据，避免阻塞页面渲染
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKnowledgeBases()
    }, 100) // 延迟100ms加载，让页面先渲染
    
    return () => clearTimeout(timer)
  }, [])

  const fetchKnowledgeBases = useCallback(async () => {
    if (isKnowledgeBasesLoading) return // 防止重复加载
    
    setIsKnowledgeBasesLoading(true)
    try {
      const result = await knowledgeApi.getAllKnowledgeBases()
      const data = result as Record<string, unknown>
      const basesData = Array.isArray(data) ? data : (data.data as KnowledgeBase[] || [])
      setKnowledgeBases(basesData)
    } catch (err) {
      console.error('获取知识库列表失败:', err)
    } finally {
      setIsKnowledgeBasesLoading(false)
    }
  }, [isKnowledgeBasesLoading])

  const updateWorkflowStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }, [])

  const executeGeneration = useCallback(async () => {
    if (!inputPrompt.trim() || isGenerating) return
    
    setIsGenerating(true)
    setError('')
    setGeneratedResult(null)
    setFileTree([])
    setSelectedFile(null)
    setGeneratedSchema(null)
    
    const initialSteps: WorkflowStep[] = [
      { id: 'intent', title: '需求分析', description: '解析用户需求，提取关键信息', status: 'pending' as const },
      ...(enableRAG ? [{ id: 'rag', title: '知识库检索', description: '从知识库检索相关编码规范', status: 'pending' as const }] : ([] as WorkflowStep[])),
      { id: 'schema', title: 'Schema 生成', description: '生成页面 Schema 结构', status: 'pending' as const },
      { id: 'validate', title: '格式校验', description: '校验 Schema 格式正确性', status: 'pending' as const },
      { id: 'codegen', title: '代码生成', description: '根据 Schema 生成代码文件', status: 'pending' as const },
      ...(enableOptimization ? [{ id: 'optimize', title: '代码优化', description: 'AI 优化代码结构和质量', status: 'pending' as const }] : ([] as WorkflowStep[])),
      { id: 'output', title: '结果输出', description: '整理生成结果', status: 'pending' as const },
    ]
    setWorkflowSteps(initialSteps)

    try {
      updateWorkflowStep('intent', { status: 'running' })
      const intentStartTime = Date.now()
      
      const agentResponse = await agentApi.generatePage(
        inputPrompt,
        selectedKnowledgeBaseIds.length > 0 ? selectedKnowledgeBaseIds : undefined
      )
      
      updateWorkflowStep('intent', { status: 'completed', duration: Date.now() - intentStartTime })
      
      if (!agentResponse.success || !agentResponse.schema) {
        throw new Error(agentResponse.error || '页面 Schema 生成失败')
      }
      
      if (enableRAG) {
        updateWorkflowStep('rag', { 
          status: 'completed',
          details: { docCount: agentResponse.logs?.filter((l: any) => l.node === 'rag_retrieval')?.[0]?.output?.retrievedDocs?.length || 0 }
        })
      }
      
      updateWorkflowStep('schema', { status: 'completed' })
      updateWorkflowStep('validate', { status: 'completed' })
      
      setGeneratedSchema(agentResponse.schema)
      
      updateWorkflowStep('codegen', { status: 'running' })
      const codegenStartTime = Date.now()
      
      const codeResponse = await codegenApi.generateCode(
        agentResponse.schema,
        generationType,
        'react',
        undefined,
        enableRAG,
        enableOptimization
      )
      
      updateWorkflowStep('codegen', { status: 'completed', duration: Date.now() - codegenStartTime })
      
      if (enableOptimization) {
        updateWorkflowStep('optimize', { status: 'completed' })
      }
      
      updateWorkflowStep('output', { status: 'completed' })
      
      if (codeResponse.success) {
        setGeneratedResult(codeResponse)
        const tree = buildFileTree(codeResponse.files)
        setFileTree(tree)
        
        if (codeResponse.files.length > 0) {
          setSelectedFile({
            path: codeResponse.files[0].path,
            content: codeResponse.files[0].content,
          })
        }
      } else {
        throw new Error(codeResponse.error || '代码生成失败')
      }
    } catch (err: any) {
      console.error('Code generation failed:', err)
      setError(err.message || '代码生成失败，请检查后端服务')
      setWorkflowSteps(prev => prev.map(step => 
        step.status === 'pending' || step.status === 'running'
          ? { ...step, status: 'error' as const }
          : step
      ))
    } finally {
      setIsGenerating(false)
    }
  }, [inputPrompt, generationType, isGenerating, enableRAG, enableOptimization, selectedKnowledgeBaseIds, updateWorkflowStep])

  const downloadCode = useCallback(async () => {
    if (!generatedResult || !generatedSchema) return
    
    try {
      const blob = await codegenApi.downloadCode(
        generatedSchema,
        generationType,
        'react'
      )
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generationType}-project.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Download failed:', err)
      setError(err.message || '下载失败')
    }
  }, [generatedResult, generatedSchema, generationType])

  const copyCode = useCallback(async () => {
    if (!selectedFile?.content) return
    await navigator.clipboard.writeText(selectedFile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [selectedFile])

  const saveCode = useCallback(async () => {
    if (!selectedFile?.content) return
    
    try {
      const fileName = selectedFile.path.split('/').pop() || 'code.ts'
      
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker!({
          suggestedName: fileName,
          types: [
            {
              description: '代码文件',
              accept: {
                'text/typescript': ['.ts', '.tsx'],
                'text/javascript': ['.js', '.jsx'],
                'text/css': ['.css'],
                'text/html': ['.html'],
                'application/json': ['.json'],
                'text/plain': ['.txt'],
              },
            },
          ],
        })
        
        const writable = await handle.createWritable()
        await writable.write(selectedFile.content)
        await writable.close()
      } else {
        const blob = new Blob([selectedFile.content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err)
        setError(err.message || '保存失败')
      }
    }
  }, [selectedFile])

  const applyPreset = (preset: typeof presets[0]) => {
    setInputPrompt(preset.description)
  }

  const handleSelectFile = (path: string, content: string) => {
    setSelectedFile({ path, content })
  }

  const toggleKnowledgeBase = (id: number) => {
    setSelectedKnowledgeBaseIds(prev => 
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    )
  }

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'running': return '⏳'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '○'
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💻 AI 代码生成</h1>
          <p className="text-gray-500 mt-1">基于 AI 的自动化代码生成，支持前后端全栈项目</p>
        </div>
        {generatedResult && (
          <button
            onClick={downloadCode}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span>📥</span>
            <span>下载项目 (.zip)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 左侧：输入和配置 */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 生成类型</h3>
            <div className="space-y-3">
              {generationTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setGenerationType(type.value)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    generationType === type.value
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{type.icon}</span>
                    <span className="font-medium text-gray-800">{type.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ 增强选项</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-gray-800">启用 RAG 检索</div>
                  <div className="text-sm text-gray-500">基于知识库检索编码规范和代码片段</div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={enableRAG}
                    onChange={(e) => setEnableRAG(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-gray-800">启用代码优化</div>
                  <div className="text-sm text-gray-500">使用 AI 自动优化代码结构和质量</div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={enableOptimization}
                    onChange={(e) => setEnableOptimization(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </label>
            </div>
          </div>

          {enableRAG && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 选择知识库</h3>
              {isKnowledgeBasesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">加载中...</span>
                </div>
              ) : knowledgeBases.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {knowledgeBases.map((base) => (
                    <label
                      key={base.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedKnowledgeBaseIds.includes(base.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKnowledgeBaseIds.includes(base.id)}
                        onChange={() => toggleKnowledgeBase(base.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{base.name}</div>
                        {base.documentCount !== undefined && (
                          <div className="text-xs text-gray-500">{base.documentCount} 个文档</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">暂无知识库</p>
              )}
            </div>
          )}

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

          {isGenerating && workflowSteps.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 工作流执行</h3>
              <div className="space-y-2">
                {workflowSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      step.status === 'running'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : step.status === 'completed'
                        ? 'bg-green-50 border-l-4 border-green-500'
                        : step.status === 'error'
                        ? 'bg-red-50 border-l-4 border-red-500'
                        : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{getStepIcon(step.status)}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        step.status === 'error' ? 'text-red-700' : 'text-gray-800'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.description}
                        {step.duration && ` · ${step.duration}ms`}
                        {step.details?.docCount !== undefined && ` · 检索 ${step.details.docCount} 条文档`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">✍️ 需求描述</h3>
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="请描述您的页面需求...&#10;&#10;例如：创建一个用户管理页面，包含搜索框、数据表格和新增按钮"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={6}
            />
            {error && (
              <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}
            <button
              onClick={executeGeneration}
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
                  生成中...
                </span>
              ) : (
                <span>🚀 生成代码</span>
              )}
            </button>
          </div>

          {generatedResult && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 生成统计</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{generatedResult.fileCount}</div>
                  <div className="text-sm text-gray-600">文件数量</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{generatedResult.duration}ms</div>
                  <div className="text-sm text-gray-600">生成耗时</div>
                </div>
              </div>
              {(generatedResult.ragRetrievalTime !== undefined || generatedResult.optimizedFiles !== undefined) && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {generatedResult.ragRetrievalTime !== undefined && (
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{generatedResult.ragRetrievalTime}ms</div>
                      <div className="text-sm text-gray-600">RAG 检索</div>
                    </div>
                  )}
                  {generatedResult.optimizedFiles !== undefined && (
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{generatedResult.optimizedFiles}</div>
                      <div className="text-sm text-gray-600">优化文件</div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">会话 ID:</span> {generatedResult.sessionId.slice(0, 8)}...
                </div>
              </div>
            </div>
          )}

          {generatedSchema && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📐 生成的 Schema</h3>
              <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                  {JSON.stringify(generatedSchema, null, 2)}
                </pre>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                组件数量: {generatedSchema.children?.length || 0}
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">📖 使用说明</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• 选择生成类型（前端/后端/全栈）</li>
              <li>• 可选启用 RAG 检索和代码优化</li>
              <li>• 启用 RAG 时可选择关联知识库</li>
              <li>• 输入需求描述或选择预设模板</li>
              <li>• 点击生成代码按钮</li>
              <li>• 在右侧查看生成的文件和代码</li>
              <li>• 点击下载按钮获取完整项目包</li>
            </ul>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[calc(100vh-180px)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📁 项目文件</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyCode}
                  disabled={!selectedFile}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    selectedFile
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
                      <span>复制代码</span>
                    </span>
                  )}
                </button>
                <button
                  onClick={saveCode}
                  disabled={!selectedFile}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    selectedFile
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span>💾</span>
                    <span>另存为</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
              <div className="w-64 border-r border-gray-200 overflow-auto">
                {fileTree.length > 0 ? (
                  <FileTree
                    files={fileTree}
                    onSelectFile={handleSelectFile}
                    selectedPath={selectedFile?.path}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-3">📁</div>
                      <p>生成代码后查看文件</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden">
                <CodePreview
                  content={selectedFile?.content || ''}
                  fileName={selectedFile?.path}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
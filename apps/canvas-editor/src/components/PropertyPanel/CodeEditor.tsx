'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Input, Button, Tabs, Tag, Tooltip } from 'antd'
import { CodeOutlined, PlayCircleOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons'
import { useCanvasStore } from '@/store/canvasStore'
import { customComponentRegistry } from '@/services/CustomComponentRegistry'
import type { CustomComponentDefinition, CodeTemplateConfig } from '@ai-lowcode/shared-types'

const { TextArea } = Input

interface CodeEditorProps {
  onPreviewChange?: (code: string | undefined) => void
}

export function CodeEditor({ onPreviewChange }: CodeEditorProps) {
  const selectedId = useCanvasStore((state) => state.selectedId)
  const components = useCanvasStore((state) => state.components)

  const selectedComponent = components.find((c) => c.id === selectedId)
  const [codeConfig, setCodeConfig] = useState<CodeTemplateConfig>({
    renderCode: '',
    styleCode: '',
    logicCode: '',
  })
  const [compilationError, setCompilationError] = useState<string | undefined>()
  const [isCompiling, setIsCompiling] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)

  // 获取组件定义
  const componentDefinition = React.useMemo(() => {
    if (!selectedComponent?.customComponentId) return null
    return customComponentRegistry.getDefinition(selectedComponent.customComponentId) as CustomComponentDefinition | null
  }, [selectedComponent?.customComponentId])

  // 初始化代码配置
  useEffect(() => {
    if (componentDefinition?.template.type === 'code') {
      setCodeConfig(componentDefinition.template.codeConfig || {
        renderCode: '',
        styleCode: '',
        logicCode: '',
      })
      setCompilationError(undefined)
      setIsPreviewing(false)
    } else {
      setCodeConfig({ renderCode: '', styleCode: '', logicCode: '' })
      setCompilationError(undefined)
      setIsPreviewing(false)
    }
  }, [componentDefinition])

  // 编译代码
  const compileCode = useCallback(() => {
    if (!codeConfig.renderCode.trim()) {
      setCompilationError('渲染代码为空')
      return
    }

    setIsCompiling(true)
    
    setTimeout(() => {
      const result = customComponentRegistry.compileCodeForPreview(codeConfig.renderCode)
      
      if (result.success) {
        setCompilationError(undefined)
        setIsPreviewing(true)
        onPreviewChange?.(codeConfig.renderCode)
      } else {
        setCompilationError(result.error)
        setIsPreviewing(false)
        onPreviewChange?.(undefined)
      }
      
      setIsCompiling(false)
    }, 100)
  }, [codeConfig.renderCode, onPreviewChange])

  // 保存代码
  const saveCode = useCallback(() => {
    if (!selectedComponent?.customComponentId || !componentDefinition) return

    const updatedDefinition: CustomComponentDefinition = {
      ...componentDefinition,
      template: {
        type: 'code',
        codeConfig,
      },
      updatedAt: new Date(),
    }

    customComponentRegistry.register(updatedDefinition)
    
    const result = customComponentRegistry.compileCodeTemplate(selectedComponent.customComponentId)
    
    if (result) {
      setIsPreviewing(false)
      onPreviewChange?.(undefined)
    }
  }, [selectedComponent, componentDefinition, codeConfig, onPreviewChange])

  // 检查是否是代码模板组件
  const isCodeTemplate = componentDefinition?.template.type === 'code'

  if (!isCodeTemplate) {
    return null
  }

  const handleRenderCodeChange = (value: string) => {
    setCodeConfig((prev) => ({ ...prev, renderCode: value }))
    if (isPreviewing) {
      setCompilationError(undefined)
    }
  }

  const handleStyleCodeChange = (value: string) => {
    setCodeConfig((prev) => ({ ...prev, styleCode: value }))
  }

  const handleLogicCodeChange = (value: string) => {
    setCodeConfig((prev) => ({ ...prev, logicCode: value }))
  }

  return (
    <div className="border-b border-gray-200">
      <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <CodeOutlined />
          代码编辑
        </span>
        <div className="flex items-center gap-2">
          {compilationError && (
            <Tag color="error" icon={<WarningOutlined />}>
              编译错误
            </Tag>
          )}
          {isPreviewing && (
            <Tag color="success">预览中</Tag>
          )}
        </div>
      </div>

      <div className="p-4">
        <Tabs
          items={[
            {
              key: 'render',
              label: '渲染代码',
              children: (
                <div>
                  <TextArea
                    value={codeConfig.renderCode}
                    onChange={(e) => handleRenderCodeChange(e.target.value)}
                    placeholder="输入 React 渲染代码，例如：<div>Hello World</div>"
                    rows={8}
                    style={{ fontFamily: 'monospace, monospace' }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    <p>💡 提示：代码会被包裹在函数中，可直接返回 JSX 元素</p>
                    <p>可用变量：props（组件属性）、state（状态）、setState（设置状态）</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'style',
              label: '样式代码',
              children: (
                <div>
                  <TextArea
                    value={codeConfig.styleCode}
                    onChange={(e) => handleStyleCodeChange(e.target.value)}
                    placeholder="输入 CSS 样式代码"
                    rows={6}
                    style={{ fontFamily: 'monospace, monospace' }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    <p>💡 提示：样式会自动注入到页面中</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'logic',
              label: '逻辑代码',
              children: (
                <div>
                  <TextArea
                    value={codeConfig.logicCode}
                    onChange={(e) => handleLogicCodeChange(e.target.value)}
                    placeholder="输入组件逻辑代码（hooks、事件处理等）"
                    rows={6}
                    style={{ fontFamily: 'monospace, monospace' }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    <p>💡 提示：此处代码会在渲染前执行，可定义变量和函数</p>
                  </div>
                </div>
              ),
            },
          ]}
        />

        {compilationError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <WarningOutlined className="text-red-500 mt-0.5" />
              <div className="text-sm text-red-600">
                <div className="font-medium">编译错误</div>
                <div className="mt-1">{compilationError}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Tooltip title="编译并预览代码">
            <Button
              icon={<PlayCircleOutlined />}
              onClick={compileCode}
              loading={isCompiling}
              disabled={!codeConfig.renderCode.trim()}
            >
              {isCompiling ? '编译中...' : '预览'}
            </Button>
          </Tooltip>
          <Tooltip title="保存代码到组件">
            <Button
              icon={<SaveOutlined />}
              type="primary"
              onClick={saveCode}
              disabled={!codeConfig.renderCode.trim()}
            >
              保存代码
            </Button>
          </Tooltip>
          {isPreviewing && (
            <Button
              onClick={() => {
                setIsPreviewing(false)
                onPreviewChange?.(undefined)
              }}
            >
              退出预览
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

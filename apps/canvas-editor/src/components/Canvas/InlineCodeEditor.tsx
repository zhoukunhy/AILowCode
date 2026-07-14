'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Input, Tag, Popover } from 'antd'
import { CodeOutlined, XOutlined, PlayCircleOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons'
import { customComponentRegistry } from '@/services/CustomComponentRegistry'
import type { CustomComponentDefinition, CodeTemplateConfig } from '@ai-lowcode/shared-types'

const { TextArea } = Input

interface InlineCodeEditorProps {
  x: number
  y: number
  width: number
  height: number
  customComponentId: string
  onPreviewChange: (code: string | undefined) => void
}

export function InlineCodeEditor({
  x,
  y,
  width,
  height,
  customComponentId,
  onPreviewChange,
}: InlineCodeEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [codeConfig, setCodeConfig] = useState<CodeTemplateConfig>({
    renderCode: '',
    styleCode: '',
    logicCode: '',
  })
  const [compilationError, setCompilationError] = useState<string | undefined>()
  const [isCompiling, setIsCompiling] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const popoverRef = useRef<any>(null)

  const componentDefinition = React.useMemo(() => {
    return customComponentRegistry.getDefinition(customComponentId) as CustomComponentDefinition | null
  }, [customComponentId])

  useEffect(() => {
    if (componentDefinition?.template.type === 'code') {
      setCodeConfig(componentDefinition.template.codeConfig || {
        renderCode: '',
        styleCode: '',
        logicCode: '',
      })
    }
  }, [componentDefinition])

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
        onPreviewChange(codeConfig.renderCode)
      } else {
        setCompilationError(result.error)
        setIsPreviewing(false)
        onPreviewChange(undefined)
      }
      
      setIsCompiling(false)
    }, 100)
  }, [codeConfig.renderCode, onPreviewChange])

  const saveCode = useCallback(() => {
    if (!customComponentId || !componentDefinition) return

    const updatedDefinition: CustomComponentDefinition = {
      ...componentDefinition,
      template: {
        type: 'code',
        codeConfig,
      },
      updatedAt: new Date(),
    }

    customComponentRegistry.register(updatedDefinition)
    customComponentRegistry.compileCodeTemplate(customComponentId)
    
    setIsPreviewing(false)
    onPreviewChange(undefined)
    setIsOpen(false)
  }, [customComponentId, componentDefinition, codeConfig, onPreviewChange])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setIsPreviewing(false)
    onPreviewChange(undefined)
  }, [onPreviewChange])

  const editorContent = (
    <div style={{ width: 400, maxHeight: 400, overflow: 'auto' }}>
      <div className="mb-3">
        <TextArea
          value={codeConfig.renderCode}
          onChange={(e) => setCodeConfig((prev) => ({ ...prev, renderCode: e.target.value }))}
          placeholder="输入 React 渲染代码..."
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>

      {compilationError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-medium text-red-800">编译错误</div>
          <div className="text-sm text-red-600 mt-1">{compilationError}</div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          icon={<PlayCircleOutlined />}
          onClick={compileCode}
          loading={isCompiling}
          size="small"
        >
          {isCompiling ? '编译中...' : '预览'}
        </Button>
        <Button
          icon={<SaveOutlined />}
          type="primary"
          onClick={saveCode}
          size="small"
          disabled={!codeConfig.renderCode.trim()}
        >
          保存
        </Button>
        {isPreviewing && (
          <Button
            onClick={() => {
              setIsPreviewing(false)
              onPreviewChange(undefined)
            }}
            size="small"
          >
            退出预览
          </Button>
        )}
        <Button
          icon={<XOutlined />}
          onClick={handleClose}
          size="small"
        >
          关闭
        </Button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <p>💡 提示：代码会被包裹在函数中，可直接返回 JSX 元素</p>
        <p>可用变量：props、state、setState</p>
      </div>
    </div>
  )

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        cursor: 'pointer',
        zIndex: 1000,
      }}
    >
      {!isOpen ? (
        <Popover
          ref={popoverRef}
          content={editorContent}
          title={
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CodeOutlined />
                代码编辑器
              </span>
              {componentDefinition && (
                <Tag color="blue">{componentDefinition.displayName}</Tag>
              )}
            </div>
          }
          trigger="click"
          onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) {
              setIsPreviewing(false)
              onPreviewChange(undefined)
            }
          }}
          placement="topRight"
          overlayStyle={{ maxWidth: 450 }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-100/50 hover:bg-gray-200/50 transition-colors"
            style={{ borderRadius: 4 }}
          >
            <div className="flex flex-col items-center gap-2">
              <EditOutlined style={{ fontSize: 20, color: '#666' }} />
              <span className="text-xs text-gray-500">点击编辑代码</span>
            </div>
          </div>
        </Popover>
      ) : null}
    </div>
  )
}

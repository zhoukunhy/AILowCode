'use client'

import React from 'react'
import type { ComponentConfig } from '@/store/canvasStore'
import { registerComponent } from './componentMap'

interface RuntimeComponentProps {
  component: ComponentConfig
}

const getComponentStyle = (component: ComponentConfig): React.CSSProperties => ({
  position: 'absolute',
  left: component.x,
  top: component.y,
  width: component.width,
  height: component.height,
  zIndex: component.zIndex,
  opacity: component.opacity,
  transform: `rotate(${component.rotation}deg)`,
})

const InputRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const inputType =
    component.type === 'passwordInput'
      ? 'password'
      : component.type === 'emailInput'
      ? 'email'
      : component.type === 'phoneInput'
      ? 'tel'
      : component.type === 'numberInput'
      ? 'number'
      : 'text'
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-2 overflow-hidden">
      {props.label && (
        <label
          className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ width: 80, flexShrink: 0 }}
          title={props.label}
        >
          {props.label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={inputType}
        value={props.value || ''}
        placeholder={props.placeholder}
        disabled={props.disabled}
        required={props.required}
        className="flex-1 min-w-0 h-full px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  )
}

const TextareaRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div style={getComponentStyle(component)} className="flex items-start gap-2 overflow-hidden">
      {props.label && (
        <label
          className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis pt-2"
          style={{ width: 80, flexShrink: 0 }}
          title={props.label}
        >
          {props.label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        value={props.value || ''}
        placeholder={props.placeholder}
        rows={props.rows || 3}
        disabled={props.disabled}
        className="flex-1 min-w-0 h-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
      />
    </div>
  )
}

const SelectRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const options = props.options || []
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-2 overflow-hidden">
      {props.label && (
        <label
          className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ width: 80, flexShrink: 0 }}
          title={props.label}
        >
          {props.label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={props.value || ''}
        disabled={props.disabled}
        className="flex-1 min-w-0 h-full px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
      >
        <option value="">{props.placeholder || '请选择'}</option>
        {options.map((opt: any, index: number) => {
          const optValue = typeof opt === 'object' ? opt.value : opt
          const optLabel = typeof opt === 'object' ? opt.label : opt
          return (
            <option key={index} value={optValue}>
              {optLabel}
            </option>
          )
        })}
      </select>
    </div>
  )
}

const ButtonRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const colors: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    default: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    dashed: 'bg-white text-gray-700 border border-dashed border-gray-300 hover:bg-gray-50',
    text: 'bg-transparent text-gray-700 hover:bg-gray-100',
    link: 'bg-transparent text-blue-600 hover:text-blue-700 hover:bg-blue-50',
  }
  const colorClass = colors[props.type as string] || colors.default
  
  return (
    <button
      className={`w-full h-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${colorClass}`}
      style={getComponentStyle(component)}
      onClick={() => props.onClick?.()}
    >
      {props.text || '按钮'}
    </button>
  )
}

const HeadingRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const level = props.level || 2
  const HeadingTag = `h${level}` as React.ElementType
  
  return React.createElement(
    HeadingTag,
    {
      className: 'font-bold text-gray-800',
      style: {
        ...getComponentStyle(component),
        fontSize: props.fontSize || (level === 1 ? '2rem' : level === 2 ? '1.5rem' : level === 3 ? '1.25rem' : '1rem'),
        color: props.color || '#1a1a2e',
        margin: 0,
      },
    },
    props.content
  )
}

const TextRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <span
      className="text-gray-700"
      style={{
        ...getComponentStyle(component),
        fontSize: props.fontSize || 14,
        color: props.color || '#333',
        fontWeight: props.bold ? 'bold' : 'normal',
        fontStyle: props.italic ? 'italic' : 'normal',
        textDecoration: props.underline ? 'underline' : 'none',
      }}
    >
      {props.content || props.text || ''}
    </span>
  )
}

const ContainerRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className="rounded-lg border border-gray-200 overflow-hidden"
      style={{
        ...getComponentStyle(component),
        backgroundColor: props.backgroundColor || '#ffffff',
        padding: props.padding || '16px',
        borderColor: props.borderColor || '#e5e7eb',
      }}
    />
  )
}

const SwitchRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-2">
      {props.label && (
        <span className="text-sm text-gray-700">{props.label}</span>
      )}
      <button
        role="switch"
        aria-checked={props.checked || false}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          props.checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        onClick={() => {}}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            props.checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

const DatePickerRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const inputType =
    component.type === 'timepicker' ? 'time' : component.type === 'daterange' ? 'date' : 'date'
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-2 overflow-hidden">
      {props.label && (
        <label
          className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ width: 80, flexShrink: 0 }}
          title={props.label}
        >
          {props.label}
        </label>
      )}
      <input
        type={inputType}
        value={props.value || ''}
        placeholder={props.placeholder}
        className="flex-1 min-w-0 h-full px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  )
}

const ImageRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <img
      src={props.src || ''}
      alt={props.alt || ''}
      className="object-contain rounded"
      style={{
        ...getComponentStyle(component),
        objectFit: props.objectFit || 'cover',
      }}
    />
  )
}

const DividerRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className="border-t"
      style={{
        ...getComponentStyle(component),
        borderColor: props.color || '#e5e7eb',
        borderWidth: props.thickness || 1,
      }}
    >
      {props.text && (
        <span className="inline-block px-4 text-sm text-gray-500 bg-white -mt-4">
          {props.text}
        </span>
      )}
    </div>
  )
}

const AlertRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const types: Record<string, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }
  const typeClass = types[props.type as string] || types.info
  
  return (
    <div
      className={`p-4 border rounded-lg text-sm ${typeClass}`}
      style={getComponentStyle(component)}
    >
      {props.message}
    </div>
  )
}

const AvatarRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className="rounded-full bg-gray-200 flex items-center justify-center text-white font-medium"
      style={{
        ...getComponentStyle(component),
        backgroundColor: props.color || '#6b7280',
        fontSize: props.fontSize || 14,
      }}
    >
      {props.icon || props.text || '?'}
    </div>
  )
}

const TagRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const colors: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  }
  const colorClass = colors[props.type as string] || colors.default
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      style={getComponentStyle(component)}
    >
      {props.text || '标签'}
    </span>
  )
}

const BadgeRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className="relative inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full"
      style={{
        ...getComponentStyle(component),
        backgroundColor: props.color || '#ef4444',
        color: '#ffffff',
      }}
    >
      {props.count || props.text || 0}
    </div>
  )
}

const SpaceRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className="flex"
      style={{
        ...getComponentStyle(component),
        flexDirection: props.direction === 'vertical' ? 'column' : 'row',
        gap: props.gap || 8,
      }}
    />
  )
}

const RateRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const value = props.value || 0
  const count = props.count || 5
  
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="text-lg cursor-pointer"
          style={{ color: index < value ? '#fbbf24' : '#e5e7eb' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

const SliderRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const value = props.value || 50
  const min = props.min || 0
  const max = props.max || 100
  const percentage = ((value - min) / (max - min)) * 100
  
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
        }}
      />
      <span className="text-sm text-gray-600 w-12">{value}</span>
    </div>
  )
}

interface UploadedFile {
  uid: string
  name: string
  url: string
  isImage: boolean
}

const UploadRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const [fileList, setFileList] = React.useState<UploadedFile[]>([])
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const accept = props.accept || 'image/*'
  const isImageMode = accept.startsWith('image') || accept === '*'
  const multiple = props.multiple ?? false
  const maxCount = props.maxCount ?? 8
  const disabled = props.disabled ?? false

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newFiles: UploadedFile[] = files.map((file) => {
      const url = URL.createObjectURL(file)
      return {
        uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        url,
        isImage: file.type.startsWith('image'),
      }
    })

    setFileList((prev) => {
      if (!multiple) return newFiles
      const combined = [...prev, ...newFiles]
      return combined.slice(0, maxCount)
    })
    e.target.value = ''
  }

  const handleRemove = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFileList((prev) => {
      const file = prev.find((f) => f.uid === uid)
      if (file) URL.revokeObjectURL(file.url)
      return prev.filter((f) => f.uid !== uid)
    })
  }

  const handlePreview = (file: UploadedFile) => {
    if (file.isImage) {
      setPreviewUrl(file.url)
    } else {
      window.open(file.url, '_blank')
    }
  }

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col"
      style={getComponentStyle(component)}
    >
      {props.label && (
        <div className="text-sm text-gray-700 mb-1 px-1">{props.label}</div>
      )}
      <div
        className="flex-1 overflow-auto p-2"
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {fileList.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer h-full min-h-[60px]">
            <span className="text-2xl mb-1">{isImageMode ? '🖼️' : '📁'}</span>
            <span className="text-sm text-gray-500">
              {props.placeholder || '点击上传'}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {isImageMode
              ? fileList.map((file) => (
                  <div
                    key={file.uid}
                    className="relative group w-20 h-20 rounded-md overflow-hidden border border-gray-200"
                  >
                    {file.isImage ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePreview(file)
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center bg-gray-50 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePreview(file)
                        }}
                      >
                        <span className="text-2xl">📄</span>
                      </div>
                    )}
                    <button
                      className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-md w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleRemove(file.uid, e)}
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.name}
                    </div>
                  </div>
                ))
              : fileList.map((file) => (
                  <div
                    key={file.uid}
                    className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2 border border-gray-200"
                  >
                    <span className="text-xl">📄</span>
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">
                      {file.name}
                    </span>
                    <button
                      className="text-gray-400 hover:text-red-500 text-sm"
                      onClick={(e) => handleRemove(file.uid, e)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
            {(!disabled && multiple && fileList.length < maxCount) && (
              <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <span className="text-2xl text-gray-400">+</span>
              </div>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={handleChange}
      />
      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="预览"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
          <button className="absolute top-4 right-4 text-white text-3xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

const PaginationRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const current = props.current || 1
  const pageSize = props.pageSize || 10
  const total = props.total || 100
  const totalPages = Math.ceil(total / pageSize)
  
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-2">
      <button
        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
        disabled={current === 1}
      >
        ←
      </button>
      <span className="text-sm text-gray-600">
        第 {current} / {totalPages} 页
      </span>
      <button
        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
        disabled={current === totalPages}
      >
        →
      </button>
    </div>
  )
}

const TabsRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const tabs = props.tabs || []
  const activeKey = props.activeKey || (tabs[0]?.key || '0')
  
  return (
    <div style={getComponentStyle(component)} className="flex flex-col h-full">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab: any) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab.key === activeKey
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label || tab.title}
          </button>
        ))}
      </div>
      <div className="flex-1 p-4">
        {tabs.find((tab: any) => tab.key === activeKey)?.content || ''}
      </div>
    </div>
  )
}

const StepsRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const steps = props.steps || []
  const current = props.current || 0
  
  return (
    <div style={getComponentStyle(component)} className="flex items-center justify-between">
      {steps.map((step: any, index: number) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= current
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index <= current ? index + 1 : '○'}
            </div>
            <span
              className={`text-xs mt-1 ${
                index <= current ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-16 h-0.5 mx-2 ${
                index < current ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

const ModalRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  if (!props.visible) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        style={{ width: props.width || 520 }}
      >
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{props.title || '弹窗'}</h3>
          <button className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-4">
          {props.content}
        </div>
        <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
            取消
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

const DrawerRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  if (!props.visible) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex z-50">
      <div
        className="bg-white shadow-xl w-full"
        style={{ width: props.width || 320, marginLeft: 'auto' }}
      >
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{props.title || '抽屉'}</h3>
          <button className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-4">
          {props.content}
        </div>
      </div>
    </div>
  )
}

const CascaderRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-2 overflow-hidden">
      {props.label && (
        <label
          className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ width: 80, flexShrink: 0 }}
          title={props.label}
        >
          {props.label}
        </label>
      )}
      <div className="flex-1 min-w-0 h-full px-3 py-2 border border-gray-300 rounded-md text-sm flex items-center justify-between bg-white">
        <span className="text-gray-500 overflow-hidden text-ellipsis">{props.placeholder || '请选择'}</span>
        <span className="text-gray-400 ml-2">▼</span>
      </div>
    </div>
  )
}

const TransferRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const leftData = props.leftData || []
  const rightData = props.rightData || []
  
  return (
    <div style={getComponentStyle(component)} className="flex items-center gap-4 h-full">
      <div className="flex-1 border border-gray-300 rounded-md p-2 h-full flex flex-col">
        <div className="text-sm font-medium text-gray-600 mb-2">{props.leftTitle || '待选'}</div>
        <div className="flex-1 overflow-auto">
          {leftData.map((item: any, index: number) => (
            <div key={index} className="px-2 py-1.5 text-sm border border-gray-200 rounded mb-1 hover:bg-blue-50">
              {item.label || item}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button className="px-2 py-1 border border-gray-300 rounded text-sm">→</button>
        <button className="px-2 py-1 border border-gray-300 rounded text-sm">←</button>
      </div>
      <div className="flex-1 border border-gray-300 rounded-md p-2 h-full flex flex-col">
        <div className="text-sm font-medium text-gray-600 mb-2">{props.rightTitle || '已选'}</div>
        <div className="flex-1 overflow-auto">
          {rightData.map((item: any, index: number) => (
            <div key={index} className="px-2 py-1.5 text-sm border border-gray-200 rounded mb-1 hover:bg-blue-50">
              {item.label || item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TimelineRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const items = props.items || []
  
  return (
    <div style={getComponentStyle(component)} className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
      {items.map((item: any, index: number) => (
        <div key={index} className="relative pl-8 pb-4">
          <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
            <span className="text-xs text-blue-500">{index + 1}</span>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">{item.title}</div>
            {item.content && <div className="text-gray-500">{item.content}</div>}
            {item.time && <div className="text-xs text-gray-400">{item.time}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

const CarouselRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const items = props.items || []
  const current = props.current || 0
  
  return (
    <div style={getComponentStyle(component)} className="relative overflow-hidden rounded">
      <div className="flex h-full transition-transform">
        {items.map((item: any, index: number) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full flex items-center justify-center bg-gray-100"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            <span className="text-4xl">{item.icon || '🖼️'}</span>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {items.map((_: any, index: number) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${index === current ? 'bg-blue-600' : 'bg-white'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const TooltipRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div style={getComponentStyle(component)} className="relative inline-block">
      <span className="text-gray-400 cursor-help">?</span>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
        {props.title || '提示'}
      </div>
    </div>
  )
}

const PopoverRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div style={getComponentStyle(component)} className="relative inline-block">
      <button className="px-4 py-2 border border-gray-300 rounded text-sm">
        {props.triggerText || '点击'}
      </button>
      {props.visible && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg p-3 z-10">
          {props.content}
        </div>
      )}
    </div>
  )
}

const TreeRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  
  const renderTree = (nodes: any[] = [], level = 0) => (
    <ul className="list-none m-0" style={{ paddingLeft: level > 0 ? '16px' : 0 }}>
      {nodes.map((node: any, index: number) => (
        <li key={index} className="py-1">
          <div className="flex items-center gap-1 text-sm">
            <span>{node.children && node.children.length > 0 ? '▶' : '◉'}</span>
            <span className={node.selected ? 'text-blue-600 font-medium' : 'text-gray-700'}>
              {node.title || node.name}
            </span>
          </div>
          {node.children && renderTree(node.children, level + 1)}
        </li>
      ))}
    </ul>
  )
  
  return (
    <div style={getComponentStyle(component)} className="overflow-auto border border-gray-200 rounded p-2">
      {renderTree(props.treeData)}
    </div>
  )
}

const FormRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <form style={getComponentStyle(component)} className="space-y-4">
      {props.label && (
        <div className="text-lg font-medium text-gray-900">{props.label}</div>
      )}
    </form>
  )
}

const CheckboxRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <label
      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none"
      style={getComponentStyle(component)}
    >
      <input
        type="checkbox"
        checked={props.checked || false}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      {props.label && <span>{props.label}</span>}
    </label>
  )
}

const RadioRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const options = props.options || []
  const value = props.value
  return (
    <div
      className="flex flex-wrap items-center gap-4 text-sm text-gray-700"
      style={getComponentStyle(component)}
    >
      {props.label && <span className="font-medium text-gray-700">{props.label}</span>}
      {options.map((opt: any, index: number) => {
        const optValue = typeof opt === 'object' ? opt.value : opt
        const optLabel = typeof opt === 'object' ? opt.label : opt
        return (
          <label key={index} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={component.id}
              checked={value === optValue}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span>{optLabel}</span>
          </label>
        )
      })}
    </div>
  )
}

const TableRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const cols = props.columns || 4
  const rows = props.rows || 5
  const headers = props.headers || Array.from({ length: cols }, (_, i) => `列${i + 1}`)
  const data = props.data || Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => `单元格${r + 1}-${c + 1}`)
  )

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col"
      style={getComponentStyle(component)}
    >
      {props.title && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
          {props.title}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className={`w-full text-sm text-left ${props.striped ? '' : ''}`}>
          <thead className={props.striped ? 'bg-gray-50' : ''}>
            <tr>
              {headers.map((h: string, i: number) => (
                <th
                  key={i}
                  className="px-3 py-2 font-medium text-gray-600 border-b border-gray-200 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any[], r: number) => (
              <tr
                key={r}
                className={
                  props.striped && r % 2 === 1
                    ? 'bg-gray-50'
                    : props.hoverable
                    ? 'hover:bg-blue-50 transition-colors'
                    : ''
                }
              >
                {row.map((cell: any, c: number) => (
                  <td key={c} className="px-3 py-2 text-gray-700 border-b border-gray-100">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ListRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const items = props.items || []
  return (
    <div
      className={`bg-white overflow-hidden flex flex-col ${props.bordered ? 'border border-gray-200 rounded-lg' : ''}`}
      style={getComponentStyle(component)}
    >
      {props.title && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
          {props.title}
        </div>
      )}
      <ul className="flex-1 overflow-auto divide-y divide-gray-100">
        {items.length === 0 ? (
          <li className="px-4 py-3 text-sm text-gray-400 text-center">暂无数据</li>
        ) : (
          items.map((item: any, index: number) => (
            <li key={index} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              {typeof item === 'object' ? item.label || item.title || JSON.stringify(item) : item}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

const CardRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className={`bg-white rounded-lg shadow-sm flex flex-col overflow-hidden ${
        props.bordered ? 'border border-gray-200' : ''
      } ${props.hoverable ? 'hover:shadow-md transition-shadow' : ''}`}
      style={getComponentStyle(component)}
    >
      {props.title && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">{props.title}</h3>
        </div>
      )}
      <div className="flex-1 px-4 py-3 text-sm text-gray-600 overflow-auto">
        {props.content}
      </div>
    </div>
  )
}

const ApprovalRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const statusMap: Record<string, { label: string; className: string }> = {
    pending: { label: '待审批', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    approved: { label: '已通过', className: 'bg-green-100 text-green-800 border-green-200' },
    rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800 border-red-200' },
  }
  const status = statusMap[props.status as string] || statusMap.pending
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      style={getComponentStyle(component)}
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-medium text-gray-900">{props.title || '审批流程'}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
          {status.label}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2 text-sm">
        {props.approver && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">审批人:</span>
            <span className="text-gray-900">{props.approver}</span>
          </div>
        )}
        {props.comment && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500">审批意见:</span>
            <span className="text-gray-900">{props.comment}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const FlowNodeRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const typeMap: Record<string, { color: string; bg: string }> = {
    start: { color: 'text-white', bg: 'bg-green-500' },
    end: { color: 'text-white', bg: 'bg-red-500' },
    task: { color: 'text-gray-700', bg: 'bg-blue-100' },
    approval: { color: 'text-white', bg: 'bg-yellow-500' },
    condition: { color: 'text-gray-700', bg: 'bg-purple-100' },
  }
  const style = typeMap[props.type as string] || typeMap.task
  return (
    <div
      className={`rounded-lg flex items-center justify-center text-sm font-medium border-2 border-transparent ${style.color} ${style.bg}`}
      style={getComponentStyle(component)}
    >
      {props.label || '流程节点'}
    </div>
  )
}

const ConditionRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden"
      style={getComponentStyle(component)}
    >
      <div className="px-3 py-2 bg-purple-50 border-b border-purple-100 text-xs text-purple-700 font-mono break-all">
        {props.condition || 'condition'}
      </div>
      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center text-sm text-gray-700 border-r border-gray-100 bg-green-50">
          {props.trueLabel || '是'}
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-700 bg-red-50">
          {props.falseLabel || '否'}
        </div>
      </div>
    </div>
  )
}

const ApiConnectorRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
  }
  const methodClass = methodColors[props.method as string] || methodColors.GET
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      style={getComponentStyle(component)}
    >
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodClass}`}>
          {props.method || 'GET'}
        </span>
        <span className="text-xs text-gray-700 font-mono break-all flex-1">
          {props.url || '/api/endpoint'}
        </span>
      </div>
      {(Object.keys(props.headers || {}).length > 0 || Object.keys(props.params || {}).length > 0) && (
        <div className="px-3 py-2 text-xs text-gray-500 space-y-1">
          {Object.keys(props.headers || {}).length > 0 && (
            <div>Headers: {Object.keys(props.headers).length} 项</div>
          )}
          {Object.keys(props.params || {}).length > 0 && (
            <div>Params: {Object.keys(props.params).length} 项</div>
          )}
        </div>
      )}
    </div>
  )
}

const PaymentRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const methodMap: Record<string, { label: string; icon: string }> = {
    alipay: { label: '支付宝', icon: '💳' },
    wechat: { label: '微信支付', icon: '💚' },
    card: { label: '银行卡', icon: '🏦' },
  }
  const method = methodMap[props.method as string] || methodMap.alipay
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg flex items-center gap-3 px-4"
      style={getComponentStyle(component)}
    >
      <span className="text-2xl">{method.icon}</span>
      <div className="flex-1">
        <div className="text-sm text-gray-500">{method.label}</div>
        <div className="text-lg font-semibold text-gray-900">
          ¥{(props.amount || 0).toFixed(2)}
        </div>
      </div>
      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
        去支付
      </button>
    </div>
  )
}

const MapRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className="bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden"
      style={getComponentStyle(component)}
    >
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2">🗺️</div>
        <div className="text-sm">地图区域</div>
        <div className="text-xs mt-1">
          中心: [{props.center?.[0] || 0}, {props.center?.[1] || 0}] · 缩放: {props.zoom || 12}
        </div>
      </div>
      <div className="absolute top-2 right-2 bg-white rounded shadow px-2 py-1 text-xs text-gray-600">
        Zoom: {props.zoom || 12}
      </div>
    </div>
  )
}

registerComponent('input', InputRenderer)
registerComponent('textarea', TextareaRenderer)
registerComponent('select', SelectRenderer)
registerComponent('button', ButtonRenderer)
registerComponent('heading', HeadingRenderer)
registerComponent('text', TextRenderer)
registerComponent('container', ContainerRenderer)
registerComponent('switch', SwitchRenderer)
registerComponent('datepicker', DatePickerRenderer)
registerComponent('daterange', DatePickerRenderer)
registerComponent('timepicker', DatePickerRenderer)
registerComponent('image', ImageRenderer)
registerComponent('divider', DividerRenderer)
registerComponent('alert', AlertRenderer)
registerComponent('avatar', AvatarRenderer)
registerComponent('tag', TagRenderer)
registerComponent('badge', BadgeRenderer)
registerComponent('space', SpaceRenderer)
registerComponent('rate', RateRenderer)
registerComponent('slider', SliderRenderer)
registerComponent('upload', UploadRenderer)
registerComponent('pagination', PaginationRenderer)
registerComponent('tabs', TabsRenderer)
registerComponent('steps', StepsRenderer)
registerComponent('modal', ModalRenderer)
registerComponent('drawer', DrawerRenderer)
registerComponent('cascader', CascaderRenderer)
registerComponent('transfer', TransferRenderer)
registerComponent('timeline', TimelineRenderer)
registerComponent('carousel', CarouselRenderer)
registerComponent('tooltip', TooltipRenderer)
registerComponent('popover', PopoverRenderer)
registerComponent('tree', TreeRenderer)
registerComponent('form', FormRenderer)
registerComponent('numberInput', InputRenderer)
registerComponent('passwordInput', InputRenderer)
registerComponent('emailInput', InputRenderer)
registerComponent('phoneInput', InputRenderer)
registerComponent('checkbox', CheckboxRenderer)
registerComponent('radio', RadioRenderer)
registerComponent('table', TableRenderer)
registerComponent('list', ListRenderer)
registerComponent('card', CardRenderer)
registerComponent('approval', ApprovalRenderer)
registerComponent('flowNode', FlowNodeRenderer)
registerComponent('condition', ConditionRenderer)
registerComponent('apiConnector', ApiConnectorRenderer)
registerComponent('payment', PaymentRenderer)
registerComponent('map', MapRenderer)
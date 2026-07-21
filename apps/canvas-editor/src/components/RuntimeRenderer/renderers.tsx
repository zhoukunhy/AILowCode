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
  return (
    <div style={getComponentStyle(component)}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={component.type === 'passwordInput' ? 'password' : component.type === 'emailInput' ? 'email' : component.type === 'phoneInput' ? 'tel' : component.type === 'numberInput' ? 'number' : 'text'}
        value={props.value || ''}
        placeholder={props.placeholder}
        className="w-full h-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        style={{ height: props.label ? 'calc(100% - 24px)' : '100%' }}
      />
    </div>
  )
}

const TextareaRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div style={getComponentStyle(component)}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={props.value || ''}
        placeholder={props.placeholder}
        rows={props.rows || 3}
        className="w-full h-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
        style={{ height: props.label ? 'calc(100% - 24px)' : '100%' }}
      />
    </div>
  )
}

const SelectRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  const options = props.options || []
  return (
    <div style={getComponentStyle(component)}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={props.value || ''}
        className="w-full h-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
        style={{ height: props.label ? 'calc(100% - 24px)' : '100%' }}
      >
        <option value="">{props.placeholder || '请选择'}</option>
        {options.map((opt: any, index: number) => (
          <option key={index} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
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
  return (
    <div style={getComponentStyle(component)}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
        </label>
      )}
      <input
        type="date"
        value={props.value || ''}
        placeholder={props.placeholder}
        className="w-full h-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        style={{ height: props.label ? 'calc(100% - 24px)' : '100%' }}
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

const UploadRenderer: React.FC<RuntimeComponentProps> = ({ component }) => {
  const { props } = component
  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
      style={getComponentStyle(component)}
    >
      <span className="text-2xl mb-2">📁</span>
      <span className="text-sm text-gray-500">{props.placeholder || '点击上传'}</span>
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
    <div style={getComponentStyle(component)}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
        </label>
      )}
      <div className="w-full h-full px-3 py-2 border border-gray-300 rounded-md text-sm flex items-center justify-between bg-white">
        <span className="text-gray-500">{props.placeholder || '请选择'}</span>
        <span className="text-gray-400">▼</span>
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
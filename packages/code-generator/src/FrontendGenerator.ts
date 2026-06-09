/**
 * 前端代码生成器
 * 生成 React 组件源码
 */
import type { PageSchema, ComponentSchema } from '@ai-lowcode/lang-ai-core'
import { GeneratedFile, ReactComponentConfig, ImportStatement } from './types'

export class FrontendGenerator {
  private schema: PageSchema
  private imports: Set<string> = new Set()
  private components: Map<string, string> = new Map()
  private hasRouter: boolean = false
  private hasStore: boolean = false

  constructor(schema: PageSchema) {
    this.schema = schema
    this.initializeImports()
    this.detectFeatures()
  }

  /**
   * 初始化默认导入
   */
  private initializeImports(): void {
    this.imports.add("import React from 'react'")
    this.imports.add("import './index.css'")
  }

  /**
   * 检测需要的功能特性
   */
  private detectFeatures(): void {
    const children = this.schema.children || []
    const checkChildren = (comps: ComponentSchema[]) => {
      for (const comp of comps) {
        if (comp.type === 'Link' || comp.type === 'RouterView') {
          this.hasRouter = true
        }
        if (comp.type === 'Table' || comp.type === 'Form' || comp.type === 'List') {
          this.hasStore = true
        }
        if (comp.children && comp.children.length > 0) {
          checkChildren(comp.children)
        }
      }
    }
    checkChildren(children)
  }

  /**
   * 生成完整的前端项目
   */
  generate(): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // 生成组件文件
    const componentFiles = this.generateComponents()
    files.push(...componentFiles)

    // 生成路由配置（如果需要）
    if (this.hasRouter) {
      files.push(this.generateRoutes())
      files.push(this.generateRouterStore())
    }

    // 生成状态管理（如果需要）
    if (this.hasStore) {
      files.push(this.generateStore())
    }

    // 生成 API 文件
    files.push(this.generateApi())

    // 生成 App.tsx
    files.push(this.generateApp())

    // 生成 main.tsx
    files.push(this.generateMain())

    // 生成样式文件
    files.push(this.generateStyles())

    // 生成 index.html
    files.push(this.generateIndexHtml())

    // 生成 package.json
    files.push(this.generatePackageJson())

    // 生成 tsconfig.json
    files.push(this.generateTsConfig())

    // 生成 vite.config.ts
    files.push(this.generateViteConfig())

    return files
  }

  /**
   * 生成所有组件
   */
  private generateComponents(): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // 生成主页面组件
    files.push(this.generatePageComponent())

    // 生成子组件
    const childComponents = this.generateChildComponents(this.schema.children || [])
    files.push(...childComponents)

    return files
  }

  /**
   * 生成主页面组件
   */
  private generatePageComponent(): GeneratedFile {
    const componentName = this.toPascalCase(this.schema.name || 'Page')
    const children = this.schema.children || []
    
    const content = `import React from 'react'
${this.generateChildImports(children)}

interface ${componentName}Props {}

export function ${componentName}(props: ${componentName}Props) {
  return (
    <div className="page-container">
${this.renderChildren(children, 2)}
    </div>
  )
}

export default ${componentName}
`
    return {
      path: `src/components/${componentName}.tsx`,
      content,
    }
  }

  /**
   * 生成子组件
   */
  private generateChildComponents(components: ComponentSchema[]): GeneratedFile[] {
    const files: GeneratedFile[] = []

    for (const component of components) {
      const file = this.generateComponentFile(component)
      if (file) {
        files.push(file)
      }

      // 递归处理嵌套组件
      if (component.children && component.children.length > 0) {
        const nestedFiles = this.generateChildComponents(component.children)
        files.push(...nestedFiles)
      }
    }

    return files
  }

  /**
   * 生成单个组件文件
   */
  private generateComponentFile(component: ComponentSchema): GeneratedFile | null {
    const componentName = this.toPascalCase(component.type) + '_' + component.id.slice(-8)
    
    // 简单组件类型映射
    const componentTemplate = this.generateComponentTemplate(component, componentName)
    
    if (!componentTemplate) return null

    return {
      path: `src/components/${componentName}.tsx`,
      content: componentTemplate,
    }
  }

  /**
   * 生成组件模板
   */
  private generateComponentTemplate(component: ComponentSchema, componentName: string): string | null {
    const props = component.props || {}
    const style = component.style || {}

    switch (component.type) {
      case 'Container':
        return this.generateContainer(component, componentName)
      case 'Button':
        return this.generateButton(component, componentName)
      case 'Input':
        return this.generateInput(component, componentName)
      case 'Text':
        return this.generateText(component, componentName)
      case 'Card':
        return this.generateCard(component, componentName)
      case 'Table':
        return this.generateTable(component, componentName)
      case 'Form':
        return this.generateForm(component, componentName)
      case 'List':
        return this.generateList(component, componentName)
      case 'Link':
        return this.generateLink(component, componentName)
      case 'Image':
        return this.generateImage(component, componentName)
      case 'Select':
        return this.generateSelect(component, componentName)
      case 'Checkbox':
        return this.generateCheckbox(component, componentName)
      case 'Radio':
        return this.generateRadio(component, componentName)
      case 'DatePicker':
        return this.generateDatePicker(component, componentName)
      case 'Modal':
        return this.generateModal(component, componentName)
      case 'Tabs':
        return this.generateTabs(component, componentName)
      case 'Switch':
        return this.generateSwitch(component, componentName)
      case 'Avatar':
        return this.generateAvatar(component, componentName)
      case 'Badge':
        return this.generateBadge(component, componentName)
      case 'Progress':
        return this.generateProgress(component, componentName)
      case 'Breadcrumb':
        return this.generateBreadcrumb(component, componentName)
      case 'Pagination':
        return this.generatePagination(component, componentName)
      case 'Drawer':
        return this.generateDrawer(component, componentName)
      case 'Tooltip':
        return this.generateTooltip(component, componentName)
      case 'Alert':
        return this.generateAlert(component, componentName)
      default:
        return this.generateGenericComponent(component, componentName)
    }
  }

  private generateContainer(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const children = component.children || []
    
    return `import React from 'react'

interface ${name}Props {
  title?: string
}

export function ${name}(props: ${name}Props) {
  return (
    <div className="${name.toLowerCase()}">
      {props.title && <h2>{props.title}</h2>}
${this.renderChildren(children, 4)}
    </div>
  )
}

export default ${name}
`
  }

  private generateButton(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  onClick?: () => void
  type?: 'primary' | 'secondary' | 'danger'
}

export function ${name}(props: ${name}Props) {
  const { onClick, type = 'primary' } = props
  
  return (
    <button
      className="${name.toLowerCase()} button-${type}"
      onClick={onClick}
    >
      ${props.text || '按钮'}
    </button>
  )
}

export default ${name}
`
  }

  private generateInput(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  label?: string
  placeholder?: string
  type?: string
  value?: string
  onChange?: (value: string) => void
}

export function ${name}(props: ${name}Props) {
  const [inputValue, setInputValue] = useState(props.value || '')
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    props.onChange?.(e.target.value)
  }
  
  return (
    <div className="${name.toLowerCase()}">
      {props.label && <label>{props.label}</label>}
      <input
        type={props.type || 'text'}
        placeholder={props.placeholder}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  )
}

export default ${name}
`
  }

  private generateText(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  content?: string
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'span'
}

export function ${name}(props: ${name}Props) {
  const Tag = props.tag || 'p'
  
  return (
    <Tag className="${name.toLowerCase()}">
      {props.content || '文本内容'}
    </Tag>
  )
}

export default ${name}
`
  }

  private generateCard(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const children = component.children || []
    
    return `import React from 'react'

interface ${name}Props {
  title?: string
}

export function ${name}(props: ${name}Props) {
  return (
    <div className="${name.toLowerCase()}">
      {props.title && <h3 className="card-title">{props.title}</h3>}
      <div className="card-content">
${this.renderChildren(children, 6)}
      </div>
    </div>
  )
}

export default ${name}
`
  }

  private generateTable(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const columns = props.columns || []
    const data = props.data || []
    
    return `import React from 'react'

interface ${name}Props {
  data?: any[]
}

export function ${name}(props: ${name}Props) {
  const tableData = props.data || ${JSON.stringify(data)}
  const columns = ${JSON.stringify(columns)}
  
  return (
    <table className="${name.toLowerCase()}">
      <thead>
        <tr>
          {columns.map((col: any) => (
            <th key={col.key}>{col.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableData.map((row: any, index: number) => (
          <tr key={index}>
            {columns.map((col: any) => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ${name}
`
  }

  private generateForm(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const children = component.children || []
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  onSubmit?: (data: Record<string, any>) => void
}

export function ${name}(props: ${name}Props) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    props.onSubmit?.(formData)
  }
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  return (
    <form className="${name.toLowerCase()}" onSubmit={handleSubmit}>
${this.renderChildren(children, 4)}
      <button type="submit">提交</button>
    </form>
  )
}

export default ${name}
`
  }

  private generateList(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const data = props.data || []
    
    return `import React from 'react'

interface ${name}Props {
  items?: any[]
}

export function ${name}(props: ${name}Props) {
  const items = props.items || ${JSON.stringify(data)}
  
  return (
    <ul className="${name.toLowerCase()}">
      {items.map((item: any, index: number) => (
        <li key={index}>
          {typeof item === 'object' ? item.label : item}
        </li>
      ))}
    </ul>
  )
}

export default ${name}
`
  }

  private generateGenericComponent(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const children = component.children || []
    
    return `import React from 'react'

interface ${name}Props {
  [key: string]: any
}

export function ${name}(props: ${name}Props) {
  return (
    <div className="${name.toLowerCase()}">
${this.renderChildren(children, 4)}
    </div>
  )
}

export default ${name}
`
  }

  private generateLink(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  to: string
  children?: React.ReactNode
  target?: '_blank' | '_self' | '_parent' | '_top'
}

export function ${name}(props: ${name}Props) {
  const { to, children, target = '_self' } = props
  
  return (
    <a href={to} target={target} className="${name.toLowerCase()}">
      {children || '链接'}
    </a>
  )
}

export default ${name}
`
  }

  private generateImage(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
}

export function ${name}(props: ${name}Props) {
  const { src, alt = 'Image', width, height } = props
  
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="${name.toLowerCase()}"
    />
  )
}

export default ${name}
`
  }

  private generateSelect(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const options = props.options || []
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  label?: string
  options?: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
}

export function ${name}(props: ${name}Props) {
  const [selectedValue, setSelectedValue] = useState(props.value || '')
  const options = props.options || ${JSON.stringify(options)}
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedValue(value)
    props.onChange?.(value)
  }
  
  return (
    <div className="${name.toLowerCase()}">
      {props.label && <label>{props.label}</label>}
      <select value={selectedValue} onChange={handleChange}>
        <option value="">请选择</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ${name}
`
  }

  private generateCheckbox(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  label?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
}

export function ${name}(props: ${name}Props) {
  const [isChecked, setIsChecked] = useState(props.checked || false)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsChecked(checked)
    props.onChange?.(checked)
  }
  
  return (
    <label className="${name.toLowerCase()}">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
      />
      {props.label}
    </label>
  )
}

export default ${name}
`
  }

  private generateRadio(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const options = props.options || []
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  name: string
  label?: string
  options?: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
}

export function ${name}(props: ${name}Props) {
  const [selectedValue, setSelectedValue] = useState(props.value || '')
  const options = props.options || ${JSON.stringify(options)}
  
  const handleChange = (value: string) => {
    setSelectedValue(value)
    props.onChange?.(value)
  }
  
  return (
    <div className="${name.toLowerCase()}">
      {props.label && <span>{props.label}</span>}
      {options.map((opt) => (
        <label key={opt.value}>
          <input
            type="radio"
            name={props.name}
            value={opt.value}
            checked={selectedValue === opt.value}
            onChange={() => handleChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

export default ${name}
`
  }

  private generateDatePicker(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  label?: string
  value?: string
  onChange?: (value: string) => void
}

export function ${name}(props: ${name}Props) {
  const [dateValue, setDateValue] = useState(props.value || '')
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDateValue(value)
    props.onChange?.(value)
  }
  
  return (
    <div className="${name.toLowerCase()}">
      {props.label && <label>{props.label}</label>}
      <input
        type="date"
        value={dateValue}
        onChange={handleChange}
      />
    </div>
  )
}

export default ${name}
`
  }

  private generateModal(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const children = component.children || []
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  title?: string
  visible?: boolean
  onClose?: () => void
  children?: React.ReactNode
}

export function ${name}(props: ${name}Props) {
  const [isVisible, setIsVisible] = useState(props.visible || false)
  
  const handleClose = () => {
    setIsVisible(false)
    props.onClose?.()
  }
  
  if (!isVisible) return null
  
  return (
    <div className="${name.toLowerCase()}-overlay" onClick={handleClose}>
      <div className="${name.toLowerCase()}-content" onClick={(e) => e.stopPropagation()}>
        <div className="${name.toLowerCase()}-header">
          <h3>{props.title || '标题'}</h3>
          <button onClick={handleClose} className="${name.toLowerCase()}-close">
            ×
          </button>
        </div>
        <div className="${name.toLowerCase()}-body">
          {props.children || ${this.renderChildren(children, 8)}}
        </div>
        <div className="${name.toLowerCase()}-footer">
          <button onClick={handleClose}>确定</button>
          <button onClick={handleClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

export default ${name}
`
  }

  private generateTabs(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const tabs = props.tabs || []
    
    return `import React, { useState } from 'react'

interface TabItem {
  key: string
  label: string
}

interface ${name}Props {
  tabs?: TabItem[]
  children?: React.ReactNode
}

export function ${name}(props: ${name}Props) {
  const [activeTab, setActiveTab] = useState<string>('')
  const tabs = props.tabs || ${JSON.stringify(tabs)}
  
  if (tabs.length > 0 && !activeTab) {
    setActiveTab(tabs[0].key)
  }
  
  return (
    <div className="${name.toLowerCase()}">
      <div className="${name.toLowerCase()}-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={\`${name.toLowerCase()}-tab \${activeTab === tab.key ? 'active' : ''}\`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="${name.toLowerCase()}-content">
        {props.children}
      </div>
    </div>
  )
}

export default ${name}
`
  }

  private generateSwitch(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  checked?: boolean
  onChange?: (checked: boolean) => void
}

export function ${name}(props: ${name}Props) {
  const [isChecked, setIsChecked] = useState(props.checked || false)
  
  const handleToggle = () => {
    const newValue = !isChecked
    setIsChecked(newValue)
    props.onChange?.(newValue)
  }
  
  return (
    <button
      type="button"
      className={\`${name.toLowerCase()} \${isChecked ? 'checked' : ''}\`}
      onClick={handleToggle}
      role="switch"
      aria-checked={isChecked}
    >
      <span className="${name.toLowerCase()}-thumb" />
    </button>
  )
}

export default ${name}
`
  }

  private generateAvatar(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  src?: string
  alt?: string
  size?: 'small' | 'medium' | 'large'
}

export function ${name}(props: ${name}Props) {
  const { src, alt = 'Avatar', size = 'medium' } = props
  
  return (
    <div className="${name.toLowerCase()} ${name.toLowerCase()}-${size}">
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <span className="${name.toLowerCase()}-icon">
          {alt.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

export default ${name}
`
  }

  private generateBadge(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  count?: number
  dot?: boolean
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue'
  children?: React.ReactNode
}

export function ${name}(props: ${name}Props) {
  const { count = 0, dot = false, color = 'red', children } = props
  
  return (
    <span className="${name.toLowerCase()}">
      {children}
      {(count > 0 || dot) && (
        <span className="${name.toLowerCase()}-dot ${name.toLowerCase()}-${color}">
          {!dot && count > 0 && count <= 99 ? count : ''}
        </span>
      )}
    </span>
  )
}

export default ${name}
`
  }

  private generateProgress(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  percent?: number
  showInfo?: boolean
  strokeColor?: string
}

export function ${name}(props: ${name}Props) {
  const { percent = 0, showInfo = true, strokeColor = '#1890ff' } = props
  
  return (
    <div className="${name.toLowerCase()}">
      <div className="${name.toLowerCase()}-track">
        <div
          className="${name.toLowerCase()}-bar"
          style={{ width: \`\${percent}%\`, backgroundColor: strokeColor }}
        />
      </div>
      {showInfo && <span className="${name.toLowerCase()}-text">{percent}%</span>}
    </div>
  )
}

export default ${name}
`
  }

  private generateBreadcrumb(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const items = props.items || []
    
    return `import React from 'react'

interface BreadcrumbItem {
  title: string
  href?: string
}

interface ${name}Props {
  items?: BreadcrumbItem[]
}

export function ${name}(props: ${name}Props) {
  const items = props.items || ${JSON.stringify(items)}
  
  return (
    <nav className="${name.toLowerCase()}" aria-label="breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            {item.href ? (
              <a href={item.href}>{item.title}</a>
            ) : (
              <span>{item.title}</span>
            )}
            {index < items.length - 1 && (
              <span className="${name.toLowerCase()}-separator">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default ${name}
`
  }

  private generatePagination(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  current?: number
  total?: number
  pageSize?: number
  onChange?: (page: number) => void
}

export function ${name}(props: ${name}Props) {
  const { current = 1, total = 0, pageSize = 10, onChange } = props
  const totalPages = Math.ceil(total / pageSize)
  
  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChange?.(page)
    }
  }
  
  return (
    <div className="${name.toLowerCase()}">
      <button
        className="${name.toLowerCase()}-btn"
        onClick={() => handlePageClick(current - 1)}
        disabled={current === 1}
      >
        上一页
      </button>
      <span className="${name.toLowerCase()}-info">
        第 {current} / {totalPages} 页
      </span>
      <button
        className="${name.toLowerCase()}-btn"
        onClick={() => handlePageClick(current + 1)}
        disabled={current === totalPages}
      >
        下一页
      </button>
    </div>
  )
}

export default ${name}
`
  }

  private generateDrawer(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    const children = component.children || []
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  title?: string
  visible?: boolean
  onClose?: () => void
  placement?: 'left' | 'right' | 'top' | 'bottom'
  width?: string | number
  children?: React.ReactNode
}

export function ${name}(props: ${name}Props) {
  const [isVisible, setIsVisible] = useState(props.visible || false)
  const { placement = 'right', width = 320 } = props
  
  const handleClose = () => {
    setIsVisible(false)
    props.onClose?.()
  }
  
  if (!isVisible) return null
  
  return (
    <div className="${name.toLowerCase()}-overlay" onClick={handleClose}>
      <div
        className="${name.toLowerCase()}-content ${name.toLowerCase()}-${placement}"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="${name.toLowerCase()}-header">
          <h3>{props.title || '标题'}</h3>
          <button onClick={handleClose} className="${name.toLowerCase()}-close">
            ×
          </button>
        </div>
        <div className="${name.toLowerCase()}-body">
          {props.children || ${this.renderChildren(children, 8)}}
        </div>
      </div>
    </div>
  )
}

export default ${name}
`
  }

  private generateTooltip(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React, { useState } from 'react'

interface ${name}Props {
  title: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
}

export function ${name}(props: ${name}Props) {
  const [isVisible, setIsVisible] = useState(false)
  const { title, placement = 'top', children } = props
  
  return (
    <div className="${name.toLowerCase()}">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </span>
      {isVisible && (
        <span className="${name.toLowerCase()}-tip ${name.toLowerCase()}-${placement}">
          {title}
        </span>
      )}
    </div>
  )
}

export default ${name}
`
  }

  private generateAlert(component: ComponentSchema, name: string): string {
    const props = component.props || {}
    
    return `import React from 'react'

interface ${name}Props {
  type?: 'success' | 'warning' | 'error' | 'info'
  message?: string
  description?: string
  closable?: boolean
  onClose?: () => void
}

export function ${name}(props: ${name}Props) {
  const { type = 'info', message, description, closable = false, onClose } = props
  
  return (
    <div className="${name.toLowerCase()} ${name.toLowerCase()}-${type}">
      <span className="${name.toLowerCase()}-icon">
        {type === 'success' && '✓'}
        {type === 'warning' && '⚠'}
        {type === 'error' && '✕'}
        {type === 'info' && 'i'}
      </span>
      <div className="${name.toLowerCase()}-content">
        {message && <strong>{message}</strong>}
        {description && <p>{description}</p>}
      </div>
      {closable && (
        <button onClick={onClose} className="${name.toLowerCase()}-close">×</button>
      )}
    </div>
  )
}

export default ${name}
`
  }

  /**
   * 渲染子组件
   */
  private renderChildren(children: ComponentSchema[], indent: number): string {
    const spaces = ' '.repeat(indent * 2)
    
    return children.map(child => {
      const childName = this.toPascalCase(child.type) + '_' + child.id.slice(-8)
      const propsStr = this.generatePropsString(child.props || {})
      return `${spaces}<${childName} ${propsStr} />`
    }).join('\n')
  }

  /**
   * 生成子组件导入
   */
  private generateChildImports(children: ComponentSchema[]): string {
    const imports: string[] = []
    
    for (const child of children) {
      const childName = this.toPascalCase(child.type) + '_' + child.id.slice(-8)
      if (!imports.includes(`import ${childName} from './${childName}'`)) {
        imports.push(`import ${childName} from './${childName}'`)
      }
      
      // 递归处理嵌套组件
      if (child.children && child.children.length > 0) {
        const nestedImports = this.generateChildImports(child.children)
        nestedImports.split('\n').forEach(imp => {
          if (!imports.includes(imp)) {
            imports.push(imp)
          }
        })
      }
    }
    
    return imports.join('\n')
  }

  /**
   * 生成属性字符串
   */
  private generatePropsString(props: Record<string, any>): string {
    const filteredProps = Object.keys(props).filter(k => k !== 'dataSource' && k !== 'fields')
    
    return filteredProps.map(key => {
      const value = props[key]
      if (typeof value === 'string') {
        return `${key}="${value}"`
      }
      return `${key}={${JSON.stringify(value)}}`
    }).join(' ')
  }

  /**
   * 生成 App.tsx
   */
  private generateApp(): GeneratedFile {
    const componentName = this.toPascalCase(this.schema.name || 'Page')
    
    return {
      path: 'src/App.tsx',
      content: `import React from 'react'
import ${componentName} from './components/${componentName}'

function App() {
  return (
    <div className="app">
      <${componentName} />
    </div>
  )
}

export default App
`,
    }
  }

  /**
   * 生成 main.tsx
   */
  private generateMain(): GeneratedFile {
    return {
      path: 'src/main.tsx',
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
    }
  }

  /**
   * 生成样式文件
   */
  private generateStyles(): GeneratedFile {
    return {
      path: 'src/index.css',
      content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.app {
  width: 100%;
  min-height: 100vh;
}

.page-container {
  padding: 20px;
}

/* 按钮样式 */
button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.button-primary {
  background-color: #1890ff;
  color: white;
}

.button-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.button-danger {
  background-color: #ff4d4f;
  color: white;
}

/* 表单样式 */
form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

input {
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

/* 卡片样式 */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 16px;
}

.card-title {
  margin-bottom: 12px;
  font-size: 16px;
}

/* 表格样式 */
table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th, td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
}

th {
  background-color: #fafafa;
  font-weight: 600;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 抽屉样式 */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.drawer-content {
  position: fixed;
  background: white;
  height: 100%;
  overflow-y: auto;
}

.drawer-right {
  right: 0;
}

.drawer-left {
  left: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.drawer-body {
  padding: 16px;
}

/* 标签页样式 */
.tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.tabs-tab {
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tabs-tab.active {
  border-bottom-color: #1890ff;
  color: #1890ff;
}

.tabs-content {
  padding: 16px;
}

/* 开关样式 */
.switch {
  width: 44px;
  height: 24px;
  background: #ccc;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.switch.checked {
  background: #1890ff;
}

.switch-thumb {
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: left 0.3s;
}

.switch.checked .switch-thumb {
  left: 22px;
}

/* 进度条样式 */
.progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

/* 面包屑样式 */
.breadcrumb ol {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 8px;
}

.breadcrumb a {
  color: #1890ff;
  text-decoration: none;
}

.breadcrumb-separator {
  color: #999;
}

/* 头像样式 */
.avatar {
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-small {
  width: 24px;
  height: 24px;
}

.avatar-medium {
  width: 40px;
  height: 40px;
}

.avatar-large {
  width: 64px;
  height: 64px;
}

.avatar-icon {
  font-size: 14px;
  color: #fff;
  background: #1890ff;
}

/* 徽章样式 */
.badge {
  position: relative;
  display: inline-block;
}

.badge-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
}

.badge-red {
  background: #ff4d4f;
}

.badge-orange {
  background: #fa8c16;
}

.badge-yellow {
  background: #faad14;
}

.badge-green {
  background: #52c41a;
}

.badge-blue {
  background: #1890ff;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pagination-btn {
  padding: 4px 12px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

/* 工具提示样式 */
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip-tip {
  position: absolute;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  z-index: 100;
  white-space: nowrap;
}

.tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
}

.tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
}

/* 警告样式 */
.alert {
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.alert-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.alert-warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.alert-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.alert-info {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.alert-icon {
  font-size: 16px;
}

.alert-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  margin-left: auto;
}
`,
    }
  }

  /**
   * 生成路由配置
   */
  private generateRoutes(): GeneratedFile {
    return {
      path: 'src/routes/index.ts',
      content: `import { lazy } from 'react'

export interface RouteConfig {
  path: string
  element: React.ComponentType<any>
  name?: string
  children?: RouteConfig[]
}

const ${this.toPascalCase(this.schema.name || 'Page')} = lazy(() => import('../components/${this.toPascalCase(this.schema.name || 'Page')}'))

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: ${this.toPascalCase(this.schema.name || 'Page')},
    name: '${this.schema.name || '首页'}',
  },
]

export default routes
`,
    }
  }

  /**
   * 生成路由状态管理
   */
  private generateRouterStore(): GeneratedFile {
    return {
      path: 'src/store/routerStore.ts',
      content: `import { create } from 'zustand'

interface RouterState {
  currentPath: string
  previousPath: string
  navigate: (path: string) => void
  goBack: () => void
}

export const useRouterStore = create<RouterState>((set) => ({
  currentPath: '/',
  previousPath: '/',
  navigate: (path) => set((state) => ({
    previousPath: state.currentPath,
    currentPath: path,
  })),
  goBack: () => set((state) => ({
    currentPath: state.previousPath,
    previousPath: state.currentPath,
  })),
}))
`,
    }
  }

  /**
   * 生成状态管理
   */
  private generateStore(): GeneratedFile {
    return {
      path: 'src/store/index.ts',
      content: `import { create } from 'zustand'

interface AppState {
  loading: boolean
  error: string | null
  data: Record<string, any[]>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setData: (key: string, value: any[]) => void
  getData: (key: string) => any[]
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: false,
  error: null,
  data: {},
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setData: (key, value) => set((state) => ({
    data: { ...state.data, [key]: value },
  })),
  getData: (key) => get().data[key] || [],
}))

export { useRouterStore } from './routerStore'
`,
    }
  }

  /**
   * 生成 API 请求层
   */
  private generateApi(): GeneratedFile {
    return {
      path: 'src/api/index.ts',
      content: `const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(\`\${BASE_URL}\${url}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || '请求失败')
  }

  return response.json()
}

export const api = {
  get: <T>(url: string, params?: Record<string, any>) => {
    const query = params ? new URLSearchParams(params).toString() : ''
    return request<T>(\`\${url}\${query ? '?' + query : ''}\`, { method: 'GET' })
  },
  post: <T>(url: string, data?: Record<string, any>) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data?: Record<string, any>) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}

export default api
`,
    }
  }

  /**
   * 生成 index.html
   */
  private generateIndexHtml(): GeneratedFile {
    return {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.schema.name || 'Generated Page'}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    }
  }

  /**
   * 生成 package.json
   */
  private generatePackageJson(): GeneratedFile {
    const dependencies: string[] = [
      '"react": "^18.2.0"',
      '"react-dom": "^18.2.0"',
    ]
    
    if (this.hasRouter) {
      dependencies.push('"react-router-dom": "^6.20.0"')
    }
    
    if (this.hasStore) {
      dependencies.push('"zustand": "^4.4.7"')
    }
    
    return {
      path: 'package.json',
      content: `{
  "name": "${this.toKebabCase(this.schema.name || 'generated-project')}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    ${dependencies.join(',\n    ')}
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
`,
    }
  }

  /**
   * 生成 tsconfig.json
   */
  private generateTsConfig(): GeneratedFile {
    return {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`,
    }
  }

  /**
   * 生成 vite.config.ts
   */
  private generateViteConfig(): GeneratedFile {
    return {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`,
    }
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  /**
   * 转换为 kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[-_\s]+/g, '-')
      .toLowerCase()
  }
}

/**
 * 创建前端代码生成器
 */
export function createFrontendGenerator(schema: PageSchema): FrontendGenerator {
  return new FrontendGenerator(schema)
}

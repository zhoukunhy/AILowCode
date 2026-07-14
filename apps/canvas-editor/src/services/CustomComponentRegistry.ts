import React from 'react'
import type {
  CustomComponentInstance,
  CustomPropSchema,
} from '@ai-lowcode/shared-types'

export interface CompilationResult {
  success: boolean
  compiledCode?: (props: any) => React.ReactNode
  error?: string
}

export interface RegisteredComponent {
  definition: any
  renderFunction?: (props: any) => React.ReactNode
  compiledCode?: (props: any) => React.ReactNode
  compilationError?: string
  compiledAt?: number
}

class CustomComponentRegistry {
  private components: Map<string, RegisteredComponent> = new Map()
  private listeners: Set<() => void> = new Set()
  private styleSheets: Map<string, HTMLStyleElement> = new Map()

  /**
   * 注册自定义组件
   */
  register(definition: any, renderFunction?: (props: any) => React.ReactNode): void {
    const existing = this.components.get(definition.id)
    
    // 如果已存在且版本相同，跳过
    if (existing && existing.definition.version === definition.version) {
      return
    }

    // 注册组件
    this.components.set(definition.id, {
      definition,
      renderFunction,
    })

    // 通知监听器
    this.notifyListeners()
  }

  /**
   * 批量注册组件
   */
  registerBatch(definitions: any[]): void {
    definitions.forEach(def => this.register(def))
    this.notifyListeners()
  }

  /**
   * 取消注册组件
   */
  unregister(componentId: string): void {
    this.components.delete(componentId)
    this.notifyListeners()
  }

  /**
   * 获取组件定义
   */
  getDefinition(componentId: string): any | undefined {
    return this.components.get(componentId)?.definition
  }

  /**
   * 获取所有已注册组件
   */
  getAllDefinitions(): any[] {
    return Array.from(this.components.values()).map(c => c.definition)
  }

  /**
   * 获取指定分类的组件
   */
  getDefinitionsByCategory(category: string): any[] {
    return this.getAllDefinitions().filter(c => c.category === category)
  }

  /**
   * 搜索组件
   */
  searchDefinitions(query: string): any[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllDefinitions().filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.displayName.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * 检查组件是否存在
   */
  exists(componentId: string): boolean {
    return this.components.has(componentId)
  }

  /**
   * 获取组件渲染函数
   */
  getRenderFunction(componentId: string): ((props: any) => React.ReactNode) | undefined {
    const registered = this.components.get(componentId)
    return registered?.renderFunction || registered?.compiledCode
  }

  /**
   * 编译代码模板组件
   */
  compileCodeTemplate(componentId: string): boolean {
    const result = this.tryCompileCodeTemplate(componentId)
    return result.success
  }

  /**
   * 尝试编译代码模板组件，返回详细的编译结果
   */
  tryCompileCodeTemplate(componentId: string): CompilationResult {
    const registered = this.components.get(componentId)
    if (!registered || registered.definition.template.type !== 'code') {
      return { success: false, error: '组件不存在或不是代码模板类型' }
    }

    const codeConfig = registered.definition.template.codeConfig
    if (!codeConfig?.renderCode) {
      return { success: false, error: '渲染代码为空' }
    }

    try {
      const renderCode = codeConfig.renderCode.trim()
      let functionBody = renderCode

      if (!renderCode.startsWith('return') && !renderCode.startsWith('(') && !renderCode.startsWith('{')) {
        functionBody = `return ${renderCode}`
      }

      const compiledFunction = new Function(
        'React',
        'props',
        'state',
        'setState',
        functionBody
      )

      registered.compiledCode = (props: any) => {
        try {
          return compiledFunction(React, props, {}, () => {})
        } catch (runtimeError) {
          console.error(`Runtime error in component ${componentId}:`, runtimeError)
          return null
        }
      }
      registered.compilationError = undefined
      registered.compiledAt = Date.now()

      this.injectStyles(componentId, codeConfig.styleCode)

      this.notifyListeners()

      return { success: true, compiledCode: registered.compiledCode }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Failed to compile custom component ${componentId}:`, error)
      
      if (registered) {
        registered.compilationError = errorMessage
        registered.compiledCode = undefined
      }

      return { success: false, error: errorMessage }
    }
  }

  /**
   * 实时编译代码（用于编辑器预览）
   */
  compileCodeForPreview(renderCode: string, styleCode?: string): CompilationResult {
    if (!renderCode || !renderCode.trim()) {
      return { success: false, error: '渲染代码为空' }
    }

    try {
      const trimmedCode = renderCode.trim()
      let functionBody = trimmedCode

      if (!trimmedCode.startsWith('return') && !trimmedCode.startsWith('(') && !trimmedCode.startsWith('{')) {
        functionBody = `return ${trimmedCode}`
      }

      const compiledFunction = new Function(
        'React',
        'props',
        'state',
        'setState',
        functionBody
      )

      const compiledCode = (props: any) => {
        try {
          return compiledFunction(React, props, {}, () => {})
        } catch (runtimeError) {
          console.error('Runtime error in preview:', runtimeError)
          return null
        }
      }

      if (styleCode) {
        this.injectStyles('preview', styleCode)
      }

      return { success: true, compiledCode }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 注入样式到页面
   */
  private injectStyles(componentId: string, styleCode?: string): void {
    const existingStyle = this.styleSheets.get(componentId)
    if (existingStyle) {
      document.head.removeChild(existingStyle)
    }

    if (!styleCode || !styleCode.trim()) {
      this.styleSheets.delete(componentId)
      return
    }

    const styleElement = document.createElement('style')
    styleElement.textContent = styleCode
    styleElement.id = `custom-component-style-${componentId}`
    document.head.appendChild(styleElement)
    this.styleSheets.set(componentId, styleElement)
  }

  /**
   * 获取组件编译错误
   */
  getCompilationError(componentId: string): string | undefined {
    return this.components.get(componentId)?.compilationError
  }

  /**
   * 创建组件实例
   */
  createInstance(
    componentId: string,
    instanceId: string,
    props?: Record<string, any>
  ): CustomComponentInstance | null {
    const definition = this.getDefinition(componentId)
    if (!definition) {
      return null
    }

    // 合合默认属性
    const defaultProps = this.getDefaultProps(definition.propsSchema)
    const finalProps = { ...defaultProps, ...props }

    return {
      id: instanceId,
      customComponentId: componentId,
      version: definition.version,
      props: finalProps,
    }
  }

  /**
   * 获取默认属性值
   */
  getDefaultProps(schema: CustomPropSchema): Record<string, any> {
    const props: Record<string, any> = {}

    for (const [key, propDef] of Object.entries(schema.properties)) {
      if (propDef.default !== undefined) {
        props[key] = propDef.default
      } else {
        // 根据类型设置默认值
        switch (propDef.type) {
          case 'string':
            props[key] = ''
            break
          case 'number':
            props[key] = 0
            break
          case 'boolean':
            props[key] = false
            break
          case 'array':
            props[key] = []
            break
          case 'object':
            props[key] = {}
            break
          default:
            props[key] = null
        }
      }
    }

    return props
  }

  /**
   * 验证属性值
   */
  validateProps(
    componentId: string,
    props: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const definition = this.getDefinition(componentId)
    if (!definition) {
      return { valid: false, errors: ['组件不存在'] }
    }

    const errors: string[] = []
    const schema = definition.propsSchema

    // 检查必填属性
    if (schema.required) {
      for (const requiredKey of schema.required) {
        if (props[requiredKey] === undefined || props[requiredKey] === null) {
          errors.push(`属性 ${requiredKey} 是必填的`)
        }
      }
    }

    // 验证属性值
    for (const [key, value] of Object.entries(props)) {
      const propDef = schema.properties[key]
      if (!propDef) {
        continue
      }

      // 类型验证
      if (!this.validatePropType(value, propDef.type)) {
        errors.push(`属性 ${key} 类型不正确，期望 ${propDef.type}`)
        continue
      }

      // 验证规则
      if (propDef.validation) {
        const validationErrors = this.validatePropRules(key, value, propDef.validation)
        errors.push(...validationErrors)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * 验证属性类型
   */
  private validatePropType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      case 'color':
        return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value) || /^rgb/.test(value)
      case 'date':
        return value instanceof Date || typeof value === 'string'
      default:
        return true
    }
  }

  /**
   * 验证属性规则
   */
  private validatePropRules(key: string, value: any, validation: any): string[] {
    const errors: string[] = []

    if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
      errors.push(`属性 ${key} 最小值为 ${validation.min}`)
    }

    if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
      errors.push(`属性 ${key} 最大值为 ${validation.max}`)
    }

    if (validation.minLength !== undefined && typeof value === 'string' && value.length < validation.minLength) {
      errors.push(`属性 ${key} 最小长度为 ${validation.minLength}`)
    }

    if (validation.maxLength !== undefined && typeof value === 'string' && value.length > validation.maxLength) {
      errors.push(`属性 ${key} 最大长度为 ${validation.maxLength}`)
    }

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        errors.push(`属性 ${key} 格式不正确`)
      }
    }

    return errors
  }

  /**
   * 添加监听器
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  /**
   * 清空所有组件
   */
  clear(): void {
    this.components.clear()
    this.notifyListeners()
  }

  /**
   * 导出组件定义
   */
  exportDefinitions(): any[] {
    return this.getAllDefinitions()
  }

  /**
   * 导入组件定义
   */
  importDefinitions(definitions: any[]): void {
    this.registerBatch(definitions)
  }
}

// 创建全局实例
export const customComponentRegistry = new CustomComponentRegistry()

// React Hook for using custom components
export function useCustomComponentRegistry() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  React.useEffect(() => {
    const unsubscribe = customComponentRegistry.subscribe(() => forceUpdate())
    return unsubscribe
  }, [])

  return {
    register: customComponentRegistry.register.bind(customComponentRegistry),
    unregister: customComponentRegistry.unregister.bind(customComponentRegistry),
    getDefinition: customComponentRegistry.getDefinition.bind(customComponentRegistry),
    getAllDefinitions: customComponentRegistry.getAllDefinitions.bind(customComponentRegistry),
    getDefinitionsByCategory: customComponentRegistry.getDefinitionsByCategory.bind(customComponentRegistry),
    searchDefinitions: customComponentRegistry.searchDefinitions.bind(customComponentRegistry),
    createInstance: customComponentRegistry.createInstance.bind(customComponentRegistry),
    validateProps: customComponentRegistry.validateProps.bind(customComponentRegistry),
    compileCodeTemplate: customComponentRegistry.compileCodeTemplate.bind(customComponentRegistry),
    tryCompileCodeTemplate: customComponentRegistry.tryCompileCodeTemplate.bind(customComponentRegistry),
    compileCodeForPreview: customComponentRegistry.compileCodeForPreview.bind(customComponentRegistry),
    getCompilationError: customComponentRegistry.getCompilationError.bind(customComponentRegistry),
    getRenderFunction: customComponentRegistry.getRenderFunction.bind(customComponentRegistry),
  }
}
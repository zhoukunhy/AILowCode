/**
 * Wasm 沙盒模块
 * 支持用户上传自定义组件插件，沙箱隔离运行
 */
export class WasmSandbox {
  private plugins: Map<string, PluginInstance> = new Map()
  private moduleCache: Map<string, WebAssembly.Module> = new Map()
  private globalExports: Map<string, any> = new Map()

  /**
   * 加载 Wasm 插件
   */
  async loadPlugin(name: string, wasmBytes: Uint8Array): Promise<PluginInstance> {
    try {
      // 编译 Wasm 模块
      const module = await WebAssembly.compile(wasmBytes)
      
      // 创建隔离的内存和导入对象
      const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 })
      
      // 创建导入对象
      const importObject = this.createImportObject(memory)
      
      // 实例化模块
      const instance = await WebAssembly.instantiate(module, importObject)
      
      // 验证插件格式
      const plugin = this.validatePlugin(instance, name)
      
      // 缓存模块
      this.moduleCache.set(name, module)
      this.plugins.set(name, plugin)
      
      // 注册到全局组件库
      this.registerPlugin(plugin)
      
      console.log(`插件加载成功: ${name}`)
      return plugin
    } catch (error: any) {
      console.error(`插件加载失败: ${name}`, error)
      throw error
    }
  }

  /**
   * 创建隔离的导入对象
   */
  private createImportObject(memory: WebAssembly.Memory): WebAssembly.Imports {
    return {
      env: {
        memory,
        table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
        __stack_pointer: () => {},
        __data_end: 0,
        __global_base: 0,
        
        // 安全的控制台输出
        console_log: (ptr: number, len: number) => {
          const str = this.readString(memory, ptr, len)
          console.log(`[Plugin] ${str}`)
        },
        
        // 安全的内存分配
        alloc: (size: number) => {
          const offset = (memory.buffer as any)._allocOffset || 0
          ;(memory.buffer as any)._allocOffset = offset + size
          return offset
        },
        
        // 安全的组件注册
        register_component: (typePtr: number, typeLen: number) => {
          const type = this.readString(memory, typePtr, typeLen)
          console.log(`注册组件类型: ${type}`)
        },
      },
    }
  }

  /**
   * 从内存读取字符串
   */
  private readString(memory: WebAssembly.Memory, ptr: number, len: number): string {
    const buffer = new Uint8Array(memory.buffer, ptr, len)
    return new TextDecoder().decode(buffer)
  }

  /**
   * 验证插件格式
   */
  private validatePlugin(instance: WebAssembly.Instance, name: string): PluginInstance {
    const exports = instance.exports as any
    
    // 检查必需的导出函数
    if (typeof exports.init !== 'function') {
      throw new Error('插件缺少 init 函数')
    }
    if (typeof exports.get_metadata !== 'function') {
      throw new Error('插件缺少 get_metadata 函数')
    }
    if (typeof exports.render !== 'function') {
      throw new Error('插件缺少 render 函数')
    }

    // 调用 init 初始化
    exports.init()
    
    // 获取元数据
    const metadata = exports.get_metadata()
    
    return {
      name,
      instance,
      metadata,
      exports,
      status: 'loaded',
    }
  }

  /**
   * 注册插件到全局组件库
   */
  private registerPlugin(plugin: PluginInstance): void {
    if (plugin.metadata?.components) {
      for (const component of plugin.metadata.components) {
        this.globalExports.set(component.name, {
          type: 'component',
          pluginName: plugin.name,
          component,
        })
      }
    }
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): PluginInstance | undefined {
    return this.plugins.get(name)
  }

  /**
   * 获取所有插件
   */
  listPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 卸载插件
   */
  unloadPlugin(name: string): void {
    const plugin = this.plugins.get(name)
    if (plugin) {
      // 清理注册的组件
      if (plugin.metadata?.components) {
        for (const component of plugin.metadata.components) {
          this.globalExports.delete(component.name)
        }
      }
      
      this.plugins.delete(name)
      this.moduleCache.delete(name)
      
      console.log(`插件已卸载: ${name}`)
    }
  }

  /**
   * 调用插件方法
   */
  callPluginMethod(pluginName: string, methodName: string, ...args: any[]): any {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      throw new Error(`插件不存在: ${pluginName}`)
    }
    
    const method = plugin.exports[methodName]
    if (typeof method !== 'function') {
      throw new Error(`方法不存在: ${methodName}`)
    }
    
    return method(...args)
  }

  /**
   * 获取全局组件库
   */
  getGlobalComponents(): any[] {
    return Array.from(this.globalExports.values())
      .filter(item => item.type === 'component')
  }

  /**
   * 渲染插件组件
   */
  renderComponent(componentName: string, props: Record<string, any>): any {
    const component = this.globalExports.get(componentName)
    if (!component) {
      throw new Error(`组件不存在: ${componentName}`)
    }
    
    const plugin = this.plugins.get(component.pluginName)
    if (!plugin) {
      throw new Error(`插件不存在: ${component.pluginName}`)
    }
    
    return plugin.exports.render(componentName, JSON.stringify(props))
  }
}

/**
 * 插件实例
 */
export interface PluginInstance {
  name: string
  instance: WebAssembly.Instance
  metadata: PluginMetadata
  exports: any
  status: 'loaded' | 'error' | 'unloaded'
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  name: string
  version: string
  description?: string
  author?: string
  components: ComponentMetadata[]
  dependencies?: string[]
}

/**
 * 组件元数据
 */
export interface ComponentMetadata {
  name: string
  type: string
  props: PropDefinition[]
  description?: string
}

/**
 * 属性定义
 */
export interface PropDefinition {
  name: string
  type: string
  required: boolean
  default?: any
  description?: string
}

/**
 * 创建 Wasm 沙盒
 */
export function createWasmSandbox(): WasmSandbox {
  return new WasmSandbox()
}

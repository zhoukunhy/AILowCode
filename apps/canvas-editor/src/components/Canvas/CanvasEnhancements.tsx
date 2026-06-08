/**
 * 画布增强功能
 * - 多选组件
 * - 缩放控制
 * - 快捷键支持
 */

import { useCanvasStore, ComponentConfig } from '@/store/canvasStore'

/**
 * 多选管理器
 */
export class MultiSelectManager {
  private selectedIds: Set<string> = new Set()

  /**
   * 切换选中状态
   */
  toggle(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id)
    } else {
      this.selectedIds.add(id)
    }
  }

  /**
   * 添加到选中
   */
  add(id: string): void {
    this.selectedIds.add(id)
  }

  /**
   * 从选中移除
   */
  remove(id: string): void {
    this.selectedIds.delete(id)
  }

  /**
   * 全选
   */
  selectAll(ids: string[]): void {
    this.selectedIds = new Set(ids)
  }

  /**
   * 清空选择
   */
  clear(): void {
    this.selectedIds.clear()
  }

  /**
   * 是否选中
   */
  isSelected(id: string): boolean {
    return this.selectedIds.has(id)
  }

  /**
   * 获取所有选中的 ID
   */
  getSelected(): string[] {
    return Array.from(this.selectedIds)
  }

  /**
   * 获取选中的组件
   */
  getSelectedComponents(components: ComponentConfig[]): ComponentConfig[] {
    return components.filter(c => this.selectedIds.has(c.id))
  }

  /**
   * 是否有选中
   */
  hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  /**
   * 选中数量
   */
  count(): number {
    return this.selectedIds.size
  }
}

/**
 * 缩放管理器
 */
export class ZoomManager {
  private scale: number = 1
  private minScale: number = 0.1
  private maxScale: number = 3
  private step: number = 0.1

  /**
   * 获取当前缩放
   */
  getScale(): number {
    return this.scale
  }

  /**
   * 设置缩放
   */
  setScale(scale: number): number {
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale))
    return this.scale
  }

  /**
   * 放大
   */
  zoomIn(): number {
    return this.setScale(this.scale + this.step)
  }

  /**
   * 缩小
   */
  zoomOut(): number {
    return this.setScale(this.scale - this.step)
  }

  /**
   * 重置缩放
   */
  reset(): number {
    this.scale = 1
    return this.scale
  }

  /**
   * 适应画布
   */
  fitToScreen(canvasWidth: number, canvasHeight: number, containerWidth: number, containerHeight: number): number {
    const scaleX = containerWidth / canvasWidth
    const scaleY = containerHeight / canvasHeight
    return this.setScale(Math.min(scaleX, scaleY, 1))
  }

  /**
   * 计算缩放后的尺寸
   */
  transformSize(width: number, height: number): { width: number; height: number } {
    return {
      width: width * this.scale,
      height: height * this.scale,
    }
  }
}

/**
 * 快捷键管理器
 */
export class KeyboardManager {
  private handlers: Map<string, Set<() => void>> = new Map()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this))
    }
  }

  /**
   * 注册快捷键
   */
  register(key: string, handler: () => void): void {
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set())
    }
    this.handlers.get(key)!.add(handler)
  }

  /**
   * 注销快捷键
   */
  unregister(key: string, handler: () => void): void {
    this.handlers.get(key)?.delete(handler)
  }

  /**
   * 处理按键
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const key = this.getKeyString(e)
    const handlers = this.handlers.get(key)
    if (handlers) {
      handlers.forEach(handler => handler())
    }
  }

  /**
   * 获取按键字符串
   */
  private getKeyString(e: KeyboardEvent): string {
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')
    parts.push(e.key.toLowerCase())
    return parts.join('+')
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    }
    this.handlers.clear()
  }
}

/**
 * 创建画布 hook 增强
 */
export function useCanvasEnhancements() {
  const store = useCanvasStore()
  const multiSelect = new MultiSelectManager()
  const zoom = new ZoomManager()

  // 多选相关
  const toggleMultiSelect = (id: string, e?: KeyboardEvent) => {
    if (e?.ctrlKey || e?.metaKey) {
      multiSelect.toggle(id)
      const selected = multiSelect.getSelected()
      if (selected.length === 1) {
        store.selectComponent(selected[0])
      }
    } else {
      multiSelect.clear()
      multiSelect.add(id)
      store.selectComponent(id)
    }
  }

  const selectAll = () => {
    const ids = store.components.map(c => c.id)
    multiSelect.selectAll(ids)
    store.selectComponent(ids[0] || null)
  }

  const clearSelection = () => {
    multiSelect.clear()
    store.selectComponent(null)
  }

  const deleteSelected = () => {
    const selected = multiSelect.getSelected()
    selected.forEach(id => store.removeComponent(id))
    clearSelection()
  }

  // 组合选中组件
  const groupSelected = () => {
    const selected = multiSelect.getSelectedComponents(store.components)
    if (selected.length < 2) return

    // 计算边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    selected.forEach(comp => {
      minX = Math.min(minX, comp.x)
      minY = Math.min(minY, comp.y)
      maxX = Math.max(maxX, comp.x + comp.width)
      maxY = Math.max(maxY, comp.y + comp.height)
    })

    // 创建组合组件
    const groupWidth = maxX - minX
    const groupHeight = maxY - minY

    // 更新选中组件的位置（相对于组合）
    selected.forEach(comp => {
      store.updateComponent(comp.id, {
        x: comp.x - minX,
        y: comp.y - minY,
      })
    })

    // TODO: 创建组合组件
    console.log('组合组件:', { x: minX, y: minY, width: groupWidth, height: groupHeight })
  }

  // 快捷键处理
  const setupKeyboardShortcuts = () => {
    const keyboard = new KeyboardManager()

    // Delete/Backspace 删除选中
    keyboard.register('delete', deleteSelected)
    keyboard.register('backspace', deleteSelected)

    // Ctrl+A 全选
    keyboard.register('ctrl+a', () => {
      selectAll()
    })

    // Escape 取消选择
    keyboard.register('escape', clearSelection)

    // Ctrl+G 组合
    keyboard.register('ctrl+g', groupSelected)

    // Ctrl+Z 撤销 (TODO)

    // Ctrl+C 复制 (TODO)

    // Ctrl+V 粘贴 (TODO)

    return keyboard
  }

  return {
    multiSelect,
    zoom,
    toggleMultiSelect,
    selectAll,
    clearSelection,
    deleteSelected,
    groupSelected,
    setupKeyboardShortcuts,
  }
}

/**
 * 拖拽辅助函数
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

/**
 * 计算组件边界
 */
export function calculateBounds(components: ComponentConfig[]): {
  x: number
  y: number
  width: number
  height: number
} {
  if (components.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  components.forEach(comp => {
    minX = Math.min(minX, comp.x)
    minY = Math.min(minY, comp.y)
    maxX = Math.max(maxX, comp.x + comp.width)
    maxY = Math.max(maxY, comp.y + comp.height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * 检测组件碰撞
 */
export function checkCollision(comp1: ComponentConfig, comp2: ComponentConfig): boolean {
  return !(
    comp1.x + comp1.width <= comp2.x ||
    comp2.x + comp2.width <= comp1.x ||
    comp1.y + comp1.height <= comp2.y ||
    comp2.y + comp2.height <= comp1.y
  )
}

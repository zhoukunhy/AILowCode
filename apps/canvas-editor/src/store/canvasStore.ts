import { create } from 'zustand'
import { generateId } from '@ai-lowcode/common-util'

// 组件配置类型
export interface ComponentConfig {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  props: Record<string, any>
  zIndex: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
}

// 组件元数据类型
export interface ComponentMeta {
  type: string
  name: string
  icon: string
  defaultWidth: number
  defaultHeight: number
  defaultProps: Record<string, any>
  schema: any // JSON Schema配置
}

// 页面配置类型
export interface PageConfig {
  id: string
  name: string
  width: number
  height: number
  gridSize: number
  snapToGrid: boolean
  showGrid: boolean
  showRulers: boolean
  backgroundColor: string
}

// 项目配置类型
export interface ProjectConfig {
  id: string | null
  name: string
  pages: PageConfig[]
  currentPageId: string
  createdAt: Date | null
  updatedAt: Date | null
  isDirty: boolean
}

// 完整的画布状态类型
interface CanvasState {
  project: ProjectConfig
  currentPage: PageConfig
  components: ComponentConfig[]
  selectedId: string | null
  componentList: ComponentMeta[]
  // 组件操作
  addComponent: (componentType: string, x: number, y: number) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<ComponentConfig>) => void
  updateComponentProps: (id: string, props: Record<string, any>) => void
  selectComponent: (id: string | null) => void
  moveComponentToFront: (id: string) => void
  moveComponentToBack: (id: string) => void
  moveComponentUp: (id: string) => void
  moveComponentDown: (id: string) => void
  // 页面操作
  newPage: () => void
  switchPage: (pageId: string) => void
  updateCurrentPage: (updates: Partial<PageConfig>) => void
  // 项目操作
  newProject: () => void
  saveProject: () => Promise<void>
  saveProjectAs: (name: string) => Promise<void>
  loadProject: (projectId: string) => Promise<void>
  autoSave: () => Promise<void>
  setProjectDirty: (isDirty: boolean) => void
}

// 组件元数据列表
const DEFAULT_COMPONENT_LIST: ComponentMeta[] = [
  {
    type: 'button',
    name: '按钮',
    icon: '🔘',
    defaultWidth: 120,
    defaultHeight: 40,
    defaultProps: { text: '按钮', type: 'primary', disabled: false },
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', title: '文本内容' },
        type: { 
          type: 'string', 
          title: '按钮类型',
          enum: ['primary', 'default', 'ghost', 'dashed', 'text', 'link']
        },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'input',
    name: '输入框',
    icon: '📝',
    defaultWidth: 200,
    defaultHeight: 32,
    defaultProps: { placeholder: '请输入', value: '', disabled: false },
    schema: {
      type: 'object',
      properties: {
        placeholder: { type: 'string', title: '占位文本' },
        value: { type: 'string', title: '默认值' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'text',
    name: '文本',
    icon: '📄',
    defaultWidth: 200,
    defaultHeight: 30,
    defaultProps: { content: '文本内容', fontSize: 14, fontWeight: 'normal', color: '#333' },
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', title: '文本内容' },
        fontSize: { type: 'number', title: '字号' },
        fontWeight: { 
          type: 'string', 
          title: '字重',
          enum: ['normal', 'bold']
        },
        color: { type: 'string', title: '颜色' },
      },
    },
  },
  {
    type: 'card',
    name: '卡片',
    icon: '🃏',
    defaultWidth: 300,
    defaultHeight: 200,
    defaultProps: { title: '卡片标题', content: '卡片内容' },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '标题' },
        content: { type: 'string', title: '内容' },
      },
    },
  },
  {
    type: 'radio',
    name: '单选框',
    icon: '🔘',
    defaultWidth: 150,
    defaultHeight: 30,
    defaultProps: { label: '选项', value: false },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签' },
        value: { type: 'boolean', title: '选中状态' },
      },
    },
  },
  {
    type: 'table',
    name: '表格',
    icon: '📊',
    defaultWidth: 500,
    defaultHeight: 300,
    defaultProps: { columns: 3, rows: 5, data: [] },
    schema: {
      type: 'object',
      properties: {
        columns: { type: 'number', title: '列数' },
        rows: { type: 'number', title: '行数' },
      },
    },
  },
  {
    type: 'modal',
    name: '弹窗',
    icon: '🪟',
    defaultWidth: 400,
    defaultHeight: 300,
    defaultProps: { title: '弹窗标题', visible: true },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '标题' },
        visible: { type: 'boolean', title: '显示状态' },
      },
    },
  },
]

// 默认页面配置
const DEFAULT_PAGE_CONFIG: PageConfig = {
  id: generateId(),
  name: '页面 1',
  width: 800,
  height: 600,
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  showRulers: true,
  backgroundColor: '#ffffff',
}

// 默认项目配置
const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  id: null,
  name: '未命名项目',
  pages: [DEFAULT_PAGE_CONFIG],
  currentPageId: DEFAULT_PAGE_CONFIG.id,
  createdAt: null,
  updatedAt: null,
  isDirty: false,
}

// 创建Zustand store
export const useCanvasStore = create<CanvasState>((set, get) => ({
  project: DEFAULT_PROJECT_CONFIG,
  currentPage: DEFAULT_PAGE_CONFIG,
  components: [],
  selectedId: null,
  componentList: DEFAULT_COMPONENT_LIST,

  // 添加组件到画布
  addComponent: (componentType: string, x: number, y: number) => {
    const { componentList, components, currentPage } = get()
    const meta = componentList.find(m => m.type === componentType)
    if (!meta) return

    // 计算栅格对齐
    let finalX = x
    let finalY = y
    if (currentPage.snapToGrid) {
      finalX = Math.round(x / currentPage.gridSize) * currentPage.gridSize
      finalY = Math.round(y / currentPage.gridSize) * currentPage.gridSize
    }

    const newComponent: ComponentConfig = {
      id: generateId(),
      type: componentType,
      name: meta.name,
      x: finalX,
      y: finalY,
      width: meta.defaultWidth,
      height: meta.defaultHeight,
      props: { ...meta.defaultProps },
      zIndex: components.length + 1,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    }

    set((state) => ({
      components: [...state.components, newComponent],
      selectedId: newComponent.id,
      project: { ...state.project, isDirty: true },
    }))
  },

  // 删除组件
  removeComponent: (id: string) => {
    set((state) => {
      const newComponents = state.components.filter(c => c.id !== id)
      // 重新计算zIndex
      const sortedComponents = [...newComponents].sort((a, b) => a.zIndex - b.zIndex)
      sortedComponents.forEach((c, idx) => c.zIndex = idx + 1)
      
      return {
        components: sortedComponents,
        selectedId: state.selectedId === id ? null : state.selectedId,
        project: { ...state.project, isDirty: true },
      }
    })
  },

  // 更新组件
  updateComponent: (id: string, updates: Partial<ComponentConfig>) => {
    set((state) => ({
      components: state.components.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 更新组件属性
  updateComponentProps: (id: string, props: Record<string, any>) => {
    set((state) => ({
      components: state.components.map(c => 
        c.id === id ? { ...c, props: { ...c.props, ...props } } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 选中组件
  selectComponent: (id: string | null) => {
    set({ selectedId: id })
  },

  // 组件置顶
  moveComponentToFront: (id: string) => {
    const { components } = get()
    const maxZIndex = Math.max(...components.map(c => c.zIndex))
    set((state) => ({
      components: state.components.map(c => 
        c.id === id ? { ...c, zIndex: maxZIndex + 1 } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 组件置底
  moveComponentToBack: (id: string) => {
    const { components } = get()
    const minZIndex = Math.min(...components.map(c => c.zIndex))
    set((state) => ({
      components: state.components.map(c => 
        c.id === id ? { ...c, zIndex: minZIndex - 1 } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 上移一层
  moveComponentUp: (id: string) => {
    const { components } = get()
    const currentComponent = components.find(c => c.id === id)
    if (!currentComponent) return

    set((state) => {
      const sortedComponents = [...state.components].sort((a, b) => a.zIndex - b.zIndex)
      const currentIndex = sortedComponents.findIndex(c => c.id === id)
      
      if (currentIndex < sortedComponents.length - 1) {
        const nextComponent = sortedComponents[currentIndex + 1]
        const tempZIndex = currentComponent.zIndex
        sortedComponents[currentIndex] = { ...currentComponent, zIndex: nextComponent.zIndex }
        sortedComponents[currentIndex + 1] = { ...nextComponent, zIndex: tempZIndex }
      }

      return {
        components: sortedComponents,
        project: { ...state.project, isDirty: true },
      }
    })
  },

  // 下移一层
  moveComponentDown: (id: string) => {
    const { components } = get()
    const currentComponent = components.find(c => c.id === id)
    if (!currentComponent) return

    set((state) => {
      const sortedComponents = [...state.components].sort((a, b) => a.zIndex - b.zIndex)
      const currentIndex = sortedComponents.findIndex(c => c.id === id)
      
      if (currentIndex > 0) {
        const prevComponent = sortedComponents[currentIndex - 1]
        const tempZIndex = currentComponent.zIndex
        sortedComponents[currentIndex] = { ...currentComponent, zIndex: prevComponent.zIndex }
        sortedComponents[currentIndex - 1] = { ...prevComponent, zIndex: tempZIndex }
      }

      return {
        components: sortedComponents,
        project: { ...state.project, isDirty: true },
      }
    })
  },

  // 新建页面
  newPage: () => {
    const pageId = generateId()
    set((state) => ({
      project: {
        ...state.project,
        pages: [
          ...state.project.pages,
          {
            ...DEFAULT_PAGE_CONFIG,
            id: pageId,
            name: `页面 ${state.project.pages.length + 1}`,
          },
        ],
        currentPageId: pageId,
        isDirty: true,
      },
      currentPage: {
        ...DEFAULT_PAGE_CONFIG,
        id: pageId,
        name: `页面 ${state.project.pages.length + 1}`,
      },
      components: [],
    }))
  },

  // 切换页面
  switchPage: (pageId: string) => {
    const { project } = get()
    const page = project.pages.find(p => p.id === pageId)
    if (!page) return

    set((state) => ({
      project: { ...state.project, currentPageId: pageId },
      currentPage: page,
      components: [],
      selectedId: null,
    }))
  },

  // 更新当前页面
  updateCurrentPage: (updates: Partial<PageConfig>) => {
    set((state) => {
      const updatedPage = { ...state.currentPage, ...updates }
      const updatedPages = state.project.pages.map(p => 
        p.id === state.project.currentPageId ? updatedPage : p
      )

      return {
        currentPage: updatedPage,
        project: {
          ...state.project,
          pages: updatedPages,
          isDirty: true,
        },
      }
    })
  },

  // 新建项目
  newProject: () => {
    const newProject = { ...DEFAULT_PROJECT_CONFIG }
    set(() => ({
      project: newProject,
      currentPage: newProject.pages[0],
      components: [],
      selectedId: null,
    }))
  },

  // 保存项目
  saveProject: async () => {
    const { project, components, currentPage } = get()
    try {
      // 这里调用后端API保存项目
      console.log('保存项目:', { project, components, currentPage })
      set((state) => ({
        project: {
          ...state.project,
          updatedAt: new Date(),
          isDirty: false,
        },
      }))
    } catch (error) {
      console.error('保存项目失败:', error)
      throw error
    }
  },

  // 另存为项目
  saveProjectAs: async (name: string) => {
    const { components, currentPage } = get()
    try {
      // 这里调用后端API另存为项目
      console.log('另存为项目:', { name, components, currentPage })
      set((state) => ({
        project: {
          ...state.project,
          id: generateId(),
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDirty: false,
        },
      }))
    } catch (error) {
      console.error('另存为项目失败:', error)
      throw error
    }
  },

  // 加载项目
  loadProject: async (projectId: string) => {
    try {
      // 这里调用后端API加载项目
      console.log('加载项目:', projectId)
    } catch (error) {
      console.error('加载项目失败:', error)
      throw error
    }
  },

  // 自动保存
  autoSave: async () => {
    const { project } = get()
    if (!project.isDirty) return
    try {
      await get().saveProject()
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  },

  // 设置项目脏状态
  setProjectDirty: (isDirty: boolean) => {
    set((state) => ({
      project: { ...state.project, isDirty },
    }))
  },
}))

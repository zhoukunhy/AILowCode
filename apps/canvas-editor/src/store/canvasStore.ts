import { createStore } from 'zustand/vanilla'
import { generateId } from '@ai-lowcode/common-util'
import { canvasPageApi } from '../lib/api'
import { generateCanvasCode } from '../utils/codeGenerator'

export interface ConditionalRenderConfig {
  enabled: boolean
  condition: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'isEmpty' | 'isNotEmpty'
  leftValue: string
  rightValue: string
  showIfTrue: boolean
}

export interface LoopRenderConfig {
  enabled: boolean
  dataSource: string
  itemKey: string
  itemName: string
}

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
  customComponentId?: string
  hasAnimation?: boolean
  hasInteractiveState?: boolean
  conditionalRender?: ConditionalRenderConfig
  loopRender?: LoopRenderConfig
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

export interface BreakpointConfig {
  name: string
  minWidth: number
  maxWidth: number
  icon: string
}

export interface ResponsiveLayoutConfig {
  enabled: boolean
  breakpoints: BreakpointConfig[]
  currentBreakpoint: string
}

export const DEFAULT_BREAKPOINTS: BreakpointConfig[] = [
  { name: 'xs', minWidth: 0, maxWidth: 576, icon: '📱' },
  { name: 'sm', minWidth: 576, maxWidth: 768, icon: '📲' },
  { name: 'md', minWidth: 768, maxWidth: 992, icon: '💻' },
  { name: 'lg', minWidth: 992, maxWidth: 1200, icon: '🖥️' },
  { name: 'xl', minWidth: 1200, maxWidth: Infinity, icon: '🖼️' },
]

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
  responsiveLayout?: ResponsiveLayoutConfig
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

// 弹窗状态类型
interface ModalState {
  visible: boolean
  title: string
  content: string
  closable: boolean
}

export interface EnumOption {
  label: string
  value: string | number
  color?: string
}

export interface EnumDefinition {
  id: string
  name: string
  label: string
  options: EnumOption[]
}

export interface ValidationRule {
  id: string
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 
        'pattern' | 'email' | 'phone' | 'url' | 'custom'
  value?: string | number
  message: string
}

export interface DataPermission {
  id: string
  roleId: string
  roleName: string
  permissionType: 'read' | 'write' | 'delete' | 'manage'
}

export interface Field {
  id: string
  name: string
  label: string
  type: 'string' | 'number' | 'integer' | 'bigint' | 'smallint' |
        'decimal' | 'float' | 'double' | 'boolean' | 'date' | 'datetime' | 
        'timestamp' | 'text' | 'email' | 'phone' | 'password' | 'select' | 
        'textarea' | 'json' | 'uuid' | 'enum'
  required: boolean
  primaryKey: boolean
  unique: boolean
  index: boolean
  foreignKey?: {
    entityId: string
    fieldId: string
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  }
  defaultValue?: string | number | boolean
  length?: number
  precision?: number
  scale?: number
  options?: EnumOption[]
  enumId?: string
  validationRules: ValidationRule[]
  dataPermissions: DataPermission[]
  description?: string
}

export interface Entity {
  id: string
  name: string
  tableName: string
  description: string
  fields: Field[]
  dataPermissions: DataPermission[]
  softDelete: boolean
  createdAtField: boolean
  updatedAtField: boolean
}

export interface Relation {
  id: string
  name: string
  sourceEntityId: string
  sourceFieldId?: string
  targetEntityId: string
  targetFieldId?: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  cascade?: boolean
}

export interface DataModel {
  id: string
  name: string
  description: string
  entities: Entity[]
  relations: Relation[]
  enums: EnumDefinition[]
}

// 完整的画布状态类型
export interface CanvasState {
  project: ProjectConfig
  currentPage: PageConfig
  components: ComponentConfig[]
  selectedId: string | null
  selectedIds: string[]
  componentList: ComponentMeta[]
  zoom: number
  zoomPosition: { x: number; y: number }
  // 弹窗状态
  modal: ModalState
  // 数据模型
  dataModels: DataModel[]
  // 组件操作
  addComponent: (componentType: string, x: number, y: number) => void
  addComponentsBatch: (components: ComponentConfig[]) => void
  removeComponent: (id: string) => void
  clearCanvas: () => void
  updateComponent: (id: string, updates: Partial<ComponentConfig>) => void
  updateComponentProps: (id: string, props: Record<string, any>) => void
  selectComponent: (id: string | null, multiSelect?: boolean) => void
  selectComponents: (ids: string[]) => void
  addToSelection: (id: string) => void
  removeFromSelection: (id: string) => void
  clearSelection: () => void
  moveComponentToFront: (id: string) => void
  moveComponentToBack: (id: string) => void
  moveComponentUp: (id: string) => void
  moveComponentDown: (id: string) => void
  // 对齐操作
  alignLeft: () => void
  alignRight: () => void
  alignTop: () => void
  alignBottom: () => void
  alignCenter: () => void
  alignMiddle: () => void
  // 缩放操作
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setZoom: (zoom: number, position?: { x: number; y: number }) => void
  // 页面操作
  newPage: () => void
  switchPage: (pageId: string) => void
  updateCurrentPage: (updates: Partial<PageConfig>) => void
  // 项目操作
  newProject: () => void
  saveProject: (name?: string) => Promise<{ success: boolean; id?: string }>
  saveProjectAs: (name: string) => Promise<void>
  loadProject: (projectId: string) => Promise<void>
  autoSave: () => Promise<void>
  setProjectDirty: (isDirty: boolean) => void
  // 导入导出
  exportCanvasJson: () => string
  importCanvasJson: (json: string) => void
  importCanvasSchema: (schema: any) => void
  // 代码生成
  generateCode: () => { files: { path: string; content: string }[] }
  // 弹窗操作
  openModal: (title: string, content: string, closable?: boolean) => void
  closeModal: () => void
  // 数据模型操作
  addDataModel: (model: DataModel) => void
  updateDataModel: (modelId: string, updates: Partial<DataModel>) => void
  deleteDataModel: (modelId: string) => void
}

// 组件元数据列表
const DEFAULT_COMPONENT_LIST: ComponentMeta[] = [
  // ============ 表单组件 ============
  {
    type: 'button',
    name: '按钮',
    icon: '🔘',
    defaultWidth: 120,
    defaultHeight: 40,
    defaultProps: { text: '提交', type: 'primary', disabled: false, openModal: false, modalTitle: '弹窗标题', modalContent: '弹窗内容' },
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', title: '按钮文本' },
        type: { 
          type: 'string', 
          title: '按钮类型',
          enum: ['primary', 'default', 'ghost', 'dashed', 'text', 'link']
        },
        disabled: { type: 'boolean', title: '禁用状态' },
        openModal: { type: 'boolean', title: '点击打开弹窗' },
        modalTitle: { type: 'string', title: '弹窗标题' },
        modalContent: { type: 'string', title: '弹窗内容' },
      },
    },
  },
  {
    type: 'input',
    name: '输入框',
    icon: '📝',
    defaultWidth: 240,
    defaultHeight: 40,
    defaultProps: { 
      label: '标签', 
      placeholder: '请输入内容', 
      value: '', 
      disabled: false,
      required: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        value: { type: 'string', title: '默认值' },
        disabled: { type: 'boolean', title: '禁用状态' },
        required: { type: 'boolean', title: '必填' },
      },
    },
  },
  {
    type: 'textarea',
    name: '文本域',
    icon: '📄',
    defaultWidth: 300,
    defaultHeight: 100,
    defaultProps: { 
      label: '文本域标签', 
      placeholder: '请输入多行文本...', 
      rows: 4,
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        rows: { type: 'number', title: '行数' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'select',
    name: '下拉选择',
    icon: '🔽',
    defaultWidth: 240,
    defaultHeight: 40,
    defaultProps: { 
      label: '选择标签', 
      placeholder: '请选择',
      options: ['选项1', '选项2', '选项3'],
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        options: { type: 'array', title: '选项列表' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'checkbox',
    name: '复选框',
    icon: '☑️',
    defaultWidth: 200,
    defaultHeight: 32,
    defaultProps: { 
      label: '复选框标签', 
      checked: false,
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        checked: { type: 'boolean', title: '选中状态' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'radio',
    name: '单选框',
    icon: '🔘',
    defaultWidth: 200,
    defaultHeight: 32,
    defaultProps: { 
      label: '单选框标签', 
      options: ['选项A', '选项B'],
      value: '选项A',
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        options: { type: 'array', title: '选项列表' },
        value: { type: 'string', title: '选中值' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'switch',
    name: '开关',
    icon: '🔌',
    defaultWidth: 60,
    defaultHeight: 32,
    defaultProps: { 
      label: '开关标签', 
      checked: false,
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        checked: { type: 'boolean', title: '开关状态' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'datepicker',
    name: '日期选择',
    icon: '📅',
    defaultWidth: 240,
    defaultHeight: 40,
    defaultProps: { 
      label: '日期标签', 
      placeholder: '选择日期',
      format: 'YYYY-MM-DD',
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        format: { type: 'string', title: '日期格式' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'daterange',
    name: '日期范围',
    icon: '📆',
    defaultWidth: 300,
    defaultHeight: 40,
    defaultProps: { 
      label: '日期范围标签', 
      placeholder: '选择日期范围',
      format: 'YYYY-MM-DD',
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        format: { type: 'string', title: '日期格式' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'timepicker',
    name: '时间选择',
    icon: '⏰',
    defaultWidth: 200,
    defaultHeight: 40,
    defaultProps: { 
      label: '时间标签', 
      placeholder: '选择时间',
      format: 'HH:mm:ss',
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        format: { type: 'string', title: '时间格式' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'numberInput',
    name: '数字输入',
    icon: '🔢',
    defaultWidth: 200,
    defaultHeight: 40,
    defaultProps: { 
      label: '数字标签', 
      placeholder: '请输入数字',
      min: 0,
      max: 100,
      step: 1,
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        min: { type: 'number', title: '最小值' },
        max: { type: 'number', title: '最大值' },
        step: { type: 'number', title: '步进值' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'passwordInput',
    name: '密码输入',
    icon: '🔐',
    defaultWidth: 240,
    defaultHeight: 40,
    defaultProps: { 
      label: '密码标签', 
      placeholder: '请输入密码',
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'emailInput',
    name: '邮箱输入',
    icon: '📧',
    defaultWidth: 240,
    defaultHeight: 40,
    defaultProps: { 
      label: '邮箱标签', 
      placeholder: '请输入邮箱',
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'phoneInput',
    name: '手机号码',
    icon: '📱',
    defaultWidth: 240,
    defaultHeight: 40,
    defaultProps: { 
      label: '手机标签', 
      placeholder: '请输入手机号',
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'upload',
    name: '文件上传',
    icon: '📤',
    defaultWidth: 240,
    defaultHeight: 100,
    defaultProps: { 
      label: '上传标签', 
      placeholder: '点击或拖拽文件到此处上传',
      accept: '*',
      multiple: false,
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '提示文本' },
        accept: { type: 'string', title: '接受文件类型' },
        multiple: { type: 'boolean', title: '多文件上传' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'slider',
    name: '滑块',
    icon: '🎚️',
    defaultWidth: 300,
    defaultHeight: 40,
    defaultProps: { 
      label: '滑块标签', 
      min: 0,
      max: 100,
      value: 50,
      step: 1,
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        min: { type: 'number', title: '最小值' },
        max: { type: 'number', title: '最大值' },
        value: { type: 'number', title: '当前值' },
        step: { type: 'number', title: '步进值' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'rate',
    name: '评分',
    icon: '⭐',
    defaultWidth: 200,
    defaultHeight: 40,
    defaultProps: { 
      label: '评分标签', 
      count: 5,
      value: 0,
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        count: { type: 'number', title: '星星数量' },
        value: { type: 'number', title: '当前评分' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'cascader',
    name: '级联选择',
    icon: '🌲',
    defaultWidth: 240,
    defaultHeight: 40,
    defaultProps: { 
      label: '级联标签', 
      placeholder: '请选择',
      options: [
        { label: '选项1', value: '1', children: [{ label: '子选项1.1', value: '1.1' }] },
        { label: '选项2', value: '2' },
      ],
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        placeholder: { type: 'string', title: '占位文本' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'transfer',
    name: '穿梭框',
    icon: '↔️',
    defaultWidth: 400,
    defaultHeight: 300,
    defaultProps: { 
      label: '穿梭框标签', 
      options: ['选项1', '选项2', '选项3', '选项4'],
      targetKeys: [],
      disabled: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        options: { type: 'array', title: '选项列表' },
        targetKeys: { type: 'array', title: '已选中的键' },
        disabled: { type: 'boolean', title: '禁用状态' },
      },
    },
  },
  {
    type: 'form',
    name: '表单容器',
    icon: '📋',
    defaultWidth: 500,
    defaultHeight: 400,
    defaultProps: { 
      title: '表单标题', 
      layout: 'vertical',
      colon: true,
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '表单标题' },
        layout: { 
          type: 'string', 
          title: '布局方式',
          enum: ['horizontal', 'vertical', 'inline']
        },
        colon: { type: 'boolean', title: '显示冒号' },
      },
    },
  },
  // ============ 列表组件 ============
  {
    type: 'table',
    name: '数据表格',
    icon: '📊',
    defaultWidth: 600,
    defaultHeight: 300,
    defaultProps: { 
      title: '数据列表',
      columns: 4,
      rows: 5,
      bordered: true,
      striped: true,
      hoverable: true,
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '表格标题' },
        columns: { type: 'number', title: '列数' },
        rows: { type: 'number', title: '行数' },
        bordered: { type: 'boolean', title: '显示边框' },
        striped: { type: 'boolean', title: '斑马纹' },
        hoverable: { type: 'boolean', title: '悬停高亮' },
      },
    },
  },
  {
    type: 'list',
    name: '列表',
    icon: '📝',
    defaultWidth: 400,
    defaultHeight: 300,
    defaultProps: { 
      title: '列表标题',
      items: ['列表项1', '列表项2', '列表项3'],
      bordered: true,
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '列表标题' },
        items: { type: 'array', title: '列表项' },
        bordered: { type: 'boolean', title: '显示边框' },
      },
    },
  },
  {
    type: 'pagination',
    name: '分页',
    icon: '📄',
    defaultWidth: 600,
    defaultHeight: 48,
    defaultProps: { 
      total: 100,
      pageSize: 10,
      current: 1,
      showSizeChanger: true,
      showQuickJumper: true,
    },
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', title: '总条数' },
        pageSize: { type: 'number', title: '每页条数' },
        current: { type: 'number', title: '当前页' },
        showSizeChanger: { type: 'boolean', title: '显示条数切换' },
        showQuickJumper: { type: 'boolean', title: '显示快速跳转' },
      },
    },
  },
  {
    type: 'tabs',
    name: '标签页',
    icon: '📑',
    defaultWidth: 500,
    defaultHeight: 250,
    defaultProps: { 
      tabPosition: 'top',
      tabs: ['标签页1', '标签页2', '标签页3'],
      activeTab: 0,
    },
    schema: {
      type: 'object',
      properties: {
        tabPosition: { 
          type: 'string', 
          title: '标签位置',
          enum: ['top', 'bottom', 'left', 'right']
        },
        tabs: { type: 'array', title: '标签列表' },
        activeTab: { type: 'number', title: '当前标签索引' },
      },
    },
  },
  {
    type: 'steps',
    name: '步骤条',
    icon: '🔢',
    defaultWidth: 600,
    defaultHeight: 80,
    defaultProps: { 
      current: 1,
      steps: ['步骤1', '步骤2', '步骤3'],
      direction: 'horizontal',
      size: 'default',
    },
    schema: {
      type: 'object',
      properties: {
        current: { type: 'number', title: '当前步骤' },
        steps: { type: 'array', title: '步骤列表' },
        direction: { 
          type: 'string', 
          title: '方向',
          enum: ['horizontal', 'vertical']
        },
        size: { 
          type: 'string', 
          title: '尺寸',
          enum: ['default', 'small']
        },
      },
    },
  },
  {
    type: 'timeline',
    name: '时间线',
    icon: '⏱️',
    defaultWidth: 400,
    defaultHeight: 250,
    defaultProps: { 
      items: [
        { title: '2024-01-01', content: '事件1' },
        { title: '2024-01-02', content: '事件2' },
        { title: '2024-01-03', content: '事件3' },
      ],
    },
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', title: '时间线项' },
      },
    },
  },
  {
    type: 'tree',
    name: '树形控件',
    icon: '🌳',
    defaultWidth: 300,
    defaultHeight: 250,
    defaultProps: { 
      title: '树形结构',
      checkable: true,
      showLine: true,
      treeData: [
        {
          key: '1',
          title: '根节点',
          children: [
            { key: '1-1', title: '子节点1' },
            { key: '1-2', title: '子节点2' },
          ],
        },
      ],
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '标题' },
        checkable: { type: 'boolean', title: '可选中' },
        showLine: { type: 'boolean', title: '显示连接线' },
        treeData: { type: 'array', title: '树形数据' },
      },
    },
  },
  {
    type: 'carousel',
    name: '轮播图',
    icon: '🎠',
    defaultWidth: 600,
    defaultHeight: 300,
    defaultProps: { 
      autoplay: true,
      dotPosition: 'bottom',
      effect: 'scrollx',
      images: [
        { url: 'https://via.placeholder.com/600x300?text=Slide+1', title: '轮播图1' },
        { url: 'https://via.placeholder.com/600x300?text=Slide+2', title: '轮播图2' },
        { url: 'https://via.placeholder.com/600x300?text=Slide+3', title: '轮播图3' },
      ],
    },
    schema: {
      type: 'object',
      properties: {
        autoplay: { type: 'boolean', title: '自动播放' },
        dotPosition: { 
          type: 'string', 
          title: '指示器位置',
          enum: ['top', 'bottom', 'left', 'right']
        },
        effect: { 
          type: 'string', 
          title: '切换效果',
          enum: ['scrollx', 'fade']
        },
        images: { type: 'array', title: '图片列表' },
      },
    },
  },
  // ============ 基础组件 ============
  {
    type: 'text',
    name: '文本',
    icon: '🔤',
    defaultWidth: 200,
    defaultHeight: 30,
    defaultProps: { 
      content: '文本内容', 
      fontSize: 14, 
      fontWeight: 'normal', 
      color: '#333',
      textAlign: 'left',
    },
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
        textAlign: {
          type: 'string',
          title: '文本对齐',
          enum: ['left', 'center', 'right']
        },
      },
    },
  },
  {
    type: 'heading',
    name: '标题',
    icon: '📌',
    defaultWidth: 200,
    defaultHeight: 40,
    defaultProps: { 
      content: '标题文本', 
      level: 1,
      color: '#333',
    },
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', title: '标题内容' },
        level: { 
          type: 'number', 
          title: '标题级别',
          enum: [1, 2, 3, 4, 5, 6]
        },
        color: { type: 'string', title: '颜色' },
      },
    },
  },
  {
    type: 'image',
    name: '图片',
    icon: '🖼️',
    defaultWidth: 200,
    defaultHeight: 150,
    defaultProps: { 
      src: '',
      alt: '图片描述',
      fit: 'cover',
    },
    schema: {
      type: 'object',
      properties: {
        src: { type: 'string', title: '图片地址' },
        alt: { type: 'string', title: '图片描述' },
        fit: { 
          type: 'string', 
          title: '填充方式',
          enum: ['cover', 'contain', 'fill', 'none']
        },
      },
    },
  },
  {
    type: 'card',
    name: '卡片',
    icon: '🃏',
    defaultWidth: 300,
    defaultHeight: 200,
    defaultProps: { 
      title: '卡片标题', 
      content: '卡片内容区域，可以放置文本、图片等内容',
      bordered: true,
      hoverable: true,
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '标题' },
        content: { type: 'string', title: '内容' },
        bordered: { type: 'boolean', title: '显示边框' },
        hoverable: { type: 'boolean', title: '悬停效果' },
      },
    },
  },
  {
    type: 'divider',
    name: '分割线',
    icon: '➖',
    defaultWidth: 400,
    defaultHeight: 20,
    defaultProps: { 
      orientation: 'center',
      type: 'horizontal',
    },
    schema: {
      type: 'object',
      properties: {
        orientation: { 
          type: 'string', 
          title: '文字位置',
          enum: ['left', 'center', 'right']
        },
        type: { 
          type: 'string', 
          title: '方向',
          enum: ['horizontal', 'vertical']
        },
      },
    },
  },
  {
    type: 'space',
    name: '间距',
    icon: '📏',
    defaultWidth: 200,
    defaultHeight: 40,
    defaultProps: { 
      direction: 'horizontal',
      size: 'middle',
    },
    schema: {
      type: 'object',
      properties: {
        direction: { 
          type: 'string', 
          title: '方向',
          enum: ['horizontal', 'vertical']
        },
        size: { 
          type: 'string', 
          title: '间距大小',
          enum: ['small', 'middle', 'large']
        },
      },
    },
  },
  {
    type: 'avatar',
    name: '头像',
    icon: '👤',
    defaultWidth: 48,
    defaultHeight: 48,
    defaultProps: { 
      src: '',
      size: 'default',
      shape: 'circle',
    },
    schema: {
      type: 'object',
      properties: {
        src: { type: 'string', title: '头像地址' },
        size: { 
          type: 'string', 
          title: '尺寸',
          enum: ['small', 'default', 'large']
        },
        shape: { 
          type: 'string', 
          title: '形状',
          enum: ['circle', 'square']
        },
      },
    },
  },
  {
    type: 'tag',
    name: '标签',
    icon: '🏷️',
    defaultWidth: 80,
    defaultHeight: 28,
    defaultProps: { 
      label: '标签',
      color: 'blue',
      closable: false,
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '标签文本' },
        color: { type: 'string', title: '颜色' },
        closable: { type: 'boolean', title: '可关闭' },
      },
    },
  },
  {
    type: 'badge',
    name: '徽标',
    icon: '🔴',
    defaultWidth: 48,
    defaultHeight: 48,
    defaultProps: { 
      count: 5,
      dot: false,
      status: 'success',
    },
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', title: '数量' },
        dot: { type: 'boolean', title: '小红点' },
        status: { 
          type: 'string', 
          title: '状态',
          enum: ['success', 'processing', 'default', 'error', 'warning']
        },
      },
    },
  },
  {
    type: 'alert',
    name: '警告提示',
    icon: '⚠️',
    defaultWidth: 400,
    defaultHeight: 60,
    defaultProps: { 
      message: '提示信息',
      description: '这是一条提示描述信息',
      type: 'info',
      closable: true,
      showIcon: true,
    },
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', title: '标题' },
        description: { type: 'string', title: '描述' },
        type: { 
          type: 'string', 
          title: '类型',
          enum: ['success', 'info', 'warning', 'error']
        },
        closable: { type: 'boolean', title: '可关闭' },
        showIcon: { type: 'boolean', title: '显示图标' },
      },
    },
  },
  {
    type: 'modal',
    name: '弹窗',
    icon: '🪟',
    defaultWidth: 500,
    defaultHeight: 350,
    defaultProps: { 
      title: '弹窗标题', 
      content: '弹窗内容区域',
      width: 500,
      closable: true,
      maskClosable: true,
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '标题' },
        content: { type: 'string', title: '内容' },
        width: { type: 'number', title: '宽度' },
        closable: { type: 'boolean', title: '显示关闭按钮' },
        maskClosable: { type: 'boolean', title: '点击蒙版关闭' },
      },
    },
  },
  {
    type: 'drawer',
    name: '抽屉',
    icon: '📭',
    defaultWidth: 400,
    defaultHeight: 400,
    defaultProps: { 
      title: '抽屉标题',
      content: '抽屉内容',
      placement: 'right',
      closable: true,
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '标题' },
        content: { type: 'string', title: '内容' },
        placement: { 
          type: 'string', 
          title: '弹出方向',
          enum: ['top', 'right', 'bottom', 'left']
        },
        closable: { type: 'boolean', title: '可关闭' },
      },
    },
  },
  {
    type: 'tooltip',
    name: '文字提示',
    icon: '💬',
    defaultWidth: 100,
    defaultHeight: 40,
    defaultProps: { 
      content: '提示文本内容',
      placement: 'top',
    },
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', title: '提示内容' },
        placement: { 
          type: 'string', 
          title: '弹出位置',
          enum: ['top', 'left', 'right', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']
        },
      },
    },
  },
  {
    type: 'popover',
    name: '气泡卡片',
    icon: '💭',
    defaultWidth: 200,
    defaultHeight: 100,
    defaultProps: { 
      title: '气泡标题',
      content: '气泡内容区域',
      placement: 'top',
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '标题' },
        content: { type: 'string', title: '内容' },
        placement: { 
          type: 'string', 
          title: '弹出位置',
          enum: ['top', 'left', 'right', 'bottom']
        },
      },
    },
  },
  // ============ 业务流程物料 ============
  {
    type: 'approval',
    name: '审批组件',
    icon: '✅',
    defaultWidth: 300,
    defaultHeight: 120,
    defaultProps: { 
      title: '审批流程',
      status: 'pending',
      approver: '',
      comment: '',
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '审批标题' },
        status: { 
          type: 'string', 
          title: '审批状态',
          enum: ['pending', 'approved', 'rejected']
        },
        approver: { type: 'string', title: '审批人' },
        comment: { type: 'string', title: '审批意见' },
      },
    },
  },
  {
    type: 'flowNode',
    name: '流程节点',
    icon: '🔹',
    defaultWidth: 150,
    defaultHeight: 60,
    defaultProps: { 
      label: '流程节点',
      type: 'start',
    },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', title: '节点名称' },
        type: { 
          type: 'string', 
          title: '节点类型',
          enum: ['start', 'end', 'task', 'approval', 'condition']
        },
      },
    },
  },
  {
    type: 'condition',
    name: '条件分支',
    icon: '🔀',
    defaultWidth: 200,
    defaultHeight: 100,
    defaultProps: { 
      condition: '',
      trueLabel: '是',
      falseLabel: '否',
    },
    schema: {
      type: 'object',
      properties: {
        condition: { type: 'string', title: '条件表达式' },
        trueLabel: { type: 'string', title: '是分支标签' },
        falseLabel: { type: 'string', title: '否分支标签' },
      },
    },
  },
  // ============ 集成与工具物料 ============
  {
    type: 'apiConnector',
    name: 'API连接器',
    icon: '🔗',
    defaultWidth: 280,
    defaultHeight: 100,
    defaultProps: { 
      url: '',
      method: 'GET',
      headers: {},
      params: {},
    },
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', title: 'API地址' },
        method: { 
          type: 'string', 
          title: '请求方法',
          enum: ['GET', 'POST', 'PUT', 'DELETE']
        },
        headers: { type: 'object', title: '请求头' },
        params: { type: 'object', title: '请求参数' },
      },
    },
  },
  {
    type: 'payment',
    name: '支付组件',
    icon: '💳',
    defaultWidth: 280,
    defaultHeight: 80,
    defaultProps: { 
      amount: 0,
      method: 'alipay',
      subject: '商品名称',
    },
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', title: '支付金额' },
        method: { 
          type: 'string', 
          title: '支付方式',
          enum: ['alipay', 'wechat', 'card']
        },
        subject: { type: 'string', title: '商品名称' },
      },
    },
  },
  {
    type: 'map',
    name: '地图组件',
    icon: '🗺️',
    defaultWidth: 400,
    defaultHeight: 300,
    defaultProps: { 
      center: [116.403874, 39.914889],
      zoom: 12,
      marker: null,
    },
    schema: {
      type: 'object',
      properties: {
        center: { type: 'array', title: '中心点坐标' },
        zoom: { type: 'number', title: '缩放级别' },
        marker: { type: 'object', title: '标记点' },
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

// 创建Zustand store工厂函数
export const createCanvasStore = () => createStore<CanvasState>((set, get) => ({
  project: DEFAULT_PROJECT_CONFIG,
  currentPage: DEFAULT_PAGE_CONFIG,
  components: [],
  selectedId: null,
  selectedIds: [],
  componentList: DEFAULT_COMPONENT_LIST,
  zoom: 1,
  zoomPosition: { x: 0, y: 0 },
  modal: {
    visible: false,
    title: '',
    content: '',
    closable: true,
  },
  dataModels: [],

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

  // 批量添加组件到画布
  addComponentsBatch: (components: ComponentConfig[]) => {
    const { currentPage } = get()

    const alignedComponents = components.map(comp => {
      let finalX = comp.x
      let finalY = comp.y
      if (currentPage.snapToGrid) {
        finalX = Math.round(comp.x / currentPage.gridSize) * currentPage.gridSize
        finalY = Math.round(comp.y / currentPage.gridSize) * currentPage.gridSize
      }
      return { ...comp, x: finalX, y: finalY }
    })

    set((state) => {
      const maxZIndex = Math.max(...state.components.map(c => c.zIndex), 0)
      const updatedComponents = alignedComponents.map((comp, index) => ({
        ...comp,
        zIndex: maxZIndex + index + 1,
      }))

      return {
        components: [...state.components, ...updatedComponents],
        selectedId: updatedComponents.length > 0 ? updatedComponents[0].id : state.selectedId,
        project: { ...state.project, isDirty: true },
      }
    })
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

  // 清除画布（删除所有组件）
  clearCanvas: () => {
    set((state) => ({
      components: [],
      selectedId: null,
      selectedIds: [],
      project: { ...state.project, isDirty: true },
    }))
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
  selectComponent: (id: string | null, multiSelect = false) => {
    if (!id) {
      set({ selectedId: null, selectedIds: [] })
      return
    }
    
    if (multiSelect) {
      set((state) => {
        const isAlreadySelected = state.selectedIds.includes(id)
        const newSelectedIds = isAlreadySelected
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id]
        return {
          selectedId: id,
          selectedIds: newSelectedIds,
        }
      })
    } else {
      set({ selectedId: id, selectedIds: [id] })
    }
  },

  // 选择多个组件
  selectComponents: (ids: string[]) => {
    set({
      selectedId: ids.length > 0 ? ids[0] : null,
      selectedIds: ids,
    })
  },

  // 添加到选择
  addToSelection: (id: string) => {
    set((state) => {
      if (state.selectedIds.includes(id)) return state
      return {
        selectedId: id,
        selectedIds: [...state.selectedIds, id],
      }
    })
  },

  // 从选择中移除
  removeFromSelection: (id: string) => {
    set((state) => {
      const newSelectedIds = state.selectedIds.filter((sid) => sid !== id)
      return {
        selectedId: newSelectedIds.length > 0 ? newSelectedIds[0] : null,
        selectedIds: newSelectedIds,
      }
    })
  },

  // 清空选择
  clearSelection: () => {
    set({ selectedId: null, selectedIds: [] })
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

  // 左对齐
  alignLeft: () => {
    const { selectedIds, components } = get()
    if (selectedIds.length === 0) return

    const selectedComponents = components.filter((c) => selectedIds.includes(c.id))
    const minX = Math.min(...selectedComponents.map((c) => c.x))

    set((state) => ({
      components: state.components.map((c) =>
        selectedIds.includes(c.id) ? { ...c, x: minX } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 右对齐
  alignRight: () => {
    const { selectedIds, components } = get()
    if (selectedIds.length === 0) return

    const selectedComponents = components.filter((c) => selectedIds.includes(c.id))
    const maxRight = Math.max(...selectedComponents.map((c) => c.x + c.width))

    set((state) => ({
      components: state.components.map((c) =>
        selectedIds.includes(c.id) ? { ...c, x: maxRight - c.width } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 顶部对齐
  alignTop: () => {
    const { selectedIds, components } = get()
    if (selectedIds.length === 0) return

    const selectedComponents = components.filter((c) => selectedIds.includes(c.id))
    const minY = Math.min(...selectedComponents.map((c) => c.y))

    set((state) => ({
      components: state.components.map((c) =>
        selectedIds.includes(c.id) ? { ...c, y: minY } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 底部对齐
  alignBottom: () => {
    const { selectedIds, components } = get()
    if (selectedIds.length === 0) return

    const selectedComponents = components.filter((c) => selectedIds.includes(c.id))
    const maxBottom = Math.max(...selectedComponents.map((c) => c.y + c.height))

    set((state) => ({
      components: state.components.map((c) =>
        selectedIds.includes(c.id) ? { ...c, y: maxBottom - c.height } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 水平居中对齐
  alignCenter: () => {
    const { selectedIds, components } = get()
    if (selectedIds.length === 0) return

    const selectedComponents = components.filter((c) => selectedIds.includes(c.id))
    const minX = Math.min(...selectedComponents.map((c) => c.x))
    const maxRight = Math.max(...selectedComponents.map((c) => c.x + c.width))
    const centerX = (minX + maxRight) / 2

    set((state) => ({
      components: state.components.map((c) =>
        selectedIds.includes(c.id) ? { ...c, x: centerX - c.width / 2 } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 垂直居中对齐
  alignMiddle: () => {
    const { selectedIds, components } = get()
    if (selectedIds.length === 0) return

    const selectedComponents = components.filter((c) => selectedIds.includes(c.id))
    const minY = Math.min(...selectedComponents.map((c) => c.y))
    const maxBottom = Math.max(...selectedComponents.map((c) => c.y + c.height))
    const centerY = (minY + maxBottom) / 2

    set((state) => ({
      components: state.components.map((c) =>
        selectedIds.includes(c.id) ? { ...c, y: centerY - c.height / 2 } : c
      ),
      project: { ...state.project, isDirty: true },
    }))
  },

  // 放大
  zoomIn: () => {
    set((state) => ({
      zoom: Math.min(state.zoom + 0.1, 3),
    }))
  },

  // 缩小
  zoomOut: () => {
    set((state) => ({
      zoom: Math.max(state.zoom - 0.1, 0.25),
    }))
  },

  // 重置缩放
  resetZoom: () => {
    set({
      zoom: 1,
      zoomPosition: { x: 0, y: 0 },
    })
  },

  // 设置缩放
  setZoom: (zoom: number, position?: { x: number; y: number }) => {
    set({
      zoom: Math.min(Math.max(zoom, 0.25), 3),
      zoomPosition: position || { x: 0, y: 0 },
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

  // 保存项目（对接数据库）
  saveProject: async (name?: string) => {
    const { components, currentPage, dataModels } = get()
    try {
      let savedId: string | null = null
      
      const pageIdNum = Number(currentPage?.id)
      if (!isNaN(pageIdNum) && pageIdNum > 0) {
        // 已存在的页面，更新画布数据
        if (name) {
          await canvasPageApi.updatePage(pageIdNum, { name, canvasJson: components, dataModels })
        } else {
          await canvasPageApi.saveCanvas(pageIdNum, components, dataModels)
        }
        savedId = currentPage.id
      } else if (name || currentPage?.name) {
        // 新页面，先创建
        const pageName = name || currentPage!.name
        const created = await canvasPageApi.createPage(pageName, components, dataModels)
        // API 返回格式: { code: 200, data: { id: ... } }
        const newId = (created as any)?.data?.id || (created as any)?.id
        if (newId) {
          const newSavedId = newId.toString()
          savedId = newSavedId
          set((state) => ({
            currentPage: { ...state.currentPage, id: newSavedId, name: pageName },
          }))
        }
      }

      set((state) => ({
        project: {
          ...state.project,
          name: name || state.project.name,
          updatedAt: new Date(),
          isDirty: false,
        },
      }))

      console.log('画布保存成功')
      return { success: true, id: savedId || undefined }
    } catch (error) {
      console.error('保存画布失败:', error)
      throw error
    }
  },

  // 另存为项目
  saveProjectAs: async (name: string) => {
    const { components, dataModels } = get()
    try {
      const created = await canvasPageApi.createPage(name, components, dataModels)
      const newId = (created as any)?.id?.toString() || generateId()
      const newName = (created as any)?.name || name

      set((state) => ({
        project: {
          ...state.project,
          name: newName,
          updatedAt: new Date(),
          isDirty: false,
          currentPageId: newId,
        },
        currentPage: {
          ...state.currentPage,
          id: newId,
          name: newName,
        },
      }))

      console.log('画布另存为成功')
    } catch (error) {
      console.error('另存为画布失败:', error)
      throw error
    }
  },

  // 加载项目（从数据库）
  loadProject: async (pageId: string) => {
    try {
      if (pageId === 'new') {
        // 新建画布
        set({
          project: {
            id: 'new',
            name: '未命名画布',
            pages: [DEFAULT_PAGE_CONFIG],
            currentPageId: DEFAULT_PAGE_CONFIG.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDirty: false,
          },
          currentPage: DEFAULT_PAGE_CONFIG,
          components: [],
          selectedId: null,
        })
        return
      }

      const pageIdNum = Number(pageId)
      if (!isNaN(pageIdNum) && pageIdNum > 0) {
        // 从数据库加载
        const response = await canvasPageApi.getPage(pageIdNum) as any
        // API 返回格式: { code: 200, data: { ... } }
        const pageData = response?.data || response
        if (pageData?.id) {
          const loadedComponents = (pageData.canvasJson || []).map((comp: any) => ({
          ...comp,
          props: comp.props || {},
        }))
          const pageConfig: PageConfig = {
            id: pageData.id.toString(),
            name: pageData.name,
            width: pageData.width || 1920,
            height: pageData.height || 1080,
            gridSize: pageData.gridSize || 20,
            snapToGrid: pageData.snapToGrid ?? true,
            showGrid: pageData.showGrid ?? true,
            showRulers: pageData.showRulers ?? false,
            backgroundColor: pageData.backgroundColor || '#ffffff',
          }
          set({
            project: {
              id: pageData.id.toString(),
              name: pageData.name,
              pages: [pageConfig],
              currentPageId: pageData.id.toString(),
              createdAt: new Date(pageData.createdAt),
              updatedAt: new Date(pageData.updatedAt),
              isDirty: false,
            },
            currentPage: pageConfig,
            components: loadedComponents,
            selectedId: null,
            dataModels: pageData.dataModels || [],
          })
          console.log('加载画布成功:', pageData.id)
          return
        }
      }

      // 兜底：创建空白画布
      set({
        project: {
          id: pageId,
          name: `画布 ${pageId}`,
          pages: [DEFAULT_PAGE_CONFIG],
          currentPageId: DEFAULT_PAGE_CONFIG.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDirty: false,
        },
        currentPage: DEFAULT_PAGE_CONFIG,
        components: [],
        selectedId: null,
      })
    } catch (error) {
      console.error('加载画布失败:', error)
      // 加载失败也创建空白画布
      set({
        project: {
          id: pageId,
          name: '未命名画布',
          pages: [DEFAULT_PAGE_CONFIG],
          currentPageId: DEFAULT_PAGE_CONFIG.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDirty: false,
        },
        currentPage: DEFAULT_PAGE_CONFIG,
        components: [],
        selectedId: null,
      })
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

  // 导出画布JSON
  exportCanvasJson: () => {
    const { project, components, currentPage } = get()
    const exportData = {
      project: {
        id: project.id,
        name: project.name,
        pages: project.pages,
        currentPageId: project.currentPageId,
      },
      currentPage,
      components,
    }
    return JSON.stringify(exportData, null, 2)
  },

  // 生成代码
  generateCode: () => {
    const { components, currentPage } = get()
    return { files: generateCanvasCode(components, currentPage) }
  },

  // 导入AI生成的画布Schema
  importCanvasSchema: (schema: any) => {
    try {
      const { componentList } = get()
      
      // 提取页面配置
      if (schema.config) {
        if (schema.config.width) {
          set((state) => ({
            currentPage: { ...state.currentPage, width: schema.config.width },
            project: {
              ...state.project,
              pages: state.project.pages.map(p => 
                p.id === state.project.currentPageId 
                  ? { ...p, width: schema.config.width } 
                  : p
              ),
            },
          }))
        }
        if (schema.config.height) {
          set((state) => ({
            currentPage: { ...state.currentPage, height: schema.config.height },
            project: {
              ...state.project,
              pages: state.project.pages.map(p => 
                p.id === state.project.currentPageId 
                  ? { ...p, height: schema.config.height } 
                  : p
              ),
            },
          }))
        }
        if (schema.config.background) {
          set((state) => ({
            currentPage: { ...state.currentPage, backgroundColor: schema.config.background },
          }))
        }
      }

      // 转换组件格式
      const convertedComponents: ComponentConfig[] = []
      let zIndex = 1

      const convertComponent = (comp: any, parentX = 0, parentY = 0) => {
        if (!comp.type) return

        const meta = componentList.find(m => m.type.toLowerCase() === comp.type.toLowerCase())
        const defaultMeta = meta || {
          name: comp.type,
          defaultWidth: 200,
          defaultHeight: 100,
          defaultProps: {},
        }

        // 从style中提取位置和尺寸
        const x = (comp.style?.x || comp.style?.left || 0) + parentX
        const y = (comp.style?.y || comp.style?.top || 0) + parentY
        const width = comp.style?.width || defaultMeta.defaultWidth
        const height = comp.style?.height || defaultMeta.defaultHeight

        const newComponent: ComponentConfig = {
          id: comp.id || generateId(),
          type: comp.type,
          name: comp.props?.label || comp.props?.text || comp.props?.content || defaultMeta.name,
          x: typeof x === 'number' ? x : parseInt(x) || 0,
          y: typeof y === 'number' ? y : parseInt(y) || 0,
          width: typeof width === 'number' ? width : parseInt(width) || defaultMeta.defaultWidth,
          height: typeof height === 'number' ? height : parseInt(height) || defaultMeta.defaultHeight,
          props: comp.props || { ...defaultMeta.defaultProps },
          zIndex: zIndex++,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
        }

        convertedComponents.push(newComponent)

        // 递归处理子组件
        if (comp.children && Array.isArray(comp.children)) {
          comp.children.forEach((child: any) => {
            convertComponent(child, newComponent.x, newComponent.y)
          })
        }
      }

      // 处理所有顶层组件
      if (schema.children && Array.isArray(schema.children)) {
        schema.children.forEach((comp: any) => convertComponent(comp))
      }

      // 更新页面名称
      if (schema.name || schema.config?.title) {
        const pageName = schema.name || schema.config.title
        set((state) => ({
          currentPage: { ...state.currentPage, name: pageName },
          project: {
            ...state.project,
            pages: state.project.pages.map(p => 
              p.id === state.project.currentPageId 
                ? { ...p, name: pageName } 
                : p
            ),
          },
        }))
      }

      // 设置组件
      set({
        components: convertedComponents,
        selectedId: null,
        selectedIds: [],
        project: { ...get().project, isDirty: true },
      })

      console.log('成功导入AI生成的Schema，组件数:', convertedComponents.length)
    } catch (error) {
      console.error('导入Schema失败:', error)
      throw new Error('无效的Schema格式')
    }
  },

  // 导入画布JSON
  importCanvasJson: (json: string) => {
    try {
      const data = JSON.parse(json)
      set({
        project: {
          ...data.project,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDirty: false,
        },
        currentPage: data.currentPage,
        components: data.components || [],
        selectedId: null,
        selectedIds: [],
      })
    } catch (error) {
      console.error('导入画布JSON失败:', error)
      throw new Error('无效的画布JSON格式')
    }
  },

  // 打开弹窗
  openModal: (title: string, content: string, closable = true) => {
    set((_state) => ({
      modal: {
        visible: true,
        title,
        content,
        closable,
      },
    }))
  },

  // 关闭弹窗
  closeModal: () => {
    set((state) => ({
      modal: {
        ...state.modal,
        visible: false,
      },
    }))
  },

  // 数据模型操作
  addDataModel: (model: DataModel) => {
    set((state) => ({
      dataModels: [...state.dataModels, model],
    }))
  },

  updateDataModel: (modelId: string, updates: Partial<DataModel>) => {
    set((state) => ({
      dataModels: state.dataModels.map((model) =>
        model.id === modelId ? { ...model, ...updates } : model
      ),
    }))
  },

  deleteDataModel: (modelId: string) => {
    set((state) => ({
      dataModels: state.dataModels.filter((model) => model.id !== modelId),
    }))
  },
}))

export { useCanvasStore } from '@/providers/canvas-store-provider'

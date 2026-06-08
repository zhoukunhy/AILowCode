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
  // ============ 表单组件 ============
  {
    type: 'button',
    name: '按钮',
    icon: '🔘',
    defaultWidth: 120,
    defaultHeight: 40,
    defaultProps: { text: '提交', type: 'primary', disabled: false },
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
    },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '标题' },
        checkable: { type: 'boolean', title: '可选中' },
        showLine: { type: 'boolean', title: '显示连接线' },
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
      // 模拟项目数据
      const mockProjects: Record<string, {
        name: string
        components: ComponentConfig[]
        pages: PageConfig[]
      }> = {
        '1': {
          name: '电商后台管理系统',
          pages: [DEFAULT_PAGE_CONFIG],
          components: [
            {
              id: generateId(),
              type: 'button',
              name: '按钮',
              x: 50,
              y: 50,
              width: 120,
              height: 40,
              props: { text: '提交订单', type: 'primary', disabled: false },
              zIndex: 1,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
            },
            {
              id: generateId(),
              type: 'input',
              name: '输入框',
              x: 50,
              y: 120,
              width: 240,
              height: 60,
              props: { label: '订单编号', placeholder: '请输入订单编号', required: true },
              zIndex: 1,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
            },
            {
              id: generateId(),
              type: 'table',
              name: '数据表格',
              x: 50,
              y: 200,
              width: 800,
              height: 300,
              props: { 
                data: [
                  { id: 1, name: '商品A', price: 100, quantity: 10 },
                  { id: 2, name: '商品B', price: 200, quantity: 5 },
                  { id: 3, name: '商品C', price: 150, quantity: 8 },
                ],
                columns: ['id', 'name', 'price', 'quantity'],
                bordered: true,
                stripe: true,
              },
              zIndex: 1,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
            },
          ],
        },
        '2': {
          name: 'CRM客户管理系统',
          pages: [DEFAULT_PAGE_CONFIG],
          components: [
            {
              id: generateId(),
              type: 'card',
              name: '卡片',
              x: 50,
              y: 50,
              width: 300,
              height: 200,
              props: { title: '客户概览', hoverable: true },
              zIndex: 1,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
            },
            {
              id: generateId(),
              type: 'tabs',
              name: '标签页',
              x: 50,
              y: 280,
              width: 600,
              height: 300,
              props: { 
                tabs: ['基本信息', '联系记录', '跟进计划'],
                activeTab: 0,
              },
              zIndex: 1,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
            },
          ],
        },
        '3': {
          name: 'OA办公自动化系统',
          pages: [DEFAULT_PAGE_CONFIG],
          components: [
            {
              id: generateId(),
              type: 'steps',
              name: '步骤条',
              x: 50,
              y: 50,
              width: 800,
              height: 80,
              props: { 
                steps: ['提交申请', '部门审批', '财务审核', '完成'],
                current: 1,
              },
              zIndex: 1,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
            },
            {
              id: generateId(),
              type: 'form',
              name: '表单容器',
              x: 50,
              y: 150,
              width: 600,
              height: 400,
              props: { labelCol: 6, wrapperCol: 18 },
              zIndex: 1,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
            },
          ],
        },
      }

      const projectData = mockProjects[projectId]
      if (projectData) {
        set({
          project: {
            id: projectId,
            name: projectData.name,
            pages: projectData.pages,
            currentPageId: projectData.pages[0].id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDirty: false,
          },
          currentPage: projectData.pages[0],
          components: projectData.components,
          selectedId: null,
        })
      } else {
        // 如果找不到项目，创建一个新项目
        set({
          project: {
            id: projectId,
            name: `项目 ${projectId}`,
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
      console.log('加载项目成功:', projectId)
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

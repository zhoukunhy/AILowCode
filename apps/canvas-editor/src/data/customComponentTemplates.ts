import type { CustomComponentDefinition } from '@ai-lowcode/shared-types'

/**
 * 自定义组件模板库
 * 提供预定义的组件模板，用户可以基于模板快速创建自定义组件
 */
export const customComponentTemplates: CustomComponentDefinition[] = [
  // ==================== 表单模板 ====================
  {
    id: 'template_form_group',
    name: 'FormGroup',
    displayName: '表单分组',
    description: '将多个表单字段组合在一起，支持统一的标签和验证',
    category: 'form',
    icon: '📋',
    version: '1.0.0',
    author: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'published',
    template: {
      type: 'visual',
      visualConfig: {
        children: [
          {
            id: 'label',
            type: 'text',
            props: { text: '${label}', fontSize: 16, fontWeight: 'bold' },
            schema: { width: 200, height: 30, x: 0, y: 0 },
          },
          {
            id: 'field1',
            type: 'input',
            props: { label: '${field1Label}', placeholder: '${field1Placeholder}', value: '${field1Value}' },
            schema: { width: 200, height: 40, x: 0, y: 40 },
          },
          {
            id: 'field2',
            type: 'input',
            props: { label: '${field2Label}', placeholder: '${field2Placeholder}', value: '${field2Value}' },
            schema: { width: 200, height: 40, x: 0, y: 90 },
          },
        ],
        layout: { type: 'flex', direction: 'column', gap: 10 },
        containerStyle: { backgroundColor: '#ffffff', borderRadius: 8 },
      },
    },
    propsSchema: {
      properties: {
        label: { type: 'string', title: '分组标题', default: '表单分组', bindable: true, visible: true },
        field1Label: { type: 'string', title: '字段1标签', default: '字段1', bindable: true, visible: true },
        field1Placeholder: { type: 'string', title: '字段1占位符', default: '请输入', bindable: true, visible: true },
        field1Value: { type: 'string', title: '字段1值', default: '', bindable: true, visible: true },
        field2Label: { type: 'string', title: '字段2标签', default: '字段2', bindable: true, visible: true },
        field2Placeholder: { type: 'string', title: '字段2占位符', default: '请输入', bindable: true, visible: true },
        field2Value: { type: 'string', title: '字段2值', default: '', bindable: true, visible: true },
      },
      required: ['label'],
    },
    events: [
      { name: 'onField1Change', title: '字段1值变化', params: [{ name: 'value', type: 'string' }] },
      { name: 'onField2Change', title: '字段2值变化', params: [{ name: 'value', type: 'string' }] },
    ],
    tags: ['form', 'group', 'input'],
  },

  // ==================== 卡片模板 ====================
  {
    id: 'template_info_card',
    name: 'InfoCard',
    displayName: '信息卡片',
    description: '展示信息的卡片组件，包含标题、内容和操作按钮',
    category: 'layout',
    icon: '🃏',
    version: '1.0.0',
    author: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'published',
    template: {
      type: 'visual',
      visualConfig: {
        children: [
          {
            id: 'title',
            type: 'heading',
            props: { text: '${title}', level: 3 },
            schema: { width: 280, height: 30, x: 10, y: 10 },
          },
          {
            id: 'content',
            type: 'text',
            props: { text: '${content}', fontSize: 14 },
            schema: { width: 280, height: 60, x: 10, y: 50 },
          },
          {
            id: 'action',
            type: 'button',
            props: { text: '${actionText}', type: '${actionType}' },
            schema: { width: 100, height: 32, x: 10, y: 120 },
          },
        ],
        layout: { type: 'absolute' },
        containerStyle: { backgroundColor: '#ffffff', borderRadius: 8, padding: 16 },
      },
    },
    propsSchema: {
      properties: {
        title: { type: 'string', title: '卡片标题', default: '信息卡片', bindable: true, visible: true },
        content: { type: 'string', title: '卡片内容', default: '这里是卡片内容描述', bindable: true, visible: true },
        actionText: { type: 'string', title: '按钮文本', default: '查看详情', bindable: true, visible: true },
        actionType: {
          type: 'select',
          title: '按钮类型',
          default: 'primary',
          enum: [
            { label: '主要', value: 'primary' },
            { label: '默认', value: 'default' },
            { label: '虚线', value: 'dashed' },
          ],
          bindable: true,
          visible: true,
        },
      },
      required: ['title', 'content'],
    },
    events: [{ name: 'onActionClick', title: '按钮点击' }],
    tags: ['card', 'info', 'layout'],
  },

  // ==================== 状态指示器模板 ====================
  {
    id: 'template_status_indicator',
    name: 'StatusIndicator',
    displayName: '状态指示器',
    description: '显示状态的指示器组件，支持不同状态的颜色和图标',
    category: 'business',
    icon: '📊',
    version: '1.0.0',
    author: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'published',
    template: {
      type: 'visual',
      visualConfig: {
        children: [
          {
            id: 'icon',
            type: 'text',
            props: { text: '${statusIcon}', fontSize: 24 },
            schema: { width: 40, height: 40, x: 0, y: 0 },
          },
          {
            id: 'label',
            type: 'text',
            props: { text: '${statusLabel}', fontSize: 14, fill: '${statusColor}' },
            schema: { width: 100, height: 40, x: 50, y: 0 },
          },
        ],
        layout: { type: 'flex', direction: 'row', gap: 10, alignItems: 'center' },
        containerStyle: { backgroundColor: '${backgroundColor}', borderRadius: 4, padding: 8 },
      },
    },
    propsSchema: {
      properties: {
        statusIcon: { type: 'string', title: '状态图标', default: '✓', bindable: true, visible: true },
        statusLabel: { type: 'string', title: '状态文本', default: '成功', bindable: true, visible: true },
        statusColor: {
          type: 'color',
          title: '状态颜色',
          default: '#52c41a',
          bindable: true,
          visible: true,
        },
        backgroundColor: {
          type: 'color',
          title: '背景颜色',
          default: '#f6ffed',
          bindable: true,
          visible: true,
        },
      },
      required: ['statusLabel'],
    },
    events: [{ name: 'onStatusChange', title: '状态变化', params: [{ name: 'status', type: 'string' }] }],
    tags: ['status', 'indicator', 'business'],
  },

  // ==================== 数据列表模板 ====================
  {
    id: 'template_data_list',
    name: 'DataList',
    displayName: '数据列表',
    description: '展示数据列表的组件，支持自定义列和操作',
    category: 'business',
    icon: '📑',
    version: '1.0.0',
    author: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'published',
    template: {
      type: 'code',
      codeConfig: {
        renderCode: `
function DataList({ data, columns, onRowClick }) {
  return React.createElement('div', { className: 'data-list' },
    React.createElement('table', { className: 'data-table' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          columns.map(col => 
            React.createElement('th', { key: col.key }, col.title)
          )
        )
      ),
      React.createElement('tbody', null,
        data.map(row => 
          React.createElement('tr', { 
            key: row.id,
            onClick: () => onRowClick && onRowClick(row),
            className: 'data-row'
          },
            columns.map(col =>
              React.createElement('td', { key: col.key }, row[col.key])
            )
          )
        )
      )
    )
  );
}
`,
        styleCode: `
.data-list {
  width: 100%;
  overflow: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 12px;
  border: 1px solid #e8e8e8;
  text-align: left;
}
.data-table th {
  background: #fafafa;
  font-weight: 600;
}
.data-row:hover {
  background: #f5f5f5;
}
`,
      },
    },
    propsSchema: {
      properties: {
        data: {
          type: 'array',
          title: '数据源',
          default: [],
          bindable: true,
          visible: true,
          items: { type: 'object', title: '数据项' },
        },
        columns: {
          type: 'array',
          title: '列配置',
          default: [
            { key: 'id', title: 'ID' },
            { key: 'name', title: '名称' },
          ],
          bindable: true,
          visible: true,
          items: {
            type: 'object',
            title: '列配置项',
            properties: {
              key: { type: 'string', title: '字段键' },
              title: { type: 'string', title: '列标题' },
            },
          },
        },
      },
      required: ['data', 'columns'],
    },
    events: [
      {
        name: 'onRowClick',
        title: '行点击',
        params: [{ name: 'row', type: 'object', description: '行数据' }],
      },
    ],
    dataSource: {
      types: ['api', 'database'],
      defaultConfig: { type: 'api', method: 'GET' },
    },
    tags: ['list', 'data', 'table'],
  },

  // ==================== 进度条模板 ====================
  {
    id: 'template_progress_bar',
    name: 'ProgressBar',
    displayName: '进度条',
    description: '显示进度百分比的进度条组件',
    category: 'business',
    icon: '📈',
    version: '1.0.0',
    author: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'published',
    template: {
      type: 'visual',
      visualConfig: {
        children: [
          {
            id: 'label',
            type: 'text',
            props: { text: '${label}', fontSize: 14 },
            schema: { width: 100, height: 20, x: 0, y: 0 },
          },
          {
            id: 'progressBg',
            type: 'rect',
            props: { fill: '#e8e8e8', width: 200, height: 20 },
            schema: { width: 200, height: 20, x: 110, y: 0 },
          },
          {
            id: 'progressFill',
            type: 'rect',
            props: { fill: '${progressColor}', width: '${progressWidth}', height: 20 },
            schema: { width: 100, height: 20, x: 110, y: 0 },
          },
          {
            id: 'percentText',
            type: 'text',
            props: { text: '${percent}%', fontSize: 12, fill: '#fff' },
            schema: { width: 50, height: 20, x: 160, y: 0 },
          },
        ],
        layout: { type: 'flex', direction: 'row', gap: 10, alignItems: 'center' },
      },
    },
    propsSchema: {
      properties: {
        label: { type: 'string', title: '标签', default: '进度', bindable: true, visible: true },
        percent: {
          type: 'number',
          title: '百分比',
          default: 50,
          bindable: true,
          visible: true,
          validation: { min: 0, max: 100 },
        },
        progressColor: {
          type: 'color',
          title: '进度颜色',
          default: '#1890ff',
          bindable: true,
          visible: true,
        },
      },
      required: ['percent'],
    },
    events: [{ name: 'onComplete', title: '完成', description: '进度达到100%时触发' }],
    tags: ['progress', 'bar', 'business'],
  },

  // ==================== 用户头像组模板 ====================
  {
    id: 'template_avatar_group',
    name: 'AvatarGroup',
    displayName: '头像组',
    description: '展示多个用户头像的组件，支持重叠显示',
    category: 'business',
    icon: '👥',
    version: '1.0.0',
    author: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'published',
    template: {
      type: 'visual',
      visualConfig: {
        children: [
          {
            id: 'avatar1',
            type: 'avatar',
            props: { src: '${avatar1Src}', name: '${avatar1Name}', size: 40 },
            schema: { width: 40, height: 40, x: 0, y: 0 },
          },
          {
            id: 'avatar2',
            type: 'avatar',
            props: { src: '${avatar2Src}', name: '${avatar2Name}', size: 40 },
            schema: { width: 40, height: 40, x: 30, y: 0 },
          },
          {
            id: 'avatar3',
            type: 'avatar',
            props: { src: '${avatar3Src}', name: '${avatar3Name}', size: 40 },
            schema: { width: 40, height: 40, x: 60, y: 0 },
          },
          {
            id: 'moreCount',
            type: 'avatar',
            props: { name: '+${moreCount}', size: 40 },
            schema: { width: 40, height: 40, x: 90, y: 0 },
          },
        ],
        layout: { type: 'flex', direction: 'row', gap: -10 },
      },
    },
    propsSchema: {
      properties: {
        avatar1Src: { type: 'string', title: '头像1', default: '', bindable: true, visible: true },
        avatar1Name: { type: 'string', title: '名称1', default: '用户A', bindable: true, visible: true },
        avatar2Src: { type: 'string', title: '头像2', default: '', bindable: true, visible: true },
        avatar2Name: { type: 'string', title: '名称2', default: '用户B', bindable: true, visible: true },
        avatar3Src: { type: 'string', title: '头像3', default: '', bindable: true, visible: true },
        avatar3Name: { type: 'string', title: '名称3', default: '用户C', bindable: true, visible: true },
        moreCount: {
          type: 'number',
          title: '更多数量',
          default: 0,
          bindable: true,
          visible: true,
          validation: { min: 0 },
        },
      },
      required: [],
    },
    events: [{ name: 'onAvatarClick', title: '头像点击', params: [{ name: 'index', type: 'number' }] }],
    tags: ['avatar', 'group', 'user'],
  },
]

/**
 * 获取模板分类列表
 */
export function getTemplateCategories(): string[] {
  return ['form', 'layout', 'business', 'custom']
}

/**
 * 按分类获取模板
 */
export function getTemplatesByCategory(category: string): CustomComponentDefinition[] {
  return customComponentTemplates.filter(t => t.category === category)
}

/**
 * 搜索模板
 */
export function searchTemplates(query: string): CustomComponentDefinition[] {
  const lowerQuery = query.toLowerCase()
  return customComponentTemplates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.displayName.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * 从模板创建自定义组件
 */
export function createFromTemplate(
  templateId: string,
  customName?: string
): CustomComponentDefinition | null {
  const template = customComponentTemplates.find(t => t.id === templateId)
  if (!template) {
    return null
  }

  // 复制模板并生成新的 ID
  const newComponent: CustomComponentDefinition = {
    ...template,
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: customName || `${template.name}_custom`,
    displayName: customName || template.displayName,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'user',
    status: 'draft',
  }

  return newComponent
}
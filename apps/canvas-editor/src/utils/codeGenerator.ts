import type { ComponentConfig, PageConfig } from '@/store/canvasStore'

export interface GeneratedCodeFile {
  path: string
  content: string
}

export interface CodeGenerationOptions {
  framework?: 'react'
  language?: 'typescript'
  includeStyles?: boolean
}

const COMPONENT_TEMPLATES: Record<string, (comp: ComponentConfig) => string> = {
  button: (comp) => {
    const colors: Record<string, string> = {
      primary: 'bg-blue-500 text-white',
      default: 'bg-white text-gray-700 border border-gray-300',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
      dashed: 'bg-white text-gray-700 border border-dashed border-gray-300',
      text: 'bg-transparent text-gray-700',
      link: 'bg-transparent text-blue-500',
    }
    const colorClass = colors[comp.props.type as string] || colors.default
    
    return `<button
  className="${colorClass} px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
  style={{ width: '${comp.width}px', height: '${comp.height}px' }}
>
  ${escapeHtml(comp.props.text)}
</button>`
  },

  input: (comp) => {
    const label = comp.props.label ? `<label className="block text-sm font-medium text-gray-700 mb-1">${escapeHtml(comp.props.label)}</label>` : ''
    return `<div>
  ${label}
  <input
    type="text"
    value="${escapeHtml(comp.props.value || '')}"
    placeholder="${escapeHtml(comp.props.placeholder || '')}"
    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    style={{ width: '${comp.width}px', height: '${comp.height}px' }}
    ${comp.props.disabled ? 'disabled' : ''}
    ${comp.props.required ? 'required' : ''}
  />
</div>`
  },

  textarea: (comp) => {
    const label = comp.props.label ? `<label className="block text-sm font-medium text-gray-700 mb-1">${escapeHtml(comp.props.label)}</label>` : ''
    return `<div>
  ${label}
  <textarea
    placeholder="${escapeHtml(comp.props.placeholder || '')}"
    rows="${comp.props.rows || 4}"
    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    style={{ width: '${comp.width}px', height: '${comp.height}px' }}
    ${comp.props.disabled ? 'disabled' : ''}
  ></textarea>
</div>`
  },

  select: (comp) => {
    const label = comp.props.label ? `<label className="block text-sm font-medium text-gray-700 mb-1">${escapeHtml(comp.props.label)}</label>` : ''
    const options = (comp.props.options || []).map((opt: string) => 
      `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`
    ).join('\n    ')
    
    return `<div>
  ${label}
  <select
    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
    style={{ width: '${comp.width}px', height: '${comp.height}px' }}
    ${comp.props.disabled ? 'disabled' : ''}
  >
    <option value="">${escapeHtml(comp.props.placeholder || '请选择')}</option>
    ${options}
  </select>
</div>`
  },

  checkbox: (comp) => {
    return `<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
    ${comp.props.checked ? 'checked' : ''}
    ${comp.props.disabled ? 'disabled' : ''}
  />
  <span className="text-sm text-gray-700">${escapeHtml(comp.props.label || '')}</span>
</label>`
  },

  radio: (comp) => {
    const options = (comp.props.options || []).map((opt: string, idx: number) => 
      `<label key="${idx}" className="flex items-center gap-2 cursor-pointer mr-4">
  <input
    type="radio"
    name="${comp.id}"
    value="${escapeHtml(opt)}"
    className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
    ${comp.props.value === opt ? 'checked' : ''}
  />
  <span className="text-sm text-gray-700">${escapeHtml(opt)}</span>
</label>`
    ).join('\n    ')
    
    return `<div className="flex">${options}</div>`
  },

  switch: (comp) => {
    return `<button
  type="button"
  role="switch"
  aria-checked="${comp.props.checked || false}"
  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${comp.props.checked ? 'bg-blue-500' : 'bg-gray-300'}"
  onClick={() => {}}
>
  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${comp.props.checked ? 'translate-x-6' : 'translate-x-1'}"></span>
</button>`
  },

  text: (comp) => {
    const tag = comp.props.tag || 'p'
    const fontSize = comp.props.fontSize ? `font-size: ${comp.props.fontSize}px;` : ''
    const fontWeight = comp.props.fontWeight ? `font-weight: ${comp.props.fontWeight};` : ''
    const color = comp.props.color ? `color: ${comp.props.color};` : ''
    
    return `<${tag} style="${fontSize}${fontWeight}${color}">${escapeHtml(comp.props.content || '')}</${tag}>`
  },

  heading: (comp) => {
    const level = Math.min(Math.max(comp.props.level || 1, 1), 6)
    return `<h${level} className="font-bold">${escapeHtml(comp.props.content || '')}</h${level}>`
  },

  card: (comp) => {
    const title = comp.props.title ? `<h3 className="text-lg font-semibold mb-2">${escapeHtml(comp.props.title)}</h3>` : ''
    return `<div className="bg-white rounded-lg shadow-md p-4">
  ${title}
  <div className="card-content">
    ${comp.props.content ? escapeHtml(comp.props.content) : ''}
  </div>
</div>`
  },

  image: (comp) => {
    return `<img
  src="${escapeHtml(comp.props.src || '')}"
  alt="${escapeHtml(comp.props.alt || '')}"
  className="rounded"
  style={{ width: '${comp.width}px', height: '${comp.height}px', objectFit: 'cover' }}
/>`
  },

  divider: (_comp) => {
    return `<hr className="border-gray-200 my-4" />`
  },

  space: (comp) => {
    return `<div style={{ height: '${comp.height}px', width: '${comp.width}px' }}></div>`
  },

  container: (comp) => {
    return `<div className="container p-4" style={{ width: '${comp.width}px', minHeight: '${comp.height}px' }}>
  ${comp.props.content ? escapeHtml(comp.props.content) : ''}
</div>`
  },

  table: (comp) => {
    const columns = comp.props.columns || []
    const data = comp.props.data || []
    
    const headers = columns.map((col: any) => `<th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 bg-gray-50">${escapeHtml(col.title)}</th>`).join('\n        ')
    
    const rows = data.map((row: any, idx: number) => {
      const cells = columns.map((col: any) => `<td className="px-4 py-2 text-sm text-gray-700 border-t">${escapeHtml(row[col.key] || '')}</td>`).join('\n          ')
      return `<tr key="${idx}">${cells}</tr>`
    }).join('\n      ')
    
    return `<table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
  <thead>
    <tr>${headers}</tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
    ${rows}
  </tbody>
</table>`
  },

  form: (comp) => {
    return `<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
  ${comp.props.content ? escapeHtml(comp.props.content) : ''}
  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">提交</button>
</form>`
  },

  list: (comp) => {
    const items = (comp.props.items || []).map((item: string, idx: number) => 
      `<li key="${idx}" className="text-sm text-gray-700">${escapeHtml(item)}</li>`
    ).join('\n    ')
    
    return `<ul className="list-disc list-inside space-y-1">${items}</ul>`
  },

  link: (comp) => {
    return `<a href="${escapeHtml(comp.props.href || '#')}" className="text-blue-500 hover:underline" ${comp.props.target ? `target="${comp.props.target}"` : ''}>
  ${escapeHtml(comp.props.content || '')}
</a>`
  },

  badge: (comp) => {
    const colors: Record<string, string> = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
    }
    const colorClass = colors[comp.props.color as string] || colors.blue
    
    return `<span className="${colorClass} text-white text-xs font-medium px-2 py-1 rounded-full">
  ${escapeHtml(comp.props.content || '')}
</span>`
  },

  progress: (comp) => {
    return `<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-blue-500 h-2 rounded-full transition-all"
    style={{ width: '${comp.props.percent || 0}%' }}
  ></div>
</div>`
  },

  tabs: (comp) => {
    const tabs = comp.props.tabs || []
    const activeTab = comp.props.activeTab || (tabs[0]?.key || '')
    
    const tabButtons = tabs.map((tab: any) => 
      `<button
  key="${tab.key}"
  className="px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab.key ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}"
>
  ${escapeHtml(tab.label)}
</button>`
    ).join('\n    ')
    
    return `<div className="tabs">
  <div className="flex border-b">${tabButtons}</div>
  <div className="p-4">
    ${comp.props.content ? escapeHtml(comp.props.content) : ''}
  </div>
</div>`
  },

  modal: (comp) => {
    return `<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">${escapeHtml(comp.props.title || '')}</h3>
      <button className="text-gray-400 hover:text-gray-600">✕</button>
    </div>
    <div className="modal-body">
      ${comp.props.content ? escapeHtml(comp.props.content) : ''}
    </div>
    <div className="flex justify-end gap-2 mt-4">
      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md">取消</button>
      <button className="px-4 py-2 bg-blue-500 text-white rounded-md">确定</button>
    </div>
  </div>
</div>`
  },

  drawer: (comp) => {
    const placement = comp.props.placement || 'right'
    const placementStyle = placement === 'right' ? 'right-0' : placement === 'left' ? 'left-0' : ''
    
    return `<div className="fixed inset-0 bg-black bg-opacity-50 z-50">
  <div className="fixed top-0 bottom-0 w-80 bg-white shadow-xl ${placementStyle}">
    <div className="p-4 border-b">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">${escapeHtml(comp.props.title || '')}</h3>
        <button className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
    </div>
    <div className="p-4">
      ${comp.props.content ? escapeHtml(comp.props.content) : ''}
    </div>
  </div>
</div>`
  },

  tooltip: (comp) => {
    return `<div className="relative inline-block">
  <span className="tooltip-trigger">${escapeHtml(comp.props.content || '')}</span>
  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
    ${escapeHtml(comp.props.title || '')}
  </span>
</div>`
  },

  alert: (comp) => {
    const types: Record<string, string> = {
      success: 'bg-green-50 border-green-200 text-green-700',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      error: 'bg-red-50 border-red-200 text-red-700',
      info: 'bg-blue-50 border-blue-200 text-blue-700',
    }
    const typeClass = types[comp.props.type as string] || types.info
    const icons: Record<string, string> = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ',
    }
    
    return `<div className="${typeClass} border-l-4 p-4 mb-4">
  <div className="flex items-start">
    <span className="mr-2">${icons[comp.props.type as string] || icons.info}</span>
    <div>
      ${comp.props.message ? `<strong>${escapeHtml(comp.props.message)}</strong>` : ''}
      ${comp.props.description ? `<p className="text-sm mt-1">${escapeHtml(comp.props.description)}</p>` : ''}
    </div>
  </div>
</div>`
  },

  breadcrumb: (comp) => {
    const items = (comp.props.items || []).map((item: any, idx: number) => {
      const separator = idx < (comp.props.items as any[]).length - 1 ? '<span className="mx-2 text-gray-400">/</span>' : ''
      if (item.href) {
        return `<a href="${escapeHtml(item.href)}" className="text-blue-500 hover:underline">${escapeHtml(item.title)}</a>${separator}`
      }
      return `<span className="text-gray-600">${escapeHtml(item.title)}</span>${separator}`
    }).join('\n    ')
    
    return `<nav className="flex items-center" aria-label="breadcrumb">${items}</nav>`
  },

  pagination: (comp) => {
    const current = comp.props.current || 1
    const total = comp.props.total || 10
    const pageSize = comp.props.pageSize || 10
    const totalPages = Math.ceil(total / pageSize)
    
    return `<div className="flex items-center gap-2">
  <button className="px-3 py-1 border rounded ${current === 1 ? 'opacity-50 cursor-not-allowed' : ''}" disabled={${current === 1}}>上一页</button>
  <span className="text-sm">第 ${current} / ${totalPages} 页</span>
  <button className="px-3 py-1 border rounded ${current === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" disabled={${current === totalPages}}>下一页</button>
</div>`
  },

  avatar: (comp) => {
    const sizes: Record<string, string> = {
      small: 'w-6 h-6 text-xs',
      medium: 'w-10 h-10 text-sm',
      large: 'w-16 h-16 text-lg',
    }
    const sizeClass = sizes[comp.props.size as string] || sizes.medium
    
    if (comp.props.src) {
      return `<img src="${escapeHtml(comp.props.src)}" alt="${escapeHtml(comp.props.alt || '')}" className="${sizeClass} rounded-full object-cover" />`
    }
    
    const initial = comp.props.alt ? comp.props.alt.charAt(0).toUpperCase() : '?'
    return `<div className="${sizeClass} rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">${initial}</div>`
  },
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function generateComponentCode(component: ComponentConfig): string {
  const template = COMPONENT_TEMPLATES[component.type]
  if (template) {
    return template(component)
  }
  
  return `<div className="component-${component.type}" style={{ 
    width: '${component.width}px', 
    height: '${component.height}px',
    opacity: ${component.opacity},
    ${component.rotation ? `transform: rotate(${component.rotation}deg);` : ''}
  }}>
  ${escapeHtml(component.name)}
</div>`
}

function generateComponentWithPosition(component: ComponentConfig): string {
  const componentCode = generateComponentCode(component)
  
  return `    <div
      className="absolute"
      style={{
        left: '${component.x}px',
        top: '${component.y}px',
        width: '${component.width}px',
        height: '${component.height}px',
        zIndex: ${component.zIndex},
        opacity: ${component.opacity},
        ${component.rotation ? `transform: rotate(${component.rotation}deg);` : ''},
      }}
    >
${componentCode.split('\n').map(line => '      ' + line).join('\n')}
    </div>`
}

export function generateCanvasCode(
  components: ComponentConfig[],
  pageConfig: PageConfig,
  _options: CodeGenerationOptions = {}
): GeneratedCodeFile[] {
  const files: GeneratedCodeFile[] = []

  const componentCode = components
    .filter(c => c.visible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(generateComponentWithPosition)
    .join('\n')

  const componentName = pageConfig.name ? 
    pageConfig.name.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') : 
    'CanvasPage'

  const componentContent = `import React from 'react'
import './${componentName}.css'

interface ${componentName}Props {}

export function ${componentName}(props: ${componentName}Props) {
  return (
    <div
      className="canvas-container"
      style={{
        width: '${pageConfig.width}px',
        height: '${pageConfig.height}px',
        backgroundColor: '${pageConfig.backgroundColor || '#ffffff'}',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
${componentCode}
    </div>
  )
}

export default ${componentName}
`

  files.push({
    path: `src/components/${componentName}.tsx`,
    content: componentContent,
  })

  const cssContent = `.canvas-container {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.canvas-container > div {
  position: absolute;
}

.tooltip-trigger {
  cursor: pointer;
}

.tabs {
  width: 100%;
}
`

  files.push({
    path: `src/components/${componentName}.css`,
    content: cssContent,
  })

  const appContent = `import React from 'react'
import ${componentName} from './components/${componentName}'
import './index.css'

function App() {
  return (
    <div className="app">
      <${componentName} />
    </div>
  )
}

export default App
`

  files.push({
    path: 'src/App.tsx',
    content: appContent,
  })

  const mainContent = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`

  files.push({
    path: 'src/main.tsx',
    content: mainContent,
  })

  const indexCssContent = `* {
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
  padding: 20px;
}
`

  files.push({
    path: 'src/index.css',
    content: indexCssContent,
  })

  const indexHtmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pageConfig.name || 'Canvas Page'}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

  files.push({
    path: 'index.html',
    content: indexHtmlContent,
  })

  const packageJsonContent = `{
  "name": "${pageConfig.name ? pageConfig.name.toLowerCase().replace(/\s+/g, '-') : 'canvas-page'}",
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
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
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
`

  files.push({
    path: 'package.json',
    content: packageJsonContent,
  })

  const tsconfigContent = `{
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
`

  files.push({
    path: 'tsconfig.json',
    content: tsconfigContent,
  })

  const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`

  files.push({
    path: 'vite.config.ts',
    content: viteConfigContent,
  })

  const tsconfigNodeContent = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
`

  files.push({
    path: 'tsconfig.node.json',
    content: tsconfigNodeContent,
  })

  return files
}

export function generateCanvasCodeZip(
  components: ComponentConfig[],
  pageConfig: PageConfig
): Blob {
  const files = generateCanvasCode(components, pageConfig)
  
  let zipContent = ''
  files.forEach(file => {
    zipContent += `---${file.path}---\n`
    zipContent += file.content
    zipContent += '\n'
  })
  
  return new Blob([zipContent], { type: 'application/octet-stream' })
}

export function generateSingleComponentCode(component: ComponentConfig): string {
  return generateComponentCode(component)
}
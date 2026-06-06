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

  constructor(schema: PageSchema) {
    this.schema = schema
    this.initializeImports()
  }

  /**
   * 初始化默认导入
   */
  private initializeImports(): void {
    this.imports.add("import React from 'react'")
    this.imports.add("import './index.css'")
  }

  /**
   * 生成完整的前端项目
   */
  generate(): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // 生成组件文件
    const componentFiles = this.generateComponents()
    files.push(...componentFiles)

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

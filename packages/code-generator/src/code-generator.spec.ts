/**
 * 代码生成引擎单元测试
 */
import { describe, it, expect, beforeEach } from '@jest/globals'
import { CodeGenerator, createCodeGenerator } from '@ai-lowcode/code-generator'

// 模拟画布组件 JSON
const mockSchema = {
  id: 'test-page',
  name: '测试页面',
  width: 1000,
  height: 800,
  backgroundColor: '#ffffff',
  components: [
    {
      id: 'btn-1',
      type: 'Button',
      x: 100,
      y: 100,
      width: 120,
      height: 40,
      props: {
        label: '点击按钮',
        variant: 'primary',
      },
      zIndex: 1,
    },
    {
      id: 'input-1',
      type: 'Input',
      x: 100,
      y: 160,
      width: 200,
      height: 40,
      props: {
        placeholder: '请输入内容',
        type: 'text',
      },
      zIndex: 2,
    },
    {
      id: 'table-1',
      type: 'Table',
      x: 100,
      y: 220,
      width: 800,
      height: 300,
      props: {
        columns: [
          { key: 'id', title: 'ID' },
          { key: 'name', title: '名称' },
        ],
      },
      dataSourceBinding: {
        type: 'database',
        tableName: 'users',
      },
      zIndex: 3,
    },
  ],
}

describe('CodeGenerator', () => {
  let generator: CodeGenerator

  beforeEach(() => {
    generator = createCodeGenerator(mockSchema, {
      framework: 'react',
      language: 'typescript',
      style: 'css',
    })
  })

  describe('基本功能', () => {
    it('should be defined', () => {
      expect(generator).toBeDefined()
    })

    it('should generate frontend code', () => {
      const result = generator.generate('frontend')
      
      expect(result).toBeDefined()
      expect(result.files).toBeDefined()
      expect(Array.isArray(result.files)).toBe(true)
      expect(result.files.length).toBeGreaterThan(0)
    })

    it('should generate backend code', () => {
      const result = generator.generate('backend')
      
      expect(result).toBeDefined()
      expect(result.files).toBeDefined()
      expect(Array.isArray(result.files)).toBe(true)
    })

    it('should generate fullstack code', () => {
      const result = generator.generate('fullstack')
      
      expect(result).toBeDefined()
      expect(result.files).toBeDefined()
      expect(Array.isArray(result.files)).toBe(true)
    })
  })

  describe('前端代码生成', () => {
    it('should generate React component files', () => {
      const result = generator.generate('frontend')
      
      // 检查是否生成了组件文件
      const componentFiles = result.files.filter(f => f.path.includes('.tsx'))
      expect(componentFiles.length).toBeGreaterThan(0)
    })

    it('should generate package.json', () => {
      const result = generator.generate('frontend')
      
      const packageFile = result.files.find(f => f.path === 'package.json')
      expect(packageFile).toBeDefined()
      
      const packageContent = JSON.parse(packageFile.content)
      expect(packageContent.name).toBeDefined()
      expect(packageContent.scripts).toBeDefined()
    })

    it('should generate vite config', () => {
      const result = generator.generate('frontend')
      
      const viteConfig = result.files.find(f => f.path === 'vite.config.ts')
      expect(viteConfig).toBeDefined()
      expect(viteConfig.content).toContain('Vite')
    })
  })

  describe('后端代码生成', () => {
    it('should generate NestJS module files', () => {
      const result = generator.generate('backend')
      
      const moduleFiles = result.files.filter(f => f.path.includes('.module.ts'))
      expect(moduleFiles.length).toBeGreaterThan(0)
    })

    it('should generate SQL file', () => {
      const result = generator.generate('backend')
      
      const sqlFile = result.files.find(f => f.path.includes('.sql'))
      expect(sqlFile).toBeDefined()
      expect(sqlFile.content).toContain('CREATE TABLE')
    })

    it('should generate Controller and Service', () => {
      const result = generator.generate('backend')
      
      const controllerFiles = result.files.filter(f => f.path.includes('.controller.ts'))
      const serviceFiles = result.files.filter(f => f.path.includes('.service.ts'))
      
      expect(controllerFiles.length).toBeGreaterThan(0)
      expect(serviceFiles.length).toBeGreaterThan(0)
    })
  })

  describe('文件内容验证', () => {
    it('should generate valid TypeScript code', () => {
      const result = generator.generate('frontend')
      
      const tsxFile = result.files.find(f => f.path.endsWith('.tsx'))
      expect(tsxFile).toBeDefined()
      expect(tsxFile.content).toContain('import')
      expect(tsxFile.content).toContain('export')
    })

    it('should generate proper component structure', () => {
      const result = generator.generate('frontend')
      
      const pageFile = result.files.find(f => f.path.includes('PageComponent'))
      expect(pageFile).toBeDefined()
      expect(pageFile.content).toContain('function')
      expect(pageFile.content).toContain('return')
    })
  })
})

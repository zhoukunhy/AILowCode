/**
 * 工具调用 Agent 测试用例
 */

import {
  SQLDDLTool,
  NestCrudTool,
  HttpTestTool,
  ToolCallingAgent,
} from '../index'

describe('SQLDDLTool', () => {
  const tool = new SQLDDLTool()

  describe('generateDDL', () => {
    it('should generate basic CREATE TABLE statement', () => {
      const input = {
        tableName: 'users',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string', nullable: false },
        ],
        ifNotExists: true,
      }

      const sql = tool.generateDDL(input)
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS users')
      expect(sql).toContain('id')
      expect(sql).toContain('name')
      expect(sql).toContain('email')
    })

    it('should handle primary key correctly', () => {
      const input = {
        tableName: 'products',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'name', type: 'string' },
        ],
      }

      const sql = tool.generateDDL(input)
      expect(sql).toContain('PRIMARY KEY')
    })

    it('should handle foreign keys', () => {
      const input = {
        tableName: 'orders',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'user_id', type: 'integer', references: 'users(id)' },
          { name: 'product_id', type: 'integer', references: 'products(id)' },
        ],
      }

      const sql = tool.generateDDL(input)
      expect(sql).toContain('REFERENCES users(id)')
      expect(sql).toContain('REFERENCES products(id)')
    })
  })

  describe('execute', () => {
    it('should generate DDL without executing', async () => {
      const input = {
        tableName: 'test_table',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'name', type: 'string' },
        ],
      }

      const result = await tool.execute(input)
      expect(result.success).toBe(true)
      expect(result.executed).toBe(false)
      expect(result.sql).toContain('CREATE TABLE')
      expect(result.tableName).toBe('test_table')
    })
  })
})

describe('NestCrudTool', () => {
  const tool = new NestCrudTool()

  describe('execute', () => {
    it('should generate entity, service, controller, and module', async () => {
      const input = {
        entityName: 'User',
        tableName: 'users',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string' },
        ],
        generateService: true,
        generateController: true,
        generateDTOs: true,
        swagger: true,
      }

      const result = await tool.execute(input)
      expect(result.success).toBe(true)
      expect(result.files.length).toBeGreaterThan(0)
      expect(result.files.some(f => f.type === 'entity')).toBe(true)
      expect(result.files.some(f => f.type === 'service')).toBe(true)
      expect(result.files.some(f => f.type === 'controller')).toBe(true)
      expect(result.files.some(f => f.type === 'module')).toBe(true)
    })

    it('should generate correct entity content', async () => {
      const input = {
        entityName: 'Product',
        tableName: 'products',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'name', type: 'string' },
        ],
      }

      const result = await tool.execute(input)
      const entityFile = result.files.find(f => f.type === 'entity')
      expect(entityFile?.content).toContain('@Entity')
      expect(entityFile?.content).toContain('class Product')
    })
  })
})

describe('HttpTestTool', () => {
  const tool = new HttpTestTool({ defaultTimeout: 5000 })

  describe('execute', () => {
    it('should execute GET request', async () => {
      const input = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET' as const,
        expectedStatus: 200,
      }

      const result = await tool.execute(input)
      expect(result.statusCode).toBe(200)
      expect(result.success).toBe(true)
      expect(result.duration).toBeLessThan(10000)
    })

    it('should handle connection errors gracefully', async () => {
      const input = {
        url: 'http://localhost:99999',
        method: 'GET' as const,
        timeout: 1000,
      }

      const result = await tool.execute(input)
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(0)
    })
  })

  describe('testConnectivity', () => {
    it('should test connectivity to a reachable URL', async () => {
      const result = await tool.testConnectivity('https://jsonplaceholder.typicode.com')
      expect(result.reachable).toBe(true)
      expect(result.latency).toBeLessThan(10000)
    })
  })
})

describe('ToolCallingAgent', () => {
  const agent = new ToolCallingAgent()

  describe('decideTool', () => {
    it('should decide SQL_DDL for create table requests', async () => {
      const decision = await agent.decideTool('帮我建一个用户表', [])
      expect(decision.shouldCallTool).toBe(true)
      expect(decision.toolName).toBe('SQL_DDL')
    })

    it('should decide Nest_Crud for code generation requests', async () => {
      const decision = await agent.decideTool('生成用户管理的CRUD接口', [])
      expect(decision.shouldCallTool).toBe(true)
      expect(decision.toolName).toBe('Nest_Crud')
    })

    it('should decide Http_Test for test requests', async () => {
      const decision = await agent.decideTool('测试一下这个接口', [])
      expect(decision.shouldCallTool).toBe(true)
      expect(decision.toolName).toBe('Http_Test')
    })
  })

  describe('execute', () => {
    it('should execute SQL_DDL tool with entity', async () => {
      const entities = [
        {
          name: 'User',
          tableName: 'users',
          columns: [
            { name: 'id', type: 'integer', primaryKey: true },
            { name: 'name', type: 'string' },
          ],
        },
      ]

      const result = await agent.execute('帮我建一个用户表', entities)
      expect(result.summary).toContain('DDL')
      expect(result.ddlResult).toBeDefined()
      expect(result.ddlResult?.success).toBe(true)
    })
  })
})

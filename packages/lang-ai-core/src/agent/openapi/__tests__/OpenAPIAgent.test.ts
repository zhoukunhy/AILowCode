/**
 * OpenAPI Agent 测试用例
 */

import { OpenAPIParser } from '../OpenAPIParser'
import { OpenAPIAgentExecutor } from '../OpenAPIAgentExecutor'
import { VersionCompareService } from '../VersionCompareService'

describe('OpenAPIParser', () => {
  const parser = new OpenAPIParser()

  const sampleOpenAPI: any = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {
      '/users': {
        get: {
          summary: 'Get users',
          description: 'Retrieve a list of users',
          operationId: 'getUsers',
          tags: ['Users'],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              required: false,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', description: 'User ID' },
                        name: { type: 'string', description: 'User name' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create user',
          operationId: 'createUser',
          tags: ['Users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                  },
                  required: ['name', 'email'],
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User created',
            },
          },
        },
      },
    },
  }

  describe('parse', () => {
    it('should parse OpenAPI document', () => {
      const endpoints = parser.parse(sampleOpenAPI)
      expect(endpoints.length).toBe(2)
      expect(endpoints[0].path).toBe('/users')
      expect(endpoints[0].method).toBe('GET')
      expect(endpoints[0].operationId).toBe('getUsers')
    })

    it('should extract parameters', () => {
      const endpoints = parser.parse(sampleOpenAPI)
      const getUsers = endpoints.find((e: any) => e.operationId === 'getUsers')
      expect(getUsers.parameters.length).toBe(1)
      expect(getUsers.parameters[0].name).toBe('page')
      expect(getUsers.parameters[0].in).toBe('query')
    })

    it('should extract request body', () => {
      const endpoints = parser.parse(sampleOpenAPI)
      const createUser = endpoints.find((e: any) => e.operationId === 'createUser')
      expect(createUser.requestBody).toBeDefined()
      expect(createUser.requestBody?.required).toBe(true)
    })
  })

  describe('validate', () => {
    it('should validate valid document', () => {
      const result = parser.validate(sampleOpenAPI)
      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should invalidate document without info', () => {
      const invalidDoc = { ...sampleOpenAPI }
      delete invalidDoc.info
      const result = parser.validate(invalidDoc)
      expect(result.valid).toBe(false)
    })

    it('should invalidate document without paths', () => {
      const invalidDoc = { ...sampleOpenAPI }
      delete invalidDoc.paths
      const result = parser.validate(invalidDoc)
      expect(result.valid).toBe(false)
    })
  })

  describe('getVersion', () => {
    it('should detect OpenAPI 3.0', () => {
      expect(parser.getVersion({ openapi: '3.0.0', info: { title: 'Test', version: '1.0' }, paths: {} })).toBe('3.0')
    })

    it('should detect OpenAPI 3.1', () => {
      expect(parser.getVersion({ openapi: '3.1.0', info: { title: 'Test', version: '1.0' }, paths: {} })).toBe('3.1')
    })

    it('should detect Swagger 2.0', () => {
      expect(parser.getVersion({ swagger: '2.0', info: { title: 'Test', version: '1.0' }, paths: {} })).toBe('2.0')
    })
  })

  describe('getTags', () => {
    it('should extract tags from operations', () => {
      const tags = parser.getTags(sampleOpenAPI)
      expect(tags).toContain('Users')
    })
  })
})

describe('OpenAPIAgentExecutor', () => {
  const executor = new OpenAPIAgentExecutor({
    defaultBaseUrl: 'http://localhost:3000',
    defaultAuthType: 'none',
  })

  const sampleOpenAPI: any = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    servers: [{ url: 'http://api.example.com/v1' }],
    paths: {
      '/users': {
        get: {
          summary: 'Get users',
          operationId: 'getUsers',
          tags: ['Users'],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: { id: { type: 'integer' }, name: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/posts': {
        get: {
          summary: 'Get posts',
          operationId: 'getPosts',
          tags: ['Posts'],
          responses: {
            '200': {
              description: 'Success',
            },
          },
        },
      },
    },
  }

  describe('execute', () => {
    it('should parse and generate data sources and pages', async () => {
      const result = await executor.execute(sampleOpenAPI)
      expect(result.endpoints.length).toBe(2)
      expect(result.dataSources.length).toBe(2)
      expect(result.pages.length).toBe(2)
    })

    it('should generate correct data source configuration', async () => {
      const result = await executor.execute(sampleOpenAPI)
      const userDs = result.dataSources.find((ds: any) => ds.name.includes('Users'))
      expect(userDs).toBeDefined()
      expect(userDs.baseUrl).toBe('http://api.example.com/v1')
      expect(userDs.endpoints.length).toBe(1)
    })

    it('should generate page configurations', async () => {
      const result = await executor.execute(sampleOpenAPI)
      const page = result.pages[0]
      expect(page.id).toBeDefined()
      expect(page.name).toBeDefined()
      expect(page.components.length).toBeGreaterThan(0)
    })
  })

  it('should throw error for invalid document', async () => {
    const invalidDoc = { invalid: 'document' }
    await expect(executor.execute(invalidDoc as any)).rejects.toThrow()
  })
})

describe('VersionCompareService', () => {
  const service = new VersionCompareService({ aiEnabled: true })

  const baseSchema = {
    version: '1.0',
    type: 'list',
    components: [
      {
        id: 'comp-1',
        type: 'Table',
        props: {
          dataSource: 'ds://users',
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'name', title: 'Name', dataIndex: 'name' },
          ],
        },
      },
    ],
  }

  const modifiedSchema = {
    version: '2.0',
    type: 'list',
    components: [
      {
        id: 'comp-1',
        type: 'Table',
        props: {
          dataSource: 'ds://users-v2',
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'name', title: 'User Name', dataIndex: 'name' },
            { key: 'email', title: 'Email', dataIndex: 'email' },
          ],
        },
      },
      {
        id: 'comp-2',
        type: 'Button',
        props: { text: 'Add User' },
      },
    ],
  }

  describe('compare', () => {
    it('should detect differences between versions', async () => {
      const versionFrom = {
        id: 'snapshot-1',
        pageId: 'page-1',
        version: '1.0',
        timestamp: new Date(),
        pageSchema: baseSchema,
        metadata: {},
      }

      const versionTo = {
        id: 'snapshot-2',
        pageId: 'page-1',
        version: '2.0',
        timestamp: new Date(),
        pageSchema: modifiedSchema,
        metadata: {},
      }

      const comparison = await service.compare(versionFrom, versionTo)
      expect(comparison.differences.length).toBeGreaterThan(0)
      expect(comparison.versionFrom).toBe('1.0')
      expect(comparison.versionTo).toBe('2.0')
    })

    it('should detect additions', async () => {
      const versionFrom = {
        id: 'snapshot-1',
        pageId: 'page-1',
        version: '1.0',
        timestamp: new Date(),
        pageSchema: baseSchema,
        metadata: {},
      }

      const versionTo = {
        id: 'snapshot-2',
        pageId: 'page-1',
        version: '2.0',
        timestamp: new Date(),
        pageSchema: modifiedSchema,
        metadata: {},
      }

      const comparison = await service.compare(versionFrom, versionTo)
      const additions = comparison.differences.filter((d: any) => d.type === 'addition')
      expect(additions.length).toBeGreaterThan(0)
    })

    it('should detect modifications', async () => {
      const versionFrom = {
        id: 'snapshot-1',
        pageId: 'page-1',
        version: '1.0',
        timestamp: new Date(),
        pageSchema: baseSchema,
        metadata: {},
      }

      const versionTo = {
        id: 'snapshot-2',
        pageId: 'page-1',
        version: '2.0',
        timestamp: new Date(),
        pageSchema: modifiedSchema,
        metadata: {},
      }

      const comparison = await service.compare(versionFrom, versionTo)
      const modifications = comparison.differences.filter((d: any) => d.type === 'modification')
      expect(modifications.length).toBeGreaterThan(0)
    })
  })

  describe('analyzeChanges', () => {
    it('should provide analysis statistics', async () => {
      const versionFrom = {
        id: 'snapshot-1',
        pageId: 'page-1',
        version: '1.0',
        timestamp: new Date(),
        pageSchema: baseSchema,
        metadata: {},
      }

      const versionTo = {
        id: 'snapshot-2',
        pageId: 'page-1',
        version: '2.0',
        timestamp: new Date(),
        pageSchema: modifiedSchema,
        metadata: {},
      }

      const comparison = await service.compare(versionFrom, versionTo)
      expect(comparison.analysis.totalChanges).toBeGreaterThan(0)
      expect(comparison.analysis.additions).toBeGreaterThan(0)
      expect(comparison.analysis.modifications).toBeGreaterThan(0)
    })
  })

  describe('getChangeSummary', () => {
    it('should generate human-readable summary', async () => {
      const versionFrom = {
        id: 'snapshot-1',
        pageId: 'page-1',
        version: '1.0',
        timestamp: new Date(),
        pageSchema: baseSchema,
        metadata: {},
      }

      const versionTo = {
        id: 'snapshot-2',
        pageId: 'page-1',
        version: '2.0',
        timestamp: new Date(),
        pageSchema: modifiedSchema,
        metadata: {},
      }

      const comparison = await service.compare(versionFrom, versionTo)
      const summary = service.getChangeSummary(comparison)
      expect(summary).toContain('1.0')
      expect(summary).toContain('2.0')
      expect(summary).toContain('总变更数')
    })
  })

  describe('createSnapshot', () => {
    it('should create snapshot correctly', () => {
      const snapshot = service.createSnapshot('page-1', '1.0', baseSchema, { author: 'test' })
      expect(snapshot.id).toBeDefined()
      expect(snapshot.pageId).toBe('page-1')
      expect(snapshot.version).toBe('1.0')
      expect(snapshot.metadata.author).toBe('test')
    })
  })

  describe('getAIOptimizationSuggestions', () => {
    it('should return suggestions when AI is enabled', async () => {
      const schemaWithDeprecated = {
        components: [
          {
            id: 'comp-1',
            type: 'Table',
            props: {
              dataSource: 'ds://users',
              deprecated: true,
            },
          },
        ],
      }

      const suggestions = await service.getAIOptimizationSuggestions(schemaWithDeprecated)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return empty when AI is disabled', async () => {
      const disabledService = new VersionCompareService({ aiEnabled: false })
      const suggestions = await disabledService.getAIOptimizationSuggestions(baseSchema)
      expect(suggestions.length).toBe(0)
    })
  })
})

/**
 * Jest 测试环境配置
 */

// 设置测试超时时间
jest.setTimeout(30000)

// Mock console.log 和 console.error 以减少测试输出噪音
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// 全局测试环境变量
process.env.NODE_ENV = 'test'
process.env.MILVUS_HOST = 'localhost'
process.env.MILVUS_PORT = '19530'
process.env.OPENAI_API_KEY = 'test-api-key'

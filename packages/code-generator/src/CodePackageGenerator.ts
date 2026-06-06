/**
 * 代码包生成器
 * 将生成的代码打包为 ZIP 文件
 */

import type { GeneratedFile } from './types'
import { BackendGenerator, createBackendGenerator } from './BackendGenerator'
import { FrontendGenerator, createFrontendGenerator } from './FrontendGenerator'

/**
 * 打包选项
 */
export interface PackageOptions {
  includeReadme?: boolean
  includeDocker?: boolean
  includeGitIgnore?: boolean
  projectName?: string
}

/**
 * 代码包生成器
 */
export class CodePackageGenerator {
  private backendFiles: GeneratedFile[] = []
  private frontendFiles: GeneratedFile[] = []
  private options: PackageOptions

  constructor(options: PackageOptions = {}) {
    this.options = {
      includeReadme: true,
      includeDocker: true,
      includeGitIgnore: true,
      projectName: 'generated-project',
      ...options,
    }
  }

  /**
   * 添加后端文件
   */
  addBackendFiles(files: GeneratedFile[]): void {
    this.backendFiles.push(...files)
  }

  /**
   * 添加前端文件
   */
  addFrontendFiles(files: GeneratedFile[]): void {
    this.frontendFiles.push(...files)
  }

  /**
   * 生成完整项目包
   */
  generateFullStackPackage(backendSchema: any, frontendSchema: any): Promise<Buffer> {
    // 生成后端代码
    const backendGenerator = createBackendGenerator(backendSchema)
    this.backendFiles = backendGenerator.generate()

    // 生成前端代码
    const frontendGenerator = createFrontendGenerator(frontendSchema)
    this.frontendFiles = frontendGenerator.generate()

    return this.generateZip()
  }

  /**
   * 生成 ZIP 文件
   */
  async generateZip(): Promise<Buffer> {
    const files: { path: string; content: Buffer }[] = []

    // 添加后端文件
    for (const file of this.backendFiles) {
      files.push({
        path: `backend/${file.path}`,
        content: Buffer.from(file.content, 'utf-8'),
      })
    }

    // 添加前端文件
    for (const file of this.frontendFiles) {
      files.push({
        path: `frontend/${file.path}`,
        content: Buffer.from(file.content, 'utf-8'),
      })
    }

    // 添加 README
    if (this.options.includeReadme) {
      files.push({
        path: 'README.md',
        content: Buffer.from(this.generateReadme(), 'utf-8'),
      })
    }

    // 添加 Docker 配置
    if (this.options.includeDocker) {
      files.push({
        path: 'docker-compose.yml',
        content: Buffer.from(this.generateDockerCompose(), 'utf-8'),
      })
      files.push({
        path: 'Dockerfile.frontend',
        content: Buffer.from(this.generateDockerfile('frontend'), 'utf-8'),
      })
      files.push({
        path: 'Dockerfile.backend',
        content: Buffer.from(this.generateDockerfile('backend'), 'utf-8'),
      })
    }

    // 添加 .gitignore
    if (this.options.includeGitIgnore) {
      files.push({
        path: '.gitignore',
        content: Buffer.from(this.generateGitIgnore(), 'utf-8'),
      })
    }

    // 生成 ZIP
    return this.createZipBuffer(files)
  }

  /**
   * 生成 README
   */
  private generateReadme(): string {
    return `# ${this.options.projectName}

> 由 AI 低代码平台自动生成的全栈项目

## 项目结构

\`\`\`
${this.options.projectName}/
├── backend/          # NestJS 后端项目
│   ├── src/
│   │   ├── modules/  # 业务模块
│   │   └── ...
│   ├── package.json
│   └── ...
├── frontend/         # React 前端项目
│   ├── src/
│   │   └── ...
│   ├── package.json
│   └── ...
├── docker-compose.yml
└── README.md
\`\`\`

## 快速开始

### 使用 Docker（推荐）

\`\`\`bash
docker-compose up -d
\`\`\`

### 手动启动

**后端**

\`\`\`bash
cd backend
npm install
npm run start:dev
\`\`\`

**前端**

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 后端 API

后端服务运行在 http://localhost:3000

### 接口文档

- Swagger UI: http://localhost:3000/api/docs
- OpenAPI JSON: http://localhost:3000/api/docs-json

## 前端

前端服务运行在 http://localhost:5173

## 技术栈

- **后端**: NestJS, TypeORM, PostgreSQL
- **前端**: React, TypeScript, TailwindCSS
- **数据库**: PostgreSQL
- **容器化**: Docker, Docker Compose

---
*此文件由 AI 低代码平台自动生成*
`
  }

  /**
   * 生成 docker-compose.yml
   */
  private generateDockerCompose(): string {
    return `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ${this.options.projectName}-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${this.options.projectName}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: ../Dockerfile.backend
    container_name: ${this.options.projectName}-backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      DB_DATABASE: ${this.options.projectName}
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:dev

  frontend:
    build:
      context: ./frontend
      dockerfile: ../Dockerfile.frontend
    container_name: ${this.options.projectName}-frontend
    environment:
      VITE_API_URL: http://localhost:3000
    ports:
      - "5173:5173"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
`
  }

  /**
   * 生成 Dockerfile
   */
  private generateDockerfile(type: 'frontend' | 'backend'): string {
    if (type === 'frontend') {
      return `# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 5173

# 启动命令
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
`
    } else {
      return `# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "run", "start:dev"]
`
    }
  }

  /**
   * 生成 .gitignore
   */
  private generateGitIgnore(): string {
    return `# 依赖
node_modules/
.pnp
.pnp.js

# 构建输出
dist/
build/
out/

# 环境变量
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# 日志
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 操作系统
.DS_Store
Thumbs.db

# 测试
coverage/
.nyc_output/

# Docker
.docker/

# 临时文件
*.tmp
*.temp
.cache/
`
  }

  /**
   * 创建 ZIP Buffer
   */
  private async createZipBuffer(files: { path: string; content: Buffer }[]): Promise<Buffer> {
    // 使用简单的 ZIP 格式
    // 在实际环境中应使用 archiver 或 jszip 库
    const zipParts: Buffer[] = []
    const centralDirectory: { offset: number; size: number; path: string }[] = []

    for (const file of files) {
      const pathBuffer = Buffer.from(file.path, 'utf-8')
      const content = file.content

      // Local file header
      const localHeader = Buffer.alloc(30)
      localHeader.writeUInt32LE(0x04034b50, 0) // Signature
      localHeader.writeUInt16LE(20, 4) // Version needed
      localHeader.writeUInt16LE(0, 6) // Flags
      localHeader.writeUInt16LE(0, 8) // Compression (stored)
      localHeader.writeUInt16LE(0, 10) // Mod time
      localHeader.writeUInt16LE(0, 12) // Mod date
      localHeader.writeUInt32LE(this.crc32(content), 14) // CRC-32
      localHeader.writeUInt32LE(content.length, 18) // Compressed size
      localHeader.writeUInt32LE(content.length, 22) // Uncompressed size
      localHeader.writeUInt16LE(pathBuffer.length, 26) // Path length
      localHeader.writeUInt16LE(0, 28) // Extra length

      const offset = zipParts.reduce((acc, p) => acc + p.length, 0)
      centralDirectory.push({ offset, size: content.length, path: file.path })

      zipParts.push(localHeader)
      zipParts.push(pathBuffer)
      zipParts.push(content)
    }

    // Central directory
    const cdOffset = zipParts.reduce((acc, p) => acc + p.length, 0)
    const centralDirParts: Buffer[] = []

    for (const entry of centralDirectory) {
      const pathBuffer = Buffer.from(entry.path, 'utf-8')
      const cdEntry = Buffer.alloc(46)
      cdEntry.writeUInt32LE(0x02014b50, 0) // Signature
      cdEntry.writeUInt16LE(0, 4) // Version made by
      cdEntry.writeUInt16LE(20, 6) // Version needed
      cdEntry.writeUInt16LE(0, 8) // Flags
      cdEntry.writeUInt16LE(0, 10) // Compression
      cdEntry.writeUInt16LE(0, 12) // Mod time
      cdEntry.writeUInt16LE(0, 14) // Mod date
      cdEntry.writeUInt32LE(entry.size, 16) // CRC-32 (use compressed size)
      cdEntry.writeUInt32LE(entry.size, 20) // Compressed size
      cdEntry.writeUInt32LE(entry.size, 24) // Uncompressed size
      cdEntry.writeUInt16LE(pathBuffer.length, 28) // Path length
      cdEntry.writeUInt16LE(0, 30) // Extra length
      cdEntry.writeUInt16LE(0, 32) // Comment length
      cdEntry.writeUInt16LE(0, 34) // Disk start
      cdEntry.writeUInt16LE(0, 36) // Internal attr
      cdEntry.writeUInt32LE(0, 38) // External attr
      cdEntry.writeUInt32LE(entry.offset, 42) // Relative offset

      centralDirParts.push(cdEntry)
      centralDirParts.push(pathBuffer)
    }

    // End of central directory
    const eocd = Buffer.alloc(22)
    eocd.writeUInt32LE(0x06054b50, 0) // Signature
    eocd.writeUInt16LE(0, 4) // Disk number
    eocd.writeUInt16LE(0, 6) // CD disk number
    eocd.writeUInt16LE(centralDirectory.length, 8) // Entries on disk
    eocd.writeUInt16LE(centralDirectory.length, 10) // Total entries
    eocd.writeUInt32LE(centralDirParts.reduce((acc, p) => acc + p.length, 0), 12) // CD size
    eocd.writeUInt32LE(cdOffset, 16) // CD offset
    eocd.writeUInt16LE(0, 20) // Comment length

    return Buffer.concat([...zipParts, ...centralDirParts, eocd])
  }

  /**
   * 计算 CRC-32
   */
  private crc32(data: Buffer): number {
    let crc = 0xffffffff
    const table = this.getCrc32Table()
    
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
    }
    
    return (crc ^ 0xffffffff) >>> 0
  }

  /**
   * 获取 CRC-32 表
   */
  private crc32Table: number[] | null = null
  private getCrc32Table(): number[] {
    if (this.crc32Table) return this.crc32Table

    this.crc32Table = []
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
      }
      this.crc32Table[i] = c >>> 0
    }
    return this.crc32Table
  }
}

/**
 * 创建代码包生成器
 */
export function createCodePackageGenerator(options?: PackageOptions): CodePackageGenerator {
  return new CodePackageGenerator(options)
}

/**
 * 将生成的代码打包为单个 ZIP 文件
 */
export async function packageGeneratedCode(
  files: GeneratedFile[],
  options?: PackageOptions
): Promise<Buffer> {
  const generator = createCodePackageGenerator(options)
  
  if (files.some(f => f.path.startsWith('src/'))) {
    generator.addBackendFiles(files.filter(f => f.path.startsWith('src/') || f.path.endsWith('.json')))
  } else {
    generator.addFrontendFiles(files)
  }
  
  return generator.generateZip()
}

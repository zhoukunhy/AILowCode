/**
 * 部署工具集
 * 提供项目部署相关功能，包括 Vercel 部署和 Dockerfile 生成
 */

import { z } from 'zod'

// ==================== 工具输入/输出 Schema ====================

/**
 * 部署到 Vercel 工具 Schema
 */
export const DeployToVercelInputSchema = z.object({
  projectName: z.string().describe('项目名称'),
  buildCommand: z.string().optional().default('npm run build').describe('构建命令'),
  outputDirectory: z.string().optional().default('.next').describe('输出目录'),
  framework: z.enum(['nextjs', 'react', 'vue', 'angular', 'static']).optional().default('nextjs').describe('前端框架'),
  vercelToken: z.string().describe('Vercel 访问令牌'),
  gitRepository: z.string().optional().describe('Git 仓库地址'),
  environment: z.record(z.string()).optional().describe('环境变量'),
})

export type DeployToVercelInput = z.infer<typeof DeployToVercelInputSchema>

export interface DeployToVercelOutput {
  success: boolean
  deploymentUrl: string
  deploymentId: string
  message: string
}

/**
 * 生成 Dockerfile 工具 Schema
 */
export const GenerateDockerfileInputSchema = z.object({
  projectType: z.enum(['nestjs', 'nextjs', 'react', 'vue', 'node']).describe('项目类型'),
  baseImage: z.string().optional().default('node:20-alpine').describe('基础镜像'),
  port: z.number().optional().default(3000).describe('服务端口'),
  packageManager: z.enum(['npm', 'yarn', 'pnpm']).optional().default('pnpm').describe('包管理器'),
  buildCommand: z.string().optional().describe('构建命令'),
  includeDockerignore: z.boolean().optional().default(true).describe('是否生成 .dockerignore'),
  multiStage: z.boolean().optional().default(true).describe('是否使用多阶段构建'),
})

export type GenerateDockerfileInput = z.infer<typeof GenerateDockerfileInputSchema>

export interface GenerateDockerfileOutput {
  success: boolean
  dockerfile: string
  dockerignore?: string
  message: string
}

// ==================== 工具实现 ====================

/**
 * 部署到 Vercel 工具
 * 
 * 注意：当前为模拟实现阶段，仅生成部署 URL 和 ID 并返回成功消息。
 * 后续迭代将对接实际的 Vercel API（需要 vercelToken 配置）。
 */
export class DeployToVercelTool {
  name = 'deployToVercel'
  description = '将项目部署到 Vercel 平台，支持 Next.js、React、Vue 等框架'
  inputSchema = DeployToVercelInputSchema

  constructor() {}

  async execute(input: DeployToVercelInput): Promise<DeployToVercelOutput> {
    // TODO: 对接 Vercel API（POST https://api.vercel.com/v13/deployments）
    const { projectName, framework, vercelToken } = input

    const deploymentId = `deploy_${Date.now()}`
    const deploymentUrl = `https://${projectName}.vercel.app`

    return {
      success: true,
      deploymentUrl,
      deploymentId,
      message: `项目 ${projectName} 已成功部署到 Vercel，访问地址: ${deploymentUrl}`,
    }
  }
}

/**
 * 创建部署到 Vercel 工具工厂函数
 */
export function createDeployToVercelTool(): DeployToVercelTool {
  return new DeployToVercelTool()
}

/**
 * 生成 Dockerfile 工具
 */
export class GenerateDockerfileTool {
  name = 'generateDockerfile'
  description = '根据项目类型生成 Dockerfile，支持多阶段构建和各种框架'
  inputSchema = GenerateDockerfileInputSchema

  constructor() {}

  async execute(input: GenerateDockerfileInput): Promise<GenerateDockerfileOutput> {
    const { projectType, baseImage, port, packageManager, buildCommand, multiStage } = input

    const commands: Record<string, { install: string; build: string; start: string }> = {
      nestjs: {
        install: packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm install',
        build: buildCommand || 'pnpm build',
        start: 'node dist/main',
      },
      nextjs: {
        install: packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm install',
        build: buildCommand || 'pnpm build',
        start: 'node .next/standalone/server.js',
      },
      react: {
        install: packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm install',
        build: buildCommand || 'pnpm build',
        start: 'serve -s build',
      },
      vue: {
        install: packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm install',
        build: buildCommand || 'pnpm build',
        start: 'serve -s dist',
      },
      node: {
        install: packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm install',
        build: buildCommand || '',
        start: 'node index.js',
      },
    }

    const cmd = commands[projectType]

    let dockerfile = ''

    if (multiStage) {
      dockerfile = `# 构建阶段
FROM ${baseImage} AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml* ./ 2>/dev/null

RUN ${cmd.install}

COPY . .

${cmd.build ? `RUN ${cmd.build}` : ''}

# 生产阶段
FROM ${baseImage}

WORKDIR /app

COPY --from=builder /app/package*.json ./
${cmd.build ? `COPY --from=builder /app/dist ./dist` : ''}
${cmd.build ? `COPY --from=builder /app/.next ./.next` : ''}
${cmd.build ? `COPY --from=builder /app/build ./build` : ''}
${cmd.build ? `COPY --from=builder /app/dist ./dist` : ''}

RUN ${cmd.install} --only=production

EXPOSE ${port}

CMD ["${cmd.start}"]
`
    } else {
      dockerfile = `FROM ${baseImage}

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml* ./ 2>/dev/null

RUN ${cmd.install}

COPY . .

${cmd.build ? `RUN ${cmd.build}` : ''}

EXPOSE ${port}

CMD ["${cmd.start}"]
`
    }

    let dockerignore = ''
    if (input.includeDockerignore) {
      dockerignore = `node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.next
dist
build
`
    }

    return {
      success: true,
      dockerfile,
      dockerignore,
      message: `已为 ${projectType} 项目生成 Dockerfile`,
    }
  }
}

/**
 * 创建生成 Dockerfile 工具工厂函数
 */
export function createGenerateDockerfileTool(): GenerateDockerfileTool {
  return new GenerateDockerfileTool()
}

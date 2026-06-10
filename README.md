# AI Low-Code Platform

> 基于 AI 能力的新一代低代码开发平台，让开发变得更简单、更高效。

## 📋 项目概述

AI Low-Code Platform 是一个基于 Monorepo 架构的全栈低代码开发平台，集成了可视化画布编辑器、AI 代码生成、RAG 知识库、LangGraph 多 Agent 架构等核心 AI 能力。

### ✨ 核心特性

- **可视化画布编辑器**：拖拽式组件设计，所见即所得
- **AI 智能生成**：基于大语言模型的代码和组件生成
- **RAG 知识库**：检索增强生成，整合项目编码规范和历史代码
- **LangGraph 多 Agent**：多智能体协作，复杂任务分解执行
- **异常诊断 Agent**：AI 自动故障诊断和修复建议
- **代码优化 Agent**：自动优化代码结构、异常处理、参数校验
- **丰富组件库**：内置多种基础组件和自定义组件支持
- **多环境部署**：支持开发、测试、生产环境配置
- **插件系统**：灵活的插件扩展机制

### 🚀 项目当前状态

#### ✅ 已完成功能

| 模块 | 功能 | 状态 |
|------|------|------|
| **用户认证** | JWT登录/注册 | ✅ 已完成 |
| **画布编辑器** | 可视化拖拽编辑器 | ✅ 已完成 |
| **画布持久化** | 数据库存储 | ✅ 已完成 |
| **菜单管理** | 动态菜单配置 | ✅ 已完成 |
| **画布管理** | 画布CRUD、复制、删除 | ✅ 已完成 |
| **数据建模** | 数据模型配置 | ✅ 已完成 |
| **工作流编排** | 可视化流程设计 | ✅ 已完成 |
| **知识库管理** | RAG文档管理 | ✅ 已完成 |
| **数据源管理** | 多数据源配置 | ✅ 已完成 |
| **AI配置** | 多LLM支持 | ✅ 已完成 |
| **Agent编排** | LangGraph工作流 | ✅ 已完成 |
| **日志系统** | AI调用日志 | ✅ 已完成 |

#### 🔄 进行中功能

| 模块 | 功能 | 状态 |
|------|------|------|
| **AI代码生成** | AST代码生成 | 🔄 开发中 |
| **智能诊断** | AI故障诊断 | 🔄 开发中 |
| **页面版本** | 版本快照回滚 | 🔄 开发中 |

#### 📋 待开发功能

| 模块 | 功能 | 优先级 |
|------|------|--------|
| **AI页面生成** | 自然语言生成页面 | P0 |
| **代码导出** | ZIP打包下载 | P1 |
| **数据源绑定** | 组件绑定数据源 | P1 |
| **权限管理** | RBAC完整实现 | P2 |

## 🤖 AI 能力架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Low-Code Platform                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Canvas    │  │   Admin    │  │   API       │             │
│  │   Editor    │  │   Panel    │  │   Gateway   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│  ┌───────────────────────▼────────────────────────┐            │
│  │              AI Service Layer                    │            │
│  │  ┌──────────────┐  ┌──────────────┐           │            │
│  │  │ Code Gen     │  │ Diagnostic   │           │            │
│  │  │ Agent        │  │ Agent        │           │            │
│  │  └──────────────┘  └──────────────┘           │            │
│  │  ┌──────────────┐  ┌──────────────┐           │            │
│  │  │ Code Opt     │  │ RAG          │           │            │
│  │  │ Agent        │  │ Knowledge    │           │            │
│  │  └──────────────┘  └──────────────┘           │            │
│  └───────────────────────┬────────────────────────┘            │
│                          │                                      │
│  ┌───────────────────────▼────────────────────────┐            │
│  │           LangGraph Orchestration               │            │
│  │  ┌────────┐  ┌────────┐  ┌────────┐           │            │
│  │  │ RAG    │→ │ LLM    │→ │ Output │           │            │
│  │  │ Node   │  │ Node   │  │ Node   │           │            │
│  │  └────────┘  └────────┘  └────────┘           │            │
│  └───────────────────────┬────────────────────────┘            │
│                          │                                      │
│  ┌───────────────────────▼────────────────────────┐            │
│  │           LLM Factory (Multi-Provider)         │            │
│  │  ┌────────┐  ┌────────┐  ┌────────┐           │            │
│  │  │ OpenAI │  │DeepSeek│  │Qwen    │           │            │
│  │  └────────┘  └────────┘  └────────┘           │            │
│  └────────────────────────────────────────────────┘            │
│                          │                                      │
│  ┌───────────────────────▼────────────────────────┐            │
│  │              Vector & Data Layer                │            │
│  │  ┌────────┐  ┌────────┐  ┌────────┐           │            │
│  │  │ Chroma │  │ Postgres│  │ Redis  │           │            │
│  │  └────────┘  └────────┘  └────────┘           │            │
│  └────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### LangGraph 多 Agent 架构

#### 1. 页面规划 Agent (PagePlanningAgent)

```
用户需求 → 需求分析 → RAG检索 → Schema生成 → 校验 → 输出页面Schema
```

| 节点 | 功能 |
|------|------|
| `RequirementAnalysis` | 解析用户需求，提取关键实体 |
| `RAGRetrieval` | 检索编码规范和历史代码片段 |
| `SchemaGeneration` | 生成页面 Schema |
| `Validation` | 校验 Schema 有效性 |

#### 2. 代码生成 Agent (CodeGenerator)

```
页面Schema → RAG检索 → 代码生成 → 代码优化 → 输出代码文件
```

| 功能 | 说明 |
|------|------|
| RAG 上下文 | 检索项目编码规范和优质代码片段 |
| 前端生成 | React + TypeScript + TailwindCSS |
| 后端生成 | NestJS + TypeORM + Swagger |
| 代码优化 | LangChain 自动优化结构、异常处理、参数校验 |

#### 3. 异常诊断 Agent (DiagnosticAgent)

```
错误信息 → 错误收集 → RAG检索 → 原因分析 → 修复建议 → 知识更新
```

| 节点 | 功能 |
|------|------|
| `ErrorCollection` | 收集错误堆栈和上下文 |
| `RAGRetrieval` | 检索同类故障记录 |
| `RootCauseAnalysis` | AI 分析根本原因 |
| `FixSuggestion` | 生成修复建议和代码 |
| `KnowledgeUpdate` | 更新私有知识库 |

### RAG 知识库架构

```
┌──────────────────────────────────────────┐
│           RAG Pipeline Service            │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────┐   ┌──────────┐            │
│  │ Document │──→│  Loader  │            │
│  │  Sources │   └────┬─────┘            │
│  └──────────┘        │                   │
│                      ▼                   │
│  ┌──────────┐   ┌──────────┐            │
│  │ Text     │←──│ Splitter │            │
│  │ Chunks   │   └────┬─────┘            │
│  └────┬─────┘        │                   │
│       │              ▼                   │
│       │        ┌──────────┐              │
│       └───────→│Embedding │              │
│                └────┬─────┘              │
│                     │                     │
│                     ▼                     │
│              ┌──────────┐                │
│              │ Chroma   │                │
│              │ VectorDB │                │
│              └──────────┘                │
│                     │                     │
│                     ▼                     │
│              ┌──────────┐                │
│              │Retrieval │                │
│              │  Query   │                │
│              └──────────┘                │
└──────────────────────────────────────────┘
```

#### 知识库类型

| 类型 | 内容 | 用途 |
|------|------|------|
| 编码规范 | React/NestJS 规范文档 | 代码生成参考 |
| 代码片段 | 历史优质代码 | 模板复用 |
| 故障记录 | 错误和解决方案 | 异常诊断 |
| API 文档 | 接口定义 | 接口生成 |

## 🚀 快速开始

### 环境要求

- Node.js >= 20.x
- pnpm >= 8.x
- Docker >= 24.x (用于容器化部署)

### 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/your-org/ai-lowcode.git
cd ai-lowcode

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 API Key

# 3. 一键启动所有服务
docker-compose -f docker-compose.yml up -d

# 4. 查看服务状态
docker-compose ps
```

### 开发模式

```bash
# 安装依赖
pnpm install

# 启动所有应用
pnpm dev

# 单独启动
pnpm --filter @ai-lowcode/canvas-editor dev
pnpm --filter @ai-lowcode/admin-dashboard dev
pnpm --filter @ai-lowcode/nest-server dev
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行 AI Agent 测试
pnpm --filter @ai-lowcode/lang-ai-core test
```

## 📦 Docker 部署服务

| 服务 | 端口 | 说明 |
|------|------|------|
| NestJS | 3001 | 后端 API（默认3001） |
| Canvas Editor | 3003 | 画布编辑器 |
| Admin Dashboard | 3002 | 管理后台 |
| Redis | 6379 | 缓存服务（可选） |
| Chroma | 8000 | 向量数据库（可选） |
| PostgreSQL | 5432 | 主数据库（可选） |
| pgAdmin | 5050 | 数据库管理（可选） |

### 本地开发服务端口

| 应用 | 端口 | 说明 |
|------|------|------|
| NestJS | 3001 | 后端 API 服务 |
| Canvas Editor | 3003 | 画布编辑器前端 |
| Swagger文档 | 3001/api/docs | API 文档 |

## 🔧 AI 配置

### LLM Provider 配置

在 `.env` 文件中配置至少一个 LLM Provider：

```bash
# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4

# DeepSeek
DEEPSEEK_API_KEY=sk-xxx

# 阿里云通义千问
DASHSCOPE_API_KEY=sk-xxx
```

### Chroma 向量库配置

```bash
CHROMA_URL=http://localhost:8000
```

## 📁 项目结构

```
ai-lowcode/
├── apps/
│   ├── canvas-editor/          # 画布编辑器 (Next.js)
│   ├── admin-dashboard/        # 管理后台 (React)
│   └── nest-server/            # 后端服务 (NestJS)
├── packages/
│   ├── lang-ai-core/          # AI 核心包
│   │   └── src/
│   │       ├── agent/          # LangGraph Agents
│   │       │   ├── diagnostic/ # 异常诊断 Agent
│   │       │   └── nodes/      # Agent 节点
│   │       ├── rag/            # RAG 服务
│   │       ├── llm/            # LLM 工厂
│   │       └── vectorstore/    # 向量存储
│   └── code-generator/         # 代码生成器
├── docker-compose.yml          # 完整部署配置
├── docker-compose.simple.yml    # 简化部署配置
├── .github/workflows/           # CI/CD 配置
└── README.md
```

## 🧪 AI 功能演示

### 1. AI 代码生成

```typescript
import { createCodeGenerator } from '@ai-lowcode/code-generator'

const generator = createCodeGenerator(schema, {
  enableRAG: true,
  enableOptimization: true,
})

const result = await generator.generateFullStackEnhanced()
// 自动检索编码规范、生成代码、优化代码
```

### 2. 异常诊断

```typescript
import { createDiagnosticService } from '@ai-lowcode/lang-ai-core'

const service = createDiagnosticService(config)

const result = await service.diagnose({
  type: 'datasource_connection',
  message: '数据库连接失败',
  stack: '...',
})
// 自动分析原因并生成修复建议
```

### 3. 知识库检索

```typescript
import { VectorRetrievalService } from '@ai-lowcode/lang-ai-core'

const service = new VectorRetrievalService({
  chromaConfig: { url: 'http://localhost:8000' },
  collectionName: 'code-snippets',
})

const results = await service.search('React 用户列表组件', 5)
// 检索相关代码片段作为生成参考
```

## 📊 CI/CD

GitHub Actions 工作流包含：

| Job | 说明 |
|-----|------|
| Lint | ESLint 代码检查 |
| Type Check | TypeScript 类型检查 |
| Test | 单元测试 (覆盖率阈值 50%) |
| Agent Tests | AI Agent 专项测试 |
| Build | 构建所有包 |
| Docker Build | 构建并推送 Docker 镜像 |
| Security | npm audit 安全扫描 |

## 🛠️ 技术栈

### 前端技术栈

| 模块 | 技术 | 版本 | 状态 |
|------|------|------|------|
| 画布编辑器 | Next.js | 14.x | ✅ |
| 状态管理 | Zustand | 4.x | ✅ |
| 画布渲染 | Konva + React-Konva | 9.x | ✅ |
| UI 框架 | Ant Design | 6.x | ✅ |
| 样式方案 | TailwindCSS | 3.x | ✅ |
| 路由 | Next.js App Router | 14.x | ✅ |

### 后端技术栈

| 模块 | 技术 | 版本 | 状态 |
|------|------|------|------|
| 框架 | NestJS | 10.x | ✅ |
| ORM | TypeORM | 0.3.x | ✅ |
| 数据库 | SQLite | 3.x | ✅ 本地 |
| 缓存 | Redis | 7.x | 🔄 可选 |
| 向量数据库 | Chroma | latest | 🔄 可选 |
| API文档 | Swagger | 6.x | ✅ |
| 认证 | JWT | - | ✅ |

### AI 技术栈

| 模块 | 技术 | 状态 |
|------|------|------|
| LLM 框架 | LangChain | ✅ |
| 工作流编排 | LangGraph | ✅ |
| 向量数据库 | Chroma | 🔄 可选 |
| Embedding | OpenAI/qwen | ✅ |

## 🤝 贡献指南

### 开发流程

1. Fork 仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交代码：`git commit -m 'feat: add xxx'`
4. 推送到远程：`git push origin feature/xxx`
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 编写，确保类型安全
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 添加必要的注释和文档
- AI Agent 代码需要编写 Jest 测试用例

## 📄 许可证

MIT License

## 📧 联系方式

- GitHub Issues: [提交问题](https://github.com/your-org/ai-lowcode/issues)
- 邮件: support@ailowcode.dev

---

**AI Low-Code Platform** - 让开发更智能 ✨
# AILowCode

# AI Low-Code Platform 技术文档

> 基于 AI 能力的新一代低代码开发平台，让开发变得更简单、更高效。

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [项目结构](#3-项目结构)
4. [核心模块详解](#4-核心模块详解)
5. [关键代码解析](#5-关键代码解析)
6. [AI 能力架构](#6-ai-能力架构)
7. [画布编辑器原理](#7-画布编辑器原理)
8. [前端架构](#8-前端架构)
9. [后端架构](#9-后端架构)

---

## 1. 项目概述

### 1.1 项目简介

AI Low-Code Platform 是一个基于 **Monorepo 架构**的全栈低代码开发平台，集成了可视化画布编辑器、AI 代码生成、RAG 知识库、LangGraph 多 Agent 架构等核心 AI 能力。

### 1.2 核心特性

| 特性 | 描述 |
|------|------|
| **可视化画布编辑器** | 拖拽式组件设计，所见即所得 |
| **AI 智能生成** | 基于大语言模型的代码和组件生成 |
| **RAG 知识库** | 检索增强生成，整合项目编码规范和历史代码 |
| **LangGraph 多 Agent** | 多智能体协作，复杂任务分解执行 |
| **异常诊断 Agent** | AI 自动故障诊断和修复建议 |
| **代码优化 Agent** | 自动优化代码结构、异常处理、参数校验 |
| **丰富组件库** | 内置多种基础组件和自定义组件支持 |
| **多环境部署** | 支持开发、测试、生产环境配置 |
| **插件系统** | 灵活的插件扩展机制 |

### 1.3 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | Next.js 14 (Canvas) / React + Vite (Admin) |
| **后端框架** | NestJS |
| **数据库** | PostgreSQL + SQLite |
| **向量数据库** | Chroma |
| **缓存** | Redis |
| **AI 能力** | LangChain + LangGraph |
| **构建工具** | pnpm + Turbo |
| **样式** | Tailwind CSS |

---

## 2. 技术架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Low-Code Platform                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Canvas    │  │   Admin    │  │   API       │             │
│  │   Editor    │  │   Panel    │  │   Gateway   │             │
│  │ (Next.js)   │  │  (Vite)    │  │ (NestJS)    │             │
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
│  │  │ Chroma │  │ Postgres│ │ Redis  │           │            │
│  │  └────────┘  └────────┘  └────────┘           │            │
│  └────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Monorepo 架构

```
ai-lowcode/
├── apps/                    # 应用层
│   ├── canvas-editor/       # 画布编辑器 (Next.js)
│   ├── admin-dashboard/     # 管理面板 (Vite + React)
│   └── nest-server/         # 后端服务 (NestJS)
│
├── packages/                # 共享包层
│   ├── shared-types/        # 共享类型定义
│   ├── lang-ai-core/        # AI 核心能力
│   ├── datasource-core/     # 数据源插件
│   ├── code-generator/      # 代码生成
│   ├── ai-sdk/              # AI SDK 封装
│   ├── ui-components/       # 共享 UI 组件
│   └── common-util/         # 通用工具
│
├── docs/                    # 文档
├── docker-compose*.yml       # Docker 配置
├── turbo.json               # Turbo 构建配置
└── pnpm-workspace.yaml      # pnpm 工作空间配置
```

---

## 3. 项目结构

### 3.1 apps/nest-server - 后端服务

```
nest-server/
├── src/
│   ├── common/                    # 公共模块
│   │   ├── filters/               # 异常过滤器
│   │   ├── interceptors/          # 拦截器（限流、响应转换）
│   │   ├── interfaces/            # 接口定义
│   │   └── redis/                 # Redis 缓存和限流
│   │
│   ├── modules/                   # 业务模块
│   │   ├── auth/                  # 认证授权
│   │   ├── user/                  # 用户管理
│   │   ├── role/                  # 角色权限
│   │   ├── project/               # 项目管理
│   │   ├── page/                  # 页面管理
│   │   ├── template/              # 模板管理
│   │   ├── canvas/                # 画布数据
│   │   ├── knowledge/             # 知识库
│   │   ├── agent/                 # AI Agent
│   │   ├── codegen/               # 代码生成
│   │   ├── workflow/              # 工作流
│   │   ├── data-source/           # 数据源
│   │   ├── ai-config/             # AI 配置
│   │   ├── logging/               # 日志
│   │   ├── menu/                  # 菜单管理
│   │   ├── webhook/               # Webhook
│   │   └── schema/                # Schema 管理
│   │
│   ├── app.module.ts              # 根模块
│   └── main.ts                    # 入口文件
```

### 3.2 apps/canvas-editor - 画布编辑器

```
canvas-editor/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # 认证路由
│   │   │   └── login/             # 登录页面
│   │   └── (dashboard)/           # 仪表盘路由
│   │       ├── canvas/             # 画布管理
│   │       ├── editor/[id]/        # 画布编辑器
│   │       ├── projects/           # 项目管理
│   │       ├── templates/          # 模板管理
│   │       ├── knowledge/          # 知识库
│   │       ├── workflow/           # 工作流
│   │       ├── users/              # 用户管理
│   │       ├── roles/              # 角色管理
│   │       ├── menus/              # 菜单管理
│   │       └── settings/           # 设置
│   │
│   ├── components/                # 组件
│   │   ├── Canvas/                # 画布核心组件
│   │   ├── Sidebar/               # 组件面板
│   │   ├── Toolbar/                # 工具栏
│   │   ├── PropertyPanel/          # 属性面板
│   │   ├── DashboardLayout/        # 布局组件
│   │   ├── Workflow/              # 工作流组件
│   │   └── ...
│   │
│   ├── store/                     # Zustand 状态管理
│   │   ├── canvasStore.ts         # 画布状态
│   │   └── workflowStore.ts       # 工作流状态
│   │
│   ├── hooks/                     # 自定义 Hooks
│   ├── lib/                       # 工具库
│   └── services/                  # API 服务
```

### 3.3 packages/lang-ai-core - AI 核心

```
lang-ai-core/
├── src/
│   ├── agent/                     # Agent 相关
│   │   ├── PagePlanningAgent.ts   # 页面规划 Agent
│   │   ├── LangGraphExecutor.ts   # LangGraph 执行器
│   │   ├── nodes/                 # Agent 节点
│   │   │   ├── RequirementAnalysisNode.ts
│   │   │   ├── RAGRetrievalNode.ts
│   │   │   ├── SchemaGenerationNode.ts
│   │   │   └── ValidationNode.ts
│   │   ├── diagnostic/            # 诊断 Agent
│   │   ├── openapi/              # OpenAPI Agent
│   │   └── tools/                # 工具调用 Agent
│   │
│   ├── llm/                       # LLM 相关
│   │   └── LLMFactory.ts         # LLM 工厂
│   │
│   ├── rag/                       # RAG 相关
│   │   ├── RAGProcessor.ts       # RAG 处理器
│   │   ├── VectorRetrievalService.ts
│   │   ├── RAGPipelineService.ts
│   │   └── DocumentLoader.ts
│   │
│   └── vectorstore/               # 向量存储
│       └── ChromaVectorStore.ts
```

---

## 4. 核心模块详解

### 4.1 AI 模块 (lang-ai-core)

#### 4.1.1 LLM 工厂 (LLMFactory)

**文件位置**: `packages/lang-ai-core/src/llm/LLMFactory.ts`

**核心功能**: 统一封装多种大语言模型，支持 DeepSeek、通义千问、OpenAI。

```typescript
export class LLMFactory {
  // 支持的提供商
  static createLLM(config: LLMConfig): BaseChatModel {
    switch (config.provider) {
      case 'deepseek':
        return this.createDeepSeek(config)
      case 'qwen':
        return this.createQwen(config)
      case 'openai':
        return this.createOpenAI(config)
    }
  }

  // 获取支持的模型列表
  static getSupportedModels(): Record<LLMProvider, string[]> {
    return {
      deepseek: ['deepseek-chat', 'deepseek-coder'],
      qwen: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
      openai: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
    }
  }
}
```

**关键特性**:
- 实例缓存，避免重复创建
- 多提供商支持
- 统一的调用接口

#### 4.1.2 RAG 处理器 (RAGProcessor)

**文件位置**: `packages/lang-ai-core/src/rag/RAGProcessor.ts`

**核心功能**: 文档分块、嵌入生成、相似度计算。

```typescript
export class RAGProcessor {
  // 初始化文本分块器
  constructor(config: RAGConfig) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize || 1000,      // 分块大小
      chunkOverlap: config.chunkOverlap || 200, // 重叠大小
    })
  }

  // 分块文档
  async splitText(text: string): Promise<Document[]> {
    return this.splitter.createDocuments([text])
  }

  // 生成嵌入向量
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts)
  }
}
```

**关键特性**:
- 智能文档分块（RecursiveCharacterTextSplitter）
- 支持多种嵌入模型
- 向量相似度计算

#### 4.1.3 页面规划 Agent (PagePlanningAgent)

**文件位置**: `packages/lang-ai-core/src/agent/PagePlanningAgent.ts`

**核心功能**: 基于 LangGraph 的多节点规划 Agent，支持条件路由和自动循环修正。

```typescript
export class PagePlanningAgent {
  private buildGraph(): LangGraphExecutor {
    // 创建节点
    const nodes = [
      createRequirementAnalysisNode(),  // 需求分析
      createRAGRetrievalNode(),         // RAG 检索
      createSchemaGenerationNode(),      // Schema 生成
      createValidationNode(),           // 校验
    ]

    // 创建边（包含条件路由）
    const edges = [
      { source: 'requirement_analysis', target: 'rag_retrieval' },
      { source: 'rag_retrieval', target: 'schema_generation' },
      { source: 'schema_generation', target: 'validation' },
      // 条件路由：校验失败时返回重新生成
      { source: 'validation', target: 'schema_generation', condition: shouldRetry },
      { source: 'validation', target: 'end' },
    ]

    return new LangGraphExecutor(nodes, edges, 'requirement_analysis')
  }
}
```

**工作流程**:
```
用户需求 → 需求分析 → RAG检索 → Schema生成 → 校验 → 输出页面Schema
                     ↑                              ↓
                     └──── 校验失败，重新生成 ←──────┘
```

### 4.2 画布编辑器模块

#### 4.2.1 画布状态管理 (canvasStore)

**文件位置**: `apps/canvas-editor/src/store/canvasStore.ts`

**核心类型**:

```typescript
// 组件配置
export interface ComponentConfig {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  props: Record<string, any>
  zIndex: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
}

// 页面配置
export interface PageConfig {
  id: string
  name: string
  width: number
  height: number
  gridSize: number
  snapToGrid: boolean
  showGrid: boolean
  backgroundColor: string
}

// 数据模型
export interface DataModel {
  id: string
  name: string
  entities: Entity[]
  relations: Relation[]
}
```

**关键函数**:

| 函数 | 功能 |
|------|------|
| `addComponent()` | 添加组件到画布 |
| `updateComponent()` | 更新组件属性 |
| `selectComponent()` | 选中组件 |
| `moveComponentToFront/Back()` | 调整层级 |
| `zoomIn/Out()` | 缩放画布 |
| `alignLeft/Right/Center()` | 对齐操作 |

#### 4.2.2 Canvas 组件

**文件位置**: `apps/canvas-editor/src/components/Canvas/index.tsx`

**核心实现**:

```typescript
export function Canvas() {
  const stageRef = useRef<any>(null)
  
  // 性能优化：LRU 缓存
  const componentCache = new LRUCache<string, React.ReactNode>(200)

  // 批量更新状态管理
  const [batchState, dispatchBatch] = useReducer(batchUpdateReducer, {
    updates: new Map(),
    isProcessing: false,
  })

  return (
    <div ref={containerRef}>
      <Stage ref={stageRef} width={dimensions.width} height={dimensions.height}>
        <Layer>
          <CanvasGrid />  {/* 栅格背景 */}
        </Layer>
        <Layer>
          {/* 渲染组件 */}
          {components.map(comp => (
            <ComponentRenderer key={comp.id} component={comp} />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
```

**关键特性**:
- **LRU 缓存**: 缓存已渲染的组件，提升性能
- **批量更新**: 使用 useReducer 管理批量状态更新
- **可见区域渲染**: 只渲染可视区域内的组件

#### 4.2.3 组件渲染器 (ComponentRenderer)

**文件位置**: `apps/canvas-editor/src/components/Canvas/ComponentRenderer.tsx`

**核心实现**:

```typescript
export function ComponentRenderer({ component }: ComponentProps) {
  const isSelected = useCanvasStore(state => state.selectedIds.includes(component.id))

  // 根据组件类型渲染不同 Konva 图形
  const renderShape = () => {
    switch (component.type) {
      case 'button':
        return <ButtonShape component={component} />
      case 'input':
        return <InputShape component={component} />
      case 'text':
        return <TextShape component={component} />
      // ... 其他组件类型
    }
  }

  return (
    <Group
      x={component.x}
      y={component.y}
      draggable={!component.locked}  // 可拖拽
      onDragEnd={(e) => onDragEnd(e)}  // 拖拽结束
      onClick={() => selectComponent(component.id)}  // 点击选中
    >
      {renderShape()}
      {isSelected && <SelectionRect />}  {/* 选中边框 */}
    </Group>
  )
}
```

#### 4.2.4 拖拽流程

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Sidebar   │────▶│ canvasStore  │────▶│  Canvas 组件   │
│  (组件列表)  │     │  (Zustand)   │     │ (渲染&交互)     │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                   ▲                      │
       │                   │                      │
  拖拽开始              状态更新              位置变化
  setDataTransfer       addComponent          onDragMove
```

**关键代码**:

```typescript
// Sidebar - 拖拽开始
const handleDragStart = (e: React.DragEvent, componentType: string) => {
  e.dataTransfer.setData('componentType', componentType)  // 保存组件类型
}

// Canvas - 放置组件
const handleDrop = (e: React.DragEvent) => {
  const componentType = e.dataTransfer.getData('componentType')
  const { x, y } = calculatePosition(e)  // 计算放置位置
  addComponent(componentType, x, y)       // 添加到 store
}
```

### 4.3 后端模块

#### 4.3.1 AppModule (根模块)

**文件位置**: `apps/nest-server/src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ ... }),
    JwtModule.registerAsync({ ... }),
    
    // 业务模块
    AuthModule,
    UserModule,
    RoleModule,
    ProjectModule,
    PageModule,
    CanvasModule,
    KnowledgeModule,
    AgentModule,
    WorkflowModule,
    // ...
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
```

#### 4.3.2 Redis 缓存服务

**文件位置**: `apps/nest-server/src/common/redis/cache.service.ts`

```typescript
@Injectable()
export class CacheService {
  // 分布式锁实现
  async acquireLock(key: string, ttl: number = 30000): Promise<boolean> {
    const lockKey = `lock:${key}`
    const lockValue = generateUuid()
    
    // 使用 SET NX 实现分布式锁
    const result = await (this.cacheManager.store as any).set(lockKey, lockValue, {
      ttl: Math.ceil(ttl / 1000),
      nx: true,  // 只有 key 不存在时才设置
    })
    
    return result === 'OK' || result === true
  }
}
```

**关键特性**:
- **分布式锁**: 使用 Redis SET NX 实现
- **TTL 支持**: 自动过期，防止死锁
- **令牌桶限流**: 基于 Redis 的限流实现

---

## 5. 关键代码解析

### 5.1 LangGraphExecutor 执行器

**文件位置**: `packages/lang-ai-core/src/agent/LangGraphExecutor.ts`

```typescript
export class LangGraphExecutor {
  async execute(initialState: AgentState): Promise<AgentState> {
    let currentState = { ...initialState }
    let currentNode = this.entryPoint
    const maxSteps = 20  // 防止无限循环

    while (currentNode !== 'end' && step < maxSteps) {
      // 获取节点
      const node = this.nodes.get(currentNode)
      
      // 执行节点
      const updates = await node.handler(currentState)
      currentState = { ...currentState, ...updates }
      
      // 确定下一个节点（支持条件路由）
      currentNode = this.getNextNode(currentState, currentNode)
    }

    return currentState
  }

  // 条件路由实现
  private getNextNode(state, currentNode): AgentNodeName {
    const outgoingEdges = this.edges.filter(e => e.source === currentNode)
    
    for (const edge of outgoingEdges) {
      if (edge.condition) {
        const nextNode = edge.condition(state)
        if (nextNode) return nextNode
      }
    }
    
    return outgoingEdges[0]?.target || 'end'
  }
}
```

### 5.2 画布拖拽核心

```typescript
// apps/canvas-editor/src/components/Canvas/index.tsx

// LRU 缓存实现
class LRUCache<K, V> {
  private cache = new Map<K, V>()
  
  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      this.cache.delete(key)
      this.cache.set(key, value)  // 移到末尾
    }
    return value
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value!
      this.cache.delete(firstKey)  // 删除最旧的
    }
    this.cache.set(key, value)
  }
}

// 批量更新 Reducer
function batchUpdateReducer(state, action) {
  switch (action.type) {
    case 'ADD_UPDATE':
      return { ...state, updates: new Map(state.updates).set(action.id, { x: action.x, y: action.y }) }
    case 'CLEAR_UPDATES':
      return { ...state, updates: new Map() }
  }
}
```

### 5.3 组件元数据定义

```typescript
// apps/canvas-editor/src/store/canvasStore.ts

export const componentList: ComponentMeta[] = [
  // 布局类
  { type: 'card', name: '卡片', icon: '🃏', defaultWidth: 300, defaultHeight: 200 },
  { type: 'divider', name: '分割线', icon: '➖', defaultWidth: 300, defaultHeight: 20 },
  { type: 'space', name: '间距', icon: '↕', defaultWidth: 20, defaultHeight: 20 },
  
  // 表单类
  { type: 'input', name: '输入框', icon: '📝', defaultWidth: 200, defaultHeight: 40 },
  { type: 'button', name: '按钮', icon: '🔘', defaultWidth: 100, defaultHeight: 40 },
  { type: 'select', name: '选择器', icon: '📋', defaultWidth: 200, defaultHeight: 40 },
  { type: 'table', name: '表格', icon: '📊', defaultWidth: 600, defaultHeight: 300 },
  
  // 交互类
  { type: 'text', name: '文本', icon: '📄', defaultWidth: 200, defaultHeight: 30 },
  { type: 'heading', name: '标题', icon: '🔤', defaultWidth: 300, defaultHeight: 40 },
  { type: 'image', name: '图片', icon: '🖼', defaultWidth: 200, defaultHeight: 150 },
  { type: 'avatar', name: '头像', icon: '👤', defaultWidth: 60, defaultHeight: 60 },
  // ...
]
```

---

## 6. AI 能力架构

### 6.1 LangGraph 多 Agent 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph Orchestration                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                           │
│  │   页面规划   │  用户需求 → 需求分析 → RAG检索 → 生成 → 校验 │
│  │   Agent     │                                           │
│  └─────────────┘                                           │
│                                                              │
│  ┌─────────────┐                                           │
│  │   代码生成   │  Schema → RAG上下文 → 前端生成 → 后端生成   │
│  │   Agent     │                                           │
│  └─────────────┘                                           │
│                                                              │
│  ┌─────────────┐                                           │
│  │   异常诊断   │  错误信息 → 收集 → RAG检索 → 原因分析 → 修复 │
│  │   Agent     │                                           │
│  └─────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Agent 节点定义

| 节点 | 功能 | 输入 | 输出 |
|------|------|------|------|
| `RequirementAnalysis` | 解析用户需求 | 用户自然语言 | 实体、任务分解 |
| `RAGRetrieval` | 检索编码规范 | 查询文本 | 相关文档片段 |
| `SchemaGeneration` | 生成页面 Schema | 需求+RAG上下文 | PageSchema JSON |
| `Validation` | 校验 Schema | PageSchema | 校验结果 |
| `FrontendGeneration` | 生成前端代码 | PageSchema | React 代码 |
| `BackendGeneration` | 生成后端代码 | PageSchema | NestJS 代码 |

### 6.3 RAG 知识库架构

```
┌─────────────────────────────────────────────────────────────┐
│                       RAG Knowledge Base                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │  文档上传     │ ──▶ │  文档分块     │ ──▶ │  向量化    │  │
│  │ (PDF/MD/API) │     │  (1000字/块)  │     │  (OpenAI)  │  │
│  └──────────────┘     └──────────────┘     └────────────┘  │
│                                                    │         │
│                                                    ▼         │
│                                           ┌────────────┐    │
│                                           │   Chroma    │    │
│                                           │  向量数据库  │    │
│                                           └────────────┘    │
│                                                    │         │
│                                                    ▼         │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │   检索结果    │ ◀── │   相似度匹配   │ ◀── │   查询向量  │  │
│  │  (Top-K)     │     │  (余弦相似度)  │     │            │  │
│  └──────────────┘     └──────────────┘     └────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 画布编辑器原理

### 7.1 渲染引擎

使用 `react-konva` 基于 Canvas 的渲染：

```typescript
import { Stage, Layer, Group, Rect, Text } from 'react-konva'

<Stage width={800} height={600}>
  <Layer>
    <CanvasGrid />  {/* 栅格背景 */}
  </Layer>
  <Layer>
    {components.map(comp => (
      <ComponentRenderer key={comp.id} component={comp} />
    ))}
  </Layer>
</Stage>
```

### 7.2 数据流

```
用户操作 (拖拽/点击)
       │
       ▼
┌─────────────────┐
│   Event Handler │
│  (onDragEnd/    │
│   onClick)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  canvasStore    │  ← Zustand 状态管理
│  (Zustand)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React 重新渲染  │
│  (状态驱动)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Konva Canvas   │
│  (高性能渲染)    │
└─────────────────┘
```

### 7.3 性能优化

| 优化策略 | 实现方式 |
|----------|----------|
| **LRU 缓存** | 缓存已渲染的组件，避免重复创建 |
| **批量更新** | 使用 `useReducer` 合并多个状态更新 |
| **可见区域渲染** | 只渲染可视区域内的组件 |
| **虚拟滚动** | 大量组件时启用虚拟滚动 |
| **骨架屏** | 加载时显示骨架屏，提升感知性能 |

---

## 8. 前端架构

### 8.1 画布编辑器 (Next.js)

**技术栈**: Next.js 14 + React + TailwindCSS + react-konva + Zustand

**路由结构**:
```
app/
├── (auth)/              # 认证路由组
│   └── login/          # 登录页面
│
├── (dashboard)/         # 仪表盘路由组
│   ├── layout.tsx       # 仪表盘布局
│   ├── dashboard/       # 首页
│   ├── canvas/          # 画布列表
│   ├── editor/[id]/     # 画布编辑器
│   ├── projects/        # 项目管理
│   ├── templates/       # 模板管理
│   ├── knowledge/       # 知识库
│   ├── workflow/        # 工作流
│   └── settings/        # 设置
│
└── page.tsx            # 首页重定向
```

### 8.2 管理面板 (Vite)

**技术栈**: React + Vite + Ant Design + Zustand

**页面结构**:
```
pages/
├── Login/              # 登录页
├── Dashboard/          # 首页
├── UserManage/         # 用户管理
├── RoleManage/         # 角色管理
├── ProjectList/        # 项目列表
└── TemplateManage/     # 模板管理
```

### 8.3 状态管理

使用 Zustand 进行状态管理：

```typescript
// canvasStore.ts
export const useCanvasStore = create<CanvasState>()((set, get) => ({
  components: [],
  selectedIds: [],
  zoom: 1,
  
  addComponent: (type, x, y) => {
    const newComponent = {
      id: generateId(),
      type,
      x, y,
      // ...
    }
    set({ components: [...get().components, newComponent] })
  },
  
  updateComponent: (id, updates) => {
    set({
      components: get().components.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    })
  },
  
  selectComponent: (id) => set({ selectedIds: id ? [id] : [] }),
}))
```

---

## 9. 后端架构

### 9.1 NestJS 模块

```
AppModule
├── ConfigModule        # 配置管理
├── TypeOrmModule       # 数据库 ORM
├── JwtModule           # JWT 认证
├── RedisModule         # 缓存和限流
│
├── AuthModule          # 认证授权
├── UserModule          # 用户管理
├── RoleModule          # 角色权限
├── MenuModule          # 菜单管理
│
├── ProjectModule       # 项目管理
├── PageModule          # 页面管理
├── CanvasModule        # 画布数据
├── TemplateModule      # 模板管理
│
├── KnowledgeModule      # 知识库
├── AgentModule          # AI Agent
├── CodegenModule        # 代码生成
├── WorkflowModule       # 工作流
├── DataSourceModule     # 数据源
├── AiConfigModule       # AI 配置
├── LoggingModule         # 日志
├── WebhookModule         # Webhook
└── SchemaModule         # Schema 管理
```

### 9.2 认证授权

```typescript
// JWT 策略
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username }
  }
}

// JWT 守卫
export class JwtAuthGuard extends AuthGuard('jwt') {}

// 角色守卫
export class RolesGuard extends ... {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler())
    if (!requiredRoles) return true
    // 检查用户角色...
  }
}
```

### 9.3 分布式限流

```typescript
// 基于令牌桶算法的限流
@Injectable()
export class RateLimiterService {
  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const redisKey = `ratelimit:${key}`
    const current = await this.redis.incr(redisKey)
    
    if (current === 1) {
      await this.redis.expire(redisKey, Math.ceil(windowMs / 1000))
    }
    
    return current <= limit
  }
}
```

---

## 10. 部署架构

### 10.1 Docker Compose

```yaml
services:
  postgres:          # PostgreSQL 数据库
    image: postgres:15-alpine
    ports:
      - '5432:5432'
  
  redis:             # Redis 缓存
    image: redis:7-alpine
    ports:
      - '6379:6379'
  
  chroma:            # Chroma 向量数据库
    image: chromadb/chroma:latest
    ports:
      - '8000:8000'
  
  nest-server:       # 后端服务
    build:
      context: .
      dockerfile: Dockerfile.nest-server
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis
      - chroma
  
  canvas-editor:     # 画布编辑器
    build:
      context: .
      dockerfile: Dockerfile.canvas-editor
    ports:
      - '3001:3000'
  
  admin-dashboard:    # 管理面板
    build:
      context: .
      dockerfile: Dockerfile.admin-dashboard
    ports:
      - '3002:80'
```

### 10.2 环境变量

```bash
# 数据库
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=ai_lowcode

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## 附录

### A. 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 启动后端
cd apps/nest-server && node dist/main.js

# Docker 部署
docker compose -f docker-compose.simple.yml up -d
```

### B. API 文档

访问 `http://localhost:3000/api/docs` 查看 Swagger API 文档。

### C. 关键文件索引

| 功能 | 文件路径 |
|------|----------|
| 画布核心 | `apps/canvas-editor/src/components/Canvas/index.tsx` |
| 状态管理 | `apps/canvas-editor/src/store/canvasStore.ts` |
| 组件渲染 | `apps/canvas-editor/src/components/Canvas/ComponentRenderer.tsx` |
| LLM 工厂 | `packages/lang-ai-core/src/llm/LLMFactory.ts` |
| RAG 处理器 | `packages/lang-ai-core/src/rag/RAGProcessor.ts` |
| 页面规划 | `packages/lang-ai-core/src/agent/PagePlanningAgent.ts` |
| LangGraph | `packages/lang-ai-core/src/agent/LangGraphExecutor.ts` |
| 后端入口 | `apps/nest-server/src/main.ts` |
| 根模块 | `apps/nest-server/src/app.module.ts` |
| Redis 缓存 | `apps/nest-server/src/common/redis/cache.service.ts` |

---

**文档版本**: v1.0  
**最后更新**: 2026-06-19

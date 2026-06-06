# @ai-lowcode/lang-ai-core

AI Language Model Core Package - 基于 LangChain 的 AI 核心功能包

## 📦 功能特性

- ✅ **LLM 工厂模式** - 统一封装 DeepSeek、通义千问、OpenAI
- ✅ **Milvus 向量库集成** - 完整的向量存储和检索功能
- ✅ **RAG 文档处理** - 文档分块、嵌入生成、相似度计算
- ✅ **TypeScript 类型支持** - 完整的类型定义
- ✅ **Monorepo 集成** - 与 shared-types 无缝集成

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动 Milvus 向量库

```bash
docker-compose up -d etcd minio milvus
```

### 配置环境变量

复制 `.env.ai.example` 到 `.env` 并填入您的 API 密钥：

```bash
cp .env.ai.example .env
```

## 📖 使用示例

### 1. LLM 工厂使用

```typescript
import { LLMFactory } from '@ai-lowcode/lang-ai-core'
import type { LLMConfig } from '@ai-lowcode/shared-types'

// 创建 DeepSeek 实例
const deepseekConfig: LLMConfig = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  apiKey: 'your-deepseek-api-key',
  temperature: 0.7,
}

const llm = LLMFactory.createLLM(deepseekConfig)

// 使用 LLM
const response = await llm.invoke('你好，请介绍一下自己')
console.log(response.content)
```

### 2. Milvus 向量库使用

```typescript
import { MilvusVectorStore } from '@ai-lowcode/lang-ai-core'
import type { MilvusConfig } from '@ai-lowcode/shared-types'

// 连接 Milvus
const milvusConfig: MilvusConfig = {
  address: 'localhost:19530',
  username: 'root',
  password: 'Milvus',
}

const vectorStore = new MilvusVectorStore(milvusConfig)
await vectorStore.connect()

// 创建知识库集合
await vectorStore.createKnowledgeCollection('my_knowledge_base', 1536)

// 插入文档
const documents = [
  {
    id: 'doc-1',
    content: '这是一段文档内容',
    embedding: [0.1, 0.2, 0.3, ...], // 1536维向量
    metadata: { source: 'example' },
  },
]
await vectorStore.insertDocuments('my_knowledge_base', documents)

// 向量搜索
const queryVector = [0.1, 0.2, 0.3, ...]
const results = await vectorStore.search('my_knowledge_base', queryVector, 5)
console.log(results)
```

### 3. RAG 文档处理

```typescript
import { RAGProcessor } from '@ai-lowcode/lang-ai-core'
import type { RAGConfig } from '@ai-lowcode/shared-types'

// 初始化 RAG 处理器
const ragConfig: RAGConfig = {
  embeddingApiKey: 'your-openai-api-key',
  embeddingModel: 'text-embedding-3-small',
  chunkSize: 1000,
  chunkOverlap: 200,
}

const ragProcessor = new RAGProcessor(ragConfig)

// 处理文档
const content = '这是一段很长的文档内容...'
const metadata = { documentId: 'doc-123', source: 'upload' }

const ragDocuments = await ragProcessor.processDocument(content, metadata)
console.log(ragDocuments)
// 输出: [{ id: 'doc-123-0', content: '...', embedding: [...], metadata: {...} }, ...]
```

## 🗄️ 数据库表结构

项目包含以下 AI 相关数据表：

### 1. knowledge_documents - 知识库文档表
- 存储上传的文档信息
- 跟踪向量化状态
- 记录分块数量

### 2. agent_conversations - Agent 会话记录表
- 存储会话历史
- JSON 格式存储消息列表
- 关联用户和 Agent

### 3. tool_call_logs - 工具调用日志表
- 记录工具调用详情
- 存储输入输出参数
- 跟踪执行状态和时长

### 4. ai_configs - AI 配置表
- 存储 LLM API 密钥（加密）
- 支持多提供商配置
- 配置启用/禁用

### 5. vector_store_configs - 向量库配置表
- 存储 Milvus 连接配置
- 支持多向量库实例
- 配置启用/禁用

### 6. knowledge_bases - 知识库表
- 管理多个知识库
- 记录文档数量和维度
- 配置嵌入模型

## 🔧 NestJS 集成

### 在 app.module.ts 中导入 AI 配置模块

```typescript
import { AIConfigModule } from './modules/ai-config/ai-config.module'

@Module({
  imports: [
    // ... 其他模块
    AIConfigModule,
  ],
})
export class AppModule {}
```

### 使用 AI 配置服务

```typescript
import { AIConfigService } from './modules/ai-config/ai-config.service'

@Injectable()
export class YourService {
  constructor(private readonly aiConfigService: AIConfigService) {}

  async getActiveLLMConfig() {
    const configs = await this.aiConfigService.getActiveAIConfigs()
    return configs[0] // 返回第一个启用的配置
  }
}
```

## 📊 API 接口

### LLM 配置管理

- `POST /ai-config/llm` - 创建 LLM 配置
- `GET /ai-config/llm` - 获取所有 LLM 配置
- `GET /ai-config/llm/active` - 获取启用的 LLM 配置
- `GET /ai-config/llm/:id` - 获取单个 LLM 配置
- `PUT /ai-config/llm/:id` - 更新 LLM 配置
- `DELETE /ai-config/llm/:id` - 删除 LLM 配置

### 向量库配置管理

- `POST /ai-config/vector-store` - 创建向量库配置
- `GET /ai-config/vector-store` - 获取所有向量库配置
- `GET /ai-config/vector-store/active` - 获取启用的向量库配置
- `GET /ai-config/vector-store/:id` - 获取单个向量库配置
- `PUT /ai-config/vector-store/:id` - 更新向量库配置
- `DELETE /ai-config/vector-store/:id` - 删除向量库配置

## 🐳 Docker Compose

项目已配置完整的 Milvus 服务栈：

```yaml
services:
  etcd:
    # etcd 元数据存储
  
  minio:
    # MinIO 对象存储
  
  milvus:
    # Milvus 向量数据库
    ports:
      - '19530:19530'  # gRPC 端口
      - '9091:9091'    # 健康检查端口
```

启动命令：

```bash
# 启动所有服务
docker-compose up -d

# 仅启动 Milvus 相关服务
docker-compose up -d etcd minio milvus

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f milvus
```

## 🔐 安全注意事项

1. **API 密钥加密** - 数据库中的 API 密钥应加密存储
2. **环境变量** - 不要将 `.env` 文件提交到版本控制
3. **访问控制** - AI 配置接口应添加权限验证
4. **网络安全** - 生产环境应配置 SSL/TLS

## 📝 类型定义

所有 AI 相关类型定义都在 `@ai-lowcode/shared-types` 包中：

```typescript
import type {
  LLMProvider,
  LLMConfig,
  MilvusConfig,
  RAGDocument,
  RAGConfig,
  AgentInput,
  AgentOutput,
  ToolDescription,
  ToolCallResult,
  KnowledgeDocument,
  AgentConversation,
  ToolCallLog,
  AIConfig,
} from '@ai-lowcode/shared-types'
```

## 🎯 下一步

- 实现具体的 Agent 业务逻辑
- 添加更多 LLM 提供商支持
- 优化向量检索性能
- 实现 RAG 完整流程
- 添加监控和日志

## 📄 License

MIT

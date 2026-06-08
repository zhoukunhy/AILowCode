# 知识库功能使用指南

## 📚 功能概述

Canvas Editor 知识库功能已完整实现，支持用户上传 Markdown、API 文档、需求文档，自动进行 RAG 切片向量化存入 Chroma，并提供知识库检索和预览功能。

---

## 🎯 已实现的功能

### 1. **后端 API（NestJS）**

#### 知识库管理
- ✅ 创建知识库
- ✅ 获取所有知识库
- ✅ 获取知识库详情
- ✅ 更新知识库
- ✅ 删除知识库

#### 文档管理
- ✅ 上传文档（文本内容）
- ✅ 上传文档（文件上传）
- ✅ 获取文档列表
- ✅ 获取文档详情
- ✅ 删除文档

#### 检索功能
- ✅ 知识库向量检索
- ✅ 文档分块预览
- ✅ 相似度过滤

### 2. **前端界面（Next.js）**

#### 知识库面板
- ✅ 知识库列表管理
- ✅ 文档上传界面
- ✅ 文档列表展示
- ✅ 向量化状态显示
- ✅ 检索界面
- ✅ 分块预览

---

## 🚀 快速开始

### 1. 启动后端服务

```bash
# 确保 Chroma 已启动
docker-compose up -d chroma

# 启动 NestJS 服务
cd apps/nest-server
pnpm dev
```

### 2. 启动前端服务

```bash
# 启动 Canvas Editor
cd apps/canvas-editor
pnpm dev
```

### 3. 访问知识库面板

1. 打开浏览器访问 `http://localhost:3000`
2. 点击左侧边栏的 "📚 知识库" 标签
3. 开始使用知识库功能

---

## 📖 使用流程

### 步骤 1：创建知识库

1. 点击 "新建知识库" 按钮
2. 输入知识库名称（必填）
3. 输入描述（可选）
4. 点击 "创建"

### 步骤 2：上传文档

1. 选择目标知识库
2. 点击 "上传文档" 按钮
3. 选择文档类型：
   - **Markdown 文档** - 适用于产品文档、技术文档
   - **API 文档** - 适用于接口文档、API 说明
   - **需求文档** - 适用于需求说明、功能描述
4. 选择文件（支持 .md, .txt, .markdown 格式）
5. 点击 "上传"

### 步骤 3：查看处理状态

文档上传后会自动进行向量化处理，状态包括：
- 🟡 **待处理** - 文档已上传，等待处理
- 🔵 **处理中** - 正在进行分块和向量化
- 🟢 **已完成** - 向量化完成，可以检索
- 🔴 **失败** - 处理失败，查看错误信息

### 步骤 4：检索知识库

1. 点击 "检索知识库" 按钮
2. 输入查询内容
3. 点击 "检索"
4. 查看检索结果，包括：
   - 相似度分数
   - 相关内容片段
   - 可展开查看完整内容

### 步骤 5：预览文档分块

1. 点击文档列表中的 "查看分块" 图标
2. 查看文档的分块详情
3. 每个分块显示：
   - 分块索引
   - 分块内容
   - 可展开查看完整内容
4. 支持分页浏览

---

## 🔧 API 接口文档

### 知识库管理

#### 创建知识库
```http
POST /knowledge/bases
Content-Type: application/json

{
  "name": "产品文档库",
  "description": "存储产品相关文档",
  "embeddingModel": "text-embedding-3-small",
  "dimension": 1536
}
```

#### 获取所有知识库
```http
GET /knowledge/bases
```

#### 获取知识库详情
```http
GET /knowledge/bases/:id
```

#### 更新知识库
```http
PUT /knowledge/bases/:id
Content-Type: application/json

{
  "name": "新名称",
  "description": "新描述"
}
```

#### 删除知识库
```http
DELETE /knowledge/bases/:id
```

### 文档管理

#### 上传文档（文本）
```http
POST /knowledge/documents/upload
Content-Type: application/json

{
  "knowledgeBaseId": 1,
  "name": "产品说明.md",
  "content": "# 产品说明\n\n这是一个产品说明文档...",
  "type": "md"
}
```

#### 上传文档（文件）
```http
POST /knowledge/documents/upload-file
Content-Type: multipart/form-data

knowledgeBaseId: 1
type: md
file: (binary)
```

#### 获取文档列表
```http
GET /knowledge/documents?knowledgeBaseId=1
```

#### 获取文档详情
```http
GET /knowledge/documents/:id
```

#### 删除文档
```http
DELETE /knowledge/documents/:id
```

### 检索功能

#### 检索知识库
```http
POST /knowledge/search
Content-Type: application/json

{
  "knowledgeBaseId": 1,
  "query": "如何使用产品？",
  "topK": 10,
  "threshold": 0.7
}
```

#### 获取文档分块
```http
GET /knowledge/chunks/:documentId?page=1&pageSize=10
```

---

## 🏗️ 技术架构

### 后端架构

```
apps/nest-server/src/modules/knowledge/
├── entities/
│   └── knowledge.entity.ts          # 数据实体
├── dto/
│   └── knowledge.dto.ts             # 数据传输对象
├── knowledge.service.ts             # 业务逻辑
├── knowledge.controller.ts          # API 控制器
└── knowledge.module.ts              # 模块定义
```

### 前端架构

```
apps/canvas-editor/src/
├── services/
│   └── knowledgeApi.ts              # API 服务
└── components/
    └── KnowledgePanel/
        └── index.tsx                # 知识库面板组件
```

### 数据流程

```
用户上传文档
    ↓
NestJS 接收文件
    ↓
保存文档记录到 PostgreSQL
    ↓
调用 RAGProcessor 分块
    ↓
生成嵌入向量
    ↓
存储向量到 Chroma
    ↓
更新文档状态
```

---

## 🎨 界面功能

### 知识库面板

- **知识库选择器** - 下拉选择或创建新知识库
- **操作按钮** - 上传文档、检索、刷新、删除
- **文档列表** - 显示所有文档及状态
- **状态标签** - 可视化显示处理状态
- **操作菜单** - 查看分块、删除文档

### 上传文档模态框

- **文档类型选择** - Markdown、API、需求文档
- **文件选择器** - 支持拖拽和点击选择
- **文件限制** - 最大 10MB，支持 .md/.txt/.markdown

### 检索模态框

- **查询输入框** - 多行文本输入
- **检索结果列表** - 显示相似度、内容片段
- **展开功能** - 查看完整内容

### 分块预览模态框

- **分块列表** - 显示所有分块
- **分块索引** - 标注分块序号
- **分页功能** - 大量分块时支持分页

---

## ⚙️ 配置说明

### 环境变量

在 `.env` 文件中配置以下变量：

```bash
# Chroma 配置
CHROMA_URL=http://localhost:8000

# Embedding 配置
EMBEDDING_API_KEY=your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BASE_URL=https://api.openai.com/v1
```

### Chroma 集合命名

每个知识库会创建一个独立的 Chroma 集合，命名格式：
```
knowledge_base_{knowledgeBaseId}
```

### 向量维度

默认使用 1536 维（OpenAI text-embedding-3-small），可在创建知识库时自定义。

---

## 🔍 使用示例

### 示例 1：上传产品文档

1. 创建知识库 "产品文档库"
2. 上传 `产品说明.md` 文件
3. 等待向量化完成
4. 检索 "产品功能"
5. 查看相关内容片段

### 示例 2：管理 API 文档

1. 创建知识库 "API 文档库"
2. 上传多个 API 文档文件
3. 检索特定接口信息
4. 查看接口详细说明

### 示例 3：需求文档检索

1. 创建知识库 "需求文档库"
2. 上传需求文档
3. 检索特定功能需求
4. 快速定位相关内容

---

## 📊 性能优化

### 文档处理优化

- **异步处理** - 文档上传后异步进行向量化
- **批量插入** - 分块后批量插入 Chroma
- **状态跟踪** - 实时更新处理状态

### 检索优化

- **相似度过滤** - 只返回相似度高于阈值的结果
- **TopK 限制** - 限制返回结果数量
- **向量索引** - Chroma 自动管理索引

---

## 🐛 故障排查

### 问题 1：文档上传失败

**可能原因：**
- 文件格式不支持
- 文件大小超过限制
- 网络连接问题

**解决方案：**
- 检查文件格式是否为 .md/.txt/.markdown
- 确保文件大小不超过 10MB
- 检查网络连接

### 问题 2：向量化失败

**可能原因：**
- Embedding API 密钥无效
- Chroma 连接失败
- 文档内容为空

**解决方案：**
- 检查 EMBEDDING_API_KEY 配置
- 确保 Chroma 服务正常运行
- 检查文档内容是否有效

### 问题 3：检索无结果

**可能原因：**
- 相似度阈值过高
- 查询内容不相关
- 向量化未完成

**解决方案：**
- 降低相似度阈值（默认 0.7）
- 尝试不同的查询内容
- 等待向量化完成

---

## 🎯 后续扩展

### 可扩展功能

1. **更多文档格式支持**
   - PDF 文档
   - Word 文档
   - HTML 文档

2. **高级检索功能**
   - 混合检索（向量 + 关键词）
   - 多知识库联合检索
   - 检索结果排序

3. **文档管理增强**
   - 文档版本管理
   - 文档分类标签
   - 文档权限控制

4. **性能优化**
   - 文档预处理缓存
   - 向量索引优化
   - 分布式处理

---

## 📝 总结

知识库功能已完整实现，包括：

✅ 完整的后端 API 接口
✅ 前端知识库管理界面
✅ 文档上传和处理
✅ RAG 切片和向量化
✅ Chroma 向量存储
✅ 知识库检索功能
✅ 文档分块预览

所有功能已集成到 Canvas Editor，可以立即使用！

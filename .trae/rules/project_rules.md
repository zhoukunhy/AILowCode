# AI 低代码平台开发规范

## 1. 项目架构概览

本项目采用 **Monorepo** 架构，基于 `pnpm workspace` 管理多个子项目：

```
AILowCode/
├── apps/                    # 应用层
│   ├── nest-server         # NestJS 后端服务
│   ├── canvas-editor       # Next.js 画布编辑器
│   └── admin-dashboard     # Vue/React 管理后台
├── packages/               # 共享包
│   ├── ai-sdk              # AI 能力 SDK
│   ├── code-generator      # 代码生成器
│   ├── common-util         # 通用工具函数
│   ├── datasource-core     # 数据源核心模块
│   ├── lang-ai-core        # LangChain AI 核心
│   └── shared-types        # 共享类型定义
└── docs/                   # 文档
```

---

## 2. 代码风格规范

### 2.1 ESLint 规则

项目已配置 `.eslintrc.js`，核心规则：

| 规则 | 级别 | 说明 |
|------|------|------|
| `@typescript-eslint/no-unused-vars` | error | 禁止未使用的变量（以 `_` 开头可忽略） |
| `@typescript-eslint/no-explicit-any` | warn | 避免使用 `any` 类型 |
| `no-console` | warn | 禁止使用 `console.log`（允许 `warn/error`） |
| `react/react-in-jsx-scope` | off | React 17+ 无需导入 |

### 2.2 Prettier 配置

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 2.3 编码规范

- **文件编码**: UTF-8
- **行尾符**: LF (Unix)
- **缩进**: 2 空格
- **引号**: 单引号 `'`
- **分号**: 不使用

---

## 3. 文件命名规范

### 3.1 通用规则

| 文件类型 | 命名风格 | 示例 |
|----------|----------|------|
| 组件文件 | PascalCase | `ComponentRenderer.tsx` |
| 工具函数 | camelCase | `generateId.ts` |
| 类型定义 | PascalCase | `types.ts`, `ComponentConfig.ts` |
| 测试文件 | 源文件名 + `.spec.ts` | `code-generator.spec.ts` |
| 配置文件 | kebab-case | `vite.config.ts`, `tailwind.config.js` |

### 3.2 目录命名

| 目录用途 | 命名风格 | 示例 |
|----------|----------|------|
| 组件目录 | kebab-case | `components/`, `canvas-editor/` |
| 模块目录 | kebab-case | `auth/`, `project/` |
| 工具目录 | kebab-case | `utils/`, `helpers/` |

---

## 4. TypeScript 规范

### 4.1 类型定义

1. **优先使用接口而非类型别名**：
   ```typescript
   // ✅ 推荐
   interface User {
     id: number
     name: string
   }
   
   // ❌ 避免（除非需要联合类型）
   type User = {
     id: number
     name: string
   }
   ```

2. **避免 `any` 类型**：使用更具体的类型或泛型

3. **使用类型守卫**：
   ```typescript
   function isString(value: unknown): value is string {
     return typeof value === 'string'
   }
   ```

### 4.2 泛型使用

```typescript
// ✅ 推荐：明确泛型约束
function fetchData<T extends Record<string, unknown>>(url: string): Promise<T> {
  // ...
}
```

---

## 5. 后端开发规范（NestJS）

### 5.1 模块结构

每个模块遵循以下目录结构：

```
modules/
└── project/
    ├── dto/           # 数据传输对象
    ├── entities/      # 数据库实体
    ├── project.controller.ts
    ├── project.service.ts
    └── project.module.ts
```

### 5.2 Controller 规范

1. **使用装饰器**：
   - `@Controller('endpoint')` 定义路由前缀
   - `@ApiTags()` 添加 Swagger 标签
   - `@ApiOperation()` 描述接口功能
   - `@ApiResponse()` 定义响应状态码

2. **方法命名**：
   - `create()` - POST 创建
   - `findAll()` - GET 查询列表
   - `findOne(id)` - GET 查询单个
   - `update(id)` - PUT/PATCH 更新
   - `remove(id)` - DELETE 删除

### 5.3 Service 规范

1. **依赖注入**：使用构造函数注入依赖
2. **业务逻辑封装**：复杂逻辑应在 Service 层处理
3. **异常处理**：使用 NestJS 内置异常类

```typescript
// ✅ 推荐
import { Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class ProjectService {
  async findOne(id: number) {
    const project = await this.repository.findOne({ where: { id } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    return project
  }
}
```

### 5.4 DTO 规范

使用 `class-validator` 进行数据验证：

```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsOptional()
  description?: string
}
```

---

## 6. 前端开发规范（React/Next.js）

### 6.1 组件规范

1. **函数组件优先**：使用 React Hooks
2. **组件职责单一**：每个组件只做一件事
3. **Props 定义**：使用 TypeScript 接口定义 Props

```typescript
// ✅ 推荐
interface ButtonProps {
  type?: 'primary' | 'secondary'
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ type = 'primary', onClick, children }: ButtonProps) {
  return (
    <button className={`button-${type}`} onClick={onClick}>
      {children}
    </button>
  )
}
```

### 6.2 Hooks 规范

1. **自定义 Hooks 前缀**：使用 `use` 开头
2. **逻辑复用**：将可复用逻辑抽取为自定义 Hooks

```typescript
// ✅ 推荐
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}
```

### 6.3 状态管理

使用 **Zustand** 进行状态管理：

```typescript
import { create } from 'zustand'

interface CanvasState {
  components: ComponentConfig[]
  addComponent: (type: string, x: number, y: number) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  components: [],
  addComponent: (type, x, y) => set((state) => ({
    components: [...state.components, newComponent]
  }))
}))
```

### 6.4 样式规范

1. **Tailwind CSS**：优先使用 Tailwind 工具类
2. **CSS Modules**：组件级样式使用 `[name].module.css`
3. **避免全局样式污染**

---

## 7. 提交规范

### 7.1 Commit 消息格式

采用 Angular 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 7.2 Type 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档更新 |
| `style` | 代码格式化（不影响逻辑） |
| `refactor` | 重构代码 |
| `test` | 测试更新 |
| `chore` | 构建/工具更新 |

### 7.3 示例

```
feat(canvas): 添加组件拖拽功能

- 实现组件拖拽逻辑
- 添加栅格对齐功能
- 更新组件选中状态

Closes #123
```

---

## 8. 测试规范

### 8.1 测试框架

- **单元测试**: Jest
- **API 测试**: Supertest
- **组件测试**: React Testing Library

### 8.2 测试覆盖率

| 指标 | 要求 |
|------|------|
| 语句覆盖率 | ≥ 80% |
| 分支覆盖率 | ≥ 70% |

### 8.3 测试文件位置

- 后端：`src/**/*.spec.ts`
- 前端：`src/**/*.test.tsx`

---

## 9. API 规范

### 9.1 RESTful 设计

| 操作 | HTTP 方法 | 路径 |
|------|-----------|------|
| 创建 | POST | `/api/resources` |
| 查询列表 | GET | `/api/resources` |
| 查询单个 | GET | `/api/resources/:id` |
| 更新 | PUT/PATCH | `/api/resources/:id` |
| 删除 | DELETE | `/api/resources/:id` |

### 9.2 响应格式

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200
}
```

### 9.3 错误响应

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "资源不存在"
  }
}
```

---

## 10. 安全规范

### 10.1 认证授权

- 使用 JWT 认证
- 实现 RBAC 角色权限控制
- 使用 `@Roles` 装饰器保护接口

### 10.2 输入验证

- 使用 `class-validator` 验证所有输入
- 防止 SQL 注入（使用 TypeORM 参数化查询）
- 防止 XSS 攻击（前端使用 React 自动转义）

### 10.3 敏感信息

- 不在日志中打印密码、Token 等敏感信息
- 使用环境变量存储配置（`.env` 文件）

---

## 11. CI/CD 规范

### 11.1 工作流

1. **提交代码** → 触发 CI
2. **检查**：lint + typecheck
3. **测试**：运行所有测试用例
4. **构建**：编译项目
5. **部署**：推送至生产环境

### 11.2 分支策略

- `main`：主分支（生产环境）
- `develop`：开发分支
- `feature/*`：功能分支
- `fix/*`：修复分支

---

## 12. 性能规范

### 12.1 前端优化

- 使用 React.memo 避免不必要的重渲染
- 实现组件懒加载（React.lazy + Suspense）
- 使用 useMemo/useCallback 缓存计算结果

### 12.2 后端优化

- 使用 Redis 缓存热点数据
- 数据库查询添加索引
- 实现分页和限流

---

## 附录：常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 代码格式化
pnpm format

# 代码检查
pnpm lint
```

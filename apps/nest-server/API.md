# AI低代码平台 API 使用文档

## 概述

本 API 提供完整的低代码平台后端服务，包括用户认证、项目管理、页面画布配置等功能。

## API 基础信息

- **基础 URL**: `http://localhost:3000`
- **API 文档**: `http://localhost:3000/api/docs` (Swagger UI)
- **认证方式**: JWT Bearer Token

## 统一响应格式

所有接口返回统一格式：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": { ... }
}
```

### 错误响应示例

```json
{
  "code": 401,
  "msg": "用户名或密码错误",
  "data": null
}
```

---

## 1. 用户认证接口

### 1.1 用户注册

**请求**

```http
POST /auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "123456",
  "email": "admin@example.com"
}
```

**响应**

```json
{
  "code": 201,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "user"
  }
}
```

### 1.2 用户登录

**请求**

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

**响应**

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "user",
      "avatar": null
    }
  }
}
```

### 1.3 用户登出

**请求**

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**响应**

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "message": "登出成功"
  }
}
```

### 1.4 获取当前用户信息

**请求**

```http
GET /auth/profile
Authorization: Bearer <access_token>
```

**响应**

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "user",
    "status": "active",
    "avatarUrl": null,
    "lastLoginAt": "2024-01-01T10:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.5 刷新 Token

**请求**

```http
POST /auth/refresh
Authorization: Bearer <access_token>
```

**响应**

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 2. 用户管理接口

### 2.1 获取指定用户信息

**请求**

```http
GET /users/:id
Authorization: Bearer <access_token>
```

### 2.2 更新用户信息

**请求**

```http
PUT /users/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "new_username",
  "email": "new_email@example.com"
}
```

### 2.3 删除用户

**请求**

```http
DELETE /users/:id
Authorization: Bearer <access_token>
```

---

## 3. 项目管理接口

### 3.1 创建项目

**请求**

```http
POST /projects
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "我的低代码项目",
  "description": "这是一个演示项目"
}
```

**响应**

```json
{
  "code": 201,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "name": "我的低代码项目",
    "description": "这是一个演示项目",
    "status": "draft",
    "visibility": "private",
    "userId": 1,
    "version": "1.0.0",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### 3.2 获取当前用户的所有项目

**请求**

```http
GET /projects
Authorization: Bearer <access_token>
```

**响应**

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "我的低代码项目",
      "description": "这是一个演示项目",
      "status": "draft",
      "visibility": "private",
      "userId": 1,
      "version": "1.0.0",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

### 3.3 获取单个项目详情

**请求**

```http
GET /projects/:id
Authorization: Bearer <access_token>
```

### 3.4 更新项目

**请求**

```http
PUT /projects/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "更新后的项目名称",
  "status": "published"
}
```

### 3.5 删除项目

**请求**

```http
DELETE /projects/:id
Authorization: Bearer <access_token>
```

---

## 4. 页面画布配置接口

### 4.1 创建页面

**请求**

```http
POST /projects/:projectId/pages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "首页",
  "width": 1920,
  "height": 1080,
  "gridSize": 20,
  "snapToGrid": true,
  "showGrid": true,
  "backgroundColor": "#ffffff",
  "isHome": true
}
```

**响应**

```json
{
  "code": 201,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "projectId": 1,
    "name": "首页",
    "width": 1920,
    "height": 1080,
    "gridSize": 20,
    "snapToGrid": true,
    "showGrid": true,
    "showRulers": false,
    "backgroundColor": "#ffffff",
    "canvasJson": [],
    "sortOrder": 0,
    "isHome": true,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### 4.2 获取项目所有页面

**请求**

```http
GET /projects/:projectId/pages
Authorization: Bearer <access_token>
```

**查询参数**

- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 10）
- `name`: 页面名称（模糊搜索）

**示例**

```http
GET /projects/1/pages?page=1&pageSize=10&name=首页
Authorization: Bearer <access_token>
```

### 4.3 获取单个页面详情

**请求**

```http
GET /projects/:projectId/pages/:id
Authorization: Bearer <access_token>
```

### 4.4 更新页面

**请求**

```http
PUT /projects/:projectId/pages/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "更新后的页面名称",
  "width": 1440,
  "height": 900
}
```

### 4.5 删除页面

**请求**

```http
DELETE /projects/:projectId/pages/:id
Authorization: Bearer <access_token>
```

### 4.6 复制页面

**请求**

```http
POST /projects/:projectId/pages/:id/duplicate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "newName": "首页副本"
}
```

### 4.7 保存画布 JSON（自动保存）

**请求**

```http
PUT /projects/:projectId/pages/:id/canvas
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "canvasJson": [
    {
      "id": "comp_1",
      "type": "button",
      "x": 100,
      "y": 100,
      "width": 120,
      "height": 40,
      "props": {
        "text": "提交",
        "type": "primary"
      }
    }
  ]
}
```

---

## 5. 前端对接示例

### 5.1 登录并保存 Token

```typescript
// 登录
const login = async (username: string, password: string) => {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const result = await response.json()

  if (result.code === 200) {
    // 保存 token 到 localStorage
    localStorage.setItem('access_token', result.data.access_token)
    localStorage.setItem('user', JSON.stringify(result.data.user))
    return result.data
  } else {
    throw new Error(result.msg)
  }
}
```

### 5.2 创建项目

```typescript
// 创建项目
const createProject = async (name: string, description: string) => {
  const token = localStorage.getItem('access_token')

  const response = await fetch('http://localhost:3000/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  })

  return await response.json()
}
```

### 5.3 保存画布数据（自动保存）

```typescript
// 保存画布数据
const saveCanvas = async (projectId: number, pageId: number, canvasJson: any) => {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `http://localhost:3000/projects/${projectId}/pages/${pageId}/canvas`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ canvasJson }),
    }
  )

  return await response.json()
}

// 自动保存示例
let saveTimeout: NodeJS.Timeout

const handleCanvasChange = (canvasJson: any) => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveCanvas(projectId, pageId, canvasJson)
  }, 2000) // 2秒防抖
}
```

### 5.4 获取页面列表

```typescript
// 获取页面列表
const getPages = async (projectId: number, page = 1, pageSize = 10) => {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `http://localhost:3000/projects/${projectId}/pages?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  return await response.json()
}
```

---

## 6. 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token 无效或过期） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 7. 注意事项

1. **Token 有效期**: JWT Token 默认有效期为 7 天
2. **自动保存**: 建议前端实现防抖机制，避免频繁请求
3. **错误处理**: 所有接口都应检查 `code` 字段判断是否成功
4. **Redis**: Token 会缓存在 Redis 中，登出会清除缓存
5. **Swagger 文档**: 开发环境下访问 `http://localhost:3000/api/docs` 查看完整 API 文档

---

## 8. 测试账号

注册后可以使用以下账号登录：

```json
{
  "username": "admin",
  "password": "123456"
}
```

---

## 9. 环境配置

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

主要配置项：

- `DB_HOST`: PostgreSQL 数据库地址
- `REDIS_HOST`: Redis 地址
- `JWT_SECRET`: JWT 密钥（生产环境必须修改）
- `CORS_ORIGIN`: 允许的跨域地址

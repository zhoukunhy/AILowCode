# Claude Desktop MCP 配置指南

## 快速开始

### 1. 创建 Claude Desktop 配置目录

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS/Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 2. 配置 MCP 服务器

将以下配置添加到 `claude_desktop_config.json` 的 `mcpServers` 字段中：

```json
{
  "mcpServers": {
    "ai-lowcode": {
      "command": "curl",
      "args": ["-X", "POST", "http://localhost:3000/api/mcp/sse"],
      "env": {}
    }
  }
}
```

### 3. 获取访问令牌

1. 登录 AI LowCode Platform
2. 进入个人设置 → API 令牌
3. 生成新的访问令牌
4. 将令牌添加到环境变量或配置中

### 4. 验证连接

Claude Desktop 重启后，可以在设置中看到已连接的 MCP 服务器列表。

---

## 高级配置

### 使用本地 MCP Server CLI

如果你希望使用本地命令行工具来连接：

```json
{
  "mcpServers": {
    "ai-lowcode": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000/api/mcp",
        "MCP_SERVER_TOKEN": "your-token"
      }
    }
  }
}
```

### 多服务器配置

```json
{
  "mcpServers": {
    "ai-lowcode": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000/api/mcp"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./projects"]
    }
  }
}
```

---

## API 端点说明

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/mcp/sse` | GET | SSE 流式连接端点 |
| `/api/mcp/rpc` | POST | JSON-RPC HTTP 调用端点 |
| `/api/mcp/tools` | GET | 获取工具列表 |
| `/api/mcp/tools/:name/call` | POST | 调用指定工具 |
| `/api/mcp/prompts` | GET | 获取提示词列表 |
| `/api/mcp/prompts/:id/render` | POST | 渲染提示词模板 |

---

## 故障排除

### 连接失败

1. 确认后端服务已启动 (`pnpm start`)
2. 检查端口 3000 是否被占用
3. 验证 JWT 令牌是否有效

### SSE 连接断开

1. 检查网络连接
2. 增加心跳间隔配置
3. 查看服务端日志

### 工具调用失败

1. 查看工具参数是否正确
2. 检查服务端日志获取详细错误信息
3. 确认工具已在服务端正确注册

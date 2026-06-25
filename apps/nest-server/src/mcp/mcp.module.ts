import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MCPController } from './mcp.controller'
import { MCPService } from './mcp.service'
import { McpPromptTemplateEntity } from './entities/mcp-prompt-template.entity'
import { McpContextSessionEntity } from './entities/mcp-context-session.entity'
import { McpToolRegistryEntity } from './entities/mcp-tool-registry.entity'

/**
 * MCP 模块
 * 提供模型上下文协议的核心功能，包括工具管理、提示词管理和上下文管理
 * 支持数据持久化存储
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      McpPromptTemplateEntity,
      McpContextSessionEntity,
      McpToolRegistryEntity,
    ]),
  ],
  controllers: [MCPController],
  providers: [MCPService],
  exports: [MCPService],
})
export class MCPModule {}
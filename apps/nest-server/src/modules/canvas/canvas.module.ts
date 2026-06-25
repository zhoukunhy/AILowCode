/**
 * 画布模块
 * 提供画布管理功能，集成 MCP 工具能力
 */
import { Module } from '@nestjs/common'
import { CanvasController } from './canvas.controller'
import { CanvasService } from './canvas.service'
import { MCPModule } from '../../mcp/mcp.module'

@Module({
  imports: [MCPModule],
  controllers: [CanvasController],
  providers: [CanvasService],
})
export class CanvasModule {}

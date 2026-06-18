/**
 * Agent 控制器
 * 提供 AI 生成页面的 API 接口
 */
import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AgentService } from './agent.service'
import { GeneratePageDto, QuerySessionsDto, GeneratePageResponseDto } from './dto/agent.dto'

@ApiTags('Agent')
@ApiBearerAuth('JWT-auth')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * AI 生成页面
   */
  @Post('generate-page')
  @ApiOperation({ summary: 'AI 生成页面' })
  @ApiResponse({ status: 201, description: '生成成功' })
  @ApiResponse({ status: 400, description: '生成失败' })
  async generatePage(@Body() dto: GeneratePageDto) {
    return this.agentService.generatePage(dto)
  }

  /**
   * 获取会话详情
   */
  @Get('sessions/:sessionId')
  @ApiOperation({ summary: '获取会话详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.agentService.getSession(sessionId)
  }

  /**
   * 查询会话列表
   */
  @Get('sessions')
  @ApiOperation({ summary: '查询会话列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async querySessions(@Query() dto: QuerySessionsDto) {
    return this.agentService.querySessions(dto)
  }

  /**
   * 删除会话
   */
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: '删除会话' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  async deleteSession(@Param('sessionId') sessionId: string) {
    await this.agentService.deleteSession(sessionId)
    return { message: '删除成功' }
  }

  /**
   * AI 生成页面（流式输出）
   */
  @Post('generate-page/stream')
  @ApiOperation({ summary: 'AI 生成页面（流式输出）' })
  @ApiResponse({ status: 200, description: '生成成功' })
  @ApiResponse({ status: 400, description: '生成失败' })
  async generatePageStream(@Body() dto: GeneratePageDto, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()

    const sendEvent = (event: string, data: any) => {
      response.write(`event: ${event}\n`)
      response.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    try {
      await this.agentService.generatePageWithStream(dto, {
        onStep: (step: { name: string; message: string; progress: number }) => sendEvent('step', step),
        onProgress: (progress: { current: number; total: number; message: string }) => sendEvent('progress', progress),
        onSchema: (schema: any) => sendEvent('schema', { schema }),
        onComplete: (result: GeneratePageResponseDto) => sendEvent('complete', result),
        onError: (error: { message: string }) => sendEvent('error', error),
      })
    } catch (error: any) {
      sendEvent('error', { message: error.message })
    } finally {
      response.end()
    }
  }
}

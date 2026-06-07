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
  Query
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AgentService } from './agent.service'
import { GeneratePageDto, QuerySessionsDto } from './dto/agent.dto'

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
}

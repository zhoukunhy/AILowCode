/**
 * 代码生成控制器
 */
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query,
  Res,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { CodegenService } from './codegen.service'
import { GenerateCodeDto } from './dto/codegen.dto'

@ApiTags('代码生成')
@ApiBearerAuth('JWT-auth')
@Controller('codegen')
export class CodegenController {
  constructor(private readonly codegenService: CodegenService) {}

  /**
   * 生成代码（返回文件列表）
   */
  @Post('generate')
  @ApiOperation({ summary: '生成代码' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateCode(@Body() dto: GenerateCodeDto) {
    return this.codegenService.generateCode(dto)
  }

  /**
   * 生成代码并打包下载
   */
  @Post('download')
  @ApiOperation({ summary: '生成代码并下载' })
  @ApiResponse({ status: 200, description: '下载成功' })
  async downloadCode(
    @Body() dto: GenerateCodeDto,
    @Res() res: Response,
  ) {
    try {
      const zipBuffer = await this.codegenService.generateAndDownload(dto)
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${dto.type}-project.zip"`,
        'Content-Length': zipBuffer.length,
      })
      
      res.send(zipBuffer)
    } catch (error: any) {
      throw new BadRequestException(`下载失败: ${error.message}`)
    }
  }

  /**
   * 获取生成记录详情
   */
  @Get('logs/:sessionId')
  @ApiOperation({ summary: '获取生成记录详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getGenerationLog(@Param('sessionId') sessionId: string) {
    return this.codegenService.getGenerationLog(sessionId)
  }

  /**
   * 查询生成记录列表
   */
  @Get('logs')
  @ApiOperation({ summary: '查询生成记录列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async queryLogs(
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.codegenService.queryLogs(page || 1, pageSize || 10)
  }
}

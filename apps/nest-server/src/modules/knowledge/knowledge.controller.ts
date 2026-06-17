import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger'
import { KnowledgeService } from './knowledge.service'
import {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  UploadDocumentDto,
  SearchKnowledgeDto,
} from './dto/knowledge.dto'

/**
 * 知识库控制器
 * 提供知识库管理、文档上传、检索等 API
 */
@ApiTags('知识库')
@ApiBearerAuth('JWT-auth')
@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // ==================== 知识库管理 ====================

  @Post('bases')
  @ApiOperation({ summary: '创建知识库' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createKnowledgeBase(@Body() createDto: CreateKnowledgeBaseDto) {
    return this.knowledgeService.createKnowledgeBase(createDto)
  }

  @Get('bases')
  @ApiOperation({ summary: '获取所有知识库' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllKnowledgeBases() {
    return this.knowledgeService.getAllKnowledgeBases()
  }

  @Get('bases/:id')
  @ApiOperation({ summary: '获取知识库详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getKnowledgeBaseById(@Param('id', ParseIntPipe) id: number) {
    return this.knowledgeService.getKnowledgeBaseById(id)
  }

  @Put('bases/:id')
  @ApiOperation({ summary: '更新知识库' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateKnowledgeBase(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateKnowledgeBaseDto
  ) {
    return this.knowledgeService.updateKnowledgeBase(id, updateDto)
  }

  @Delete('bases/:id')
  @ApiOperation({ summary: '删除知识库' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteKnowledgeBase(@Param('id', ParseIntPipe) id: number) {
    await this.knowledgeService.deleteKnowledgeBase(id)
    return { message: '删除成功' }
  }

  // ==================== 文档管理 ====================

  @Post('documents/upload')
  @ApiOperation({ summary: '上传文档（文本内容）' })
  @ApiResponse({ status: 201, description: '上传成功' })
  async uploadDocument(@Body() uploadDto: UploadDocumentDto) {
    return this.knowledgeService.uploadDocument(uploadDto)
  }

  @Post('documents/upload-file')
  @ApiOperation({ summary: '上传文档（文件上传）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        knowledgeBaseId: { type: 'number', description: '知识库ID' },
        type: { type: 'string', enum: ['md', 'api', 'requirement'], description: '文档类型' },
        file: { type: 'string', format: 'binary', description: '文档文件' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentFile(
    @Body() body: any,
    @UploadedFile() file: any
  ) {
    if (!file) {
      throw new BadRequestException('文件不能为空')
    }

    const knowledgeBaseId = parseInt(body.knowledgeBaseId)
    const type = body.type
    const content = file.buffer.toString('utf-8')
    const name = file.originalname

    if (!knowledgeBaseId) {
      throw new BadRequestException('知识库ID不能为空')
    }

    if (!type) {
      throw new BadRequestException('文档类型不能为空')
    }

    return this.knowledgeService.uploadDocument({
      knowledgeBaseId,
      name,
      content,
      type,
    })
  }

  @Get('documents')
  @ApiOperation({ summary: '获取知识库的文档列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getDocumentsByKnowledgeBase(@Query('knowledgeBaseId', ParseIntPipe) knowledgeBaseId: number) {
    return this.knowledgeService.getDocumentsByKnowledgeBase(knowledgeBaseId)
  }

  @Get('documents/:id')
  @ApiOperation({ summary: '获取文档详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getDocumentById(@Param('id', ParseIntPipe) id: number) {
    return this.knowledgeService.getDocumentById(id)
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: '删除文档' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteDocument(@Param('id', ParseIntPipe) id: number) {
    await this.knowledgeService.deleteDocument(id)
    return { message: '删除成功' }
  }

  // ==================== 检索功能 ====================

  @Post('search')
  @ApiOperation({ summary: '检索知识库' })
  @ApiResponse({ status: 200, description: '检索成功' })
  async searchKnowledge(@Body() searchDto: SearchKnowledgeDto) {
    return this.knowledgeService.searchKnowledge(searchDto)
  }

  @Get('chunks/:documentId')
  @ApiOperation({ summary: '获取文档分块预览' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getDocumentChunks(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return this.knowledgeService.getDocumentChunks({
      documentId,
      page,
      pageSize,
    })
  }

  @Post('bases/:id/clear-vectors')
  @ApiOperation({ summary: '清空知识库所有向量' })
  @ApiParam({ name: 'id', description: '知识库ID' })
  @ApiResponse({ status: 200, description: '清空成功' })
  async clearKnowledgeBaseVectors(@Param('id', ParseIntPipe) id: number) {
    await this.knowledgeService.clearKnowledgeBaseVectors(id)
    return { message: '清空成功' }
  }

  @Get('bases/:id/stats')
  @ApiOperation({ summary: '获取知识库统计信息' })
  @ApiParam({ name: 'id', description: '知识库ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getKnowledgeBaseStats(@Param('id', ParseIntPipe) id: number) {
    return this.knowledgeService.getKnowledgeBaseStats(id)
  }

  @Post('hybrid-search')
  @ApiOperation({ summary: '混合检索（向量+关键词）' })
  @ApiResponse({ status: 200, description: '检索成功' })
  async hybridSearchKnowledge(@Body() searchDto: SearchKnowledgeDto) {
    return this.knowledgeService.hybridSearchKnowledge(searchDto)
  }

  @Post('documents/:id/revectorize')
  @ApiOperation({ summary: '重新向量化文档' })
  @ApiParam({ name: 'id', description: '文档ID' })
  @ApiResponse({ status: 200, description: '重新向量化任务已启动' })
  async revectorizeDocument(@Param('id', ParseIntPipe) id: number) {
    return this.knowledgeService.revectorizeDocument(id)
  }

  @Get('logs')
  @ApiOperation({ summary: '获取向量化日志' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getVectorizationLogs(@Query('documentId') documentId?: string) {
    return this.knowledgeService.getVectorizationLogs(documentId)
  }
}

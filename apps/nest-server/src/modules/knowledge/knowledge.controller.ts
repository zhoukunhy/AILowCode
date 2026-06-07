import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger'
import { KnowledgeService } from './knowledge.service'
import { 
  CreateKnowledgeBaseDto, 
  UpdateKnowledgeBaseDto, 
  UploadDocumentDto, 
  SearchKnowledgeDto
} from './dto/knowledge.dto'

/**
 * 知识库控制器
 * 提供知识库管理、文档上传、检索等 API
 */
@ApiTags('知识库')
@ApiBearerAuth('JWT-auth')
@Controller('knowledge')
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
    @Body('knowledgeBaseId') knowledgeBaseId: string,
    @Body('type') type: string,
    @UploadedFile() file: any
  ) {
    if (!file) {
      throw new BadRequestException('文件不能为空')
    }

    const content = file.buffer.toString('utf-8')
    const name = file.originalname

    return this.knowledgeService.uploadDocument({
      knowledgeBaseId: parseInt(knowledgeBaseId),
      name,
      content,
      type: type as any,
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
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    return this.knowledgeService.getDocumentChunks({
      documentId,
      page: page || 1,
      pageSize: pageSize || 10,
    })
  }
}

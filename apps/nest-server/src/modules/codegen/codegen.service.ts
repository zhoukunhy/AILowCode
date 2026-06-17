/**
 * 代码生成服务
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'
import { CodeGenerationLogEntity } from './entities/code-generation-log.entity'
import { GenerateCodeDto, GenerateCodeResponseDto } from './dto/codegen.dto'
import { createCodeGenerator, EnhancedGenerateOptions } from '@ai-lowcode/code-generator'
import { CacheService } from '../../common/redis/cache.service'

@Injectable()
export class CodegenService {
  private readonly logger = new Logger(CodegenService.name)

  constructor(
    @InjectRepository(CodeGenerationLogEntity)
    private logRepository: Repository<CodeGenerationLogEntity>,
    private cacheService: CacheService,
  ) {}

  /**
   * 生成代码（带分布式锁防并发）
   */
  async generateCode(dto: GenerateCodeDto): Promise<GenerateCodeResponseDto> {
    const sessionId = dto.sessionId || uuidv4()
    const startTime = Date.now()

    // 创建日志记录
    const log = this.logRepository.create({
      sessionId,
      generationType: dto.type,
      schema: JSON.stringify(dto.schema),
      fileCount: 0,
      status: 'pending',
      startTime: new Date(startTime),
    })
    await this.logRepository.save(log)

    this.logger.log(`开始代码生成，会话: ${sessionId}, 类型: ${dto.type}`)

    // 使用分布式锁防止并发生成
    const lockKey = `codegen:${sessionId}`
    const result = await this.cacheService.executeWithLock(
      lockKey,
      async () => {
        return await this.doGenerateCode(log, dto, startTime)
      },
      60000 // 锁超时时间 60 秒
    )

    if (!result) {
      // 获取锁失败，说明有并发请求
      log.status = 'failed'
      log.errorMessage = '代码生成请求过于频繁，请稍后重试'
      log.endTime = new Date()
      log.duration = Date.now() - startTime
      await this.logRepository.save(log)

      throw new BadRequestException('代码生成请求过于频繁，请稍后重试')
    }

    return result
  }

  /**
   * 实际执行代码生成
   */
  private async doGenerateCode(
    log: CodeGenerationLogEntity,
    dto: GenerateCodeDto,
    startTime: number
  ): Promise<GenerateCodeResponseDto> {
    try {
      // 更新状态
      log.status = 'running'
      await this.logRepository.save(log)

      // 构建生成选项
      const options: Partial<EnhancedGenerateOptions> = {
        framework: (dto.framework as any) || 'react',
        language: 'typescript',
        style: 'css',
        enableRAG: dto.enableRAG ?? false,
        enableOptimization: dto.enableOptimization ?? false,
      }

      // 创建代码生成器
      const generator = createCodeGenerator(dto.schema, options)

      // 根据是否启用增强功能选择生成方式
      let project: any
      if (options.enableRAG || options.enableOptimization) {
        project = await generator.generateEnhanced(dto.type)
      } else {
        project = generator.generate(dto.type)
      }

      // 更新日志
      log.status = 'completed'
      log.fileCount = project.files.length
      log.endTime = new Date()
      log.duration = Date.now() - startTime
      await this.logRepository.save(log)

      this.logger.log(
        `代码生成成功: ${log.sessionId}, 文件数: ${project.files.length}, ` +
        `时长: ${log.duration}ms${project.metadata ? `, RAG时间: ${project.metadata.ragRetrievalTime}ms, 优化文件数: ${project.metadata.optimizedFiles}` : ''}`
      )

      const response: GenerateCodeResponseDto = {
        sessionId: log.sessionId,
        success: true,
        files: project.files,
        fileCount: project.files.length,
        duration: log.duration,
      }

      if (project.metadata) {
        response.ragRetrievalTime = project.metadata.ragRetrievalTime
        response.optimizedFiles = project.metadata.optimizedFiles
      }

      return response
    } catch (error: any) {
      // 更新日志
      log.status = 'failed'
      log.errorMessage = error.message
      log.endTime = new Date()
      log.duration = Date.now() - startTime
      await this.logRepository.save(log)

      this.logger.error(`代码生成失败: ${log.sessionId}`, error)

      throw new BadRequestException(`代码生成失败: ${error.message}`)
    }
  }

  /**
   * 生成并打包下载
   */
  async generateAndDownload(dto: GenerateCodeDto): Promise<Buffer> {
    const result = await this.generateCode(dto)
    
    if (!result.success) {
      throw new BadRequestException(result.error)
    }

    // 创建 ZIP 文件
    const zip = new JSZip()

    // 将文件添加到 ZIP
    for (const file of result.files) {
      zip.file(file.path, file.content)
    }

    // 生成 ZIP 缓冲区
    return zip.generateAsync({ type: 'nodebuffer' })
  }

  /**
   * 获取生成日志
   */
  async getGenerationLog(sessionId: string): Promise<CodeGenerationLogEntity> {
    const log = await this.logRepository.findOne({
      where: { sessionId },
    })

    if (!log) {
      throw new BadRequestException('生成记录不存在')
    }

    return log
  }

  /**
   * 查询生成日志列表
   */
  async queryLogs(page: number = 1, pageSize: number = 10): Promise<{
    logs: CodeGenerationLogEntity[]
    total: number
  }> {
    const skip = (page - 1) * pageSize

    const [logs, total] = await this.logRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    })

    return { logs, total }
  }
}
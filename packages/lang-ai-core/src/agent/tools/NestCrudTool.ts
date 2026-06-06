/**
 * Nest CRUD 工具 - 自动生成 NestJS CRUD 接口代码
 */

import type { NestCrudInput, NestCrudOutput, GeneratedCodeFile } from './ToolTypes'
import { NestCrudInputSchema } from './ToolTypes'

/**
 * Nest CRUD 工具配置
 */
export interface NestCrudToolConfig {
  outputDir?: string
  author?: string
}

/**
 * Nest CRUD 工具
 */
export class NestCrudTool {
  name = 'Nest_Crud'
  description = '自动生成对应 CRUD 接口，写入数据源配置'
  inputSchema = NestCrudInputSchema
  private config: NestCrudToolConfig

  constructor(config?: NestCrudToolConfig) {
    this.config = {
      outputDir: config?.outputDir || 'src/modules',
      author: config?.author || 'AI Lowcode',
    }
  }

  /**
   * 生成所有代码文件
   */
  async execute(input: NestCrudInput): Promise<NestCrudOutput> {
    console.log(`[NestCrudTool] 生成 ${input.entityName} CRUD 代码`)

    const files: GeneratedCodeFile[] = []
    const snakeName = this.toSnakeCase(input.entityName)
    const kebabName = this.toKebabCase(input.entityName)

    // 1. Entity
    if (input.generateDTOs !== false) {
      files.push(this.generateEntity(input, snakeName))
    }

    // 2. DTOs
    if (input.generateDTOs !== false) {
      files.push(...this.generateDTOs(input, snakeName))
    }

    // 3. Service
    if (input.generateService !== false) {
      files.push(this.generateService(input, snakeName, kebabName))
    }

    // 4. Controller
    if (input.generateController !== false) {
      files.push(this.generateController(input, snakeName, kebabName))
    }

    // 5. Module
    files.push(this.generateModule(input, kebabName))

    return {
      success: true,
      files,
      message: `生成了 ${files.length} 个文件`,
    }
  }

  /**
   * 生成 Entity
   */
  private generateEntity(input: NestCrudInput, snakeName: string): GeneratedCodeFile {
    const columns = input.columns.map(col => {
      const decorators: string[] = []
      const type = this.mapTypeScriptType(col.type)

      if (col.primaryKey) {
        decorators.push('@PrimaryGeneratedColumn()')
      } else {
        decorators.push(`@Column({ name: '${col.name}'${col.nullable ? ', nullable: true' : ''}${col.columnType ? `, type: '${col.columnType}'` : ''})`)
      }

      return `  ${decorators.join('\n  ')}\n  ${col.name}${col.nullable ? '?' : ''}: ${type};`
    }).join('\n\n')

    const swagger = input.swagger !== false

    return {
      path: `${input.moduleName || kebabName}/${kebabName}.entity.ts`,
      language: 'typescript',
      type: 'entity',
      content: `${swagger ? `import { ApiProperty } from '@nestjs/swagger';\n` : ''}import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('${snakeName}')
export class ${input.entityName} {
${swagger ? columns.split('\n').map((line: string) => {
    const match = line.match(/^\s+(\w+)\??: (\w+)/)
    if (match) {
      return `${line}\n  @ApiProperty({ description: '${match[1]}' })`
    }
    return line
  }).join('\n') : columns}
}
`,
    }
  }

  /**
   * 生成 DTOs
   */
  private generateDTOs(input: NestCrudInput, snakeName: string): GeneratedCodeFile[] {
    const files: GeneratedCodeFile[] = []
    const kebabName = this.toKebabCase(input.entityName)
    const swagger = input.swagger !== false

    // Create DTO
    const createProps = input.columns
      .filter(col => !col.primaryKey)
      .map(col => {
        const type = this.mapTypeScriptType(col.type)
        const optional = col.nullable ? '?' : ''
        return swagger ? `  @ApiProperty({ description: '${col.name}', required: ${!col.nullable} })\n  ${col.name}${optional}: ${type};` : `  ${col.name}${optional}: ${type};`
      }).join('\n\n')

    files.push({
      path: `${input.moduleName || kebabName}/dto/create-${kebabName}.dto.ts`,
      language: 'typescript',
      type: 'dto',
      content: `${swagger ? `import { ApiProperty } from '@nestjs/swagger'\n` : ''}export class Create${input.entityName}Dto {
${createProps}
}
`,
    })

    // Update DTO
    const updateProps = input.columns
      .filter(col => !col.primaryKey)
      .map(col => {
        const type = this.mapTypeScriptType(col.type)
        return swagger ? `  @ApiProperty({ description: '${col.name}' })\n  ${col.name}?: ${type};` : `  ${col.name}?: ${type};`
      }).join('\n\n')

    files.push({
      path: `${input.moduleName || kebabName}/dto/update-${kebabName}.dto.ts`,
      language: 'typescript',
      type: 'dto',
      content: `${swagger ? `import { ApiProperty } from '@nestjs/swagger'\n` : ''}import { PartialType } from '@nestjs/mapped-types'
import { Create${input.entityName}Dto } from './create-${kebabName}.dto'

export class Update${input.entityName}Dto extends PartialType(Create${input.entityName}Dto) {
${swagger ? updateProps.split('\n').slice(2).join('\n') : ''}
}
`,
    })

    return files
  }

  /**
   * 生成 Service
   */
  private generateService(input: NestCrudInput, snakeName: string, kebabName: string): GeneratedCodeFile {
    const crudMethods = `
  /**
   * 创建
   */
  async create(createDto: Create${input.entityName}Dto): Promise<${input.entityName}> {
    const entity = this.repo.create(createDto)
    return this.repo.save(entity)
  }

  /**
   * 查询所有
   */
  async findAll(): Promise<${input.entityName}[]> {
    return this.repo.find()
  }

  /**
   * 查询单个
   */
  async findOne(id: number): Promise<${input.entityName}> {
    const entity = await this.repo.findOne({ where: { id } as any })
    if (!entity) {
      throw new NotFoundException(\`\${this.entityName} #\${id} not found\`)
    }
    return entity
  }

  /**
   * 更新
   */
  async update(id: number, updateDto: Update${input.entityName}Dto): Promise<${input.entityName}> {
    const entity = await this.findOne(id)
    Object.assign(entity, updateDto)
    return this.repo.save(entity)
  }

  /**
   * 删除
   */
  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id)
    await this.repo.remove(entity)
  }
`

    return {
      path: `${input.moduleName || kebabName}/${kebabName}.service.ts`,
      language: 'typescript',
      type: 'service',
      content: `import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ${input.entityName} } from './${kebabName}.entity'
import { Create${input.entityName}Dto } from './dto/create-${kebabName}.dto'
import { Update${input.entityName}Dto } from './dto/update-${kebabName}.dto'

@Injectable()
export class ${input.entityName}Service {
  private readonly entityName = '${input.entityName}'

  constructor(
    @InjectRepository(${input.entityName})
    private repo: Repository<${input.entityName}>,
  ) {}${crudMethods}
}
`,
    }
  }

  /**
   * 生成 Controller
   */
  private generateController(input: NestCrudInput, snakeName: string, kebabName: string): GeneratedCodeFile {
    const swagger = input.swagger !== false

    return {
      path: `${input.moduleName || kebabName}/${kebabName}.controller.ts`,
      language: 'typescript',
      type: 'controller',
      content: `import {
  Controller, Get, Post, Body, Put, Param, Delete,
  ${swagger ? 'ApiTags, ApiOperation, ApiResponse,' : ''} ParseIntPipe
} from '@nestjs/common'
import { ${input.entityName}Service } from './${kebabName}.service'
import { Create${input.entityName}Dto } from './dto/create-${kebabName}.dto'
import { Update${input.entityName}Dto } from './dto/update-${kebabName}.dto'
${swagger ? `import { ${input.entityName} } from './${kebabName}.entity'` : ''}

${swagger ? `@ApiTags('${input.entityName}')\n@ApiBearerAuth()` : ''}@Controller('${kebabName}')
export class ${input.entityName}Controller {
  constructor(private readonly service: ${input.entityName}Service) {}

  ${swagger ? `@ApiOperation({ summary: '创建${input.entityName}' })` : ''}
  @Post()
  ${swagger ? '@ApiResponse({ status: 201, description: '创建成功' })' : ''}
  create(@Body() createDto: Create${input.entityName}Dto) {
    return this.service.create(createDto)
  }

  ${swagger ? `@ApiOperation({ summary: '查询所有${input.entityName}' })` : ''}
  @Get()
  findAll() {
    return this.service.findAll()
  }

  ${swagger ? `@ApiOperation({ summary: '查询单个${input.entityName}' })` : ''}
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  ${swagger ? `@ApiOperation({ summary: '更新${input.entityName}' })` : ''}
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: Update${input.entityName}Dto) {
    return this.service.update(id, updateDto)
  }

  ${swagger ? `@ApiOperation({ summary: '删除${input.entityName}' })` : ''}
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
`,
    }
  }

  /**
   * 生成 Module
   */
  private generateModule(input: NestCrudInput, kebabName: string): GeneratedCodeFile {
    return {
      path: `${input.moduleName || kebabName}/${kebabName}.module.ts`,
      language: 'typescript',
      type: 'module',
      content: `import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ${input.entityName} } from './${kebabName}.entity'
import { ${input.entityName}Service } from './${kebabName}.service'
import { ${input.entityName}Controller } from './${kebabName}.controller'

@Module({
  imports: [TypeOrmModule.forFeature([${input.entityName}])],
  providers: [${input.entityName}Service],
  controllers: [${input.entityName}Controller],
  exports: [${input.entityName}Service],
})
export class ${input.entityName}Module {}
`,
    }
  }

  /**
   * 映射 TypeScript 类型
   */
  private mapTypeScriptType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'text': 'string',
      'integer': 'number',
      'int': 'number',
      'bigint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'float': 'number',
      'double': 'number',
      'boolean': 'boolean',
      'date': 'Date',
      'timestamp': 'Date',
      'datetime': 'Date',
      'uuid': 'string',
      'email': 'string',
    }
    return typeMap[type.toLowerCase()] || 'any'
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
  }

  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  }
}

/**
 * 创建 Nest CRUD 工具实例
 */
export function createNestCrudTool(config?: NestCrudToolConfig): NestCrudTool {
  return new NestCrudTool(config)
}

import { Injectable, Logger } from '@nestjs/common'
import { DataModelEntity } from '../entities/data-model.entity'

export interface GeneratedFile {
  path: string
  content: string
}

@Injectable()
export class CrudGeneratorService {
  private readonly logger = new Logger(CrudGeneratorService.name)

  private toPascalCase(str: string): string {
    return str.split(/[-_\s]+/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  private getTypeScriptType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      text: 'string',
      integer: 'number',
      bigint: 'number',
      smallint: 'number',
      decimal: 'number',
      float: 'number',
      double: 'number',
      boolean: 'boolean',
      date: 'Date',
      datetime: 'Date',
      timestamp: 'Date',
      json: 'Record<string, any>',
      uuid: 'string',
      email: 'string',
      phone: 'string',
      password: 'string',
      select: 'string',
      textarea: 'string',
      enum: 'string',
    }
    return typeMap[fieldType] || 'string'
  }

  private generateEntity(entity: any): string {
    const className = this.toPascalCase(entity.name)
    const tableName = entity.tableName

    let columns = ''
    
    for (const field of entity.fields) {
      const tsType = this.getTypeScriptType(field.type)
      let decorator = `@Column()`
      
      if (field.primaryKey) {
        decorator = `@PrimaryGeneratedColumn('uuid')`
      } else if (field.unique) {
        decorator = `@Column({ unique: true })`
      } else if (field.type === 'text') {
        decorator = `@Column('text')`
      } else if (field.type === 'json') {
        decorator = `@Column('json')`
      } else if (field.type === 'datetime' || field.type === 'timestamp') {
        decorator = `@Column('datetime')`
      } else if (field.length) {
        decorator = `@Column({ length: ${field.length} })`
      }

      columns += `  ${decorator}\n  ${field.name}: ${tsType}${field.required ? '' : ' | null'}\n\n`
    }

    if (entity.createdAtField) {
      columns += `  @CreateDateColumn()\n  createdAt: Date\n\n`
    }

    if (entity.updatedAtField) {
      columns += `  @UpdateDateColumn()\n  updatedAt: Date\n\n`
    }

    if (entity.softDelete) {
      columns += `  @DeleteDateColumn()\n  deletedAt: Date | null\n\n`
    }

    return `import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

@Entity('${tableName}')
export class ${className}Entity {
${columns}}
`
  }

  private generateCreateDto(entity: any): string {
    const className = this.toPascalCase(entity.name)
    let fields = ''

    for (const field of entity.fields) {
      if (field.primaryKey) continue
      
      const tsType = this.getTypeScriptType(field.type)
      let decorators = ''
      
      if (field.required) {
        decorators += '@IsNotEmpty()\n  '
      }

      if (field.type === 'string' || field.type === 'text' || field.type === 'email' || field.type === 'phone') {
        decorators += '@IsString()\n  '
      } else if (field.type === 'integer' || field.type === 'bigint' || field.type === 'smallint') {
        decorators += '@IsInt()\n  '
      } else if (field.type === 'decimal' || field.type === 'float' || field.type === 'double') {
        decorators += '@IsNumber()\n  '
      } else if (field.type === 'boolean') {
        decorators += '@IsBoolean()\n  '
      } else if (field.type === 'date' || field.type === 'datetime' || field.type === 'timestamp') {
        decorators += '@IsDate()\n  '
      } else if (field.type === 'json') {
        decorators += '@IsObject()\n  '
      }

      if (field.validationRules) {
        for (const rule of field.validationRules) {
          if (rule.type === 'minLength') {
            decorators += `@MinLength(${rule.value})\n  `
          } else if (rule.type === 'maxLength') {
            decorators += `@MaxLength(${rule.value})\n  `
          } else if (rule.type === 'min') {
            decorators += `@Min(${rule.value})\n  `
          } else if (rule.type === 'max') {
            decorators += `@Max(${rule.value})\n  `
          } else if (rule.type === 'email') {
            decorators += '@IsEmail()\n  '
          } else if (rule.type === 'pattern') {
            decorators += `@Matches(${rule.value})\n  `
          }
        }
      }

      fields += `  ${decorators}${field.name}: ${tsType}${field.required ? '' : ' | undefined'}\n\n`
    }

    return `import { IsString, IsNumber, IsBoolean, IsDate, IsObject, IsNotEmpty, IsInt, MinLength, MaxLength, Min, Max, IsEmail, Matches } from 'class-validator'

export class Create${className}Dto {
${fields}}
`
  }

  private generateUpdateDto(entity: any): string {
    const className = this.toPascalCase(entity.name)
    let fields = ''

    for (const field of entity.fields) {
      if (field.primaryKey) continue
      
      const tsType = this.getTypeScriptType(field.type)
      let decorators = '@IsOptional()\n  '
      
      if (field.type === 'string' || field.type === 'text' || field.type === 'email' || field.type === 'phone') {
        decorators += '@IsString()\n  '
      } else if (field.type === 'integer' || field.type === 'bigint' || field.type === 'smallint') {
        decorators += '@IsInt()\n  '
      } else if (field.type === 'decimal' || field.type === 'float' || field.type === 'double') {
        decorators += '@IsNumber()\n  '
      } else if (field.type === 'boolean') {
        decorators += '@IsBoolean()\n  '
      } else if (field.type === 'date' || field.type === 'datetime' || field.type === 'timestamp') {
        decorators += '@IsDate()\n  '
      } else if (field.type === 'json') {
        decorators += '@IsObject()\n  '
      }

      fields += `  ${decorators}${field.name}?: ${tsType}\n\n`
    }

    return `import { IsString, IsNumber, IsBoolean, IsDate, IsObject, IsOptional, IsInt } from 'class-validator'

export class Update${className}Dto {
${fields}}
`
  }

  private generateService(entity: any): string {
    const className = this.toPascalCase(entity.name)
    const serviceName = `${className}Service`
    const repoName = `${this.toCamelCase(entity.name)}Repository`
    const entityName = `${className}Entity`

    return `import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ${entityName} } from './entities/${this.toCamelCase(entity.name)}.entity'
import { Create${className}Dto } from './dto/create-${this.toCamelCase(entity.name)}.dto'
import { Update${className}Dto } from './dto/update-${this.toCamelCase(entity.name)}.dto'

@Injectable()
export class ${serviceName} {
  constructor(
    @InjectRepository(${entityName})
    private readonly ${repoName}: Repository<${entityName}>,
  ) {}

  async create(createDto: Create${className}Dto): Promise<${entityName}> {
    const entity = this.${repoName}.create(createDto)
    return this.${repoName}.save(entity)
  }

  async findAll(): Promise<${entityName}[]> {
    return this.${repoName}.find()
  }

  async findOne(id: string): Promise<${entityName}> {
    const entity = await this.${repoName}.findOne({ where: { id } })
    if (!entity) {
      throw new NotFoundException('${className} not found')
    }
    return entity
  }

  async update(id: string, updateDto: Update${className}Dto): Promise<${entityName}> {
    const entity = await this.findOne(id)
    Object.assign(entity, updateDto)
    return this.${repoName}.save(entity)
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id)
    await this.${repoName}.remove(entity)
  }
}
`
  }

  private generateController(entity: any): string {
    const className = this.toPascalCase(entity.name)
    const controllerName = `${className}Controller`
    const serviceName = `${className}Service`
    const route = `/${this.toCamelCase(entity.name)}s`

    return `import { Controller, Post, Get, Put, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ${serviceName} } from './${this.toCamelCase(entity.name)}.service'
import { Create${className}Dto } from './dto/create-${this.toCamelCase(entity.name)}.dto'
import { Update${className}Dto } from './dto/update-${this.toCamelCase(entity.name)}.dto'

@ApiTags('${entity.name}')
@ApiBearerAuth('JWT-auth')
@Controller('${route}')
export class ${controllerName} {
  constructor(private readonly ${this.toCamelCase(serviceName)}: ${serviceName}) {}

  @Post()
  @ApiOperation({ summary: 'Create ${entity.name}' })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(@Body() dto: Create${className}Dto) {
    return this.${this.toCamelCase(serviceName)}.create(dto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all ${entity.name}s' })
  @ApiResponse({ status: 200, description: 'OK' })
  async findAll() {
    return this.${this.toCamelCase(serviceName)}.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${entity.name}' })
  @ApiResponse({ status: 200, description: 'OK' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.${this.toCamelCase(serviceName)}.findOne(id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ${entity.name}' })
  @ApiResponse({ status: 200, description: 'Updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Update${className}Dto,
  ) {
    return this.${this.toCamelCase(serviceName)}.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${entity.name}' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.${this.toCamelCase(serviceName)}.remove(id)
    return { success: true }
  }
}
`
  }

  private generateModule(entity: any): string {
    const className = this.toPascalCase(entity.name)
    const moduleName = `${className}Module`
    const entityName = `${className}Entity`
    const serviceName = `${className}Service`
    const controllerName = `${className}Controller`

    return `import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ${entityName} } from './entities/${this.toCamelCase(entity.name)}.entity'
import { ${serviceName} } from './${this.toCamelCase(entity.name)}.service'
import { ${controllerName} } from './${this.toCamelCase(entity.name)}.controller'

@Module({
  imports: [TypeOrmModule.forFeature([${entityName}])],
  providers: [${serviceName}],
  controllers: [${controllerName}],
  exports: [${serviceName}],
})
export class ${moduleName} {}
`
  }

  generateCrudCode(model: DataModelEntity): GeneratedFile[] {
    const files: GeneratedFile[] = []

    for (const entity of model.entities) {
      const camelName = this.toCamelCase(entity.name)
      
      files.push({
        path: `src/modules/${camelName}/entities/${camelName}.entity.ts`,
        content: this.generateEntity(entity),
      })

      files.push({
        path: `src/modules/${camelName}/dto/create-${camelName}.dto.ts`,
        content: this.generateCreateDto(entity),
      })

      files.push({
        path: `src/modules/${camelName}/dto/update-${camelName}.dto.ts`,
        content: this.generateUpdateDto(entity),
      })

      files.push({
        path: `src/modules/${camelName}/${camelName}.service.ts`,
        content: this.generateService(entity),
      })

      files.push({
        path: `src/modules/${camelName}/${camelName}.controller.ts`,
        content: this.generateController(entity),
      })

      files.push({
        path: `src/modules/${camelName}/${camelName}.module.ts`,
        content: this.generateModule(entity),
      })
    }

    this.logger.log(`为数据模型 ${model.name} 生成了 ${files.length} 个CRUD文件`)
    return files
  }
}
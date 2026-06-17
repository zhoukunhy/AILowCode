/**
 * 后端代码生成器
 * 生成 NestJS 接口代码和 PostgreSQL 建表 SQL
 */
import type { PageSchema } from '@ai-lowcode/lang-ai-core'
import { GeneratedFile, TableDefinition, ApiEndpoint } from './types'
import { ASTParser } from './ASTParser'

export class BackendGenerator {
  private parser: ASTParser
  private tables: TableDefinition[] = []
  private endpoints: ApiEndpoint[] = []

  constructor(schema: PageSchema) {
    this.parser = new ASTParser(schema)
    this.parseSchema()
  }

  /**
   * 解析 Schema 提取表和接口定义
   */
  private parseSchema(): void {
    const result = this.parser.parse()
    this.tables = result.tables
    
    // 为每个表生成 CRUD 接口
    for (const table of this.tables) {
      this.endpoints.push(...this.generateEndpointsForTable(table))
    }
  }

  /**
   * 为表生成 CRUD 接口
   */
  private generateEndpointsForTable(table: TableDefinition): ApiEndpoint[] {
    const modelName = this.toPascalCase(table.name.slice(0, -1)) // 移除末尾的 's'
    
    return [
      {
        path: `/${table.name}`,
        method: 'GET',
        controllerName: `${modelName}Controller`,
        actionName: 'findAll',
        responseType: `Array<${modelName}>`,
      },
      {
        path: `/${table.name}/:id`,
        method: 'GET',
        controllerName: `${modelName}Controller`,
        actionName: 'findOne',
        responseType: modelName,
      },
      {
        path: `/${table.name}`,
        method: 'POST',
        controllerName: `${modelName}Controller`,
        actionName: 'create',
        responseType: modelName,
        requestType: `Create${modelName}Dto`,
      },
      {
        path: `/${table.name}/:id`,
        method: 'PUT',
        controllerName: `${modelName}Controller`,
        actionName: 'update',
        responseType: modelName,
        requestType: `Update${modelName}Dto`,
      },
      {
        path: `/${table.name}/:id`,
        method: 'DELETE',
        controllerName: `${modelName}Controller`,
        actionName: 'remove',
        responseType: 'void',
      },
    ]
  }

  /**
   * 生成完整的后端项目
   */
  generate(): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // 生成 SQL 建表语句
    files.push(this.generateSQL())

    // 生成 package.json
    files.push(this.generatePackageJson())

    // 生成 tsconfig.json
    files.push(this.generateTsConfig())

    // 生成 nest-cli.json
    files.push(this.generateNestCliJson())

    // 生成主应用文件
    files.push(this.generateMain())

    // 生成 AppModule
    files.push(this.generateAppModule())

    // 生成数据库配置
    files.push(this.generateConfig())

    // 为每个表生成模块、控制器、服务、实体、DTO
    for (const table of this.tables) {
      files.push(...this.generateTableModule(table))
    }

    return files
  }

  /**
   * 生成 SQL 建表语句
   */
  private generateSQL(): GeneratedFile {
    const sqlStatements: string[] = []

    for (const table of this.tables) {
      sqlStatements.push(this.generateCreateTableSQL(table))
    }

    return {
      path: 'database/init.sql',
      content: `-- 自动生成的数据库初始化脚本
-- 生成时间: ${new Date().toISOString()}

${sqlStatements.join('\n\n')}`,
    }
  }

  /**
   * 生成单个表的创建语句
   */
  private generateCreateTableSQL(table: TableDefinition): string {
    const columnDefinitions = table.columns.map(col => {
      let def = `"${col.name}" ${col.type}`
      if (!col.nullable) def += ' NOT NULL'
      if (col.default) def += ` DEFAULT ${col.default}`
      if (col.autoIncrement) def += ' AUTO_INCREMENT'
      return def
    })

    const constraintDefinitions = table.constraints.map(c => {
      switch (c.type) {
        case 'primary':
          return `PRIMARY KEY (${c.columnNames.map(n => `"${n}"`).join(', ')})`
        case 'unique':
          return `UNIQUE (${c.columnNames.map(n => `"${n}"`).join(', ')})`
        case 'foreign':
          return `FOREIGN KEY (${c.columnNames.map(n => `"${n}"`).join(', ')}) 
            REFERENCES ${c.referencedTable}(${c.referencedColumn})`
        case 'index':
          return `INDEX idx_${table.name}_${c.columnNames.join('_')} (${c.columnNames.map(n => `"${n}"`).join(', ')})`
        default:
          return ''
      }
    }).filter(Boolean)

    const allDefinitions = [...columnDefinitions, ...constraintDefinitions]

    return `CREATE TABLE IF NOT EXISTS "${table.name}" (
  ${allDefinitions.join(',\n  ')}
);`
  }

  /**
   * 生成 package.json
   */
  private generatePackageJson(): GeneratedFile {
    return {
      path: 'package.json',
      content: `{
  "name": "backend",
  "version": "1.0.0",
  "description": "Auto-generated NestJS backend",
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
`,
    }
  }

  /**
   * 生成 tsconfig.json
   */
  private generateTsConfig(): GeneratedFile {
    return {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
`,
    }
  }

  /**
   * 生成 nest-cli.json
   */
  private generateNestCliJson(): GeneratedFile {
    return {
      path: 'nest-cli.json',
      content: `{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
`,
    }
  }

  /**
   * 生成 main.ts
   */
  private generateMain(): GeneratedFile {
    return {
      path: 'src/main.ts',
      content: `import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.useGlobalPipes(new ValidationPipe())
  app.enableCors()
  
  await app.listen(3000)
  console.log('Application is running on: http://localhost:3000')
}

bootstrap()
`,
    }
  }

  /**
   * 生成 AppModule
   */
  private generateAppModule(): GeneratedFile {
    const moduleImports = this.tables.map(t => {
      const modelName = this.toPascalCase(t.name.slice(0, -1))
      return `${modelName}Module`
    })

    return {
      path: 'src/app.module.ts',
      content: `import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
${moduleImports.map(m => `import { ${m} } from './modules/${m.toLowerCase()}'`).join('\n')}

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'example',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
${moduleImports.map(m => `    ${m},`).join('\n')}
  ],
})
export class AppModule {}
`,
    }
  }

  /**
   * 生成配置文件
   */
  private generateConfig(): GeneratedFile {
    return {
      path: '.env',
      content: `DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=example
`,
    }
  }

  /**
   * 为单个表生成完整模块
   */
  private generateTableModule(table: TableDefinition): GeneratedFile[] {
    const modelName = this.toPascalCase(table.name.slice(0, -1))
    const files: GeneratedFile[] = []

    // 生成实体
    files.push(this.generateEntity(table, modelName))

    // 生成 DTO
    files.push(this.generateCreateDto(table, modelName))
    files.push(this.generateUpdateDto(table, modelName))

    // 生成服务
    files.push(this.generateService(table, modelName))

    // 生成控制器
    files.push(this.generateController(table, modelName))

    // 生成模块
    files.push(this.generateModule(table, modelName))

    return files
  }

  /**
   * 生成实体类
   */
  private generateEntity(table: TableDefinition, modelName: string): GeneratedFile {
    const columns = table.columns.map(col => {
      const decoratorProps: string[] = []
      if (col.primary) {
        decoratorProps.push('{ primary: true }')
      }
      if (col.nullable) {
        decoratorProps.push('{ nullable: true }')
      }
      if (col.autoIncrement) {
        decoratorProps.push('{ generated: true }')
      }
      const decorator = decoratorProps.length > 0 
        ? `@Column(${decoratorProps.join(', ')})`
        : '@Column()'
      return `  ${decorator}\n  ${col.name}: ${this.mapSqlType(col.type)}`
    }).join('\n\n')

    return {
      path: `src/modules/${modelName.toLowerCase()}/${modelName.toLowerCase()}.entity.ts`,
      content: `import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('${table.name}')
export class ${modelName} {
${columns}
}
`,
    }
  }

  /**
   * 生成 Create DTO
   */
  private generateCreateDto(table: TableDefinition, modelName: string): GeneratedFile {
    const columns = table.columns
      .filter(col => !col.primary && !col.autoIncrement)
      .map(col => {
        const validators = []
        if (!col.nullable) {
          validators.push('@IsNotEmpty()')
        }
        switch (col.type.toLowerCase()) {
          case 'varchar':
          case 'text':
            validators.push('@IsString()')
            break
          case 'integer':
          case 'float':
            validators.push('@IsNumber()')
            break
          case 'boolean':
            validators.push('@IsBoolean()')
            break
          case 'date':
          case 'timestamp':
            validators.push('@IsDate()')
            break
        }
        return `${validators.join('\n  ')}\n  ${col.name}: ${this.mapSqlType(col.type)}`
      }).join('\n\n')

    return {
      path: `src/modules/${modelName.toLowerCase()}/dto/create-${modelName.toLowerCase()}.dto.ts`,
      content: `import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator'

export class Create${modelName}Dto {
${columns}
}
`,
    }
  }

  /**
   * 生成 Update DTO
   */
  private generateUpdateDto(_table: TableDefinition, modelName: string): GeneratedFile {
    return {
      path: `src/modules/${modelName.toLowerCase()}/dto/update-${modelName.toLowerCase()}.dto.ts`,
      content: `import { PartialType } from '@nestjs/mapped-types'
import { Create${modelName}Dto } from './create-${modelName.toLowerCase()}.dto'

export class Update${modelName}Dto extends PartialType(Create${modelName}Dto) {}
`,
    }
  }

  /**
   * 生成服务类
   */
  private generateService(_table: TableDefinition, modelName: string): GeneratedFile {
    return {
      path: `src/modules/${modelName.toLowerCase()}/${modelName.toLowerCase()}.service.ts`,
      content: `import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ${modelName} } from './${modelName.toLowerCase()}.entity'
import { Create${modelName}Dto } from './dto/create-${modelName.toLowerCase()}.dto'
import { Update${modelName}Dto } from './dto/update-${modelName.toLowerCase()}.dto'

@Injectable()
export class ${modelName}Service {
  constructor(
    @InjectRepository(${modelName})
    private readonly ${modelName.toLowerCase()}Repository: Repository<${modelName}>,
  ) {}

  async create(createDto: Create${modelName}Dto): Promise<${modelName}> {
    const entity = this.${modelName.toLowerCase()}Repository.create(createDto)
    return this.${modelName.toLowerCase()}Repository.save(entity)
  }

  async findAll(): Promise<${modelName}[]> {
    return this.${modelName.toLowerCase()}Repository.find()
  }

  async findOne(id: number): Promise<${modelName}> {
    const entity = await this.${modelName.toLowerCase()}Repository.findOneBy({ id })
    if (!entity) {
      throw new NotFoundException(\`${modelName} with ID \${id} not found\`)
    }
    return entity
  }

  async update(id: number, updateDto: Update${modelName}Dto): Promise<${modelName}> {
    await this.findOne(id)
    await this.${modelName.toLowerCase()}Repository.update(id, updateDto)
    return this.findOne(id)
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id)
    await this.${modelName.toLowerCase()}Repository.remove(entity)
  }
}
`,
    }
  }

  /**
   * 生成控制器
   */
  private generateController(table: TableDefinition, modelName: string): GeneratedFile {
    return {
      path: `src/modules/${modelName.toLowerCase()}/${modelName.toLowerCase()}.controller.ts`,
      content: `import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common'
import { ${modelName}Service } from './${modelName.toLowerCase()}.service'
import { Create${modelName}Dto } from './dto/create-${modelName.toLowerCase()}.dto'
import { Update${modelName}Dto } from './dto/update-${modelName.toLowerCase()}.dto'

@Controller('${table.name}')
export class ${modelName}Controller {
  constructor(private readonly ${modelName.toLowerCase()}Service: ${modelName}Service) {}

  @Post()
  create(@Body() createDto: Create${modelName}Dto) {
    return this.${modelName.toLowerCase()}Service.create(createDto)
  }

  @Get()
  findAll() {
    return this.${modelName.toLowerCase()}Service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.${modelName.toLowerCase()}Service.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Update${modelName}Dto,
  ) {
    return this.${modelName.toLowerCase()}Service.update(id, updateDto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.${modelName.toLowerCase()}Service.remove(id)
  }
}
`,
    }
  }

  /**
   * 生成模块
   */
  private generateModule(_table: TableDefinition, modelName: string): GeneratedFile {
    return {
      path: `src/modules/${modelName.toLowerCase()}/${modelName.toLowerCase()}.module.ts`,
      content: `import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ${modelName}Controller } from './${modelName.toLowerCase()}.controller'
import { ${modelName}Service } from './${modelName.toLowerCase()}.service'
import { ${modelName} } from './${modelName.toLowerCase()}.entity'

@Module({
  imports: [TypeOrmModule.forFeature([${modelName}])],
  controllers: [${modelName}Controller],
  providers: [${modelName}Service],
})
export class ${modelName}Module {}
`,
    }
  }

  /**
   * 映射 SQL 类型到 TypeScript 类型
   */
  private mapSqlType(sqlType: string): string {
    const typeMap: Record<string, string> = {
      'serial': 'number',
      'integer': 'number',
      'float': 'number',
      'varchar': 'string',
      'text': 'string',
      'boolean': 'boolean',
      'date': 'Date',
      'timestamp': 'Date',
    }
    
    for (const [key, value] of Object.entries(typeMap)) {
      if (sqlType.toLowerCase().includes(key)) {
        return value
      }
    }
    
    return 'string'
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }
}

/**
 * 创建后端代码生成器
 */
export function createBackendGenerator(schema: PageSchema): BackendGenerator {
  return new BackendGenerator(schema)
}

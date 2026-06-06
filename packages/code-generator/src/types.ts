/**
 * 代码生成引擎类型定义
 */

/**
 * 生成选项
 */
export interface GenerateOptions {
  framework: 'react' | 'vue' | 'angular'
  language: 'typescript' | 'javascript'
  style: 'css' | 'scss' | 'less'
}

/**
 * 数据源绑定信息
 */
export interface DataSourceBinding {
  sourceType: 'api' | 'database' | 'state' | 'props'
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  modelName?: string
  fieldMapping?: Record<string, string>
}

/**
 * AST 节点类型
 */
export type ASTNodeType = 
  | 'Program'
  | 'ImportDeclaration'
  | 'ClassDeclaration'
  | 'FunctionDeclaration'
  | 'VariableDeclaration'
  | 'JSXElement'
  | 'ExpressionStatement'
  | 'ReturnStatement'

/**
 * AST 节点
 */
export interface ASTNode {
  type: ASTNodeType
  children?: ASTNode[]
  attributes?: Record<string, any>
  value?: string | number | boolean
  name?: string
}

/**
 * 生成的文件
 */
export interface GeneratedFile {
  path: string
  content: string
}

/**
 * 生成的项目结构
 */
export interface GeneratedProject {
  name: string
  files: GeneratedFile[]
  type: 'frontend' | 'backend' | 'fullstack'
}

/**
 * 数据库表定义
 */
export interface TableDefinition {
  name: string
  columns: ColumnDefinition[]
  constraints: ConstraintDefinition[]
}

export interface ColumnDefinition {
  name: string
  type: string
  nullable: boolean
  default?: string
  primary: boolean
  autoIncrement?: boolean
}

export interface ConstraintDefinition {
  type: 'primary' | 'foreign' | 'unique' | 'index'
  columnNames: string[]
  referencedTable?: string
  referencedColumn?: string
}

/**
 * 后端接口定义
 */
export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  controllerName: string
  actionName: string
  responseType: string
  requestType?: string
}

/**
 * React 组件配置
 */
export interface ReactComponentConfig {
  name: string
  props: ComponentProp[]
  state: ComponentState[]
  imports: ImportStatement[]
  hooks: HookUsage[]
}

export interface ComponentProp {
  name: string
  type: string
  required: boolean
}

export interface ComponentState {
  name: string
  type: string
  initialValue: string
}

export interface ImportStatement {
  module: string
  namedImports?: string[]
  defaultImport?: string
}

export interface HookUsage {
  name: string
  importsFrom: string
  args: string[]
}

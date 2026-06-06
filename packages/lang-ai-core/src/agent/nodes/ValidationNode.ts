/**
 * 节点 4：结果校验
 * 校验生成的 Schema 格式是否正确，并进行自检修正
 */
import { AgentState, ValidationResult, ValidationError, ValidationWarning, PageSchema, ComponentSchema } from './types'
import { StateUpdate } from './LangGraphState'

export interface ValidationNodeConfig {
  strictMode?: boolean
  allowedComponents?: string[]
}

/**
 * 创建校验节点
 */
export function createValidationNode(config: ValidationNodeConfig = {}) {
  return {
    name: 'validation' as const,
    
    handler: async (state: AgentState): Promise<StateUpdate> => {
      const startTime = Date.now()
      const log: any = {
        node: 'validation',
        timestamp: new Date(),
        input: {
          schemaResult: state.schemaResult ? {
            componentCount: state.schemaResult.pageSchema.children?.length || 0,
          } : null,
        },
      }

      try {
        if (!state.schemaResult?.pageSchema) {
          throw new Error('Schema 生成结果为空')
        }

        // 执行校验
        const validationResult = validateSchema(
          state.schemaResult.pageSchema,
          config
        )

        // 如果校验失败且有错误，尝试自动修正
        let finalSchema = state.schemaResult.pageSchema
        if (!validationResult.isValid && config.strictMode !== false) {
          finalSchema = autoCorrectSchema(state.schemaResult.pageSchema, validationResult.errors)
          
          // 重新校验修正后的 Schema
          const reValidation = validateSchema(finalSchema, config)
          validationResult.isValid = reValidation.isValid
          validationResult.errors = reValidation.errors
          validationResult.warnings = [...validationResult.warnings, ...reValidation.warnings]
          validationResult.correctedSchema = finalSchema
        }

        log.output = {
          isValid: validationResult.isValid,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings.length,
        }
        log.duration = Date.now() - startTime

        return {
          validationResult,
          finalSchema: validationResult.correctedSchema || finalSchema,
          currentNode: 'end',
          status: validationResult.isValid ? 'completed' : 'completed', // 即使有错误也完成
          logs: [...state.logs, log],
        }
      } catch (error: any) {
        log.error = error.message
        log.duration = Date.now() - startTime

        return {
          error: `Schema 校验失败: ${error.message}`,
          validationResult: {
            isValid: false,
            errors: [{ path: '', message: error.message, severity: 'error' }],
            warnings: [],
          },
          currentNode: 'end',
          status: 'failed',
          logs: [...state.logs, log],
        }
      }
    },
  }
}

/**
 * 校验 Schema
 */
function validateSchema(
  schema: PageSchema,
  config: ValidationNodeConfig
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 基础结构校验
  if (!schema) {
    errors.push({ path: 'root', message: 'Schema 不能为空', severity: 'error' })
    return { isValid: false, errors, warnings }
  }

  if (!schema.name && !schema.config?.title) {
    errors.push({ path: 'name', message: '页面名称不能为空', severity: 'error' })
  }

  if (schema.type !== 'page') {
    errors.push({ path: 'type', message: '根节点类型必须为 page', severity: 'error' })
  }

  // 组件校验
  if (!schema.children || !Array.isArray(schema.children)) {
    errors.push({ path: 'children', message: 'children 必须为数组', severity: 'error' })
  } else {
    validateComponents(schema.children, '', errors, warnings, config)
  }

  // 检查组件库白名单
  if (config.allowedComponents && config.allowedComponents.length > 0) {
    const usedComponents = extractAllComponentTypes(schema.children || [])
    for (const compType of usedComponents) {
      if (!config.allowedComponents.includes(compType)) {
        warnings.push({
          path: 'components',
          message: `组件 "${compType}" 不在白名单中，可能不被支持`,
          severity: 'warning',
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 递归校验组件
 */
function validateComponents(
  components: ComponentSchema[],
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  config: ValidationNodeConfig
): void {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i]
    const compPath = `${path}/children[${i}]`

    // 必填字段校验
    if (!comp.id) {
      errors.push({ path: `${compPath}/id`, message: `组件缺少 id`, severity: 'error' })
    }

    if (!comp.type) {
      errors.push({ path: `${compPath}/type`, message: `组件缺少 type`, severity: 'error' })
    }

    // ID 唯一性校验
    const ids = new Set<string>()
    collectIds(components, ids)
    if (comp.id && ids.has(comp.id)) {
      const count = components.filter(c => c.id === comp.id).length
      if (count > 1) {
        errors.push({
          path: `${compPath}/id`,
          message: `组件 id "${comp.id}" 不唯一`,
          severity: 'error',
        })
      }
    }

    // 递归校验子组件
    if (comp.children && Array.isArray(comp.children)) {
      validateComponents(comp.children, compPath, errors, warnings, config)
    }
  }
}

/**
 * 收集所有 ID
 */
function collectIds(components: ComponentSchema[], ids: Set<string>): void {
  for (const comp of components) {
    if (comp.id) {
      ids.add(comp.id)
    }
    if (comp.children) {
      collectIds(comp.children, ids)
    }
  }
}

/**
 * 提取所有组件类型
 */
function extractAllComponentTypes(components: ComponentSchema[]): string[] {
  const types = new Set<string>()
  
  function traverse(comps: ComponentSchema[]) {
    for (const comp of comps) {
      if (comp.type) {
        types.add(comp.type)
      }
      if (comp.children) {
        traverse(comp.children)
      }
    }
  }

  traverse(components)
  return Array.from(types)
}

/**
 * 自动修正 Schema
 */
function autoCorrectSchema(schema: PageSchema, errors: ValidationError[]): PageSchema {
  const corrected = JSON.parse(JSON.stringify(schema)) as PageSchema

  // 修正缺失的 ID
  let idCounter = Date.now()
  function assignIds(components: ComponentSchema[]) {
    for (const comp of components) {
      if (!comp.id) {
        comp.id = `comp-${idCounter++}`
      }
      if (comp.children) {
        assignIds(comp.children)
      }
    }
  }
  
  if (corrected.children) {
    assignIds(corrected.children)
  }

  // 修正缺失的名称
  if (!corrected.name) {
    corrected.name = corrected.config?.title || 'AI 生成页面'
  }

  // 修正类型
  if (!corrected.type) {
    corrected.type = 'page'
  }

  return corrected
}

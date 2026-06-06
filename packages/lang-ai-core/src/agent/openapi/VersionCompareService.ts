/**
 * 页面版本对比服务 - AI 分析版本差异并给出优化建议
 */

import type {
  PageVersionSnapshot,
  VersionComparison,
  VersionDifference,
  VersionSuggestion,
  VersionAnalysis,
  AIOptimizationSuggestion,
} from './OpenAPITypes'

/**
 * 版本对比服务配置
 */
export interface VersionCompareConfig {
  aiEnabled: boolean
  aiModel?: string
  aiTemperature?: number
}

/**
 * 版本对比服务
 */
export class VersionCompareService {
  private config: VersionCompareConfig

  constructor(config: VersionCompareConfig = { aiEnabled: true }) {
    this.config = config
  }

  /**
   * 对比两个页面版本
   */
  async compare(
    versionFrom: PageVersionSnapshot,
    versionTo: PageVersionSnapshot
  ): Promise<VersionComparison> {
    console.log(`[VersionCompareService] 开始对比版本: ${versionFrom.version} -> ${versionTo.version}`)

    // 1. 检测差异
    const differences = this.detectDifferences(versionFrom.pageSchema, versionTo.pageSchema)

    // 2. 生成 AI 建议
    const suggestions = await this.generateSuggestions(differences)

    // 3. 执行分析
    const analysis = this.analyzeChanges(differences)

    const comparison: VersionComparison = {
      id: `compare-${Date.now()}`,
      versionFrom: versionFrom.version,
      versionTo: versionTo.version,
      differences,
      suggestions,
      analysis,
    }

    console.log(`[VersionCompareService] 对比完成，共 ${differences.length} 处差异`)

    return comparison
  }

  /**
   * 检测两个 schema 之间的差异
   */
  private detectDifferences(schemaFrom: any, schemaTo: any): VersionDifference[] {
    const differences: VersionDifference[] = []
    const visited = new Set<string>()

    this.compareRecursive(schemaFrom, schemaTo, '', differences, visited)

    return differences
  }

  /**
   * 递归对比
   */
  private compareRecursive(
    from: any,
    to: any,
    path: string,
    differences: VersionDifference[],
    visited: Set<string>
  ): void {
    const key = `${path}-${JSON.stringify(from)}-${JSON.stringify(to)}`
    if (visited.has(key)) return
    visited.add(key)

    // 处理 undefined/null
    if (from === undefined && to !== undefined) {
      differences.push({
        id: `diff-${differences.length + 1}`,
        type: 'addition',
        path,
        componentId: this.extractComponentId(path),
        description: `新增属性 ${path.split('.').pop()}`,
        newValue: to,
        severity: this.assessSeverity('addition', to),
      })
      return
    }

    if (to === undefined && from !== undefined) {
      differences.push({
        id: `diff-${differences.length + 1}`,
        type: 'removal',
        path,
        componentId: this.extractComponentId(path),
        description: `删除属性 ${path.split('.').pop()}`,
        oldValue: from,
        severity: this.assessSeverity('removal', from),
      })
      return
    }

    // 类型不同
    if (typeof from !== typeof to) {
      differences.push({
        id: `diff-${differences.length + 1}`,
        type: 'modification',
        path,
        componentId: this.extractComponentId(path),
        description: `类型变更: ${typeof from} -> ${typeof to}`,
        oldValue: from,
        newValue: to,
        severity: 'medium',
      })
      return
    }

    // 基本类型对比
    if (typeof from !== 'object' || from === null) {
      if (from !== to) {
        differences.push({
          id: `diff-${differences.length + 1}`,
          type: 'modification',
          path,
          componentId: this.extractComponentId(path),
          description: `值变更: ${JSON.stringify(from)} -> ${JSON.stringify(to)}`,
          oldValue: from,
          newValue: to,
          severity: this.assessSeverity('modification', { from, to }),
        })
      }
      return
    }

    // 对象/数组对比
    const keys = new Set([...Object.keys(from), ...Object.keys(to)])

    for (const key of keys) {
      const newPath = path ? `${path}.${key}` : key
      this.compareRecursive(from[key], to[key], newPath, differences, visited)
    }
  }

  /**
   * 从路径中提取组件 ID
   */
  private extractComponentId(path: string): string {
    const parts = path.split('.')
    for (const part of parts) {
      if (part.startsWith('comp-') || part.startsWith('component-')) {
        return part
      }
    }
    return 'unknown'
  }

  /**
   * 评估变更严重程度
   */
  private assessSeverity(type: string, value: any): VersionDifference['severity'] {
    if (type === 'removal') {
      // 删除核心属性更严重
      const criticalProps = ['id', 'type', 'dataSource', 'required']
      if (typeof value === 'string' && criticalProps.includes(value)) {
        return 'critical'
      }
      if (typeof value === 'object' && value !== null) {
        return 'high'
      }
    }

    if (type === 'modification') {
      if (value.from === true && value.to === false) {
        return 'high' // 从必需变为非必需
      }
      if (typeof value.from === 'string' && typeof value.to === 'string') {
        if (value.from !== value.to) {
          return 'medium'
        }
      }
    }

    return 'low'
  }

  /**
   * 生成 AI 优化建议
   */
  private async generateSuggestions(differences: VersionDifference[]): Promise<VersionSuggestion[]> {
    if (!this.config.aiEnabled) {
      return differences.map((diff) => ({
        id: `suggestion-${diff.id}`,
        differenceId: diff.id,
        action: 'manual',
        description: `需要手动审查此变更: ${diff.description}`,
        automated: false,
      }))
    }

    // 模拟 AI 分析过程
    const suggestions: VersionSuggestion[] = []

    for (const diff of differences) {
      const suggestion = await this.analyzeDifferenceWithAI(diff)
      suggestions.push(suggestion)
    }

    return suggestions
  }

  /**
   * 使用 AI 分析单个差异
   */
  private async analyzeDifferenceWithAI(diff: VersionDifference): Promise<VersionSuggestion> {
    // 模拟 AI 分析
    const suggestions: Record<string, () => VersionSuggestion> = {
      addition: () => ({
        id: `suggestion-${diff.id}`,
        differenceId: diff.id,
        action: 'accept',
        description: `建议接受新增的 ${diff.path}，这可能是一个新功能或改进`,
        automated: true,
      }),
      removal: () => ({
        id: `suggestion-${diff.id}`,
        differenceId: diff.id,
        action: 'review',
        description: `建议仔细审查删除的 ${diff.path}，确保不会影响现有功能`,
        automated: false,
      }),
      modification: () => {
        const isTypeChange = typeof diff.oldValue !== typeof diff.newValue
        if (isTypeChange) {
          return {
            id: `suggestion-${diff.id}`,
            differenceId: diff.id,
            action: 'validate',
            description: `类型变更需要验证数据兼容性，建议检查相关代码`,
            automated: false,
          }
        }
        return {
          id: `suggestion-${diff.id}`,
          differenceId: diff.id,
          action: 'accept',
          description: `值变更可以安全接受`,
          automated: true,
        }
      },
      move: () => ({
        id: `suggestion-${diff.id}`,
        differenceId: diff.id,
        action: 'update',
        description: `组件位置变更，建议更新相关引用`,
        automated: false,
      }),
    }

    const fn = suggestions[diff.type] || suggestions.modification
    return fn()
  }

  /**
   * 分析变更统计
   */
  private analyzeChanges(differences: VersionDifference[]): VersionAnalysis {
    const analysis: VersionAnalysis = {
      totalChanges: differences.length,
      additions: differences.filter((d) => d.type === 'addition').length,
      removals: differences.filter((d) => d.type === 'removal').length,
      modifications: differences.filter((d) => d.type === 'modification').length,
      criticalChanges: differences.filter((d) => d.severity === 'critical').length,
      codeQualityImprovement: false,
      performanceImprovement: false,
      breakingChanges: false,
    }

    // 判断是否有重大变更
    analysis.breakingChanges = analysis.criticalChanges > 0

    // 判断代码质量是否提升（简单判断：新增多于删除）
    analysis.codeQualityImprovement = analysis.additions > analysis.removals

    // 判断性能是否提升（简单判断：删除可能减少复杂度）
    analysis.performanceImprovement = analysis.removals > 0

    return analysis
  }

  /**
   * 获取 AI 优化建议
   */
  async getAIOptimizationSuggestions(schema: any): Promise<AIOptimizationSuggestion[]> {
    if (!this.config.aiEnabled) {
      return []
    }

    // 模拟 AI 代码优化分析
    const suggestions: AIOptimizationSuggestion[] = []

    // 检查组件配置
    const components = schema.components || []
    for (const component of components) {
      // 检查是否有重复的 dataSource 配置
      const dsCount = components.filter((c: any) => c.props?.dataSource === component.props?.dataSource).length
      if (dsCount > 1) {
        suggestions.push({
          id: `opt-${suggestions.length + 1}`,
          category: 'maintainability',
          severity: 'medium',
          description: '发现重复的数据源配置，建议提取为共享配置',
          oldCode: JSON.stringify(component.props, null, 2),
          suggestedCode: this.generateSharedDataSourceConfig(component.props),
          explanation: '将重复的数据源配置提取到公共配置中，可以减少代码冗余，提高可维护性',
        })
      }

      // 检查是否有未使用的属性
      if (component.props?.deprecated) {
        suggestions.push({
          id: `opt-${suggestions.length + 1}`,
          category: 'bestPractice',
          severity: 'low',
          description: '发现使用了已废弃的属性',
          oldCode: JSON.stringify(component.props, null, 2),
          suggestedCode: this.removeDeprecatedProps(component.props),
          explanation: '移除已废弃的属性可以提高代码质量，避免使用过时的 API',
        })
      }
    }

    return suggestions
  }

  /**
   * 生成共享数据源配置
   */
  private generateSharedDataSourceConfig(props: any): string {
    const simplified = { ...props }
    delete simplified.dataSource
    return JSON.stringify(simplified, null, 2)
  }

  /**
   * 移除废弃属性
   */
  private removeDeprecatedProps(props: any): string {
    const cleaned = { ...props }
    delete cleaned.deprecated
    return JSON.stringify(cleaned, null, 2)
  }

  /**
   * 创建版本快照
   */
  createSnapshot(pageId: string, version: string, pageSchema: any, metadata?: any): PageVersionSnapshot {
    return {
      id: `snapshot-${Date.now()}`,
      pageId,
      version,
      timestamp: new Date(),
      pageSchema,
      metadata: metadata || {},
    }
  }

  /**
   * 获取版本变更摘要
   */
  getChangeSummary(comparison: VersionComparison): string {
    const { analysis, differences } = comparison
    const summaryParts: string[] = []

    summaryParts.push(`版本变更: ${comparison.versionFrom} -> ${comparison.versionTo}`)
    summaryParts.push(`总变更数: ${analysis.totalChanges}`)
    summaryParts.push(`- 新增: ${analysis.additions}`)
    summaryParts.push(`- 删除: ${analysis.removals}`)
    summaryParts.push(`- 修改: ${analysis.modifications}`)

    if (analysis.criticalChanges > 0) {
      summaryParts.push(`⚠️  重大变更: ${analysis.criticalChanges}`)
    }

    if (analysis.breakingChanges) {
      summaryParts.push(`⚠️  存在破坏性变更`)
    }

    // 添加重要变更详情
    const importantChanges = differences.filter((d) => d.severity === 'critical' || d.severity === 'high')
    if (importantChanges.length > 0) {
      summaryParts.push('\n重要变更:')
      importantChanges.forEach((change) => {
        summaryParts.push(`- [${change.severity.toUpperCase()}] ${change.description}`)
      })
    }

    return summaryParts.join('\n')
  }
}

/**
 * 创建版本对比服务
 */
export function createVersionCompareService(config?: VersionCompareConfig): VersionCompareService {
  return new VersionCompareService(config)
}

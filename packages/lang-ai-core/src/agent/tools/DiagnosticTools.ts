/**
 * 诊断工具集
 * 提供性能分析和无障碍检查功能
 */

import { z } from 'zod'

// ==================== 工具输入/输出 Schema ====================

/**
 * 性能分析工具 Schema
 */
export const AnalyzePerformanceInputSchema = z.object({
  pageUrl: z.string().describe('页面 URL'),
  thresholds: z.object({
    lcp: z.number().optional().default(2.5).describe('LCP 阈值（秒）'),
    fid: z.number().optional().default(100).describe('FID 阈值（毫秒）'),
    cls: z.number().optional().default(0.1).describe('CLS 阈值'),
    fcp: z.number().optional().default(1.8).describe('FCP 阈值（秒）'),
  }).optional().describe('性能阈值'),
  includeMetrics: z.array(z.enum(['lcp', 'fid', 'cls', 'fcp', 'ttfb', 'tbt'])).optional().describe('要分析的指标'),
})

export type AnalyzePerformanceInput = z.infer<typeof AnalyzePerformanceInputSchema>

export interface PerformanceMetrics {
  lcp?: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor' }
  fid?: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor' }
  cls?: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor' }
  fcp?: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor' }
  ttfb?: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor' }
  tbt?: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor' }
}

export interface AnalyzePerformanceOutput {
  success: boolean
  url: string
  metrics: PerformanceMetrics
  overallScore: 'good' | 'needs-improvement' | 'poor'
  suggestions: string[]
  message: string
}

/**
 * 无障碍检查工具 Schema
 */
export const CheckAccessibilityInputSchema = z.object({
  pageUrl: z.string().describe('页面 URL'),
  rules: z.array(z.string()).optional().describe('要检查的规则 ID'),
  levels: z.array(z.enum(['wcag2a', 'wcag2aa', 'wcag2aaa', 'best-practice'])).optional().describe('检查级别'),
})

export type CheckAccessibilityInput = z.infer<typeof CheckAccessibilityInputSchema>

export interface AccessibilityIssue {
  ruleId: string
  severity: 'critical' | 'serious' | 'moderate' | 'minor'
  message: string
  context: string
  selector: string
}

export interface CheckAccessibilityOutput {
  success: boolean
  url: string
  issues: AccessibilityIssue[]
  passed: number
  violations: number
  warnings: number
  suggestions: string[]
  message: string
}

// ==================== 工具实现 ====================

/**
 * 性能分析工具
 * 
 * 注意：当前为模拟实现阶段，生成模拟性能指标数据。
 * 后续迭代将对接 Chrome DevTools Protocol 或 Lighthouse API 进行真实性能分析。
 */
export class AnalyzePerformanceTool {
  name = 'analyzePerformance'
  description = '分析页面性能指标，包括 LCP、FID、CLS 等核心 Web Vitals'
  inputSchema = AnalyzePerformanceInputSchema

  constructor() {}

  async execute(input: AnalyzePerformanceInput): Promise<AnalyzePerformanceOutput> {
    // TODO: 对接 Chrome DevTools Protocol 或 Lighthouse API
    const { pageUrl, thresholds, includeMetrics } = input

    const defaultThresholds = {
      lcp: 2.5,
      fid: 100,
      cls: 0.1,
      fcp: 1.8,
    }

    const config = { ...defaultThresholds, ...thresholds }

    const metricsToCheck = includeMetrics || ['lcp', 'fid', 'cls', 'fcp', 'ttfb', 'tbt']

    const metrics: PerformanceMetrics = {}

    const generateMetric = (name: string, threshold: number, unit: string, min: number, max: number) => {
      const value = +(Math.random() * (max - min) + min).toFixed(3)
      let status: 'good' | 'needs-improvement' | 'poor' = 'good'
      if (value > threshold * 1.5) status = 'poor'
      else if (value > threshold) status = 'needs-improvement'
      return { value, unit, status }
    }

    if (metricsToCheck.includes('lcp')) {
      metrics.lcp = generateMetric('lcp', config.lcp!, 's', 1, 5)
    }
    if (metricsToCheck.includes('fid')) {
      metrics.fid = generateMetric('fid', config.fid!, 'ms', 30, 300)
    }
    if (metricsToCheck.includes('cls')) {
      metrics.cls = generateMetric('cls', config.cls!, '', 0, 1)
    }
    if (metricsToCheck.includes('fcp')) {
      metrics.fcp = generateMetric('fcp', config.fcp!, 's', 0.5, 4)
    }
    if (metricsToCheck.includes('ttfb')) {
      metrics.ttfb = generateMetric('ttfb', 800, 'ms', 100, 2000)
    }
    if (metricsToCheck.includes('tbt')) {
      metrics.tbt = generateMetric('tbt', 300, 'ms', 50, 1500)
    }

    const poorCount = Object.values(metrics).filter((m) => m?.status === 'poor').length
    const needsImprovementCount = Object.values(metrics).filter((m) => m?.status === 'needs-improvement').length

    let overallScore: 'good' | 'needs-improvement' | 'poor' = 'good'
    if (poorCount > 0) overallScore = 'poor'
    else if (needsImprovementCount > 0) overallScore = 'needs-improvement'

    const suggestions: string[] = []
    if (metrics.lcp?.status !== 'good') suggestions.push('优化首屏大图加载，使用懒加载或响应式图片')
    if (metrics.fid?.status !== 'good') suggestions.push('减少 JavaScript 执行时间，使用防抖节流')
    if (metrics.cls?.status !== 'good') suggestions.push('为图片设置固定尺寸，避免布局偏移')
    if (metrics.fcp?.status !== 'good') suggestions.push('优化首屏渲染，使用 SSR 或预渲染')

    return {
      success: true,
      url: pageUrl,
      metrics,
      overallScore,
      suggestions,
      message: `性能分析完成，整体评分: ${overallScore}`,
    }
  }
}

/**
 * 创建性能分析工具工厂函数
 */
export function createAnalyzePerformanceTool(): AnalyzePerformanceTool {
  return new AnalyzePerformanceTool()
}

/**
 * 无障碍检查工具
 * 
 * 注意：当前为模拟实现阶段，生成模拟无障碍问题数据。
 * 后续迭代将对接 axe-core 或 Lighthouse Accessibility API 进行真实检查。
 */
export class CheckAccessibilityTool {
  name = 'checkAccessibility'
  description = '检查页面无障碍合规性，检测 WCAG 标准违规项'
  inputSchema = CheckAccessibilityInputSchema

  constructor() {}

  async execute(input: CheckAccessibilityInput): Promise<CheckAccessibilityOutput> {
    // TODO: 对接 axe-core 或 Lighthouse Accessibility API
    const { pageUrl, levels } = input

    const defaultLevels = ['wcag2a', 'wcag2aa']
    const checkLevels = levels || defaultLevels

    const issues: AccessibilityIssue[] = []

    const possibleIssues = [
      {
        ruleId: 'color-contrast',
        severity: 'moderate' as const,
        message: '文本颜色对比度不足，请确保前景色与背景色对比度至少为 4.5:1',
        context: '标题文本',
        selector: 'h1, h2, p',
      },
      {
        ruleId: 'image-alt',
        severity: 'serious' as const,
        message: '图片缺少 alt 属性或 alt 属性为空',
        context: '产品图片',
        selector: 'img',
      },
      {
        ruleId: 'label-for',
        severity: 'moderate' as const,
        message: '表单标签未正确关联输入元素',
        context: '登录表单',
        selector: 'label, input',
      },
      {
        ruleId: 'link-text',
        severity: 'minor' as const,
        message: '链接文本不够明确，请避免使用"点击这里"等通用文本',
        context: '导航链接',
        selector: 'a',
      },
      {
        ruleId: 'heading-order',
        severity: 'minor' as const,
        message: '标题层级不连续，请确保 h1-h6 按顺序使用',
        context: '页面内容',
        selector: 'h1, h2, h3',
      },
    ]

    const randomCount = Math.floor(Math.random() * 4)
    for (let i = 0; i < randomCount; i++) {
      const idx = Math.floor(Math.random() * possibleIssues.length)
      issues.push(possibleIssues[idx])
    }

    const violations = issues.filter((i) => i.severity === 'critical' || i.severity === 'serious').length
    const warnings = issues.filter((i) => i.severity === 'moderate' || i.severity === 'minor').length
    const passed = 10 - issues.length

    const suggestions: string[] = []
    if (issues.some((i) => i.ruleId === 'color-contrast')) suggestions.push('使用对比度检查工具验证文本可读性')
    if (issues.some((i) => i.ruleId === 'image-alt')) suggestions.push('为所有图片添加有意义的 alt 属性')
    if (issues.some((i) => i.ruleId === 'label-for')) suggestions.push('使用 for 属性或嵌套方式关联表单标签')
    if (issues.some((i) => i.ruleId === 'link-text')) suggestions.push('使用描述性链接文本')

    return {
      success: true,
      url: pageUrl,
      issues,
      passed,
      violations,
      warnings,
      suggestions,
      message: `无障碍检查完成，发现 ${violations} 个严重问题，${warnings} 个警告`,
    }
  }
}

/**
 * 创建无障碍检查工具工厂函数
 */
export function createCheckAccessibilityTool(): CheckAccessibilityTool {
  return new CheckAccessibilityTool()
}

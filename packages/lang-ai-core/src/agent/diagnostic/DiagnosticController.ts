/**
 * 异常诊断 API 控制器
 * 提供异常诊断相关的 HTTP 接口
 */

import { Router, Request, Response } from 'express'
import { DiagnosticService, createDiagnosticService } from './DiagnosticService'
import type { 
  ErrorInfo, 
  DiagnosisResult, 
  DiagnosticServiceConfig,
  ErrorKnowledgeEntry,
  DiagnosticAgentState,
} from './DiagnosticAgentTypes'

/**
 * 创建诊断 API 路由
 */
export function createDiagnosticRouter(config: DiagnosticServiceConfig): Router {
  const router = Router()
  const service = createDiagnosticService(config)

  /**
   * POST /diagnose
   * 诊断单个错误
   */
  router.post('/diagnose', async (req: Request, res: Response) => {
    try {
      const errorInfo: ErrorInfo = req.body
      
      if (!errorInfo || !errorInfo.message) {
        res.status(400).json({
          success: false,
          error: '缺少必要的错误信息',
        })
        return
      }

      errorInfo.id = errorInfo.id || `error-${Date.now()}`
      errorInfo.timestamp = errorInfo.timestamp ? new Date(errorInfo.timestamp) : new Date()

      console.log(`[DiagnosticAPI] 收到诊断请求: ${errorInfo.id}`)

      const result: DiagnosisResult = await service.diagnose(errorInfo)

      res.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 诊断失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * POST /diagnose/batch
   * 批量诊断错误
   */
  router.post('/diagnose/batch', async (req: Request, res: Response) => {
    try {
      const { errors } = req.body as { errors: ErrorInfo[] }
      
      if (!errors || !Array.isArray(errors)) {
        res.status(400).json({
          success: false,
          error: '缺少错误列表',
        })
        return
      }

      console.log(`[DiagnosticAPI] 收到批量诊断请求: ${errors.length} 个错误`)

      const results = await service.diagnoseBatch(errors)

      res.json({
        success: true,
        data: {
          total: errors.length,
          successful: results.length,
          failed: errors.length - results.length,
          results,
        },
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 批量诊断失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * GET /diagnose/status/:sessionId
   * 获取诊断状态
   */
  router.get('/diagnose/status/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params
      
      const state = await service.getDiagnosticStatus(sessionId)

      if (!state) {
        res.status(404).json({
          success: false,
          error: '诊断任务不存在',
        })
        return
      }

      res.json({
        success: true,
        data: state,
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 获取诊断状态失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * POST /diagnose/cancel/:sessionId
   * 取消诊断任务
   */
  router.post('/diagnose/cancel/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params
      
      await service.cancelDiagnostic(sessionId)

      res.json({
        success: true,
        message: '诊断任务已取消',
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 取消诊断任务失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * GET /knowledge
   * 获取所有知识库条目
   */
  router.get('/knowledge', async (_req: Request, res: Response) => {
    try {
      const entries = service.getAllKnowledgeEntries()

      res.json({
        success: true,
        data: entries,
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 获取知识库失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * POST /knowledge
   * 添加知识库条目
   */
  router.post('/knowledge', async (req: Request, res: Response) => {
    try {
      const entry: ErrorKnowledgeEntry = req.body
      
      if (!entry.errorType || !entry.errorMessage) {
        res.status(400).json({
          success: false,
          error: '缺少必要的字段',
        })
        return
      }

      const id = await service.addToKnowledgeBase(entry)

      res.json({
        success: true,
        data: { id },
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 添加知识库条目失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * GET /knowledge/:id
   * 获取指定知识库条目
   */
  router.get('/knowledge/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const entry = service.getKnowledgeEntry(id)

      if (!entry) {
        res.status(404).json({
          success: false,
          error: '知识库条目不存在',
        })
        return
      }

      res.json({
        success: true,
        data: entry,
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 获取知识库条目失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * PUT /knowledge/:id
   * 更新知识库条目
   */
  router.put('/knowledge/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const updates: Partial<ErrorKnowledgeEntry> = req.body

      await service.updateKnowledgeEntry(id, updates)

      res.json({
        success: true,
        data: service.getKnowledgeEntry(id),
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 更新知识库条目失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * DELETE /knowledge/:id
   * 删除知识库条目
   */
  router.delete('/knowledge/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      service.deleteKnowledgeEntry(id)

      res.json({
        success: true,
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 删除知识库条目失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * GET /knowledge/search
   * 搜索知识库
   */
  router.get('/knowledge/search', async (req: Request, res: Response) => {
    try {
      const { q } = req.query as { q?: string }

      if (!q) {
        res.status(400).json({
          success: false,
          error: '缺少搜索关键词',
        })
        return
      }

      const results = service.searchKnowledgeBase(q)

      res.json({
        success: true,
        data: results,
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 搜索知识库失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * GET /statistics
   * 获取错误统计
   */
  router.get('/statistics', async (_req: Request, res: Response) => {
    try {
      const stats = service.getErrorStatistics()

      res.json({
        success: true,
        data: stats,
      })
    } catch (error: any) {
      console.error('[DiagnosticAPI] 获取统计失败:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  return router
}

/**
 * 创建诊断 API 应用
 */
export function createDiagnosticApp(config: DiagnosticServiceConfig) {
  const express = require('express')
  const app = express()
  
  app.use(express.json())
  app.use('/api/diagnostic', createDiagnosticRouter(config))

  return app
}
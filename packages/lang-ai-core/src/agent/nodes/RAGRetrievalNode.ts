/**
 * 节点 2：知识库 RAG 召回
 * 从私有知识库检索相关页面和组件规范
 */
import { AgentState, RAGRetrievalResult, RetrievedDocument } from './types'
import { StateUpdate } from './LangGraphState'
import { VectorRetrievalService } from '../rag/VectorRetrievalService'
import type { MilvusConfig, RAGConfig } from '@ai-lowcode/shared-types'

export interface RAGRetrievalNodeConfig {
  milvusConfig: MilvusConfig
  ragConfig: RAGConfig
  knowledgeBaseIds: number[]
  topK?: number
  threshold?: number
}

/**
 * 创建 RAG 召回节点
 */
export function createRAGRetrievalNode(config: RAGRetrievalNodeConfig) {
  return {
    name: 'rag_retrieval' as const,
    
    handler: async (state: AgentState): Promise<StateUpdate> => {
      const startTime = Date.now()
      const log: any = {
        node: 'rag_retrieval',
        timestamp: new Date(),
        input: {
          query: state.userInput,
          knowledgeBaseIds: config.knowledgeBaseIds,
        },
      }

      try {
        const allRetrievedDocs: RetrievedDocument[] = []
        
        // 遍历所有知识库进行检索
        for (const kbId of config.knowledgeBaseIds) {
          const retrievalService = new VectorRetrievalService(
            config.milvusConfig,
            config.ragConfig,
            `knowledge_base_${kbId}`
          )
          
          await retrievalService.initialize()
          
          // 执行检索
          const context = await retrievalService.retrieve(
            state.userInput,
            config.topK || 5,
            config.threshold || 0.6
          )

          // 转换检索结果
          const docs: RetrievedDocument[] = context.results.map((result) => ({
            id: result.id,
            content: result.content,
            source: result.metadata?.source || 'unknown',
            sourceType: result.metadata?.documentType || 'page',
            score: result.score,
            metadata: result.metadata || {},
          }))

          allRetrievedDocs.push(...docs)
        }

        // 按相关性排序
        allRetrievedDocs.sort((a, b) => b.score - a.score)

        // 计算平均相关性分数
        const avgRelevanceScore = allRetrievedDocs.length > 0
          ? allRetrievedDocs.reduce((sum, doc) => sum + doc.score, 0) / allRetrievedDocs.length
          : 0

        const ragResult: RAGRetrievalResult = {
          query: state.userInput,
          retrievedDocs: allRetrievedDocs,
          knowledgeBaseIds: config.knowledgeBaseIds,
          relevanceScore: avgRelevanceScore,
        }

        log.output = {
          docCount: allRetrievedDocs.length,
          avgRelevance: avgRelevanceScore,
        }
        log.duration = Date.now() - startTime

        return {
          ragResults: ragResult,
          currentNode: 'schema_generation',
          status: 'running',
          logs: [...state.logs, log],
        }
      } catch (error: any) {
        log.error = error.message
        log.duration = Date.now() - startTime

        return {
          error: `RAG 召回失败: ${error.message}`,
          currentNode: 'end',
          status: 'failed',
          logs: [...state.logs, log],
        }
      }
    },
  }
}

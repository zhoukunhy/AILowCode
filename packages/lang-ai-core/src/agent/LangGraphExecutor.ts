/**
 * LangGraph 图执行器
 * 管理节点执行和状态流转，支持条件路由和循环重试
 */

import { AgentState, AgentNodeName } from './types'
import { GraphNode, GraphEdge, StateUpdate } from './LangGraphState'

export class LangGraphExecutor {
  private nodes: Map<AgentNodeName, GraphNode>
  private edges: GraphEdge[]
  private entryPoint: AgentNodeName
  private maxRetries: number

  constructor(nodes: GraphNode[], edges: GraphEdge[], entryPoint: AgentNodeName, maxRetries: number = 3) {
    this.nodes = new Map(nodes.map(n => [n.name, n]))
    this.edges = edges
    this.entryPoint = entryPoint
    this.maxRetries = maxRetries
  }

  /**
   * 执行图
   */
  async execute(initialState: AgentState): Promise<AgentState> {
    let currentState = { ...initialState }
    let currentNode = this.entryPoint
    
    // 记录每个节点的重试次数
    const retryCount = new Map<AgentNodeName, number>()
    const visitedPath: AgentNodeName[] = []

    // 最大执行步数，防止无限循环
    const maxSteps = 20
    let step = 0

    while (currentNode !== 'end' && step < maxSteps) {
      step++
      
      // 记录访问路径
      visitedPath.push(currentNode)

      // 检查重试次数
      const currentRetries = retryCount.get(currentNode) || 0
      if (currentRetries >= this.maxRetries) {
        console.warn(`节点重试次数已达上限: ${currentNode}`)
        currentState.error = `${currentNode} 执行重试次数已达上限 (${this.maxRetries})`
        currentState.status = 'failed'
        break
      }

      // 获取节点
      const node = this.nodes.get(currentNode)
      if (!node) {
        console.error(`节点未找到: ${currentNode}`)
        currentState.error = `节点未找到: ${currentNode}`
        currentState.status = 'failed'
        break
      }

      console.log(`[LangGraphExecutor] 执行节点: ${currentNode} (步骤 ${step}, 重试 ${currentRetries})`)

      // 执行节点
      try {
        const updates = await node.handler(currentState)
        currentState = { ...currentState, ...updates }
        
        // 重置当前节点的重试计数（执行成功）
        retryCount.delete(currentNode)
      } catch (error: any) {
        console.error(`节点执行失败: ${currentNode}`, error)
        
        // 增加重试计数
        retryCount.set(currentNode, currentRetries + 1)
        
        currentState.error = error.message
        currentState.status = 'failed'
        break
      }

      // 确定下一个节点（支持条件路由）
      currentNode = this.getNextNode(currentState, currentNode, retryCount)
    }

    // 最终状态
    if (currentState.status !== 'failed') {
      currentState.status = 'completed'
    }

    // 添加执行路径到日志
    currentState.logs.push({
      node: 'end',
      timestamp: new Date(),
      input: { path: visitedPath },
      duration: 0,
    })

    return currentState
  }

  /**
   * 获取下一个节点（支持条件路由）
   */
  private getNextNode(
    state: AgentState, 
    currentNode: AgentNodeName, 
    retryCount: Map<AgentNodeName, number>
  ): AgentNodeName {
    // 检查是否有错误
    if (state.error) {
      return 'end'
    }

    // 查找当前节点的出边
    const outgoingEdges = this.edges.filter(e => e.source === currentNode)
    
    if (outgoingEdges.length === 0) {
      return 'end'
    }

    // 如果有条件路由，按优先级依次检查
    for (const edge of outgoingEdges) {
      if (edge.condition) {
        try {
          const nextNode = edge.condition(state)
          if (nextNode && nextNode !== currentNode) {
            console.log(`[LangGraphExecutor] 条件路由: ${currentNode} -> ${nextNode}`)
            // 如果返回的是同一个节点，增加重试计数
            if (nextNode === currentNode) {
              retryCount.set(currentNode, (retryCount.get(currentNode) || 0) + 1)
            }
            return nextNode
          }
        } catch (error) {
          console.warn(`条件路由执行失败: ${edge.source} -> ${edge.target}`, error)
        }
      }
    }

    // 默认取第一条无条件边
    const defaultEdge = outgoingEdges.find(e => !e.condition)
    if (defaultEdge) {
      return defaultEdge.target
    }

    return 'end'
  }

  /**
   * 获取节点列表
   */
  getNodeNames(): AgentNodeName[] {
    return Array.from(this.nodes.keys())
  }

  /**
   * 可视化图结构
   */
  visualize(): string {
    const lines: string[] = ['LangGraph Structure:', '']
    
    lines.push(`Entry: ${this.entryPoint}`)
    lines.push(`Max Retries: ${this.maxRetries}`)
    lines.push('')
    lines.push('Nodes:')
    for (const [name, node] of this.nodes) {
      lines.push(`  - ${name}`)
    }
    
    lines.push('')
    lines.push('Edges:')
    for (const edge of this.edges) {
      const condition = edge.condition ? ' [conditional]' : ''
      lines.push(`  ${edge.source} -> ${edge.target}${condition}`)
    }

    return lines.join('\n')
  }
}
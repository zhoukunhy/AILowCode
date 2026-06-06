/**
 * LangGraph 图执行器
 * 管理节点执行和状态流转
 */
import { AgentState, AgentNodeName } from './types'
import { GraphNode, GraphEdge, StateUpdate } from './LangGraphState'

export class LangGraphExecutor {
  private nodes: Map<AgentNodeName, GraphNode>
  private edges: GraphEdge[]
  private entryPoint: AgentNodeName

  constructor(nodes: GraphNode[], edges: GraphEdge[], entryPoint: AgentNodeName) {
    this.nodes = new Map(nodes.map(n => [n.name, n]))
    this.edges = edges
    this.entryPoint = entryPoint
  }

  /**
   * 执行图
   */
  async execute(initialState: AgentState): Promise<AgentState> {
    let currentState = { ...initialState }
    let currentNode = this.entryPoint
    const visited = new Set<AgentNodeName>()

    // 最大执行步数，防止无限循环
    const maxSteps = 10
    let step = 0

    while (currentNode !== 'end' && step < maxSteps) {
      // 检测循环
      if (visited.has(currentNode)) {
        console.warn(`检测到循环，跳出执行: ${currentNode}`)
        currentState.error = `执行循环检测: ${currentNode}`
        currentState.status = 'failed'
        break
      }

      visited.add(currentNode)
      step++

      // 获取节点
      const node = this.nodes.get(currentNode)
      if (!node) {
        console.error(`节点未找到: ${currentNode}`)
        currentState.error = `节点未找到: ${currentNode}`
        currentState.status = 'failed'
        break
      }

      console.log(`执行节点: ${currentNode}`)

      // 执行节点
      try {
        const updates = await node.handler(currentState)
        currentState = { ...currentState, ...updates }
      } catch (error: any) {
        console.error(`节点执行失败: ${currentNode}`, error)
        currentState.error = error.message
        currentState.status = 'failed'
        break
      }

      // 确定下一个节点
      currentNode = this.getNextNode(currentState, currentNode)
    }

    // 最终状态
    if (currentState.status !== 'failed') {
      currentState.status = 'completed'
    }

    return currentState
  }

  /**
   * 获取下一个节点
   */
  private getNextNode(state: AgentState, currentNode: AgentNodeName): AgentNodeName {
    // 检查是否有错误
    if (state.error) {
      return 'end'
    }

    // 查找当前节点的出边
    const outgoingEdges = this.edges.filter(e => e.source === currentNode)
    
    if (outgoingEdges.length === 0) {
      return 'end'
    }

    // 如果有条件路由，使用条件路由
    for (const edge of outgoingEdges) {
      if (edge.condition) {
        const nextNode = edge.condition(state)
        if (nextNode !== currentNode) {
          return nextNode
        }
      }
    }

    // 默认取第一条边
    return outgoingEdges[0].target
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

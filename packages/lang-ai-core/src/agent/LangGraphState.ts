/**
 * LangGraph 状态定义
 */
import { AgentState, AgentNodeName, PageSchema } from './types'

/**
 * 状态更新函数类型
 */
export type StateUpdate = Partial<AgentState>

/**
 * 节点条件路由函数
 */
export type RouteFunction = (state: AgentState) => AgentNodeName | 'end'

/**
 * LangGraph 节点定义
 */
export interface GraphNode {
  name: AgentNodeName
  handler: (state: AgentState) => Promise<StateUpdate>
}

/**
 * LangGraph 边定义
 */
export interface GraphEdge {
  source: AgentNodeName
  target: AgentNodeName | 'end'
  condition?: RouteFunction
}

/**
 * LangGraph 图定义
 */
export interface LangGraphDefinition {
  nodes: GraphNode[]
  edges: GraphEdge[]
  entryPoint: AgentNodeName
}

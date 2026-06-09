import { create } from 'zustand'
import { ProcessDefinition, ProcessNode, ProcessTransition, NodeType } from '@ai-lowcode/shared-types'

interface WorkflowState {
  currentProcess: ProcessDefinition | null
  nodes: ProcessNode[]
  transitions: ProcessTransition[]
  selectedNodeId: string | null
  selectedTransitionId: string | null
  isConnecting: boolean
  connectingFromNodeId: string | null
  zoom: number

  setCurrentProcess: (process: ProcessDefinition | null) => void
  loadProcess: (process: ProcessDefinition) => void
  addNode: (type: NodeType, x: number, y: number) => void
  updateNode: (id: string, updates: Partial<ProcessNode>) => void
  moveNode: (id: string, x: number, y: number) => void
  removeNode: (id: string) => void
  selectNode: (id: string | null) => void
  
  addTransition: (sourceNodeId: string, targetNodeId: string, label?: string) => void
  updateTransition: (id: string, updates: Partial<ProcessTransition>) => void
  removeTransition: (id: string) => void
  selectTransition: (id: string | null) => void
  
  startConnection: (nodeId: string) => void
  endConnection: (nodeId: string) => void
  cancelConnection: () => void
  
  setZoom: (zoom: number) => void
  clearWorkflow: () => void
  
  generateId: () => string
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const getNodeDefaultName = (type: NodeType): string => {
  const names: Record<NodeType, string> = {
    start: '开始',
    approve: '审批',
    condition: '条件判断',
    fork: '分支',
    join: '合并',
    end: '结束',
    action: '动作',
  }
  return names[type]
}

const getNodeDefaultSize = (type: NodeType): { width: number; height: number } => {
  const sizes: Record<NodeType, { width: number; height: number }> = {
    start: { width: 60, height: 60 },
    approve: { width: 120, height: 60 },
    condition: { width: 120, height: 60 },
    fork: { width: 80, height: 60 },
    join: { width: 80, height: 60 },
    end: { width: 60, height: 60 },
    action: { width: 120, height: 60 },
  }
  return sizes[type]
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  currentProcess: null,
  nodes: [],
  transitions: [],
  selectedNodeId: null,
  selectedTransitionId: null,
  isConnecting: false,
  connectingFromNodeId: null,
  zoom: 1,

  setCurrentProcess: (process) => set({ currentProcess: process }),

  loadProcess: (process) => {
    set({
      currentProcess: process,
      nodes: process.nodes || [],
      transitions: process.transitions || [],
      selectedNodeId: null,
      selectedTransitionId: null,
    })
  },

  addNode: (type, x, y) => {
    const { generateId, nodes } = get()
    const { width, height } = getNodeDefaultSize(type)
    const newNode: ProcessNode = {
      id: generateId(),
      type,
      name: getNodeDefaultName(type),
      x,
      y,
      width,
      height,
      zIndex: nodes.length,
      processDefinitionId: get().currentProcess?.id || '',
    }
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }))
    return newNode
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }))
  },

  moveNode: (id, x, y) => {
    const { updateNode } = get()
    updateNode(id, { x, y })
    
    set((state) => {
      const node = state.nodes.find((n) => n.id === id)
      if (!node) return state

      return {
        transitions: state.transitions.map((t) => {
          if (t.sourceNodeId === id || t.targetNodeId === id) {
            return { ...t, points: undefined }
          }
          return t
        }),
      }
    })
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      transitions: state.transitions.filter(
        (t) => t.sourceNodeId !== id && t.targetNodeId !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }))
  },

  selectNode: (id) => {
    set({
      selectedNodeId: id,
      selectedTransitionId: null,
    })
  },

  addTransition: (sourceNodeId, targetNodeId, label) => {
    const { generateId, nodes } = get()
    const sourceNode = nodes.find((n) => n.id === sourceNodeId)
    const targetNode = nodes.find((n) => n.id === targetNodeId)

    if (!sourceNode || !targetNode) return

    const newTransition: ProcessTransition = {
      id: generateId(),
      sourceNodeId,
      targetNodeId,
      label,
      zIndex: 0,
    }

    set((state) => ({
      transitions: [...state.transitions, newTransition],
    }))
  },

  updateTransition: (id, updates) => {
    set((state) => ({
      transitions: state.transitions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }))
  },

  removeTransition: (id) => {
    set((state) => ({
      transitions: state.transitions.filter((t) => t.id !== id),
      selectedTransitionId: state.selectedTransitionId === id ? null : state.selectedTransitionId,
    }))
  },

  selectTransition: (id) => {
    set({
      selectedTransitionId: id,
      selectedNodeId: null,
    })
  },

  startConnection: (nodeId) => {
    set({
      isConnecting: true,
      connectingFromNodeId: nodeId,
    })
  },

  endConnection: (nodeId) => {
    const { isConnecting, connectingFromNodeId, addTransition, cancelConnection } = get()
    
    if (isConnecting && connectingFromNodeId && connectingFromNodeId !== nodeId) {
      addTransition(connectingFromNodeId, nodeId)
    }
    
    cancelConnection()
  },

  cancelConnection: () => {
    set({
      isConnecting: false,
      connectingFromNodeId: null,
    })
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.25, Math.min(2, zoom)) })
  },

  clearWorkflow: () => {
    set({
      currentProcess: null,
      nodes: [],
      transitions: [],
      selectedNodeId: null,
      selectedTransitionId: null,
      isConnecting: false,
      connectingFromNodeId: null,
      zoom: 1,
    })
  },

  generateId: () => generateUUID(),
}))
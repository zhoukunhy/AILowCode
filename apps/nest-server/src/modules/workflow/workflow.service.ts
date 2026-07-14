import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { ProcessDefinition } from './entities/process-definition.entity'
import { ProcessNode } from './entities/process-node.entity'
import { ProcessTransition } from './entities/process-transition.entity'
import {
  CreateProcessDefinitionDto,
  UpdateProcessDefinitionDto,
  ProcessNodeDto,
  ProcessTransitionDto,
  SaveProcessDto,
  MoveNodeDto,
} from './dto/workflow.dto'

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(ProcessDefinition)
    private processDefinitionRepository: Repository<ProcessDefinition>,
    @InjectRepository(ProcessNode)
    private processNodeRepository: Repository<ProcessNode>,
    @InjectRepository(ProcessTransition)
    private processTransitionRepository: Repository<ProcessTransition>,
  ) {}

  async createProcessDefinition(dto: CreateProcessDefinitionDto): Promise<ProcessDefinition> {
    const processDefinition = this.processDefinitionRepository.create(dto)
    return await this.processDefinitionRepository.save(processDefinition)
  }

  async findAllProcessDefinitions(page: number = 1, pageSize: number = 10): Promise<{ items: ProcessDefinition[]; total: number }> {
    const [items, total] = await this.processDefinitionRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })
    return { items, total }
  }

  async findProcessDefinitionById(id: string): Promise<ProcessDefinition> {
    const processDefinition = await this.processDefinitionRepository.findOne({
      where: { id },
      relations: ['nodes'],
    })
    if (!processDefinition) {
      throw new NotFoundException('流程定义不存在')
    }
    return processDefinition
  }

  async updateProcessDefinition(id: string, dto: UpdateProcessDefinitionDto): Promise<ProcessDefinition> {
    await this.findProcessDefinitionById(id)
    await this.processDefinitionRepository.update(id, dto)
    return await this.findProcessDefinitionById(id)
  }

  async deleteProcessDefinition(id: string): Promise<void> {
    await this.findProcessDefinitionById(id)
    await this.processTransitionRepository.delete({ sourceNodeId: id })
    await this.processTransitionRepository.delete({ targetNodeId: id })
    await this.processNodeRepository.delete({ processDefinitionId: id })
    await this.processDefinitionRepository.delete(id)
  }

  async getProcessWithNodesAndTransitions(id: string): Promise<any> {
    const processDefinition = await this.processDefinitionRepository.findOne({
      where: { id },
    })
    if (!processDefinition) {
      throw new NotFoundException('流程定义不存在')
    }

    const nodes = await this.processNodeRepository.find({
      where: { processDefinitionId: id },
      order: { zIndex: 'ASC' },
    })

    const nodeIds = nodes.map(n => n.id)
    const transitions = await this.processTransitionRepository.find({
      where: [{ sourceNodeId: In(nodeIds) }, { targetNodeId: In(nodeIds) }],
    })

    return {
      ...processDefinition,
      nodes,
      transitions,
    }
  }

  async addNode(processId: string, dto: ProcessNodeDto): Promise<ProcessNode> {
    await this.findProcessDefinitionById(processId)
    const node = this.processNodeRepository.create({
      ...dto,
      processDefinitionId: processId,
    })
    return await this.processNodeRepository.save(node)
  }

  async updateNode(processId: string, nodeId: string, dto: Partial<ProcessNodeDto>): Promise<ProcessNode | null> {
    await this.findProcessDefinitionById(processId)
    const node = await this.processNodeRepository.findOne({ where: { id: nodeId, processDefinitionId: processId } })
    if (!node) {
      throw new NotFoundException('节点不存在')
    }
    await this.processNodeRepository.update(nodeId, dto)
    return await this.processNodeRepository.findOne({ where: { id: nodeId } })
  }

  async moveNode(processId: string, nodeId: string, dto: MoveNodeDto): Promise<ProcessNode | null> {
    return await this.updateNode(processId, nodeId, dto)
  }

  async deleteNode(processId: string, nodeId: string): Promise<void> {
    await this.findProcessDefinitionById(processId)
    const node = await this.processNodeRepository.findOne({ where: { id: nodeId, processDefinitionId: processId } })
    if (!node) {
      throw new NotFoundException('节点不存在')
    }
    await this.processTransitionRepository.delete({ sourceNodeId: nodeId })
    await this.processTransitionRepository.delete({ targetNodeId: nodeId })
    await this.processNodeRepository.delete(nodeId)
  }

  async addTransition(processId: string, dto: ProcessTransitionDto): Promise<ProcessTransition | null> {
    await this.findProcessDefinitionById(processId)
    const sourceNode = await this.processNodeRepository.findOne({ where: { id: dto.sourceNodeId, processDefinitionId: processId } })
    const targetNode = await this.processNodeRepository.findOne({ where: { id: dto.targetNodeId, processDefinitionId: processId } })
    
    if (!sourceNode) {
      throw new NotFoundException('源节点不存在')
    }
    if (!targetNode) {
      throw new NotFoundException('目标节点不存在')
    }

    const transition = this.processTransitionRepository.create(dto as any)
    const saved = await this.processTransitionRepository.save(transition)
    return saved instanceof Array ? saved[0] : saved
  }

  async updateTransition(processId: string, transitionId: string, dto: Partial<ProcessTransitionDto>): Promise<ProcessTransition | null> {
    await this.findProcessDefinitionById(processId)
    const transition = await this.processTransitionRepository.findOne({ where: { id: transitionId } })
    if (!transition) {
      throw new NotFoundException('流转不存在')
    }
    await this.processTransitionRepository.update(transitionId, dto as any)
    return await this.processTransitionRepository.findOne({ where: { id: transitionId } })
  }

  async deleteTransition(processId: string, transitionId: string): Promise<void> {
    await this.findProcessDefinitionById(processId)
    const transition = await this.processTransitionRepository.findOne({ where: { id: transitionId } })
    if (!transition) {
      throw new NotFoundException('流转不存在')
    }
    await this.processTransitionRepository.delete(transitionId)
  }

  async saveProcess(dto: SaveProcessDto): Promise<any> {
    let processDefinition: ProcessDefinition

    if (dto.id) {
      processDefinition = await this.findProcessDefinitionById(dto.id)
      Object.assign(processDefinition, {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        startNodeId: dto.startNodeId,
        metadata: dto.metadata,
      })
    } else {
      processDefinition = this.processDefinitionRepository.create({
        name: dto.name,
        description: dto.description,
        status: dto.status || 'draft',
        startNodeId: dto.startNodeId,
        metadata: dto.metadata,
        creatorId: dto.creatorId,
      })
    }

    processDefinition = await this.processDefinitionRepository.save(processDefinition)

    const existingNodeIds = new Set(
      (await this.processNodeRepository.find({ where: { processDefinitionId: processDefinition.id } })).map(n => n.id)
    )
    const incomingNodeIds = new Set(dto.nodes.map((n: any) => n.id))

    for (const nodeDto of dto.nodes) {
      const nodeData = nodeDto as any
      if (nodeData.id && existingNodeIds.has(nodeData.id)) {
        await this.processNodeRepository.update(nodeData.id, {
          type: nodeData.type,
          name: nodeData.name,
          description: nodeData.description,
          x: nodeData.x,
          y: nodeData.y,
          width: nodeData.width,
          height: nodeData.height,
          config: nodeData.config,
          zIndex: nodeData.zIndex,
        })
      } else {
        const newNode = this.processNodeRepository.create({
          ...nodeDto,
          processDefinitionId: processDefinition.id,
        })
        await this.processNodeRepository.save(newNode)
      }
    }

    const deletedNodeIds = [...existingNodeIds].filter(id => !incomingNodeIds.has(id))
    for (const id of deletedNodeIds) {
      await this.processTransitionRepository.delete({ sourceNodeId: id })
      await this.processTransitionRepository.delete({ targetNodeId: id })
      await this.processNodeRepository.delete(id)
    }

    const allNodeIds = (await this.processNodeRepository.find({ where: { processDefinitionId: processDefinition.id } })).map(n => n.id)
    const existingTransitionIds = new Set(
      (await this.processTransitionRepository.find({
        where: [
          { sourceNodeId: In(allNodeIds) },
          { targetNodeId: In(allNodeIds) }
        ]
      })).map(t => t.id)
    )

    for (const transitionDto of dto.transitions) {
      const transitionData = transitionDto as any
      if (transitionData.id && existingTransitionIds.has(transitionData.id)) {
        await this.processTransitionRepository.update(transitionData.id, {
          sourceNodeId: transitionData.sourceNodeId,
          targetNodeId: transitionData.targetNodeId,
          label: transitionData.label,
          condition: transitionData.condition,
          points: transitionData.points,
          zIndex: transitionData.zIndex,
        })
      } else {
        const newTransition = this.processTransitionRepository.create(transitionDto as any)
        await this.processTransitionRepository.save(newTransition)
      }
    }

    return await this.getProcessWithNodesAndTransitions(processDefinition.id)
  }

  async validateProcess(processId: string): Promise<{ valid: boolean; errors: string[] }> {
    const process = await this.getProcessWithNodesAndTransitions(processId)
    const errors: string[] = []

    const startNodes = process.nodes.filter((n: ProcessNode) => n.type === 'start')
    const endNodes = process.nodes.filter((n: ProcessNode) => n.type === 'end')

    if (startNodes.length === 0) {
      errors.push('流程必须包含开始节点')
    }
    if (startNodes.length > 1) {
      errors.push('流程只能有一个开始节点')
    }
    if (endNodes.length === 0) {
      errors.push('流程必须包含结束节点')
    }

    for (const node of process.nodes as ProcessNode[]) {
      const outgoing = process.transitions.filter((t: ProcessTransition) => t.sourceNodeId === node.id)
      const incoming = process.transitions.filter((t: ProcessTransition) => t.targetNodeId === node.id)

      if (node.type === 'start' && incoming.length > 0) {
        errors.push(`开始节点 ${node.name} 不应该有入边`)
      }
      if (node.type === 'end' && outgoing.length > 0) {
        errors.push(`结束节点 ${node.name} 不应该有出边`)
      }
      if (node.type === 'condition' && outgoing.length !== 2) {
        errors.push(`条件节点 ${node.name} 应该有且仅有两条出边`)
      }
    }

    return { valid: errors.length === 0, errors }
  }
}
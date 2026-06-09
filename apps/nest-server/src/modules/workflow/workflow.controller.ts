import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { WorkflowService } from './workflow.service'
import {
  CreateProcessDefinitionDto,
  UpdateProcessDefinitionDto,
  ProcessNodeDto,
  ProcessTransitionDto,
  SaveProcessDto,
  MoveNodeDto,
} from './dto/workflow.dto'

@Controller('api/workflow')
@ApiTags('流程编排')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('processes')
  @ApiOperation({ summary: '获取流程定义列表' })
  @ApiResponse({ status: 200, description: '成功获取流程列表' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    const result = await this.workflowService.findAllProcessDefinitions(page, pageSize)
    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  @Get('processes/:id')
  @ApiOperation({ summary: '获取流程定义详情' })
  @ApiResponse({ status: 200, description: '成功获取流程详情' })
  @ApiResponse({ status: 404, description: '流程不存在' })
  async findOne(@Param('id') id: string) {
    const result = await this.workflowService.findProcessDefinitionById(id)
    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  @Get('processes/:id/detail')
  @ApiOperation({ summary: '获取流程完整详情（包含节点和流转）' })
  @ApiResponse({ status: 200, description: '成功获取流程完整详情' })
  async getProcessDetail(@Param('id') id: string) {
    const result = await this.workflowService.getProcessWithNodesAndTransitions(id)
    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  @Post('processes')
  @ApiOperation({ summary: '创建流程定义' })
  @ApiResponse({ status: 201, description: '成功创建流程' })
  async create(@Body() dto: CreateProcessDefinitionDto) {
    const result = await this.workflowService.createProcessDefinition(dto)
    return {
      code: 201,
      msg: '创建成功',
      data: result,
    }
  }

  @Put('processes/:id')
  @ApiOperation({ summary: '更新流程定义' })
  @ApiResponse({ status: 200, description: '成功更新流程' })
  async update(@Param('id') id: string, @Body() dto: UpdateProcessDefinitionDto) {
    const result = await this.workflowService.updateProcessDefinition(id, dto)
    return {
      code: 200,
      msg: '更新成功',
      data: result,
    }
  }

  @Delete('processes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除流程定义' })
  @ApiResponse({ status: 204, description: '成功删除流程' })
  async delete(@Param('id') id: string) {
    await this.workflowService.deleteProcessDefinition(id)
  }

  @Post('processes/:id/nodes')
  @ApiOperation({ summary: '添加流程节点' })
  @ApiResponse({ status: 201, description: '成功添加节点' })
  async addNode(@Param('id') id: string, @Body() dto: ProcessNodeDto) {
    const result = await this.workflowService.addNode(id, dto)
    return {
      code: 201,
      msg: '添加成功',
      data: result,
    }
  }

  @Put('processes/:id/nodes/:nodeId')
  @ApiOperation({ summary: '更新流程节点' })
  @ApiResponse({ status: 200, description: '成功更新节点' })
  async updateNode(@Param('id') id: string, @Param('nodeId') nodeId: string, @Body() dto: Partial<ProcessNodeDto>) {
    const result = await this.workflowService.updateNode(id, nodeId, dto)
    return {
      code: 200,
      msg: '更新成功',
      data: result,
    }
  }

  @Put('processes/:id/nodes/:nodeId/move')
  @ApiOperation({ summary: '移动流程节点' })
  @ApiResponse({ status: 200, description: '成功移动节点' })
  async moveNode(@Param('id') id: string, @Param('nodeId') nodeId: string, @Body() dto: MoveNodeDto) {
    const result = await this.workflowService.moveNode(id, nodeId, dto)
    return {
      code: 200,
      msg: '移动成功',
      data: result,
    }
  }

  @Delete('processes/:id/nodes/:nodeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除流程节点' })
  @ApiResponse({ status: 204, description: '成功删除节点' })
  async deleteNode(@Param('id') id: string, @Param('nodeId') nodeId: string) {
    await this.workflowService.deleteNode(id, nodeId)
  }

  @Post('processes/:id/transitions')
  @ApiOperation({ summary: '添加流转规则' })
  @ApiResponse({ status: 201, description: '成功添加流转' })
  async addTransition(@Param('id') id: string, @Body() dto: ProcessTransitionDto) {
    const result = await this.workflowService.addTransition(id, dto)
    return {
      code: 201,
      msg: '添加成功',
      data: result,
    }
  }

  @Put('processes/:id/transitions/:transitionId')
  @ApiOperation({ summary: '更新流转规则' })
  @ApiResponse({ status: 200, description: '成功更新流转' })
  async updateTransition(@Param('id') id: string, @Param('transitionId') transitionId: string, @Body() dto: Partial<ProcessTransitionDto>) {
    const result = await this.workflowService.updateTransition(id, transitionId, dto)
    return {
      code: 200,
      msg: '更新成功',
      data: result,
    }
  }

  @Delete('processes/:id/transitions/:transitionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除流转规则' })
  @ApiResponse({ status: 204, description: '成功删除流转' })
  async deleteTransition(@Param('id') id: string, @Param('transitionId') transitionId: string) {
    await this.workflowService.deleteTransition(id, transitionId)
  }

  @Post('processes/save')
  @ApiOperation({ summary: '保存完整流程（包含节点和流转）' })
  @ApiResponse({ status: 200, description: '成功保存流程' })
  async saveProcess(@Body() dto: SaveProcessDto) {
    const result = await this.workflowService.saveProcess(dto)
    return {
      code: 200,
      msg: '保存成功',
      data: result,
    }
  }

  @Post('processes/:id/validate')
  @ApiOperation({ summary: '验证流程配置' })
  @ApiResponse({ status: 200, description: '验证完成' })
  async validateProcess(@Param('id') id: string) {
    const result = await this.workflowService.validateProcess(id)
    return {
      code: 200,
      msg: '验证完成',
      data: result,
    }
  }
}
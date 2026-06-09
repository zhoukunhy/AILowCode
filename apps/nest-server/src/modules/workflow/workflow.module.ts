import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkflowController } from './workflow.controller'
import { WorkflowService } from './workflow.service'
import { ProcessDefinition } from './entities/process-definition.entity'
import { ProcessNode } from './entities/process-node.entity'
import { ProcessTransition } from './entities/process-transition.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ProcessDefinition, ProcessNode, ProcessTransition])],
  controllers: [WorkflowController],
  providers: [WorkflowService],
})
export class WorkflowModule {}
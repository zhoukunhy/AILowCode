import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectController } from './project.controller'
import { ProjectService } from './project.service'
import { Project } from './entities/project.entity'
import { WebhookModule } from '../webhook/webhook.module'

@Module({
  imports: [TypeOrmModule.forFeature([Project]), WebhookModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
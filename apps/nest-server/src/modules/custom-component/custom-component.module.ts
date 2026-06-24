import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CustomComponentController } from './custom-component.controller'
import { CustomComponentService } from './custom-component.service'
import { CustomComponentEntity } from './entities/custom-component.entity'

@Module({
  imports: [TypeOrmModule.forFeature([CustomComponentEntity])],
  controllers: [CustomComponentController],
  providers: [CustomComponentService],
  exports: [CustomComponentService],
})
export class CustomComponentModule {}
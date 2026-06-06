/**
 * 数据源模块
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSourceController } from './data-source.controller'
import { DataSourceService } from './data-source.service'
import { DataSourceEntity } from './entities/data-source.entity'
import { PluginEntity } from './entities/plugin.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([DataSourceEntity, PluginEntity]),
  ],
  controllers: [DataSourceController],
  providers: [DataSourceService],
  exports: [DataSourceService],
})
export class DataSourceModule {}

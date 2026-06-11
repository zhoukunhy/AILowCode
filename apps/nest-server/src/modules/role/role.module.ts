import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleController } from './role.controller'
import { RoleService } from './role.service'
import { RoleInitService } from './role.init'
import { Role } from './entities/role.entity'
import { Menu } from './entities/menu.entity'
import { Permission } from './entities/permission.entity'
import { User } from '../user/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Role, Menu, Permission, User])],
  controllers: [RoleController],
  providers: [RoleService, RoleInitService],
  exports: [RoleService],
})
export class RoleModule {}
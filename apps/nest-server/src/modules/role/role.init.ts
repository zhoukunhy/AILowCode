import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Role } from './entities/role.entity'
import { Permission } from './entities/permission.entity'
import { DEFAULT_ROLES, DEFAULT_PERMISSIONS } from '@ai-lowcode/shared-types'

/**
 * 角色权限初始化服务
 * 在模块启动时自动初始化默认角色和权限
 */
@Injectable()
export class RoleInitService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    await this.initializeDefaultPermissions()
    await this.initializeDefaultRoles()
  }

  /**
   * 初始化默认权限
   */
  private async initializeDefaultPermissions() {
    for (const permissionConfig of DEFAULT_PERMISSIONS) {
      const existing = await this.permissionRepository.findOne({
        where: { code: permissionConfig.code },
      })

      if (!existing) {
        const permission = this.permissionRepository.create({
          ...permissionConfig,
        })
        await this.permissionRepository.save(permission)
        console.log(`Initialized permission: ${permissionConfig.code}`)
      }
    }
  }

  /**
   * 初始化默认角色
   */
  private async initializeDefaultRoles() {
    for (const roleConfig of DEFAULT_ROLES) {
      const existing = await this.roleRepository.findOne({
        where: { code: roleConfig.code },
      })

      if (!existing) {
        // 创建角色
        const role = this.roleRepository.create({
          name: roleConfig.name,
          code: roleConfig.code,
          description: roleConfig.description,
          isSystem: roleConfig.isSystem || false,
          status: 'active',
        })

        // 获取角色需要的权限
        const permissions: Permission[] = []
        for (const permissionCode of roleConfig.permissions) {
          if (permissionCode === '*') {
            // 超级管理员获取所有权限
            const allPermissions = await this.permissionRepository.find()
            permissions.push(...allPermissions)
          } else {
            const permission = await this.permissionRepository.findOne({
              where: { code: permissionCode },
            })
            if (permission) {
              permissions.push(permission)
            }
          }
        }

        role.permissions = permissions
        await this.roleRepository.save(role)
        console.log(`Initialized role: ${roleConfig.code}`)
      }
    }
  }
}
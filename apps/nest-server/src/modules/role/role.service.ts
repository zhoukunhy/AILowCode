import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Role } from './entities/role.entity'
import { Menu } from './entities/menu.entity'
import { Permission } from './entities/permission.entity'
import { User } from '../user/entities/user.entity'
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignMenusDto,
  CreateMenuDto,
  UpdateMenuDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
  AssignRolesDto,
} from './dto/role.dto'

/**
 * 角色服务
 * 提供角色、菜单、权限的管理功能
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ==================== 角色管理 ====================

  /**
   * 创建角色
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    // 检查角色名称是否已存在
    const existingByName = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    })
    if (existingByName) {
      throw new ConflictException('角色名称已存在')
    }

    // 检查角色代码是否已存在
    const existingByCode = await this.roleRepository.findOne({
      where: { code: createRoleDto.code },
    })
    if (existingByCode) {
      throw new ConflictException('角色代码已存在')
    }

    const role = this.roleRepository.create(createRoleDto)
    return this.roleRepository.save(role)
  }

  /**
   * 获取所有角色
   */
  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { status: 'active' },
      relations: ['menus', 'permissions'],
    })
  }

  /**
   * 获取单个角色
   */
  async getRoleById(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['menus', 'permissions'],
    })
    if (!role) {
      throw new NotFoundException('角色不存在')
    }
    return role
  }

  /**
   * 获取角色权限列表
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const role = await this.getRoleById(roleId)
    return role.permissions
  }

  /**
   * 更新角色
   */
  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRoleById(id)

    // 检查系统角色是否可修改
    if (role.isSystem && updateRoleDto.name) {
      throw new ConflictException('系统角色名称不可修改')
    }

    Object.assign(role, updateRoleDto)
    return this.roleRepository.save(role)
  }

  /**
   * 删除角色
   */
  async deleteRole(id: number): Promise<{ message: string }> {
    const role = await this.getRoleById(id)

    // 检查系统角色是否可删除
    if (role.isSystem) {
      throw new ConflictException('系统角色不可删除')
    }

    role.status = 'deleted'
    await this.roleRepository.save(role)
    return { message: '删除成功' }
  }

  /**
   * 为角色分配菜单
   */
  async assignMenus(id: number, assignMenusDto: AssignMenusDto): Promise<Role> {
    const role = await this.getRoleById(id)
    const menus = await this.menuRepository.findByIds(assignMenusDto.menuIds)
    role.menus = menus
    return this.roleRepository.save(role)
  }

  /**
   * 为角色分配权限
   */
  async assignPermissions(id: number, assignPermissionsDto: AssignPermissionsDto): Promise<Role> {
    const role = await this.getRoleById(id)
    const permissions = await this.permissionRepository.findByIds(assignPermissionsDto.permissionIds)
    role.permissions = permissions
    return this.roleRepository.save(role)
  }

  /**
   * 为用户分配角色
   */
  async assignRolesToUser(userId: number, assignRolesDto: AssignRolesDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    const roles = await this.roleRepository.findByIds(assignRolesDto.roleIds)
    user.roles = roles
    
    // 更新用户的角色字段（保持兼容性）
    if (roles.length > 0) {
      user.role = roles[0].code
      user.roleId = roles[0].id
    }

    return this.userRepository.save(user)
  }

  /**
   * 获取用户的所有角色
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user.roles
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    const permissions: string[] = []

    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if (permission.isActive) {
          permissions.push(permission.code)
        }
      }
    }

    // 添加超级管理员权限
    if (user.roles.some(r => r.code === 'super_admin')) {
      permissions.push('*')
    }

    return [...new Set(permissions)]
  }

  /**
   * 检查用户是否有权限
   */
  async checkUserPermission(userId: number, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId)
    
    // 超级权限
    if (permissions.includes('*')) {
      return true
    }

    return permissions.includes(permissionCode)
  }

  // ==================== 菜单管理 ====================

  /**
   * 创建菜单
   */
  async createMenu(createMenuDto: CreateMenuDto): Promise<Menu> {
    const menu = this.menuRepository.create(createMenuDto)
    return this.menuRepository.save(menu)
  }

  /**
   * 获取所有菜单（树形结构）
   */
  async getAllMenus(): Promise<Menu[]> {
    return this.menuRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    })
  }

  /**
   * 获取树形菜单
   */
  async getMenuTree(): Promise<any[]> {
    const menus = await this.getAllMenus()
    return this.buildTree(menus)
  }

  /**
   * 构建树形结构
   */
  private buildTree(menus: Menu[], parentId?: number): any[] {
    return menus
      .filter((menu) => menu.parentId === parentId)
      .map((menu) => ({
        ...menu,
        children: this.buildTree(menus, menu.id),
      }))
  }

  /**
   * 获取用户可访问的菜单
   */
  async getUserMenuTree(userId: number): Promise<any[]> {
    const permissions = await this.getUserPermissions(userId)
    const menus = await this.getAllMenus()
    return this.filterMenuByPermissions(menus, permissions)
  }

  /**
   * 根据权限过滤菜单
   */
  private filterMenuByPermissions(menus: Menu[], permissions: string[]): any[] {
    const result: any[] = []

    for (const menu of menus) {
      // 如果有子菜单，检查子菜单
      if (menu.parentId === undefined && this.hasChildren(menus, menu.id)) {
        const children = this.filterMenuByPermissions(
          menus.filter(m => m.parentId === menu.id),
          permissions,
        )
        if (children.length > 0) {
          result.push({
            ...menu,
            children,
          })
        }
      } else {
        // 如果没有子菜单或为子菜单，检查自身权限
        const menuPermission = menu.permission
        if (!menuPermission || permissions.includes('*') || permissions.includes(menuPermission)) {
          result.push({ ...menu, children: [] })
        }
      }
    }

    return result
  }

  /**
   * 检查菜单是否有子菜单
   */
  private hasChildren(menus: Menu[], parentId: number): boolean {
    return menus.some(menu => menu.parentId === parentId)
  }

  /**
   * 获取单个菜单
   */
  async getMenuById(id: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id },
    })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }
    return menu
  }

  /**
   * 更新菜单
   */
  async updateMenu(id: number, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.getMenuById(id)
    Object.assign(menu, updateMenuDto)
    return this.menuRepository.save(menu)
  }

  /**
   * 删除菜单
   */
  async deleteMenu(id: number): Promise<{ message: string }> {
    const menu = await this.getMenuById(id)
    menu.isActive = false
    await this.menuRepository.save(menu)
    return { message: '删除成功' }
  }

  // ==================== 权限管理 ====================

  /**
   * 创建权限
   */
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // 检查权限代码是否已存在
    const existing = await this.permissionRepository.findOne({
      where: { code: createPermissionDto.code },
    })
    if (existing) {
      throw new ConflictException('权限代码已存在')
    }

    const permission = this.permissionRepository.create(createPermissionDto)
    return this.permissionRepository.save(permission)
  }

  /**
   * 获取所有权限
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { isActive: true },
      order: { type: 'ASC', code: 'ASC' },
    })
  }

  /**
   * 获取权限树（按类型分组）
   */
  async getPermissionTree(): Promise<any[]> {
    const permissions = await this.getAllPermissions()
    
    const grouped = {
      menu: [] as Permission[],
      button: [] as Permission[],
      api: [] as Permission[],
    }

    permissions.forEach(p => {
      grouped[p.type].push(p)
    })

    return Object.entries(grouped).map(([type, items]) => ({
      type,
      label: this.getPermissionTypeLabel(type as 'menu' | 'button' | 'api'),
      children: items,
    }))
  }

  /**
   * 获取权限类型标签
   */
  private getPermissionTypeLabel(type: 'menu' | 'button' | 'api'): string {
    const labels = {
      menu: '菜单权限',
      button: '按钮权限',
      api: 'API权限',
    }
    return labels[type]
  }

  /**
   * 获取单个权限
   */
  async getPermissionById(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    })
    if (!permission) {
      throw new NotFoundException('权限不存在')
    }
    return permission
  }

  /**
   * 获取权限通过代码
   */
  async getPermissionByCode(code: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { code, isActive: true },
    })
  }

  /**
   * 更新权限
   */
  async updatePermission(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.getPermissionById(id)
    Object.assign(permission, updatePermissionDto)
    return this.permissionRepository.save(permission)
  }

  /**
   * 删除权限
   */
  async deletePermission(id: number): Promise<{ message: string }> {
    const permission = await this.getPermissionById(id)
    permission.isActive = false
    await this.permissionRepository.save(permission)
    return { message: '删除成功' }
  }
}
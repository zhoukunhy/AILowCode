import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Role } from './entities/role.entity'
import { Menu } from './entities/menu.entity'
import { CreateRoleDto, UpdateRoleDto, AssignMenusDto, CreateMenuDto, UpdateMenuDto } from './dto/role.dto'

/**
 * 角色服务
 * 提供角色和菜单的管理功能
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>
  ) {}

  // ==================== 角色管理 ====================

  /**
   * 创建角色
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto)
    return this.roleRepository.save(role)
  }

  /**
   * 获取所有角色
   */
  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { status: 'active' },
      relations: ['menus'],
    })
  }

  /**
   * 获取单个角色
   */
  async getRoleById(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['menus'],
    })
    if (!role) {
      throw new NotFoundException('角色不存在')
    }
    return role
  }

  /**
   * 更新角色
   */
  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRoleById(id)
    Object.assign(role, updateRoleDto)
    return this.roleRepository.save(role)
  }

  /**
   * 删除角色
   */
  async deleteRole(id: number): Promise<{ message: string }> {
    const role = await this.getRoleById(id)
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
}
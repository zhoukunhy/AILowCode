/**
 * 角色服务单元测试
 * FR1-2 RBAC权限模块测试
 */
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RoleService } from './role.service'
import { Role } from './entities/role.entity'
import { Menu } from './entities/menu.entity'
import { NotFoundException } from '@nestjs/common'

describe('RoleService', () => {
  let service: RoleService
  let roleRepository: MockType<Repository<Role>>
  let menuRepository: MockType<Repository<Menu>>

  type MockType<T> = {
    [P in keyof T]: jest.Mock<unknown>
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findByIds: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Menu),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findByIds: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<RoleService>(RoleService)
    roleRepository = module.get(getRepositoryToken(Role))
    menuRepository = module.get(getRepositoryToken(Menu))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // ==================== 角色管理测试 ====================
  describe('角色管理', () => {
    const mockRole: Role = {
      id: 1,
      name: 'admin',
      description: '管理员',
      status: 'active',
      menus: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a role', async () => {
      roleRepository.create.mockReturnValue(mockRole)
      roleRepository.save.mockResolvedValue(mockRole)

      const result = await service.createRole({ name: 'admin', description: '管理员' })

      expect(roleRepository.create).toHaveBeenCalledWith({ name: 'admin', description: '管理员' })
      expect(roleRepository.save).toHaveBeenCalledWith(mockRole)
      expect(result).toEqual(mockRole)
    })

    it('should get all roles', async () => {
      roleRepository.find.mockResolvedValue([mockRole])

      const result = await service.getAllRoles()

      expect(roleRepository.find).toHaveBeenCalledWith({ where: { status: 'active' }, relations: ['menus'] })
      expect(result).toEqual([mockRole])
    })

    it('should get role by id', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole)

      const result = await service.getRoleById(1)

      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['menus'] })
      expect(result).toEqual(mockRole)
    })

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null)

      await expect(service.getRoleById(999)).rejects.toThrow(NotFoundException)
    })

    it('should update a role', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole)
      roleRepository.save.mockResolvedValue({ ...mockRole, name: 'superadmin' })

      const result = await service.updateRole(1, { name: 'superadmin' })

      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['menus'] })
      expect(roleRepository.save).toHaveBeenCalledWith({ ...mockRole, name: 'superadmin' })
      expect(result.name).toBe('superadmin')
    })

    it('should delete a role (soft delete)', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole)
      roleRepository.save.mockResolvedValue({ ...mockRole, status: 'deleted' })

      const result = await service.deleteRole(1)

      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['menus'] })
      expect(roleRepository.save).toHaveBeenCalledWith({ ...mockRole, status: 'deleted' })
      expect(result.message).toBe('删除成功')
    })
  })

  // ==================== 菜单管理测试 ====================
  describe('菜单管理', () => {
    const mockMenu: Menu = {
      id: 1,
      name: '仪表盘',
      path: '/dashboard',
      icon: '📊',
      parentId: null,
      sortOrder: 1,
      isActive: true,
      permission: 'dashboard:view',
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockSubMenu: Menu = {
      id: 2,
      name: '子菜单',
      path: '/dashboard/sub',
      icon: '📁',
      parentId: 1,
      sortOrder: 1,
      isActive: true,
      permission: 'dashboard:sub:view',
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a menu', async () => {
      menuRepository.create.mockReturnValue(mockMenu)
      menuRepository.save.mockResolvedValue(mockMenu)

      const result = await service.createMenu({
        name: '仪表盘',
        path: '/dashboard',
        icon: '📊',
      })

      expect(menuRepository.create).toHaveBeenCalled()
      expect(menuRepository.save).toHaveBeenCalled()
      expect(result).toEqual(mockMenu)
    })

    it('should get all menus', async () => {
      menuRepository.find.mockResolvedValue([mockMenu, mockSubMenu])

      const result = await service.getAllMenus()

      expect(menuRepository.find).toHaveBeenCalledWith({ where: { isActive: true }, order: { sortOrder: 'ASC' } })
      expect(result).toEqual([mockMenu, mockSubMenu])
    })

    it('should build menu tree', async () => {
      menuRepository.find.mockResolvedValue([mockMenu, mockSubMenu])

      const result = await service.getMenuTree()

      expect(result).toEqual([
        {
          ...mockMenu,
          children: [{ ...mockSubMenu, children: [] }],
        },
      ])
    })

    it('should get menu by id', async () => {
      menuRepository.findOne.mockResolvedValue(mockMenu)

      const result = await service.getMenuById(1)

      expect(menuRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
      expect(result).toEqual(mockMenu)
    })

    it('should throw NotFoundException when menu not found', async () => {
      menuRepository.findOne.mockResolvedValue(null)

      await expect(service.getMenuById(999)).rejects.toThrow(NotFoundException)
    })

    it('should update a menu', async () => {
      menuRepository.findOne.mockResolvedValue(mockMenu)
      menuRepository.save.mockResolvedValue({ ...mockMenu, name: '控制台' })

      const result = await service.updateMenu(1, { name: '控制台' })

      expect(menuRepository.save).toHaveBeenCalledWith({ ...mockMenu, name: '控制台' })
      expect(result.name).toBe('控制台')
    })

    it('should delete a menu (soft delete)', async () => {
      menuRepository.findOne.mockResolvedValue(mockMenu)
      menuRepository.save.mockResolvedValue({ ...mockMenu, isActive: false })

      const result = await service.deleteMenu(1)

      expect(menuRepository.save).toHaveBeenCalledWith({ ...mockMenu, isActive: false })
      expect(result.message).toBe('删除成功')
    })
  })

  // ==================== 角色菜单关联测试 ====================
  describe('角色菜单关联', () => {
    const mockRole: Role = {
      id: 1,
      name: 'admin',
      description: '管理员',
      status: 'active',
      menus: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockMenus: Menu[] = [
      {
        id: 1,
        name: '仪表盘',
        path: '/dashboard',
        icon: '📊',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        permission: 'dashboard:view',
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: '用户管理',
        path: '/users',
        icon: '👥',
        parentId: null,
        sortOrder: 2,
        isActive: true,
        permission: 'users:view',
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    it('should assign menus to role', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole)
      menuRepository.findByIds.mockResolvedValue(mockMenus)
      roleRepository.save.mockResolvedValue({ ...mockRole, menus: mockMenus })

      const result = await service.assignMenus(1, { menuIds: [1, 2] })

      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['menus'] })
      expect(menuRepository.findByIds).toHaveBeenCalledWith([1, 2])
      expect(roleRepository.save).toHaveBeenCalledWith({ ...mockRole, menus: mockMenus })
      expect(result.menus).toEqual(mockMenus)
    })
  })
})
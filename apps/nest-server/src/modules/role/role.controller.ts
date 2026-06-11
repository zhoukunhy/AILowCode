import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { RoleService } from './role.service'
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
 * 角色控制器
 * 提供角色、菜单和权限的管理接口
 */
@ApiTags('角色权限')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // ==================== 角色管理 ====================

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.createRole(createRoleDto)
  }

  @Get()
  @ApiOperation({ summary: '获取所有角色' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllRoles() {
    return this.roleService.getAllRoles()
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个角色' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.getRoleById(id)
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: '获取角色权限' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getRolePermissions(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.getRolePermissions(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto
  ) {
    return this.roleService.updateRole(id, updateRoleDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.deleteRole(id)
  }

  @Post(':id/menus')
  @ApiOperation({ summary: '为角色分配菜单' })
  @ApiResponse({ status: 200, description: '分配成功' })
  async assignMenus(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignMenusDto: AssignMenusDto
  ) {
    return this.roleService.assignMenus(id, assignMenusDto)
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: '为角色分配权限' })
  @ApiResponse({ status: 200, description: '分配成功' })
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto
  ) {
    return this.roleService.assignPermissions(id, assignPermissionsDto)
  }

  // ==================== 用户角色管理 ====================

  @Get('users/:userId/roles')
  @ApiOperation({ summary: '获取用户角色' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getUserRoles(@Param('userId', ParseIntPipe) userId: number) {
    return this.roleService.getUserRoles(userId)
  }

  @Get('users/:userId/permissions')
  @ApiOperation({ summary: '获取用户权限' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.roleService.getUserPermissions(userId)
  }

  @Get('users/:userId/menus')
  @ApiOperation({ summary: '获取用户菜单' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getUserMenuTree(@Param('userId', ParseIntPipe) userId: number) {
    return this.roleService.getUserMenuTree(userId)
  }

  @Post('users/:userId/roles')
  @ApiOperation({ summary: '为用户分配角色' })
  @ApiResponse({ status: 200, description: '分配成功' })
  async assignRolesToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() assignRolesDto: AssignRolesDto
  ) {
    return this.roleService.assignRolesToUser(userId, assignRolesDto)
  }

  @Get('users/:userId/check/:permissionCode')
  @ApiOperation({ summary: '检查用户权限' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async checkUserPermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('permissionCode') permissionCode: string
  ) {
    const hasPermission = await this.roleService.checkUserPermission(userId, permissionCode)
    return { hasPermission }
  }

  // ==================== 菜单管理 ====================

  @Post('menus')
  @ApiOperation({ summary: '创建菜单' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createMenu(@Body() createMenuDto: CreateMenuDto) {
    return this.roleService.createMenu(createMenuDto)
  }

  @Get('menus')
  @ApiOperation({ summary: '获取所有菜单' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllMenus() {
    return this.roleService.getAllMenus()
  }

  @Get('menus/tree')
  @ApiOperation({ summary: '获取菜单树' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getMenuTree() {
    return this.roleService.getMenuTree()
  }

  @Get('menus/:id')
  @ApiOperation({ summary: '获取单个菜单' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getMenuById(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.getMenuById(id)
  }

  @Put('menus/:id')
  @ApiOperation({ summary: '更新菜单' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuDto: UpdateMenuDto
  ) {
    return this.roleService.updateMenu(id, updateMenuDto)
  }

  @Delete('menus/:id')
  @ApiOperation({ summary: '删除菜单' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteMenu(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.deleteMenu(id)
  }

  // ==================== 权限管理 ====================

  @Post('permissions')
  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.roleService.createPermission(createPermissionDto)
  }

  @Get('permissions')
  @ApiOperation({ summary: '获取所有权限' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllPermissions() {
    return this.roleService.getAllPermissions()
  }

  @Get('permissions/tree')
  @ApiOperation({ summary: '获取权限树' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getPermissionTree() {
    return this.roleService.getPermissionTree()
  }

  @Get('permissions/:id')
  @ApiOperation({ summary: '获取单个权限' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.getPermissionById(id)
  }

  @Put('permissions/:id')
  @ApiOperation({ summary: '更新权限' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto
  ) {
    return this.roleService.updatePermission(id, updatePermissionDto)
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.deletePermission(id)
  }
}
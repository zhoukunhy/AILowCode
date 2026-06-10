import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { MenuService } from './menu.service'
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('菜单管理')
@Controller('api/menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @ApiOperation({ summary: '创建菜单' })
  @ApiResponse({ status: 201, description: '菜单创建成功' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto)
  }

  @Get()
  @ApiOperation({ summary: '获取所有菜单列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll() {
    return this.menuService.findAll()
  }

  @Get('tree')
  @ApiOperation({ summary: '获取菜单树结构' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findTree() {
    return this.menuService.findTree()
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个菜单' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新菜单' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(id, updateMenuDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  remove(@Param('id') id: string) {
    return this.menuService.remove(id)
  }
}
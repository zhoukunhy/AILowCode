import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MenuEntity } from './entities/menu.entity'
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto'

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
  ) {}

  async create(createMenuDto: CreateMenuDto): Promise<MenuEntity> {
    const menu = this.menuRepository.create(createMenuDto)
    return this.menuRepository.save(menu)
  }

  async findAll(): Promise<MenuEntity[]> {
    return this.menuRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    })
  }

  async findTree(): Promise<MenuEntity[]> {
    const menus = await this.menuRepository.find({
      order: { sortOrder: 'ASC' },
    })

    const menuMap = new Map<string, MenuEntity>()
    const rootMenus: MenuEntity[] = []

    for (const menu of menus) {
      menuMap.set(menu.id, { ...menu, children: [] })
    }

    for (const menu of menus) {
      const item = menuMap.get(menu.id)!
      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId)!
        if (!parent.children) parent.children = []
        parent.children.push(item)
      } else {
        rootMenus.push(item)
      }
    }

    return rootMenus
  }

  async findOne(id: string): Promise<MenuEntity> {
    const menu = await this.menuRepository.findOne({ where: { id } })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }
    return menu
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<MenuEntity> {
    const menu = await this.findOne(id)
    Object.assign(menu, updateMenuDto)
    return this.menuRepository.save(menu)
  }

  async remove(id: string): Promise<void> {
    const result = await this.menuRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('菜单不存在')
    }
  }

  async findByPageId(pageId: string): Promise<MenuEntity | null> {
    return this.menuRepository.findOne({ where: { pageId } })
  }
}
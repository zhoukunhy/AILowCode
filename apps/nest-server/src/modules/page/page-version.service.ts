import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PageVersion } from './entities/page-version.entity'
import { Page } from './entities/page.entity'
import { QueryPageVersionDto, RollbackVersionDto } from './dto/page-version.dto'

/**
 * 页面版本服务
 * 提供版本快照、版本历史、回滚和版本对比功能
 */
@Injectable()
export class PageVersionService {
  constructor(
    @InjectRepository(PageVersion)
    private versionRepository: Repository<PageVersion>,
    @InjectRepository(Page)
    private pageRepository: Repository<Page>
  ) {}

  /**
   * 创建版本快照
   * 在保存画布时自动调用
   */
  async createSnapshot(
    pageId: number,
    canvasJson: any,
    userId?: number,
    description?: string
  ): Promise<PageVersion> {
    const page = await this.pageRepository.findOne({ where: { id: pageId } })
    if (!page) {
      throw new NotFoundException('页面不存在')
    }

    // 获取当前最新版本号
    const latestVersion = await this.versionRepository.findOne({
      where: { pageId },
      order: { versionNumber: 'DESC' },
    })

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1
    const version = this.generateVersionString(nextVersionNumber)

    // 构建变更摘要
    const changeSummary = this.generateChangeSummary(
      latestVersion?.canvasJson,
      canvasJson
    )

    const snapshot = this.versionRepository.create({
      pageId,
      version,
      versionNumber: nextVersionNumber,
      canvasJson,
      pageConfig: {
        width: page.width,
        height: page.height,
        gridSize: page.gridSize,
        snapToGrid: page.snapToGrid,
        showGrid: page.showGrid,
        showRulers: page.showRulers,
        backgroundColor: page.backgroundColor,
      },
      description: description || `自动保存版本 ${version}`,
      changeSummary,
      createdBy: userId,
    })

    return this.versionRepository.save(snapshot)
  }

  /**
   * 获取页面版本历史
   */
  async findPageVersions(
    pageId: number,
    query: QueryPageVersionDto
  ): Promise<{ list: PageVersion[]; total: number }> {
    const { page = 1, pageSize = 20 } = query

    const [list, total] = await this.versionRepository.findAndCount({
      where: { pageId },
      order: { versionNumber: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return { list, total }
  }

  /**
   * 获取单个版本详情
   */
  async findOne(id: number): Promise<PageVersion> {
    const version = await this.versionRepository.findOne({
      where: { id },
      relations: ['page'],
    })

    if (!version) {
      throw new NotFoundException('版本不存在')
    }

    return version
  }

  /**
   * 回滚到指定版本
   */
  async rollback(
    pageId: number,
    versionId: number,
    rollbackDto: RollbackVersionDto
  ): Promise<Page> {
    const targetVersion = await this.findOne(versionId)
    if (targetVersion.pageId !== pageId) {
      throw new NotFoundException('版本不属于该页面')
    }

    const page = await this.pageRepository.findOne({ where: { id: pageId } })
    if (!page) {
      throw new NotFoundException('页面不存在')
    }

    // 恢复画布配置
    if (targetVersion.pageConfig) {
      Object.assign(page, targetVersion.pageConfig)
    }

    // 恢复画布 JSON
    page.canvasJson = targetVersion.canvasJson
    await this.pageRepository.save(page)

    // 创建新版本记录回滚操作
    await this.createSnapshot(
      pageId,
      targetVersion.canvasJson,
      undefined,
      rollbackDto.description || `回滚到版本 ${targetVersion.version}`
    )

    return page
  }

  /**
   * 对比两个版本的差异
   */
  async compareVersions(
    versionId1: number,
    versionId2: number
  ): Promise<{
    version1: PageVersion
    version2: PageVersion
    differences: any
  }> {
    const version1 = await this.findOne(versionId1)
    const version2 = await this.findOne(versionId2)

    const differences = this.calculateDifferences(
      version1.canvasJson,
      version2.canvasJson
    )

    return { version1, version2, differences }
  }

  /**
   * 删除版本
   */
  async remove(id: number): Promise<void> {
    const version = await this.findOne(id)
    await this.versionRepository.remove(version)
  }

  /**
   * 获取页面指定版本的Canvas JSON
   */
  async getVersionCanvasJson(id: number): Promise<any> {
    const version = await this.findOne(id)
    return {
      canvasJson: version.canvasJson,
      pageConfig: version.pageConfig,
      version: version.version,
    }
  }

  /**
   * 生成版本号字符串
   */
  private generateVersionString(versionNumber: number): string {
    return `${versionNumber}.0.0`
  }

  /**
   * 生成变更摘要
   */
  private generateChangeSummary(
    oldCanvasJson: any,
    newCanvasJson: any
  ): { added: number; removed: number; modified: number } {
    const oldComponents = oldCanvasJson?.components || []
    const newComponents = newCanvasJson?.components || []

    const oldIds = new Set(oldComponents.map((c: any) => c.id))
    const newIds = new Set(newComponents.map((c: any) => c.id))

    const added = newComponents.filter((c: any) => !oldIds.has(c.id)).length
    const removed = oldComponents.filter((c: any) => !newIds.has(c.id)).length

    let modified = 0
    for (const newComp of newComponents) {
      if (oldIds.has(newComp.id)) {
        const oldComp = oldComponents.find((c: any) => c.id === newComp.id)
        if (JSON.stringify(oldComp) !== JSON.stringify(newComp)) {
          modified++
        }
      }
    }

    return { added, removed, modified }
  }

  /**
   * 计算两个版本的详细差异
   */
  private calculateDifferences(
    oldCanvasJson: any,
    newCanvasJson: any
  ): any {
    if (!oldCanvasJson && !newCanvasJson) {
      return { hasChanges: false }
    }

    if (!oldCanvasJson || !newCanvasJson) {
      return {
        hasChanges: true,
        type: 'complete_replace',
        old: oldCanvasJson,
        new: newCanvasJson,
      }
    }

    const oldComponents = oldCanvasJson.components || []
    const newComponents = newCanvasJson.components || []

    const oldIds = new Map(oldComponents.map((c: any) => [c.id, c]))
    const newIds = new Map(newComponents.map((c: any) => [c.id, c]))

    const added: any[] = []
    const removed: any[] = []
    const modified: any[] = []

    // 检测新增的组件
    for (const [id, comp] of newIds) {
      if (!oldIds.has(id)) {
        added.push(comp)
      }
    }

    // 检测删除的组件
    for (const [id, comp] of oldIds) {
      if (!newIds.has(id)) {
        removed.push(comp)
      }
    }

    // 检测修改的组件
    for (const [id, newComp] of newIds) {
      if (oldIds.has(id)) {
        const oldComp = oldIds.get(id)
        if (JSON.stringify(oldComp) !== JSON.stringify(newComp)) {
          modified.push({
            id,
            oldProps: oldComp,
            newProps: newComp,
          })
        }
      }
    }

    return {
      hasChanges: added.length > 0 || removed.length > 0 || modified.length > 0,
      summary: {
        added: added.length,
        removed: removed.length,
        modified: modified.length,
      },
      details: { added, removed, modified },
    }
  }
}
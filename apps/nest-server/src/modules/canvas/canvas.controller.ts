import { Controller, Get, Post, Put, Delete, Patch, Param, Body, NotFoundException } from '@nestjs/common'
import { CanvasService, Canvas } from './canvas.service'

@Controller('api/canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get()
  findAll(): Canvas[] {
    return this.canvasService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string): Canvas {
    const canvas = this.canvasService.findOne(id)
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }

  @Post()
  create(@Body() canvas: Omit<Canvas, 'id' | 'createdAt' | 'updatedAt'>): Canvas {
    return this.canvasService.create(canvas)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updates: Partial<Canvas>): Canvas {
    const canvas = this.canvasService.update(id, updates)
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }

  @Delete(':id')
  delete(@Param('id') id: string): { success: boolean } {
    const success = this.canvasService.delete(id)
    if (!success) {
      throw new NotFoundException('画布不存在')
    }
    return { success }
  }

  @Post(':id/copy')
  copy(@Param('id') id: string): Canvas {
    const canvas = this.canvasService.copy(id)
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }

  @Patch(':id/model')
  updateDataModel(@Param('id') id: string, @Body() body: { dataModelId: string }): Canvas {
    const canvas = this.canvasService.updateDataModel(id, body.dataModelId)
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }
}

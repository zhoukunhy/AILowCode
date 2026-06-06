import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { TemplateService } from './template.service'
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto'

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templateService.create(createTemplateDto)
  }

  @Get()
  async findAll(@Query('category') category?: string) {
    return this.templateService.findAll(category)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templateService.findOne(+id)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.templateService.update(+id, updateTemplateDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.templateService.remove(+id)
  }

  @Post(':id/download')
  async download(@Param('id') id: string) {
    return this.templateService.incrementDownload(+id)
  }
}

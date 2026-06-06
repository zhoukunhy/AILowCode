import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  ParseIntPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger'
import { ProjectService } from './project.service'
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto'

/**
 * 项目控制器
 * 提供项目的 CRUD 接口
 */
@ApiTags('projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    return this.projectService.create(createProjectDto, req.user.userId)
  }

  @Get()
  @ApiOperation({ summary: '获取当前用户的所有项目' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Request() req: any) {
    return this.projectService.findAll(req.user.userId)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个项目详情' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(@Param('id', ParseIntPipe) id: string) {
    return this.projectService.findOne(+id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto
  ) {
    return this.projectService.update(+id, updateProjectDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: string) {
    return this.projectService.remove(+id)
  }
}

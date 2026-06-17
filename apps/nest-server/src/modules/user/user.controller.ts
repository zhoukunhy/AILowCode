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
import { UserService } from './user.service'
import { UpdateUserDto } from '../auth/dto/auth.dto'

class CreateUserDto {
  username!: string
  password!: string
  email!: string
}

/**
 * 用户控制器
 * 提供用户信息的查询和更新接口
 */
@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取所有用户列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll() {
    return this.userService.findAll()
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto.username, createUserDto.password, createUserDto.email)
  }

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getProfile(@Request() req: any) {
    return this.userService.findById(req.user.userId)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定用户信息' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(@Param('id', ParseIntPipe) id: string) {
    return this.userService.findById(+id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userService.update(+id, updateUserDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: string) {
    return this.userService.remove(+id)
  }
}

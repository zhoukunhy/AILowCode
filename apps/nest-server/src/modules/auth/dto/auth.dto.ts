import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator'

/**
 * 用户注册 DTO
 */
export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  username!: string

  @ApiProperty({ description: '密码（至少6位）', example: '123456' })
  @IsString()
  @MinLength(6)
  password!: string

  @ApiProperty({ description: '邮箱', example: 'admin@example.com' })
  @IsEmail()
  email!: string
}

/**
 * 用户登录 DTO
 */
export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  username!: string

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  password!: string
}

/**
 * 更新用户信息 DTO
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: '用户名' })
  @IsString()
  @IsOptional()
  username?: string

  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ description: '密码（至少6位）' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string
}

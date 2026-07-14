import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'

export class EnumOptionDto {
  @IsString()
  label!: string

  @IsString()
  value!: string | number

  @IsOptional()
  @IsString()
  color?: string
}

export class EnumDefinitionDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsString()
  label!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnumOptionDto)
  options!: EnumOptionDto[]
}

export class ValidationRuleDto {
  @IsString()
  id!: string

  @IsString()
  type!: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 
        'pattern' | 'email' | 'phone' | 'url' | 'custom'

  @IsOptional()
  value?: string | number

  @IsString()
  message!: string
}

export class DataPermissionDto {
  @IsString()
  id!: string

  @IsString()
  roleId!: string

  @IsString()
  roleName!: string

  @IsString()
  permissionType!: 'read' | 'write' | 'delete' | 'manage'
}

export class FieldDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsString()
  label!: string

  @IsString()
  type!: 'string' | 'number' | 'integer' | 'bigint' | 'smallint' |
        'decimal' | 'float' | 'double' | 'boolean' | 'date' | 'datetime' | 
        'timestamp' | 'text' | 'email' | 'phone' | 'password' | 'select' | 
        'textarea' | 'json' | 'uuid' | 'enum'

  @IsBoolean()
  required!: boolean

  @IsBoolean()
  primaryKey!: boolean

  @IsBoolean()
  unique!: boolean

  @IsBoolean()
  index!: boolean

  @IsOptional()
  foreignKey?: {
    entityId: string
    fieldId: string
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  }

  @IsOptional()
  defaultValue?: string | number | boolean

  @IsOptional()
  length?: number

  @IsOptional()
  precision?: number

  @IsOptional()
  scale?: number

  @IsOptional()
  options?: EnumOptionDto[]

  @IsOptional()
  enumId?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationRuleDto)
  validationRules!: ValidationRuleDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataPermissionDto)
  dataPermissions!: DataPermissionDto[]

  @IsOptional()
  @IsString()
  description?: string
}

export class EntityDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsString()
  tableName!: string

  @IsString()
  description!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDto)
  fields!: FieldDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataPermissionDto)
  dataPermissions!: DataPermissionDto[]

  @IsBoolean()
  softDelete!: boolean

  @IsBoolean()
  createdAtField!: boolean

  @IsBoolean()
  updatedAtField!: boolean
}

export class RelationDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsString()
  sourceEntityId!: string

  @IsOptional()
  @IsString()
  sourceFieldId?: string

  @IsString()
  targetEntityId!: string

  @IsOptional()
  @IsString()
  targetFieldId?: string

  @IsString()
  type!: 'one-to-one' | 'one-to-many' | 'many-to-many'

  @IsOptional()
  @IsBoolean()
  cascade?: boolean
}

export class CreateDataModelDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityDto)
  entities!: EntityDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelationDto)
  relations!: RelationDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnumDefinitionDto)
  enums!: EnumDefinitionDto[]

  @IsOptional()
  @IsString()
  projectId?: string
}

export class UpdateDataModelDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityDto)
  entities?: EntityDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelationDto)
  relations?: RelationDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnumDefinitionDto)
  enums?: EnumDefinitionDto[]
}
import { generateId } from '@ai-lowcode/common-util'
import type { Entity, Field } from '@/store/canvasStore'
import type { ComponentConfig } from '@/store/canvasStore'

const FIELD_TYPE_MAP: Record<string, string> = {
  string: 'input',
  number: 'numberInput',
  integer: 'numberInput',
  bigint: 'numberInput',
  smallint: 'numberInput',
  decimal: 'numberInput',
  float: 'numberInput',
  double: 'numberInput',
  boolean: 'switch',
  date: 'datepicker',
  datetime: 'datepicker',
  timestamp: 'datepicker',
  text: 'textarea',
  textarea: 'textarea',
  email: 'emailInput',
  phone: 'phoneInput',
  password: 'passwordInput',
  select: 'select',
  enum: 'select',
  json: 'textarea',
  uuid: 'input',
}

const FIELD_WIDTH_MAP: Record<string, number> = {
  input: 300,
  numberInput: 200,
  switch: 120,
  datepicker: 240,
  textarea: 400,
  emailInput: 300,
  phoneInput: 240,
  passwordInput: 300,
  select: 240,
}

const FIELD_HEIGHT_MAP: Record<string, number> = {
  input: 40,
  numberInput: 40,
  switch: 40,
  datepicker: 40,
  textarea: 120,
  emailInput: 40,
  phoneInput: 40,
  passwordInput: 40,
  select: 40,
}

export interface GenerateFormOptions {
  startX?: number
  startY?: number
  formWidth?: number
  fieldGap?: number
}

export class FormGenerator {
  static generateFromEntity(
    entity: Entity,
    options: GenerateFormOptions = {}
  ): ComponentConfig[] {
    const {
      startX = 80,
      startY = 60,
      formWidth = 500,
      fieldGap = 24,
    } = options

    const components: ComponentConfig[] = []
    let currentY = startY
    let zIndex = 1

    const titleComponent: ComponentConfig = {
      id: generateId(),
      type: 'heading',
      name: '表单标题',
      x: startX,
      y: currentY,
      width: formWidth,
      height: 48,
      props: {
        content: `${entity.name}表单`,
        level: 2,
        color: '#1a1a2e',
      },
      zIndex: zIndex++,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    }
    components.push(titleComponent)

    currentY += 60

    const formComponent: ComponentConfig = {
      id: generateId(),
      type: 'form',
      name: '表单容器',
      x: startX,
      y: currentY,
      width: formWidth,
      height: this.calculateFormHeight(entity.fields, fieldGap),
      props: {
        title: '',
        layout: 'vertical',
        colon: true,
      },
      zIndex: zIndex++,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    }
    components.push(formComponent)

    const formStartY = currentY
    currentY += 30

    const nonPrimaryFields = entity.fields.filter(f => !f.primaryKey)

    for (const field of nonPrimaryFields) {
      const component = this.generateFieldComponent(
        field,
        startX,
        currentY,
        formWidth,
        zIndex++
      )
      components.push(component)
      currentY += component.height + fieldGap
    }

    currentY += 20

    const submitButton: ComponentConfig = {
      id: generateId(),
      type: 'button',
      name: '提交按钮',
      x: startX,
      y: currentY,
      width: 100,
      height: 40,
      props: {
        text: '提交',
        type: 'primary',
        disabled: false,
      },
      zIndex: zIndex++,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    }
    components.push(submitButton)

    const cancelButton: ComponentConfig = {
      id: generateId(),
      type: 'button',
      name: '取消按钮',
      x: startX + 116,
      y: currentY,
      width: 100,
      height: 40,
      props: {
        text: '取消',
        type: 'default',
        disabled: false,
      },
      zIndex: zIndex++,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    }
    components.push(cancelButton)

    const formEndY = currentY + 60
    const finalFormHeight = formEndY - formStartY
    formComponent.height = finalFormHeight

    return components
  }

  private static generateFieldComponent(
    field: Field,
    x: number,
    y: number,
    _formWidth: number,
    zIndex: number
  ): ComponentConfig {
    const canvasType = FIELD_TYPE_MAP[field.type] || 'input'
    const width = FIELD_WIDTH_MAP[canvasType] || 300
    const height = FIELD_HEIGHT_MAP[canvasType] || 40

    const props: Record<string, any> = {
      label: field.label,
      placeholder: `请输入${field.label}`,
      required: field.required,
    }

    if (field.type === 'select' || field.type === 'enum') {
      props.options = field.options?.map(opt => opt.label) || ['选项1', '选项2', '选项3']
    }

    if (field.type === 'textarea') {
      props.rows = 4
    }

    if (field.type === 'number' || field.type === 'integer') {
      if (field.precision !== undefined) {
        props.max = Math.pow(10, field.precision) - 1
      }
    }

    if (field.defaultValue !== undefined) {
      props.value = field.defaultValue
    }

    if (field.description) {
      props.description = field.description
    }

    return {
      id: generateId(),
      type: canvasType,
      name: field.label,
      x,
      y,
      width,
      height,
      props,
      zIndex,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    }
  }

  private static calculateFormHeight(fields: Field[], gap: number): number {
    const nonPrimaryFields = fields.filter(f => !f.primaryKey)
    let height = 60

    for (const field of nonPrimaryFields) {
      const canvasType = FIELD_TYPE_MAP[field.type] || 'input'
      height += (FIELD_HEIGHT_MAP[canvasType] || 40) + gap
    }

    height += 120

    return height
  }
}
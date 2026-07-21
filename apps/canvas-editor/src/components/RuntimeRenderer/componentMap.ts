import type { ComponentConfig } from '@/store/canvasStore'

export type ComponentRenderer = React.ComponentType<{ component: ComponentConfig }>

const componentMap: Record<string, ComponentRenderer> = {}

export function registerComponent(type: string, renderer: ComponentRenderer) {
  componentMap[type] = renderer
}

export function getComponentRenderer(type: string): ComponentRenderer | undefined {
  return componentMap[type]
}

export function getAllComponentTypes(): string[] {
  return Object.keys(componentMap)
}
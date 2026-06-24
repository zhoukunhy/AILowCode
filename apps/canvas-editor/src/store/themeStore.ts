import { create } from 'zustand'

export interface ThemeColor {
  name: string
  value: string
  description?: string
}

export interface ThemeVariables {
  // 主色调
  primary: ThemeColor
  secondary: ThemeColor
  accent: ThemeColor
  
  // 中性色
  background: ThemeColor
  surface: ThemeColor
  text: ThemeColor
  textSecondary: ThemeColor
  border: ThemeColor
  
  // 功能色
  success: ThemeColor
  warning: ThemeColor
  error: ThemeColor
  info: ThemeColor
  
  // 阴影
  shadow: ThemeColor
  
  // 圆角
  borderRadius: ThemeColor
  
  // 间距
  spacing: ThemeColor
}

export interface ThemePreset {
  id: string
  name: string
  description: string
  variables: ThemeVariables
  preview: string
}

export const DEFAULT_THEME: ThemeVariables = {
  primary: { name: 'primary', value: '#3B82F6', description: '主色调' },
  secondary: { name: 'secondary', value: '#8B5CF6', description: '次要色调' },
  accent: { name: 'accent', value: '#F59E0B', description: '强调色' },
  background: { name: 'background', value: '#FFFFFF', description: '背景色' },
  surface: { name: 'surface', value: '#F3F4F6', description: '表面色' },
  text: { name: 'text', value: '#111827', description: '主文本色' },
  textSecondary: { name: 'textSecondary', value: '#6B7280', description: '次要文本色' },
  border: { name: 'border', value: '#E5E7EB', description: '边框色' },
  success: { name: 'success', value: '#10B981', description: '成功色' },
  warning: { name: 'warning', value: '#F59E0B', description: '警告色' },
  error: { name: 'error', value: '#EF4444', description: '错误色' },
  info: { name: 'info', value: '#3B82F6', description: '信息色' },
  shadow: { name: 'shadow', value: 'rgba(0, 0, 0, 0.1)', description: '阴影色' },
  borderRadius: { name: 'borderRadius', value: '8px', description: '圆角大小' },
  spacing: { name: 'spacing', value: '16px', description: '基础间距' },
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: '默认蓝色',
    description: '经典的蓝色主题，适合大多数场景',
    variables: DEFAULT_THEME,
    preview: '🔵',
  },
  {
    id: 'dark',
    name: '暗黑模式',
    description: '深色主题，适合夜间使用',
    variables: {
      primary: { name: 'primary', value: '#60A5FA', description: '主色调' },
      secondary: { name: 'secondary', value: '#A78BFA', description: '次要色调' },
      accent: { name: 'accent', value: '#FBBF24', description: '强调色' },
      background: { name: 'background', value: '#111827', description: '背景色' },
      surface: { name: 'surface', value: '#1F2937', description: '表面色' },
      text: { name: 'text', value: '#F9FAFB', description: '主文本色' },
      textSecondary: { name: 'textSecondary', value: '#9CA3AF', description: '次要文本色' },
      border: { name: 'border', value: '#374151', description: '边框色' },
      success: { name: 'success', value: '#34D399', description: '成功色' },
      warning: { name: 'warning', value: '#FBBF24', description: '警告色' },
      error: { name: 'error', value: '#F87171', description: '错误色' },
      info: { name: 'info', value: '#60A5FA', description: '信息色' },
      shadow: { name: 'shadow', value: 'rgba(0, 0, 0, 0.3)', description: '阴影色' },
      borderRadius: { name: 'borderRadius', value: '8px', description: '圆角大小' },
      spacing: { name: 'spacing', value: '16px', description: '基础间距' },
    },
    preview: '🌙',
  },
  {
    id: 'forest',
    name: '森林绿',
    description: '清新的绿色主题，给人自然舒适的感觉',
    variables: {
      primary: { name: 'primary', value: '#10B981', description: '主色调' },
      secondary: { name: 'secondary', value: '#059669', description: '次要色调' },
      accent: { name: 'accent', value: '#FBBF24', description: '强调色' },
      background: { name: 'background', value: '#FFFFFF', description: '背景色' },
      surface: { name: 'surface', value: '#ECFDF5', description: '表面色' },
      text: { name: 'text', value: '#064E3B', description: '主文本色' },
      textSecondary: { name: 'textSecondary', value: '#047857', description: '次要文本色' },
      border: { name: 'border', value: '#A7F3D0', description: '边框色' },
      success: { name: 'success', value: '#10B981', description: '成功色' },
      warning: { name: 'warning', value: '#F59E0B', description: '警告色' },
      error: { name: 'error', value: '#EF4444', description: '错误色' },
      info: { name: 'info', value: '#3B82F6', description: '信息色' },
      shadow: { name: 'shadow', value: 'rgba(16, 185, 129, 0.1)', description: '阴影色' },
      borderRadius: { name: 'borderRadius', value: '8px', description: '圆角大小' },
      spacing: { name: 'spacing', value: '16px', description: '基础间距' },
    },
    preview: '🌲',
  },
  {
    id: 'sunset',
    name: '日落橙',
    description: '温暖的橙色主题，充满活力',
    variables: {
      primary: { name: 'primary', value: '#F97316', description: '主色调' },
      secondary: { name: 'secondary', value: '#FB923C', description: '次要色调' },
      accent: { name: 'accent', value: '#FBBF24', description: '强调色' },
      background: { name: 'background', value: '#FFFFFF', description: '背景色' },
      surface: { name: 'surface', value: '#FFF7ED', description: '表面色' },
      text: { name: 'text', value: '#7C2D12', description: '主文本色' },
      textSecondary: { name: 'textSecondary', value: '#9A3412', description: '次要文本色' },
      border: { name: 'border', value: '#FED7AA', description: '边框色' },
      success: { name: 'success', value: '#10B981', description: '成功色' },
      warning: { name: 'warning', value: '#F59E0B', description: '警告色' },
      error: { name: 'error', value: '#EF4444', description: '错误色' },
      info: { name: 'info', value: '#3B82F6', description: '信息色' },
      shadow: { name: 'shadow', value: 'rgba(249, 115, 22, 0.1)', description: '阴影色' },
      borderRadius: { name: 'borderRadius', value: '8px', description: '圆角大小' },
      spacing: { name: 'spacing', value: '16px', description: '基础间距' },
    },
    preview: '🌅',
  },
  {
    id: 'purple',
    name: '紫色梦境',
    description: '神秘的紫色主题，富有创意感',
    variables: {
      primary: { name: 'primary', value: '#8B5CF6', description: '主色调' },
      secondary: { name: 'secondary', value: '#A78BFA', description: '次要色调' },
      accent: { name: 'accent', value: '#F472B6', description: '强调色' },
      background: { name: 'background', value: '#FFFFFF', description: '背景色' },
      surface: { name: 'surface', value: '#F5F3FF', description: '表面色' },
      text: { name: 'text', value: '#4C1D95', description: '主文本色' },
      textSecondary: { name: 'textSecondary', value: '#5B21B6', description: '次要文本色' },
      border: { name: 'border', value: '#DDD6FE', description: '边框色' },
      success: { name: 'success', value: '#10B981', description: '成功色' },
      warning: { name: 'warning', value: '#F59E0B', description: '警告色' },
      error: { name: 'error', value: '#EF4444', description: '错误色' },
      info: { name: 'info', value: '#3B82F6', description: '信息色' },
      shadow: { name: 'shadow', value: 'rgba(139, 92, 246, 0.1)', description: '阴影色' },
      borderRadius: { name: 'borderRadius', value: '12px', description: '圆角大小' },
      spacing: { name: 'spacing', value: '16px', description: '基础间距' },
    },
    preview: '💜',
  },
]

interface ThemeState {
  currentTheme: ThemeVariables
  currentPresetId: string
  customThemes: ThemePreset[]
  isDarkMode: boolean
  
  // 主题操作
  setTheme: (theme: ThemeVariables) => void
  setPreset: (presetId: string) => void
  updateThemeVariable: (key: keyof ThemeVariables, value: string) => void
  toggleDarkMode: () => void
  saveCustomTheme: (name: string, description: string) => void
  deleteCustomTheme: (themeId: string) => void
  exportTheme: () => string
  importTheme: (json: string) => void
  resetTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: DEFAULT_THEME,
  currentPresetId: 'default',
  customThemes: [],
  isDarkMode: false,
  
  setTheme: (theme) => set({ currentTheme: theme }),
  
  setPreset: (presetId) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId)
    if (preset) {
      set({ 
        currentTheme: preset.variables, 
        currentPresetId: presetId 
      })
    }
  },
  
  updateThemeVariable: (key, value) => {
    set((state) => ({
      currentTheme: {
        ...state.currentTheme,
        [key]: { ...state.currentTheme[key], value }
      }
    }))
  },
  
  toggleDarkMode: () => {
    const newDarkMode = !get().isDarkMode
    set({ isDarkMode: newDarkMode })
    
    // 自动切换到对应的预设
    if (newDarkMode) {
      get().setPreset('dark')
    } else {
      get().setPreset('default')
    }
  },
  
  saveCustomTheme: (name, description) => {
    const { currentTheme, customThemes } = get()
    const newTheme: ThemePreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      variables: currentTheme,
      preview: '🎨',
    }
    set({ customThemes: [...customThemes, newTheme] })
  },
  
  deleteCustomTheme: (themeId) => {
    set((state) => ({
      customThemes: state.customThemes.filter(t => t.id !== themeId)
    }))
  },
  
  exportTheme: () => {
    const { currentTheme, currentPresetId } = get()
    return JSON.stringify({
      presetId: currentPresetId,
      variables: currentTheme,
      exportedAt: new Date().toISOString(),
    }, null, 2)
  },
  
  importTheme: (json) => {
    try {
      const data = JSON.parse(json)
      if (data.variables) {
        set({ 
          currentTheme: data.variables,
          currentPresetId: data.presetId || 'custom'
        })
      }
    } catch (error) {
      console.error('导入主题失败:', error)
      throw new Error('主题格式不正确')
    }
  },
  
  resetTheme: () => {
    set({
      currentTheme: DEFAULT_THEME,
      currentPresetId: 'default',
      isDarkMode: false,
    })
  },
}))
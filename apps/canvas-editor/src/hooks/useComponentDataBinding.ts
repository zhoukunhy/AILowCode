'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDataPreviewStore } from '@/store/dataPreviewStore'
import { useCanvasStore } from '@/store/canvasStore'

export type BindingMode = 'single' | 'list' | 'form' | 'table'

// 将 BindingMode 转换为 QueryConfig 所需的类型
const bindingModeToQueryType = (mode: BindingMode): 'table' | 'query' | 'endpoint' => {
  switch (mode) {
    case 'table':
      return 'table'
    case 'single':
    case 'list':
    case 'form':
    default:
      return 'table'
  }
}

export interface DataBindingResult {
  data: any[]
  value: any
  fields: string[]
  total: number
  isLoading: boolean
  error: string | undefined
  refresh: () => void
  updateField: (fieldName: string, value: any) => void
}

export interface ComponentDataBindingOptions {
  bindingMode?: BindingMode
  autoFetch?: boolean
  debounceDelay?: number
  defaultField?: string
}

export function useComponentDataBinding(
  componentId: string,
  options: ComponentDataBindingOptions = {}
): DataBindingResult {
  const {
    bindingMode = 'single',
    autoFetch = true,
    debounceDelay = 500,
    defaultField,
  } = options

  const {
    fetchPreviewData,
    getPreviewData,
    refreshPreviewData,
  } = useDataPreviewStore()

  const components = useCanvasStore((state) => state.components)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [data, setData] = useState<any[]>([])
  const [fields, setFields] = useState<string[]>([])
  const [total, setTotal] = useState(0)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 获取组件的绑定配置
  const getBindingConfig = useCallback(() => {
    const component = components.find((c) => c.id === componentId)
    if (!component) return null

    const { dataSourceId, dataField } = component.props
    if (!dataSourceId) return null

    return {
      dataSourceId,
      dataField: dataField || defaultField,
    }
  }, [componentId, components, defaultField])

  const fetchData = useCallback(async () => {
    const config = getBindingConfig()
    if (!config?.dataSourceId) {
      setData([])
      setFields([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      await fetchPreviewData(componentId, config.dataSourceId, { type: bindingModeToQueryType(bindingMode) })
      const preview = getPreviewData(componentId)
      if (preview) {
        setData(preview.data)
        setFields(preview.fields)
        setTotal(preview.total)
        setError(preview.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [componentId, getBindingConfig, fetchPreviewData, getPreviewData, bindingMode])

  // 当组件配置变化时重新获取数据
  useEffect(() => {
    const config = getBindingConfig()
    if (!config?.dataSourceId) {
      setData([])
      setFields([])
      setTotal(0)
      return
    }

    if (autoFetch) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchData()
      }, debounceDelay)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [getBindingConfig, autoFetch, debounceDelay, fetchData, components])

  const refresh = useCallback(async () => {
    const config = getBindingConfig()
    if (!config?.dataSourceId) return

    await refreshPreviewData(componentId)
    const preview = getPreviewData(componentId)
    if (preview) {
      setData(preview.data)
      setFields(preview.fields)
      setTotal(preview.total)
      setError(preview.error)
    }
  }, [componentId, getBindingConfig, refreshPreviewData, getPreviewData])

  const updateField = useCallback((fieldName: string, value: any) => {
    // 更新本地缓存的数据
    setData((prev) =>
      prev.map((item) => ({
        ...item,
        [fieldName]: value,
      }))
    )
  }, [])

  // 根据绑定模式返回不同的值
  const config = getBindingConfig()
  let value: any = undefined

  if (bindingMode === 'single' && data.length > 0) {
    value = config?.dataField ? data[0][config.dataField] : data[0]
  } else if (bindingMode === 'list' && data.length > 0) {
    value = config?.dataField ? data.map((item) => item[config.dataField]) : data
  }

  return {
    data,
    value,
    fields,
    total,
    isLoading,
    error,
    refresh,
    updateField,
  }
}

// 简化版本：用于单字段绑定
export function useFieldBinding(
  componentId: string,
  fieldName?: string
): Pick<DataBindingResult, 'value' | 'isLoading' | 'error' | 'refresh'> {
  const { value, isLoading, error, refresh } = useComponentDataBinding(componentId, {
    bindingMode: 'single',
    defaultField: fieldName,
  })

  return { value, isLoading, error, refresh }
}

// 简化版本：用于列表绑定
export function useListBinding(
  componentId: string
): Pick<DataBindingResult, 'data' | 'fields' | 'total' | 'isLoading' | 'error' | 'refresh'> {
  const { data, fields, total, isLoading, error, refresh } = useComponentDataBinding(componentId, {
    bindingMode: 'list',
  })

  return { data, fields, total, isLoading, error, refresh }
}

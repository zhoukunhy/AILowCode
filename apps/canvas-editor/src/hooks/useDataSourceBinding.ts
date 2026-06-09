import { useState, useEffect, useCallback } from 'react'
import { useDataPreviewStore } from '@/store/dataPreviewStore'
import { QueryConfig } from '@/store/dataPreviewStore'

export interface DataBindingOptions {
  autoFetch?: boolean
  debounceDelay?: number
  pagination?: { page: number; pageSize: number }
}

export function useDataSourceBinding(
  componentId: string,
  dataSourceId: string | undefined,
  queryConfig?: QueryConfig,
  options: DataBindingOptions = {}
) {
  const {
    fetchPreviewData,
    getPreviewData,
    refreshPreviewData,
    clearPreviewData,
    dataSources,
    getFieldsByDataSource,
  } = useDataPreviewStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [data, setData] = useState<any[]>([])
  const [fields, setFields] = useState<string[]>([])
  const [total, setTotal] = useState(0)

  const { autoFetch = true, debounceDelay = 500, pagination } = options

  const resolvedQueryConfig: QueryConfig = {
    type: 'table',
    ...queryConfig,
    pagination: pagination || queryConfig?.pagination,
  }

  const fetchData = useCallback(async () => {
    if (!componentId || !dataSourceId) {
      setData([])
      setFields([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      await fetchPreviewData(componentId, dataSourceId, resolvedQueryConfig)
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
  }, [componentId, dataSourceId, resolvedQueryConfig, fetchPreviewData, getPreviewData])

  useEffect(() => {
    if (autoFetch && dataSourceId) {
      const timer = setTimeout(() => {
        fetchData()
      }, debounceDelay)
      return () => clearTimeout(timer)
    } else if (!dataSourceId) {
      setData([])
      setFields([])
      setTotal(0)
    }
    return undefined
  }, [dataSourceId, autoFetch, debounceDelay, fetchData])

  const refresh = useCallback(async () => {
    await refreshPreviewData(componentId)
    const preview = getPreviewData(componentId)
    if (preview) {
      setData(preview.data)
      setFields(preview.fields)
      setTotal(preview.total)
      setError(preview.error)
    }
  }, [componentId, refreshPreviewData, getPreviewData])

  const clear = useCallback(() => {
    clearPreviewData(componentId)
    setData([])
    setFields([])
    setTotal(0)
    setError(undefined)
  }, [componentId, clearPreviewData])

  const dataSource = dataSources.find((ds) => ds.id === dataSourceId)
  const dataSourceFields = dataSourceId ? getFieldsByDataSource(dataSourceId) : []

  return {
    data,
    fields,
    total,
    isLoading,
    error,
    dataSource,
    dataSourceFields,
    fetchData,
    refresh,
    clear,
  }
}

export function useSingleFieldBinding(
  componentId: string,
  dataSourceId: string | undefined,
  fieldName: string | undefined
) {
  const { data, isLoading, error, refresh } = useDataSourceBinding(componentId, dataSourceId)

  const fieldValues = fieldName ? data.map((item) => item[fieldName]).filter(Boolean) : []
  const firstValue = fieldValues[0]

  return {
    value: firstValue,
    values: fieldValues,
    data,
    isLoading,
    error,
    refresh,
  }
}
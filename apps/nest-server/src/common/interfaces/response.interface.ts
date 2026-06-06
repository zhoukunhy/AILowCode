/**
 * 统一响应接口
 * 所有接口返回的数据格式
 */
export interface ApiResponse<T = any> {
  /** 状态码，0表示成功 */
  code: number
  /** 响应消息 */
  msg: string
  /** 响应数据 */
  data?: T
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T = any> {
  /** 状态码，0表示成功 */
  code: number
  /** 响应消息 */
  msg: string
  /** 数据列表 */
  data: {
    list: T[]
    total: number
    page: number
    pageSize: number
  }
}

/**
 * 成功响应
 */
export const successResponse = <T>(data?: T, msg = '操作成功'): ApiResponse<T> => ({
  code: 0,
  msg,
  data,
})

/**
 * 错误响应
 */
export const errorResponse = (msg = '操作失败', code = -1): ApiResponse => ({
  code,
  msg,
})

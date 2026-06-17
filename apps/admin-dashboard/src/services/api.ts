import axios from 'axios'
import { message } from 'antd'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: 'http://localhost:3002',
  timeout: 10000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const { code, msg, data } = response.data
    if (code === 200 || code === 201) {
      return data
    } else {
      message.error(msg || 'Request failed')
      return Promise.reject(new Error(msg))
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      message.error('Login expired, please login again')
      window.location.href = '/login'
    } else if (error.response?.data?.msg) {
      message.error(error.response.data.msg)
    } else {
      message.error('Network error, please try again later')
    }
    return Promise.reject(error)
  }
)

export default api
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { isDemoMode } from '../config/demoMode.js'
import { resolveDemoMock } from './demoMocks.js'

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

const client = axios.create({
  baseURL: apiBase,
  withCredentials: true,
})

if (isDemoMode) {
  client.defaults.adapter = (config) =>
    Promise.resolve({
      data: resolveDemoMock(config),
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
    })
}

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (
      error.response?.status === 401 &&
      !isRefreshing &&
      original &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      isRefreshing = true
      try {
        const { data } = await axios.post(`${apiBase}/auth/refresh`, {}, { withCredentials: true })
        useAuthStore.getState().setToken(data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        isRefreshing = false
        return client.request(original)
      } catch {
        isRefreshing = false
        useAuthStore.getState().logout()
        if (!isDemoMode) window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client

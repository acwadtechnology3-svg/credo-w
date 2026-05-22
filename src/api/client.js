import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useApiMocks } from '../config/demoMode.js'
import { resolveDemoMock } from './demoMocks.js'
import { normalizeApiPayload } from './normalizeResponse.js'

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

const client = axios.create({
  baseURL: apiBase,
  withCredentials: true,
})

function pathFromConfig(config) {
  const raw = config.url || ''
  if (raw.startsWith('http')) {
    try {
      return new URL(raw).pathname.replace(/^\/api/, '') || '/'
    } catch {
      return raw
    }
  }
  const base = (config.baseURL || '').replace(/\/$/, '')
  const joined = `${base}${raw}`.replace(/\/api/, '')
  return joined.startsWith('/') ? joined : `/${joined}`
}

if (useApiMocks) {
  client.defaults.adapter = (config) => {
    const data = normalizeApiPayload(
      pathFromConfig(config),
      config.method,
      resolveDemoMock(config)
    )
    return Promise.resolve({
      data,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
    })
  }
}

let isRefreshing = false

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => {
    res.data = normalizeApiPayload(pathFromConfig(res.config), res.config.method, res.data)
    return res
  },
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
        if (!useApiMocks) window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client

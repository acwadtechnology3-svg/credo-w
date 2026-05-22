import { matchDemoRoute } from './demoFixtures.js'

function pathOf(config) {
  const raw = config.url || ''
  const base = (config.baseURL || '').replace(/\/$/, '')
  if (raw.startsWith('http')) {
    try {
      return new URL(raw).pathname.replace(/^\/api/, '') || '/'
    } catch {
      return raw
    }
  }
  const joined = `${base}${raw}`.replace(/\/api/, '')
  return joined.startsWith('/') ? joined : `/${joined}`
}

export function resolveDemoMock(config) {
  const path = pathOf(config)
  const method = (config.method || 'get').toLowerCase()
  const hit = matchDemoRoute(path, method)
  if (hit != null) return hit
  if (method === 'get') return []
  return { ok: true, success: true }
}

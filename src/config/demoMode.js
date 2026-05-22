/**
 * Demo: explicit VITE_DEMO_MODE=true
 * Preview: production build with no VITE_API_URL (Vercel UI-only until backend URL is set)
 * Production: set VITE_API_URL to your deployed API origin
 */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export const isProductionBuild = import.meta.env.PROD

export const hasApiUrl = Boolean(import.meta.env.VITE_API_URL?.trim())

/** Frontend-only Vercel deploy — mock API so pages do not crash */
export const isPreviewDeploy = isProductionBuild && !hasApiUrl && !isDemoMode

export const useApiMocks = isDemoMode || isPreviewDeploy

export const isSocketsEnabled =
  !useApiMocks && Boolean(import.meta.env.VITE_SOCKET_URL || import.meta.env.DEV)

/** API user shape returned by /auth/me mocks */
export const DEMO_API_USER = {
  id: 'demo-user-uuid',
  user_code: 'CW-DEMO',
  username: 'demo.founder',
  full_name: 'أحمد الديمو',
  email: 'demo@credow.com',
  role: import.meta.env.VITE_DEMO_ROLE || 'member',
  status: 'active',
  rank: { name: 'Silver Director', level: 3 },
  ranks: { name: 'Silver Director', level: 3 },
  currency: 'USD',
  country: 'AE',
}

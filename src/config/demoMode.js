/**
 * Vercel / frontend-only demo deployment.
 * Enabled when VITE_DEMO_MODE=true or production build has no VITE_API_URL.
 */
export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  (import.meta.env.PROD && !import.meta.env.VITE_API_URL)

export const isSocketsEnabled =
  !isDemoMode &&
  Boolean(import.meta.env.VITE_SOCKET_URL || import.meta.env.DEV)

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

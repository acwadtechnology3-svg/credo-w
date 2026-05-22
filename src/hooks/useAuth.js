import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'
import { mapUserForStore } from '../lib/mapUser'
import { useApiMocks, DEMO_API_USER } from '../config/demoMode.js'

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout, hasRole, authReady } = useAuthStore()
  return { user, token, isAuthenticated, login, logout, hasRole, authReady }
}

export const useInitAuth = () => {
  const { login, logout, setAuthReady } = useAuthStore()

  useEffect(() => {
    const restore = async () => {
      if (useApiMocks) {
        login(mapUserForStore(DEMO_API_USER), 'demo-access-token')
        setAuthReady(true)
        return
      }
      try {
        const { data: refreshData } = await client.post('/auth/refresh')
        const { data: meData } = await client.get('/auth/me', {
          headers: { Authorization: `Bearer ${refreshData.accessToken}` },
        })
        login(mapUserForStore(meData.user), refreshData.accessToken)
      } catch {
        logout()
      } finally {
        setAuthReady(true)
      }
    }
    restore()
  }, [])
}

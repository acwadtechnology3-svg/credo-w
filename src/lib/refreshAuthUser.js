import client from '../api/client'
import { useAuthStore } from '../store/authStore'
import { mapUserForStore } from './mapUser'

/** Reload user from /auth/me (e.g. after avatar upload). */
export async function refreshAuthUser() {
  const { data } = await client.get('/auth/me')
  useAuthStore.getState().setUser(mapUserForStore(data.user))
  return data.user
}

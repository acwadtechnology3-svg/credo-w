import { useQuery } from '@tanstack/react-query'
import { getProfile } from '../api/profile.api'
import { useAuthStore } from '../store/authStore'

/** Fresh signed avatar URL from API (Topbar, Sidebar, etc.). */
export function useProfileAvatar() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const storeImage = useAuthStore((s) => s.user?.profile_image)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  })

  return profile?.profile_image || storeImage || null
}

import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getSupportUnread } from '../../api/support.api'
import Icon from '../ui/Icon'
import '../../support/styles/support.css'

const HIDDEN_PATHS = ['/login', '/register', '/auth/callback']

export default function FloatingSupportButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data } = useQuery({
    queryKey: ['support-unread'],
    queryFn: getSupportUnread,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  if (HIDDEN_PATHS.some((p) => location.pathname.startsWith(p))) return null
  if (location.pathname.startsWith('/support') && location.pathname.length < 20) return null

  const count = data?.count || 0

  return (
    <button
      type="button"
      className="support-fab"
      aria-label="مركز الدعم"
      onClick={() => navigate('/support')}
    >
      <Icon name="support" size={24} />
      {count > 0 && <span className="support-fab-badge">{count > 9 ? '9+' : count}</span>}
    </button>
  )
}

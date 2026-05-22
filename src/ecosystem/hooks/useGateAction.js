import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

/** Redirect to login when a gated action requires an account. */
export default function useGateAction() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const gate = (target, { requiresAuth = false, message } = {}) => {
    if (requiresAuth && !isAuthenticated) {
      navigate('/login', {
        state: {
          from: typeof target === 'string' ? target : undefined,
          message:
            message ||
            'سجّل دخولك أو أنشئ حسابًا لمتابعة هذه الخطوة داخل المنظومة.',
        },
      })
      return false
    }
    if (target) navigate(target)
    return true
  }

  return { isAuthenticated, gate }
}

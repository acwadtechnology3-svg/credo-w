import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import client from '../../api/client'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import { mapUserForStore } from '../../lib/mapUser'
import PageLoader from '../../components/shared/PageLoader'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function finish() {
      if (!supabase) {
        setError('إعدادات Supabase غير مكتملة على الواجهة')
        return
      }

      const authError = searchParams.get('error_description') || searchParams.get('error')
      if (authError) {
        setError(decodeURIComponent(authError.replace(/\+/g, ' ')))
        return
      }

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr) {
        setError(sessionErr.message)
        return
      }

      let accessToken = sessionData.session?.access_token
      if (!accessToken) {
        await new Promise((r) => setTimeout(r, 400))
        const retry = await supabase.auth.getSession()
        accessToken = retry.data.session?.access_token
      }

      if (!accessToken) {
        setError('لم يتم استلام جلسة Google. جرّب مرة أخرى من صفحة الدخول.')
        return
      }

      try {
        const { data } = await client.post('/auth/google', { access_token: accessToken })
        if (cancelled) return
        await supabase.auth.signOut()
        login(mapUserForStore(data.user), data.accessToken)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        if (cancelled) return
        const body = err.response?.data
        if (body?.code === 'NEED_SIGNUP') {
          await supabase.auth.signOut()
          const params = new URLSearchParams()
          if (body.email) params.set('email', body.email)
          if (body.full_name) params.set('name', body.full_name)
          params.set('google', '1')
          const ref = searchParams.get('ref')
          const side = searchParams.get('side')
          if (ref) params.set('ref', ref)
          if (side) params.set('side', side)
          navigate(`/register?${params.toString()}`, { replace: true })
          return
        }
        if (err.response?.status === 403) {
          setError(body?.error || 'الحساب غير مفعّل')
          await supabase.auth.signOut()
          return
        }
        setError(body?.error || 'فشل تسجيل الدخول بجوجل')
        await supabase.auth.signOut()
      }
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [login, navigate, searchParams])

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}
        dir="rtl"
      >
        <p className="pill bad" style={{ maxWidth: 420 }}>
          {error}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/login', { replace: true })}
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    )
  }

  return <PageLoader text="جاري التحقق من حساب Google..." />
}

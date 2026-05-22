import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../../components/ui/Logo'
import Icon from '../../components/ui/Icon'
import client from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { mapUserForStore } from '../../lib/mapUser'
import { supabase } from '../../lib/supabaseClient'
import { toast } from '../../components/shared/Toast'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../../i18n/hooks/useLocale.js'
import LanguageSwitcher from '../../components/i18n/LanguageSwitcher'
import { useApiMocks } from '../../config/demoMode'

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const { dir } = useLocale()
  const [searchParams] = useSearchParams()
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [form, setForm] = useState({ username_or_email: '', password: '' })
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    if (useApiMocks) {
      toast.info('تسجيل Google معطّل في نسخة العرض — استخدم تسجيل الدخول التجريبي')
      return
    }
    if (!supabase) {
      toast.error('إعدادات Supabase غير مكتملة — أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY')
      return
    }
    setGoogleLoading(true)
    setError('')
    try {
      const redirectTo = new URL('/auth/callback', window.location.origin)
      const ref = searchParams.get('ref')
      const side = searchParams.get('side')
      if (ref) redirectTo.searchParams.set('ref', ref)
      if (side) redirectTo.searchParams.set('side', side)

      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectTo.toString() },
      })
      if (oauthErr) throw oauthErr
    } catch (err) {
      setError(err.message || 'تعذّر فتح تسجيل الدخول بجوجل')
      setGoogleLoading(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await client.post('/auth/login', form)
      login(mapUserForStore(data.user), data.accessToken)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.error
      if (status === 429) {
        setError('طلبات كثيرة على السيرفر — انتظر دقيقة أو أعد تشغيل npm run dev')
      } else if (status === 403) {
        setError(msg || 'الحساب غير مفعّل')
      } else if (status === 401) {
        const hint = err.response?.data?.hint
        setError(
          hint
            ? `بيانات الدخول غير صحيحة. ${hint}`
            : 'اسم المستخدم أو كلمة المرور غير صحيحة'
        )
      } else if (!err.response) {
        setError('تعذّر الاتصال بالسيرفر — تأكد أن npm run dev يعمل')
      } else {
        setError(msg || 'فشل تسجيل الدخول')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split" dir={dir}>
      <div style={{ position: 'fixed', top: 16, insetInlineEnd: 16, zIndex: 20 }}>
        <LanguageSwitcher variant="app" />
      </div>
      <div
        className="auth-split-visual"
        style={{ position: 'relative', overflow: 'hidden', borderInlineEnd: '1px solid var(--line)' }}
      >
        <div
          className="glow-blob"
          style={{
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(99,102,241,0.30), transparent 65%)',
            top: '20%',
            insetInlineStart: '20%',
            filter: 'blur(60px)',
          }}
        />
        <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 60 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div className="font-display" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}>
              توازن. ثقة. <span className="gradient-text">دقّة.</span>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
              منظومة تنظيم رقمية للتوسع والقيادة — سجّل دخولك لمتابعة رحلتك داخل المنظومة.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 40 }}>
        <div className="anim-fade-up" style={{ width: '100%', maxWidth: 420 }}>
          <Logo size="lg" />
          <h1 style={{ fontSize: 32, marginTop: 32, marginBottom: 8, fontWeight: 800 }}>{t('login.title')}</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>{t('login.subtitle')}</p>

          {error && (
            <p
              className="pill bad"
              style={{ marginBottom: 16, width: '100%', justifyContent: 'center', padding: '10px 12px' }}
            >
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="field">
              <span>{t('login.email')}</span>
              <input
                className="input font-mono"
                placeholder="omar1222 أو oa538154@gmail.com"
                value={form.username_or_email}
                onChange={(e) => setForm((p) => ({ ...p, username_or_email: e.target.value }))}
                required
                autoComplete="username"
              />
            </label>
            <label className="field">
              <span>{t('login.password')}</span>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  style={{ paddingInlineEnd: 40 }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute',
                    insetInlineEnd: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 0,
                    color: 'var(--text-3)',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name={showPwd ? 'eye-off' : 'eye'} size={15} />
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-xl"
              style={{ width: '100%', marginTop: 6 }}
              disabled={loading || googleLoading}
            >
              {loading ? 'جاري الدخول...' : 'دخول'}
              {!loading && <Icon name="arrow-left" size={14} />}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '4px 0',
                color: 'var(--text-3)',
                fontSize: 12,
              }}
            >
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              أو
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>

            <button
              type="button"
              className="btn btn-xl"
              style={{
                width: '100%',
                background: '#fff',
                border: '1px solid var(--line)',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
              disabled={loading || googleLoading}
              onClick={handleGoogleLogin}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.083 36 24 36c-5.523 0-10-4.477-10-10s4.477-10 10-10c2.52 0 4.817.926 6.582 2.458l6.106-6.106C33.46 9.21 28.92 7 24 7 12.954 7 4 15.954 4 27s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c2.52 0 4.817.926 6.582 2.458l6.106-6.106C33.46 9.21 28.92 7 24 7c-7.682 0-14.35 4.337-17.694 10.691z" />
                <path fill="#4CAF50" d="M24 47c5.523 0 10.477-1.93 14.396-5.236l-6.64-5.477C29.083 36 24.518 38 24 38c-5.083 0-9.603-3.343-11.074-7.977l-6.62 5.097C9.65 42.663 16.318 47 24 47z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.287l6.64 5.477C42.48 36.48 48 30.48 48 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              {googleLoading ? 'جاري التحويل إلى Google...' : 'متابعة بحساب Google'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            حساب جديد؟{' '}
            <Link to="/register" style={{ color: 'var(--lavender)', fontWeight: 600, textDecoration: 'none' }}>
              إنشاء حساب
            </Link>
            <span style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
              تسجيل مباشر أو بكود إحالة — الجانب في الشجرة يحدده الفرانشايز
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

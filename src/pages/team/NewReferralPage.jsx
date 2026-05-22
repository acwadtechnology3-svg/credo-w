import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  checkReferralAvailability,
  createReferral,
  getReferrals,
} from '../../api/team.api'
import { getDashboard } from '../../api/dashboard.api'
import { getInviteHub } from '../../api/invitations.api'
import Icon from '../../components/ui/Icon'
import { toast } from '../../components/shared/Toast'

const STEPS = [
  { id: 'placement', label: 'التوازن والجانب' },
  { id: 'identity', label: 'البيانات الشخصية' },
  { id: 'account', label: 'الحساب والمراجعة' },
]

const SIDES = [
  { id: 'AUTO', ico: '⚡', label: 'تلقائي', hint: 'يوازن الشجرة تلقائياً' },
  { id: 'LEFT', ico: '⬅️', label: 'يسار (A)', hint: 'الفرع الأيسر' },
  { id: 'RIGHT', ico: '➡️', label: 'يمين (B)', hint: 'الفرع الأيمن' },
]

const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr']

const COUNTRIES = [
  'Egypt',
  'Saudi Arabia',
  'United Arab Emirates',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Jordan',
  'Other',
]

const PHONE_CODES = [
  { code: '+20', label: '🇪🇬 +20' },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+965', label: '🇰🇼 +965' },
  { code: '+974', label: '🇶🇦 +974' },
]

const ERROR_AR = {
  'Your account must be active to add referrals': 'يجب تفعيل حسابك قبل إضافة إحالات.',
  'Username, email or National ID already exists':
    'اسم المستخدم أو البريد أو الرقم القومي مستخدم مسبقاً.',
  'All required fields must be provided': 'أكمل جميع الحقول المطلوبة.',
}

const EMPTY = {
  side: 'AUTO',
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  full_name: '',
  title: 'Mr',
  national_id: '',
  phone_code: '+20',
  phone: '',
  country: 'Egypt',
}

function translateError(msg) {
  if (!msg) return 'تعذّر إنشاء الإحالة — تحقق من السيرفر'
  return ERROR_AR[msg] || msg
}

function getPasswordStrength(password) {
  if (!password) return { level: 0, percent: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  let level = 1
  if (score >= 2) level = 2
  if (score >= 3) level = 3
  if (score >= 5) level = 4
  const labels = ['', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية']
  return { level, percent: level * 25, label: labels[level] }
}

function useDebounced(value, ms = 450) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

function FieldStatus({ status, hint }) {
  if (!hint) return null
  return (
    <span className={`nr-field-hint ${status === 'ok' ? 'ok' : status === 'bad' ? 'bad' : ''}`}>
      {hint}
    </span>
  )
}

function PasswordStrengthMeter({ password }) {
  const { level, percent, label } = getPasswordStrength(password)
  if (!password) return null
  return (
    <div className="pwd-strength" aria-live="polite">
      <div className="pwd-strength-track">
        <div className={`pwd-strength-fill strength-${level}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="pwd-strength-meta">
        <span>قوة كلمة المرور</span>
        <span className={`pwd-strength-label strength-${level}`}>{label}</span>
      </div>
    </div>
  )
}

export default function NewReferralPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [mode, setMode] = useState('manual')
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const { data: hub, isLoading: hubLoading } = useQuery({
    queryKey: ['invite-hub'],
    queryFn: getInviteHub,
  })

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const { data: recent } = useQuery({
    queryKey: ['referrals', 'recent'],
    queryFn: () => getReferrals({ limit: 5 }),
  })

  const balance = hub?.treeBalance || {}
  const recommended = balance.recommendedSide || 'LEFT'
  const sideA = balance.sideA ?? dashboard?.snapshot?.sideA?.unsettledBv ?? 0
  const sideB = balance.sideB ?? dashboard?.snapshot?.sideB?.unsettledBv ?? 0
  const maxBv = Math.max(sideA, sideB, 1)
  const links = dashboard?.referralLinks || {}

  const debouncedUser = useDebounced(form.username.trim())
  const debouncedEmail = useDebounced(form.email.trim().toLowerCase())
  const debouncedNid = useDebounced(form.national_id.trim())

  const { data: availability } = useQuery({
    queryKey: ['referral-availability', debouncedUser, debouncedEmail, debouncedNid],
    queryFn: () =>
      checkReferralAvailability({
        username: debouncedUser || undefined,
        email: debouncedEmail || undefined,
        national_id: debouncedNid || undefined,
      }),
    enabled:
      debouncedUser.length >= 3 ||
      debouncedEmail.includes('@') ||
      debouncedNid.length >= 6,
  })

  const pwdStrength = getPasswordStrength(form.password)
  const passwordsMatch =
    form.password && form.confirm_password && form.password === form.confirm_password
  const passwordsMismatch =
    form.confirm_password.length > 0 && form.password !== form.confirm_password

  const resolvedSide =
    form.side === 'AUTO' ? recommended : form.side

  const fieldStatus = useCallback(
    (key) => {
      const v = availability?.[key]
      if (v === null || v === undefined) return { className: '', hint: null, status: null }
      return v
        ? { className: 'valid', hint: 'متاح', status: 'ok' }
        : { className: 'invalid', hint: 'مستخدم مسبقاً', status: 'bad' }
    },
    [availability]
  )

  const canStep1 = true
  const canStep2 =
    form.full_name.trim().length >= 3 &&
    form.national_id.trim().length >= 6 &&
    (availability?.national_id !== false)
  const canStep3 =
    form.username.trim().length >= 3 &&
    form.email.includes('@') &&
    form.password.length >= 8 &&
    pwdStrength.level >= 2 &&
    passwordsMatch &&
    availability?.username !== false &&
    availability?.email !== false

  const copyLink = async (url, label) => {
    if (!url) return
    const full = url.startsWith('http') ? url : `${window.location.origin}${url}`
    try {
      await navigator.clipboard.writeText(full)
      toast.success(`تم نسخ ${label}`)
    } catch {
      toast.error('تعذّر النسخ')
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canStep3) return
    if (form.password !== form.confirm_password) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }
    setLoading(true)
    try {
      const phone = [form.phone_code, form.phone].filter(Boolean).join(' ').trim()
      const data = await createReferral({
        side: form.side,
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        title: form.title,
        national_id: form.national_id.trim(),
        phone: phone || undefined,
        country: form.country,
      })
      setSuccess({ code: data.user_code, message: data.message })
      setForm(EMPTY)
      setStep(0)
      qc.invalidateQueries({ queryKey: ['referrals'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['invite-hub'] })
      toast.success('تم إنشاء السفير بنجاح')
    } catch (err) {
      toast.error(translateError(err.response?.data?.error))
    } finally {
      setLoading(false)
    }
  }

  const resetWizard = () => {
    setSuccess(null)
    setForm(EMPTY)
    setStep(0)
  }

  const sideLabel = useMemo(() => {
    const s = SIDES.find((x) => x.id === form.side)
    return s ? s.label : form.side
  }, [form.side])

  if (success) {
    return (
      <div className="nr-page module-page page-enter" dir="rtl">
        <div className="nr-panel nr-success">
          <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>تم إنشاء السفير</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>{success.message}</p>
          <div className="nr-success-code">{success.code}</div>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            الحالة: pending — يحتاج تفعيل الباقة لدخول الشجرة
          </p>
          <div className="nr-actions" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={resetWizard}>
              إحالة أخرى
            </button>
            <Link to="/team/referrals" className="btn btn-ghost">
              قائمة الإحالات
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nr-page module-page page-enter" dir="rtl">
      <div className="nr-hero">
        <div>
          <p className="t-eyebrow" style={{ marginBottom: 4, color: 'var(--lavender)' }}>
            RECRUITMENT · MANUAL ONBOARD
          </p>
          <h1>إحالة جديدة</h1>
          <p className="nr-hero-sub">
            أضف سفيراً يدوياً مع توازن ذكي للشجرة، تحقق فوري من التكرار، وتفعيل pending حتى
            شراء الباقة.
          </p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>إحالاتك المباشرة</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--electric)' }}>
            {recent?.total ?? '—'}
          </div>
        </div>
      </div>

      <div className="nr-mode-tabs">
        <button
          type="button"
          className={`nr-mode-btn ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          ✍️ تسجيل يدوي
        </button>
        <button
          type="button"
          className={`nr-mode-btn ${mode === 'link' ? 'active' : ''}`}
          onClick={() => setMode('link')}
        >
          🔗 رابط دعوة ذكي
        </button>
      </div>

      {mode === 'link' ? (
        <div className="nr-layout">
          <div className="nr-panel">
            <h3>روابط التسجيل حسب الجانب</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 14px' }}>
              شارك الرابط المناسب — الجانب يُقفل على المسجّل ولا يمكنه تغييره.
            </p>
            <div className="nr-link-grid">
              {[
                { label: 'يسار (A)', url: links.sideA },
                { label: 'يمين (B)', url: links.sideB },
                { label: 'توازن تلقائي', url: links.auto },
              ].map((row) => (
                <div key={row.label} className="nr-link-row">
                  <input className="input" readOnly value={row.url || '—'} dir="ltr" />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => copyLink(row.url, row.label)}
                    disabled={!row.url}
                  >
                    نسخ
                  </button>
                </div>
              ))}
            </div>
            <div className="nr-actions">
              <Link to="/profile?tab=invite" className="btn btn-primary">
                دعوة ببطاقة Premium
                <Icon name="sparkles" size={14} />
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => setMode('manual')}>
                أو سجّل يدوياً
              </button>
            </div>
          </div>
          <aside>
            <div className="nr-aside-card">
              <div className="nr-balance-card" style={{ margin: 0 }}>
                <div className="nr-balance-row">
                  <span>BV يسار</span>
                  <span>BV يمين</span>
                </div>
                <div className="nr-balance-bar">
                  <div className="nr-leg">
                    <div className="nr-leg-label">A</div>
                    <div className="nr-leg-value">{Math.round(sideA)}</div>
                    <div className="nr-leg-track">
                      <div
                        className="nr-leg-fill left"
                        style={{ width: `${(sideA / maxBv) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="nr-leg">
                    <div className="nr-leg-label">B</div>
                    <div className="nr-leg-value">{Math.round(sideB)}</div>
                    <div className="nr-leg-track">
                      <div
                        className="nr-leg-fill right"
                        style={{ width: `${(sideB / maxBv) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="nr-recommend">
                  التوصية الحالية: <strong>{recommended === 'LEFT' ? 'يسار' : 'يمين'}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className={`nr-layout ${recent?.data?.length ? 'has-aside' : ''}`}>
          <div>
            <div className="invite-wizard-steps" style={{ marginBottom: '1rem' }}>
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`invite-step-pill ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                  onClick={() => setStep(i)}
                >
                  {i + 1}. {s.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={step}
                className="nr-panel"
                onSubmit={step === 2 ? onSubmit : (e) => e.preventDefault()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && (
                  <>
                    <h3>اختر جانب الشجرة</h3>
                    {!hubLoading && (
                      <div className="nr-balance-card">
                        <div className="nr-balance-row">
                          <span>حجم BV — يسار: {Math.round(sideA)}</span>
                          <span>يمين: {Math.round(sideB)}</span>
                        </div>
                        <div className="nr-balance-bar">
                          <div className="nr-leg">
                            <div className="nr-leg-label">فرع A</div>
                            <div className="nr-leg-value">{Math.round(sideA)}</div>
                            <div className="nr-leg-track">
                              <div
                                className="nr-leg-fill left"
                                style={{ width: `${(sideA / maxBv) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="nr-leg">
                            <div className="nr-leg-label">فرع B</div>
                            <div className="nr-leg-value">{Math.round(sideB)}</div>
                            <div className="nr-leg-track">
                              <div
                                className="nr-leg-fill right"
                                style={{ width: `${(sideB / maxBv) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="nr-recommend">
                          عند «تلقائي» يُوضَع العضو في:{' '}
                          <strong>{recommended === 'LEFT' ? 'يسار (A)' : 'يمين (B)'}</strong>
                        </div>
                      </div>
                    )}
                    <div className="invite-side-grid">
                      {SIDES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`invite-side-btn ${form.side === s.id ? 'selected' : ''}`}
                          onClick={() => setForm((p) => ({ ...p, side: s.id }))}
                        >
                          <span className="ico">{s.ico}</span>
                          <strong>{s.label}</strong>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                            {s.hint}
                          </div>
                          {s.id === 'AUTO' && (
                            <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 4 }}>
                              → {recommended === 'LEFT' ? 'يسار' : 'يمين'}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="nr-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!canStep1}
                        onClick={() => setStep(1)}
                      >
                        التالي
                        <Icon name="arrow-left" size={14} />
                      </button>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <h3>البيانات الشخصية</h3>
                    <div className="nr-form-grid two-col">
                      <div className="nr-field" style={{ gridColumn: '1 / -1' }}>
                        <label>الاسم الكامل</label>
                        <input
                          className="input"
                          value={form.full_name}
                          onChange={set('full_name')}
                          placeholder="مثال: أحمد محمد علي"
                          required
                          minLength={3}
                        />
                      </div>
                      <div className="nr-field">
                        <label>اللقب</label>
                        <select className="input" value={form.title} onChange={set('title')}>
                          {TITLES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="nr-field">
                        <label>الدولة</label>
                        <select className="input" value={form.country} onChange={set('country')}>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="nr-field">
                        <label>الرقم القومي / الهوية</label>
                        <input
                          className={`input font-mono ${fieldStatus('national_id').className}`}
                          value={form.national_id}
                          onChange={set('national_id')}
                          inputMode="numeric"
                          required
                          minLength={6}
                        />
                        <FieldStatus {...fieldStatus('national_id')} />
                      </div>
                      <div className="nr-field">
                        <label>الهاتف</label>
                        <div className="nr-phone-row">
                          <select
                            className="input"
                            value={form.phone_code}
                            onChange={set('phone_code')}
                          >
                            {PHONE_CODES.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                          <input
                            className="input"
                            value={form.phone}
                            onChange={set('phone')}
                            inputMode="tel"
                            placeholder="1xxxxxxxxx"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="nr-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
                        رجوع
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!canStep2}
                        onClick={() => setStep(2)}
                      >
                        التالي
                      </button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3>حساب الدخول والمراجعة</h3>
                    <div className="nr-form-grid two-col">
                      <div className="nr-field">
                        <label>اسم المستخدم</label>
                        <input
                          className={`input ${fieldStatus('username').className}`}
                          value={form.username}
                          onChange={set('username')}
                          autoComplete="off"
                          dir="ltr"
                          required
                          minLength={3}
                        />
                        <FieldStatus
                          status={fieldStatus('username').status}
                          hint={
                            fieldStatus('username').hint ||
                            (form.username.length > 0 && form.username.length < 3
                              ? '3 أحرف على الأقل'
                              : null)
                          }
                        />
                      </div>
                      <div className="nr-field">
                        <label>البريد الإلكتروني</label>
                        <input
                          className={`input ${fieldStatus('email').className}`}
                          type="email"
                          value={form.email}
                          onChange={set('email')}
                          dir="ltr"
                          required
                        />
                        <FieldStatus {...fieldStatus('email')} />
                      </div>
                      <div className="nr-field">
                        <label>كلمة المرور</label>
                        <input
                          className="input"
                          type="password"
                          value={form.password}
                          onChange={set('password')}
                          required
                          minLength={8}
                          autoComplete="new-password"
                        />
                        <PasswordStrengthMeter password={form.password} />
                      </div>
                      <div className="nr-field">
                        <label>تأكيد كلمة المرور</label>
                        <input
                          className={`input${passwordsMismatch ? ' invalid' : passwordsMatch ? ' valid' : ''}`}
                          type="password"
                          value={form.confirm_password}
                          onChange={set('confirm_password')}
                          required
                        />
                        {passwordsMismatch && (
                          <span className="nr-field-hint bad">غير متطابقة</span>
                        )}
                        {passwordsMatch && (
                          <span className="nr-field-hint ok">متطابقة ✓</span>
                        )}
                      </div>
                    </div>

                    <dl className="nr-review" style={{ marginTop: 16 }}>
                      <dt>الجانب في الشجرة</dt>
                      <dd>
                        {sideLabel}
                        {form.side === 'AUTO' && ` → ${resolvedSide === 'LEFT' ? 'يسار' : 'يمين'}`}
                      </dd>
                      <dt>الاسم</dt>
                      <dd>{form.full_name || '—'}</dd>
                      <dt>المعرّف</dt>
                      <dd>
                        {form.username || '—'} · {form.email || '—'}
                      </dd>
                    </dl>

                    <div className="nr-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                        رجوع
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-xl"
                        disabled={loading || !canStep3}
                      >
                        {loading ? 'جاري الإنشاء…' : 'إنشاء السفير'}
                        {!loading && <Icon name="plus" size={14} />}
                      </button>
                    </div>
                  </>
                )}
              </motion.form>
            </AnimatePresence>
          </div>

          {(recent?.data?.length > 0 || hub?.stats) && (
            <aside>
              {hub?.stats && (
                <div className="nr-aside-card">
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
                    دعوات Premium
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div>
                      <strong style={{ color: 'var(--electric)' }}>{hub.stats.invites_sent || 0}</strong>
                      <span style={{ color: 'var(--text-3)', marginInlineStart: 4 }}>مرسلة</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--success)' }}>
                        {hub.stats.invites_converted || 0}
                      </strong>
                      <span style={{ color: 'var(--text-3)', marginInlineStart: 4 }}>انضمت</span>
                    </div>
                  </div>
                </div>
              )}
              {recent?.data?.length > 0 && (
                <div className="nr-aside-card">
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>آخر الإحالات</div>
                  {recent.data.map((r) => (
                    <div key={r.id} className="nr-recent-item">
                      <span style={{ fontWeight: 600 }}>{r.username}</span>
                      <span className={`pill ${r.status === 'active' ? 'ok' : ''}`}>{r.status}</span>
                    </div>
                  ))}
                  <Link
                    to="/team/referrals"
                    style={{ fontSize: 11, color: 'var(--lavender)', marginTop: 8, display: 'block' }}
                  >
                    عرض الكل ←
                  </Link>
                </div>
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  )
}

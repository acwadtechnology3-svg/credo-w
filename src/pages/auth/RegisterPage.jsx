import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { resolveJoinContext } from '../../api/agencies.api'
import Logo from '../../components/ui/Logo'
import Icon from '../../components/ui/Icon'
import client from '../../api/client'
import { toast } from '../../components/shared/Toast'

const SIDE_LABELS = {
  LEFT: 'الجانب الأيسر (A)',
  RIGHT: 'الجانب الأيمن (B)',
  AUTO: 'توازن تلقائي — حسب اختيار الفرانشايز',
}

const ERROR_AR = {
  'Database access blocked (RLS). Run rls-backend.sql in Supabase or set SUPABASE_SERVICE_KEY to service_role.':
    'قاعدة البيانات غير مهيّأة. شغّل: npm run db:setup (بعد إضافة DATABASE_URL في .env) أو نفّذ rls-backend.sql في Supabase.',
  'Invalid referral code': 'كود الإحالة غير صحيح. استخدم USR-000000 أو سجّل أول حساب في المشروع.',
  'Invalid or expired invitation': 'الدعوة غير صالحة أو منتهية — اطلب رابطاً جديداً من قائد فريقك.',
  'Referral code required': 'كود الإحالة مطلوب — استخدم رابط الدعوة من الفرانشايز.',
  'Sponsor account is not active': 'حساب الراعي غير مفعّل.',
  'Username, email or National ID already exists': 'اسم المستخدم أو البريد أو الرقم القومي مستخدم مسبقاً.',
  'Passwords do not match': 'كلمتا المرور غير متطابقتين.',
  'Password must be at least 8 characters': 'كلمة المرور 8 أحرف على الأقل.',
  'All fields required': 'أكمل جميع الحقول المطلوبة.',
}

function translateError(msg) {
  if (!msg) return 'فشل التسجيل — تحقق من اتصال السيرفر (npm run dev)'
  return ERROR_AR[msg] || msg
}

const COUNTRIES = [
  'Egypt',
  'Saudi Arabia',
  'United Arab Emirates',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Jordan',
  'Lebanon',
  'Morocco',
  'Tunisia',
  'Algeria',
  'Other',
]

const PHONE_CODES = [
  { code: '+20', label: '🇪🇬 +20' },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+965', label: '🇰🇼 +965' },
  { code: '+974', label: '🇶🇦 +974' },
]

function FieldLabel({ children, required, hint }) {
  return (
    <span className="field-label">
      {children}
      {required && <span className="req">*</span>}
      {hint && <span className="field-hint"> — {hint}</span>}
    </span>
  )
}

const STRENGTH_LABELS = ['', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية']

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
  return {
    level,
    percent: level * 25,
    label: STRENGTH_LABELS[level],
  }
}

function PasswordInput({ value, onChange, placeholder, autoComplete, status }) {
  const [show, setShow] = useState(false)
  return (
    <div className={`input-with-icon${status ? ' has-status' : ''}`}>
      <input
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        minLength={8}
        autoComplete={autoComplete}
      />
      {status === 'match' && (
        <span className="pwd-field-status match-ok" aria-label="متطابقة">
          <Icon name="check" size={14} />
        </span>
      )}
      {status === 'mismatch' && (
        <span className="pwd-field-status match-bad" aria-label="غير متطابقة">
          ×
        </span>
      )}
      <button type="button" className="toggle-pwd" onClick={() => setShow((s) => !s)} aria-label="إظهار كلمة المرور">
        <Icon name={show ? 'eye-off' : 'eye'} size={15} />
      </button>
    </div>
  )
}

function PasswordStrengthMeter({ password }) {
  const { level, percent, label } = getPasswordStrength(password)
  if (!password) return null
  return (
    <div className="pwd-strength" aria-live="polite">
      <div className="pwd-strength-track">
        <div
          className={`pwd-strength-fill strength-${level}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="pwd-strength-meta">
        <span>قوة كلمة المرور</span>
        <span className={`pwd-strength-label strength-${level}`}>{label}</span>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [setup, setSetup] = useState(null)
  const fromGoogle = searchParams.get('google') === '1'
  const inviteRef = (searchParams.get('ref') || '').trim()
  const agencyId = (searchParams.get('agency') || '').trim()
  const agencyCode = (searchParams.get('agency_code') || '').trim()
  const premiumInviteCode = (searchParams.get('invite') || '').trim().toUpperCase()
  const inviteSide = (searchParams.get('side') || '').trim().toUpperCase()
  const linkSide = ['LEFT', 'RIGHT', 'AUTO'].includes(inviteSide) ? inviteSide : null
  const franchiseLinkLocked = Boolean(inviteRef && linkSide)
  const premiumInviteLocked = Boolean(premiumInviteCode)
  const [referralCode, setReferralCode] = useState(inviteRef)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [confirmIdentity, setConfirmIdentity] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    title: 'Mr',
    email: '',
    username: '',
    national_id: '',
    phone_code: '+20',
    phone: '',
    country: 'Egypt',
    city: '',
    password: '',
    confirm_password: '',
  })

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const { data: joinCtx } = useQuery({
    queryKey: ['join-context', agencyId, agencyCode, inviteRef, inviteSide],
    queryFn: () =>
      resolveJoinContext({
        agency: agencyId || undefined,
        agency_code: agencyCode || undefined,
        ref: inviteRef || undefined,
        side: inviteSide || undefined,
      }),
    enabled: Boolean(agencyId || agencyCode),
  })

  useEffect(() => {
    const r = searchParams.get('ref')
    if (r) setReferralCode(r.trim())
  }, [searchParams])

  useEffect(() => {
    const email = (searchParams.get('email') || '').trim()
    const name = (searchParams.get('name') || '').trim()
    if (!email && !name) return
    setForm((p) => {
      const next = { ...p }
      if (email) next.email = email
      if (name) {
        const parts = name.split(/\s+/)
        next.first_name = parts[0] || ''
        next.last_name = parts.slice(1).join(' ') || ''
      }
      return next
    })
  }, [searchParams])

  useEffect(() => {
    client
      .get('/health/setup')
      .then(({ data }) => setSetup(data))
      .catch(() =>
        setSetup({
          ready: false,
          canWrite: false,
          issues: [
            {
              code: 'SERVER',
              messageAr: 'السيرفر غير متصل. شغّل npm run dev في مجلد المشروع.',
              fix: 'npm run dev',
            },
          ],
        })
      )
  }, [])

  const formBlocked = setup && !setup.canWrite
  const firstUserMode = setup?.isFirstUserSlot
  const canSubmit = !formBlocked
  const codeTrimmed = referralCode.trim()
  const useLinkSide = franchiseLinkLocked && codeTrimmed === inviteRef
  const pwdStrength = getPasswordStrength(form.password)
  const confirmTouched = form.confirm_password.length > 0
  const passwordsMatch = form.password.length > 0 && form.password === form.confirm_password

  const onSubmit = async (e) => {
    e.preventDefault()
    if (formBlocked) {
      setError(setup.issues?.[0]?.messageAr || 'قاعدة البيانات غير جاهزة')
      return
    }
    if (!agreePrivacy || !confirmIdentity) {
      setError('يجب الموافقة على الشروط وتأكيد صحة البيانات')
      return
    }
    if (pwdStrength.level < 3) {
      setError('كلمة المرور ضعيفة — استخدم 8 أحرف على الأقل مع أحرف كبيرة وصغيرة وأرقام')
      return
    }
    if (!passwordsMatch) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const params = new URLSearchParams()
      if (!firstUserMode && premiumInviteCode) {
        params.set('invite', premiumInviteCode)
        if (linkSide) params.set('side', linkSide)
      } else if (!firstUserMode && codeTrimmed) {
        params.set('ref', codeTrimmed)
        if (useLinkSide) params.set('side', linkSide)
      }
      if (agencyId) params.set('agency', agencyId)
      if (agencyCode) params.set('agency_code', agencyCode)
      const phone = form.phone ? `${form.phone_code}${form.phone.replace(/^\s+/, '')}` : ''
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        title: form.title,
        national_id: form.national_id.trim(),
        phone,
        country: form.country,
      }
      const { data } = await client.post(`/auth/register?${params}`, payload)
      setSuccess(data.message || 'تم إنشاء الحساب بنجاح')
      setTimeout(() => navigate('/login'), data.status === 'active' ? 1500 : 3000)
    } catch (err) {
      if (!err.response) {
        setError('لا يوجد اتصال بالسيرفر — تأكد أن npm run dev يعمل (منفذ 3001)')
      } else {
        setError(translateError(err.response?.data?.error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split auth-register" dir="rtl">
      {/* Form panel (primary — matches official signup flow) */}
      <div className="auth-register-form-wrap">
        <div className="auth-register-topband" aria-hidden />
        <div className="auth-register-scroll">
          <div className="auth-register-card anim-fade-up">
            <Logo size="lg" />
            <h1>إنشاء حساب Credo W</h1>
            <p className="lead">
              سجّل مباشرة أو أدخل كود إحالة إن وُجد. الجانب في الشجرة يحدده الفرانشايز (رابط يسار/يمين) أو تلقائياً
              (AUTO) — لا تختاره بنفسك.
            </p>

            {fromGoogle && (
              <div
                className="auth-register-callout"
                style={{ marginBottom: 16, borderColor: 'var(--lavender-edge)', background: 'var(--lavender-soft)' }}
              >
                <span className="ico" style={{ background: 'var(--lavender)' }}>G</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>أكمل إنشاء حسابك</strong>
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                    تم التحقق من Google. لا يوجد حساب مفعّل بهذا البريد — أكمل البيانات أدناه لإنشاء عضويتك.
                  </span>
                </div>
              </div>
            )}

            {setup && !setup.ready && (
              <div className="auth-register-callout" style={{ marginBottom: 16, borderColor: 'var(--danger-edge)', background: 'var(--danger-soft)' }}>
                <span className="ico" style={{ background: 'var(--danger)' }}>!</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 6, color: 'var(--text-1)' }}>التسجيل متوقف — إعداد قاعدة البيانات</strong>
                  <ul style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.6 }}>
                    {setup.issues.map((issue) => (
                      <li key={issue.code}>
                        {issue.messageAr}
                        {issue.fix && (
                          <span style={{ display: 'block', color: 'var(--lavender)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                            {issue.fix}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {firstUserMode && (
              <p className="pill ok" style={{ marginBottom: 14, width: '100%', justifyContent: 'center' }}>
                أول حساب في المشروع — لا حاجة لرابط دعوة (سيُنشأ USR-000000)
              </p>
            )}

            {joinCtx?.ok && joinCtx?.agency && (
              <div
                className="auth-register-callout"
                style={{
                  marginBottom: 14,
                  borderColor: 'rgba(123,108,246,0.45)',
                  background: `linear-gradient(135deg, ${joinCtx.agency.primary_color || '#7B6CF6'}22, rgba(5,6,13,0.9))`,
                }}
              >
                <span className="ico" style={{ background: joinCtx.agency.primary_color || '#7B6CF6' }}>
                  🏛️
                </span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-1)' }}>
                    انضمام وكالة: {joinCtx.agency.name}
                  </strong>
                  {joinCtx.sponsor && (
                    <span style={{ fontSize: 12, display: 'block' }}>
                      مجندك: @{joinCtx.sponsor.username}
                    </span>
                  )}
                  {joinCtx.placementSide && (
                    <span style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                      موضع: <strong>{SIDE_LABELS[joinCtx.placementSide] || joinCtx.placementSide}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {premiumInviteLocked && (
              <div
                className="auth-register-callout"
                style={{
                  marginBottom: 14,
                  borderColor: 'var(--gold-edge, rgba(245,200,66,0.4))',
                  background: 'rgba(245, 200, 66, 0.08)',
                }}
              >
                <span className="ico" style={{ background: 'linear-gradient(135deg, var(--lavender), var(--electric))' }}>
                  🔥
                </span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-1)' }}>
                    دعوة خاصة — عضوية نخبوية
                  </strong>
                  <span className="font-mono" style={{ fontSize: 12 }}>كود: {premiumInviteCode}</span>
                  {linkSide && (
                    <span style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                      موضع الشجرة: <strong>{SIDE_LABELS[linkSide]}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {franchiseLinkLocked && codeTrimmed === inviteRef && !premiumInviteLocked && (
              <div
                className="auth-register-callout"
                style={{ marginBottom: 14, borderColor: 'var(--line-purple)', background: 'var(--info-soft)' }}
              >
                <span className="ico">✓</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-1)' }}>رابط دعوة من الفرانشايز</strong>
                  <span className="font-mono" style={{ fontSize: 12 }}>كود: {inviteRef}</span>
                  <span style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                    موضع الشجرة: <strong>{SIDE_LABELS[linkSide]}</strong>
                  </span>
                </div>
              </div>
            )}

            {codeTrimmed && !useLinkSide && (
              <div className="auth-register-callout" style={{ marginBottom: 14 }}>
                <span className="ico">i</span>
                <span style={{ fontSize: 12, lineHeight: 1.55 }}>
                  مع كود الإحالة فقط: سيتم وضعك في الشجرة بـ <strong>توازن تلقائي (AUTO)</strong> تحت الفرانشايز. للجانب
                  المحدد (يسار/يمين) استخدم رابط الدعوة من الفرانشايز.
                </span>
              </div>
            )}

            {error && (
              <p className="pill bad" style={{ marginBottom: 14, width: '100%', justifyContent: 'center' }}>
                {error}
              </p>
            )}
            {success && (
              <p className="pill ok" style={{ marginBottom: 14, width: '100%', justifyContent: 'center' }}>
                {success}
              </p>
            )}

            <form
              onSubmit={onSubmit}
              style={{ opacity: canSubmit ? 1 : 0.55, pointerEvents: canSubmit ? 'auto' : 'none' }}
            >
              <div className="auth-register-grid">
                <div>
                  <label className="field">
                    <FieldLabel required>الاسم الأول</FieldLabel>
                    <input
                      className="input"
                      value={form.first_name}
                      onChange={set('first_name')}
                      placeholder="كما في الهوية"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="field">
                    <FieldLabel required hint="كما في الهوية">اسم العائلة</FieldLabel>
                    <input
                      className="input"
                      value={form.last_name}
                      onChange={set('last_name')}
                      placeholder="كما في الهوية"
                      required
                    />
                  </label>
                </div>

                <div>
                  <label className="field">
                    <FieldLabel required>اللقب</FieldLabel>
                    <select className="input select" value={form.title} onChange={set('title')}>
                      <option value="Mr">السيد</option>
                      <option value="Mrs">السيدة</option>
                      <option value="Ms">الآنسة</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label className="field">
                    <FieldLabel required>الدولة</FieldLabel>
                    <select className="input select" value={form.country} onChange={set('country')}>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className="field">
                    <FieldLabel>المدينة</FieldLabel>
                    <input className="input" value={form.city} onChange={set('city')} placeholder="القاهرة" />
                  </label>
                </div>
                <div>
                  <label className="field">
                    <FieldLabel required>البريد الإلكتروني</FieldLabel>
                    <input
                      className="input"
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="example@gmail.com"
                      readOnly={fromGoogle}
                      required
                      autoComplete="email"
                    />
                  </label>
                </div>

                <div className="span-2">
                  <label className="field">
                    <FieldLabel required>رقم الجوال</FieldLabel>
                    <div className="phone-row">
                      <select className="input select" value={form.phone_code} onChange={set('phone_code')}>
                        {PHONE_CODES.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input font-mono"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="1xxxxxxxxx"
                        inputMode="tel"
                      />
                    </div>
                  </label>
                </div>

                {!firstUserMode && (
                  <div className="span-2">
                    <label className="field">
                      <FieldLabel hint="اختياري — إن لم يكن معك كود، سجّل مباشرة">كود الإحالة</FieldLabel>
                      <input
                        className="input font-mono"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder="USR-000123 (اختياري)"
                      />
                    </label>
                  </div>
                )}

                <div>
                  <label className="field">
                    <FieldLabel required>اسم المستخدم</FieldLabel>
                    <input
                      className="input"
                      value={form.username}
                      onChange={set('username')}
                      required
                      autoComplete="username"
                    />
                  </label>
                </div>
                <div>
                  <label className="field">
                    <FieldLabel required>الرقم القومي</FieldLabel>
                    <input
                      className="input font-mono"
                      value={form.national_id}
                      onChange={set('national_id')}
                      required
                    />
                  </label>
                </div>

                <div>
                  <label className="field">
                    <FieldLabel required>كلمة المرور</FieldLabel>
                    <PasswordInput
                      value={form.password}
                      onChange={set('password')}
                      placeholder="8 أحرف على الأقل"
                      autoComplete="new-password"
                    />
                    <PasswordStrengthMeter password={form.password} />
                  </label>
                </div>
                <div>
                  <label className="field">
                    <FieldLabel required>تأكيد كلمة المرور</FieldLabel>
                    <PasswordInput
                      value={form.confirm_password}
                      onChange={set('confirm_password')}
                      placeholder="أعد الإدخال"
                      autoComplete="new-password"
                      status={confirmTouched ? (passwordsMatch ? 'match' : 'mismatch') : undefined}
                    />
                  </label>
                </div>
              </div>

              <div className="auth-register-checks" style={{ marginTop: 18 }}>
                <label className="auth-register-check">
                  <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
                  <span>
                    أوافق على{' '}
                    <button
                      type="button"
                      className="link-inline"
                      onClick={() => toast.info('صفحة الشروط قريباً')}
                    >
                      سياسة الخصوصية
                    </button>{' '}
                    وشروط استخدام المنصة.
                  </span>
                </label>
                <label className="auth-register-check">
                  <input
                    type="checkbox"
                    checked={confirmIdentity}
                    onChange={(e) => setConfirmIdentity(e.target.checked)}
                  />
                  <span>أؤكد أن الاسم والدولة مطابقان للهوية الرسمية.</span>
                </label>
                <label className="auth-register-check">
                  <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                  <span>أرغب في استلام تحديثات وعروض Credo W (اختياري).</span>
                </label>
              </div>

              <div className="auth-register-callout">
                <span className="ico">i</span>
                <span>
                  بعد التسجيل لا يمكن تعديل الاسم أو الدولة. راجع بياناتك قبل الإرسال. في بيئة التطوير يُفعَّل
                  الحساب تلقائياً للدخول.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-xl"
                style={{ width: '100%', marginTop: 20 }}
                disabled={loading || !canSubmit}
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                {!loading && <Icon name="arrow-left" size={14} />}
              </button>
            </form>

            <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
              لديك حساب؟{' '}
              <Link to="/login" style={{ color: 'var(--lavender)', fontWeight: 600, textDecoration: 'none' }}>
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Marketing + dashboard preview */}
      <div className="auth-split-visual auth-register-visual">
        <div className="glow-blob" style={{ width: 500, height: 500, top: '10%', insetInlineStart: '10%', filter: 'blur(70px)' }} />
        <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2>
            أنشئ حسابك على <span className="gradient-text">Credo W</span>
          </h2>
          <p className="sub">سجّل في أقل من 60 ثانية وابدأ متابعة شبكتك وأرباحك ولوحة التحكم.</p>
          <div className="auth-register-mock">
            <img src="/register-dashboard-preview.png" alt="معاينة لوحة تحكم Credo W" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  )
}

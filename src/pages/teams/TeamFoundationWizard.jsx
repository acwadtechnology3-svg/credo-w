import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getFoundationStatus,
  getMyTeam,
  validateTeamSlug,
  establishTeam,
} from '../../api/teams.api'
import PageLoader from '../../components/shared/PageLoader'
import { toast } from '../../components/shared/Toast'
import '../../styles/team-guild.css'

const STEPS = ['identity', 'branding', 'story', 'type', 'launch']
const TEAM_TYPES = [
  { id: 'competitive', label: 'تنافسي', icon: '⚔️' },
  { id: 'leadership', label: 'قيادة', icon: '👑' },
  { id: 'trading', label: 'تداول', icon: '📈' },
  { id: 'entrepreneurship', label: 'ريادة', icon: '🚀' },
  { id: 'elite', label: 'نخبة', icon: '💎' },
  { id: 'regional', label: 'إقليمي', icon: '🌍' },
  { id: 'vip', label: 'VIP', icon: '✨' },
]

const GLOW_THEMES = ['purple_pulse', 'gold_aura', 'cyber_blue', 'ember']

export default function TeamFoundationWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    short_code: '',
    motto: '',
    mission: '',
    bio: '',
    leadership_statement: '',
    team_type: 'leadership',
    primary_color: '#7B6CF6',
    secondary_color: '#534AB7',
    glow_theme: 'purple_pulse',
    logo_base64: null,
    banner_base64: null,
    is_public: true,
  })
  const [result, setResult] = useState(null)

  const { data: status, isLoading } = useQuery({
    queryKey: ['foundation-status'],
    queryFn: getFoundationStatus,
  })

  const { data: myTeam } = useQuery({
    queryKey: ['my-team'],
    queryFn: getMyTeam,
    enabled: !!status?.has_team,
  })

  const establishMut = useMutation({
    mutationFn: () =>
      establishTeam({
        ...form,
        slug: form.slug || undefined,
      }),
    onSuccess: (data) => {
      setResult(data)
      setStep(STEPS.length)
      toast.success('تم تأسيس فريقك!')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'فشل التأسيس'),
  })

  const readFile = (file, field) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, [field]: reader.result }))
    reader.readAsDataURL(file)
  }

  if (isLoading) return <PageLoader />

  if (!status?.eligible_to_establish && status?.team_foundation_status !== 'pending' && !status?.has_team) {
    return (
      <div className="guild-wizard" dir="rtl">
        <div className="guild-wizard__hero">
          <h1 className="guild-wizard__title">تأسيس الفريق</h1>
          <p style={{ color: 'var(--text-3)' }}>اشترِ باقة مؤهلة أولاً لفتح تأسيس الفريق.</p>
          <button type="button" className="guild-btn-primary" style={{ maxWidth: 280 }} onClick={() => navigate('/packages')}>
            عرض الباقات
          </button>
        </div>
      </div>
    )
  }

  if (status?.has_team && !result && myTeam?.team?.slug) {
    navigate(`/teams/profile/${myTeam.team.slug}`, { replace: true })
    return <PageLoader />
  }

  if (step >= STEPS.length && result) {
    return (
      <div className="guild-wizard" dir="rtl">
        <motion.div
          className="guild-step-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="guild-wizard__flame">🏰</div>
          <h2 style={{ textAlign: 'center', marginBottom: 8 }}>إمبراطوريتك جاهزة</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 14 }}>
            {result.team?.name}
          </p>
          <div className="guild-success-invite">
            <div style={{ marginBottom: 6, color: 'var(--text-3)' }}>رابط التجنيد</div>
            {result.invite_url}
          </div>
          <button
            type="button"
            className="guild-btn-primary"
            onClick={() => navigate(`/teams/profile/${result.team?.slug}`)}
          >
            دخول مقر الفريق
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="guild-wizard" dir="rtl">
      <div className="guild-wizard__hero">
        <div className="guild-wizard__flame">🔥</div>
        <h1 className="guild-wizard__title">أسّس فريقك</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
          خطوة {step + 1} من {STEPS.length} — ابنِ هوية تليق بقائد
        </p>
      </div>

      <div className="guild-step-dots">
        {STEPS.map((_, i) => (
          <span key={i} className={i <= step ? 'active' : ''} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="guild-step-card"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
        >
          {step === 0 && (
            <>
              <h3 style={{ marginBottom: 12 }}>هوية الفريق</h3>
              <input
                className="guild-input"
                placeholder="اسم الفريق *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="guild-input"
                placeholder="رابط فريد (اختياري)"
                value={form.slug}
                onBlur={async () => {
                  if (form.slug) {
                    const r = await validateTeamSlug(form.slug)
                    if (!r.ok) toast.error(r.error)
                  }
                }}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <input
                className="guild-input"
                placeholder="رمز قصير (اختياري)"
                value={form.short_code}
                onChange={(e) => setForm({ ...form, short_code: e.target.value })}
              />
              <input
                className="guild-input"
                placeholder="شعار الفريق (motto)"
                value={form.motto}
                onChange={(e) => setForm({ ...form, motto: e.target.value })}
              />
            </>
          )}

          {step === 1 && (
            <>
              <h3 style={{ marginBottom: 12 }}>الهوية البصرية</h3>
              <div className="guild-color-row">
                <label>لون أساسي</label>
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                />
                <label>ثانوي</label>
                <input
                  type="color"
                  value={form.secondary_color}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {GLOW_THEMES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`guild-type-btn ${form.glow_theme === g ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, glow_theme: g })}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <label style={{ fontSize: 12, color: 'var(--text-3)' }}>شعار (صورة)</label>
              <input type="file" accept="image/*" onChange={(e) => readFile(e.target.files?.[0], 'logo_base64')} />
              <label style={{ fontSize: 12, color: 'var(--text-3)' }}>بانر</label>
              <input type="file" accept="image/*" onChange={(e) => readFile(e.target.files?.[0], 'banner_base64')} />
              <div
                className="guild-preview-banner"
                style={{
                  background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})`,
                }}
              >
                <div className="guild-preview-logo">⬡</div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ marginBottom: 12 }}>رسالة الفريق</h3>
              <textarea
                className="guild-input"
                rows={2}
                placeholder="المهمة"
                value={form.mission}
                onChange={(e) => setForm({ ...form, mission: e.target.value })}
              />
              <textarea
                className="guild-input"
                rows={3}
                placeholder="نبذة عن الفريق"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <textarea
                className="guild-input"
                rows={2}
                placeholder="رسالة القيادة"
                value={form.leadership_statement}
                onChange={(e) => setForm({ ...form, leadership_statement: e.target.value })}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={{ marginBottom: 12 }}>نوع الفريق</h3>
              <div className="guild-type-grid">
                {TEAM_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`guild-type-btn ${form.team_type === t.id ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, team_type: t.id })}
                  >
                    <div style={{ fontSize: 20 }}>{t.icon}</div>
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 style={{ marginBottom: 12 }}>إطلاق الإمبراطورية</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
                سيتم إنشاء فريق <strong>{form.name || '—'}</strong> وربطه بحسابك كمؤسس.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                />
                ظهور الفريق في الاكتشاف العام
              </label>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {step > 0 && (
              <button type="button" className="guild-btn-secondary" onClick={() => setStep(step - 1)}>
                رجوع
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="guild-btn-primary"
                style={{ flex: 1 }}
                disabled={step === 0 && !form.name.trim()}
                onClick={() => setStep(step + 1)}
              >
                متابعة
              </button>
            ) : (
              <button
                type="button"
                className="guild-btn-primary"
                style={{ flex: 1 }}
                disabled={establishMut.isPending}
                onClick={() => establishMut.mutate()}
              >
                {establishMut.isPending ? 'جاري التأسيس...' : '🔥 أسّس فريقي'}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

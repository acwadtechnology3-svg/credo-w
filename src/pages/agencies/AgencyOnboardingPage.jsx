import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getAgencyOnboarding, completeAgencyOnboarding } from '../../api/agencies.api'
import PageLoader from '../../components/shared/PageLoader'
import SupportQuickLink from '../../components/support/SupportQuickLink'
import '../../styles/team-guild.css'

export default function AgencyOnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['agency-onboarding'],
    queryFn: getAgencyOnboarding,
  })

  const completeMut = useMutation({
    mutationFn: (patch) => completeAgencyOnboarding(patch),
    onSuccess: () => navigate('/dashboard'),
  })

  if (isLoading) return <PageLoader />
  if (!data?.agency) {
    return (
      <div className="guild-wizard" dir="rtl" style={{ textAlign: 'center', padding: 48 }}>
        <SupportQuickLink category="agency" />
        <p>أنت غير منضم لوكالة بعد.</p>
        <button type="button" className="guild-btn-primary" onClick={() => navigate('/agencies/discover')}>
          اكتشف الوكالات
        </button>
      </div>
    )
  }

  const { agency, founder, recruiter, checklist, achievements_unlocked } = data
  const primary = agency.primary_color || '#7B6CF6'

  const steps = [
    {
      key: 'welcome',
      title: `مرحباً في ${agency.name}`,
      body: agency.motto || 'وكالة رسمية ضمن نظام Credo W',
      action: () => completeMut.mutate({ welcomed: true }),
    },
    {
      key: 'intro',
      title: 'هوية الوكالة',
      body: agency.mission || agency.bio || 'منظمة نخبة لبناء شبكة احترافية.',
      action: () => completeMut.mutate({ viewed_intro: true }),
    },
    {
      key: 'founder',
      title: 'رسالة القائد',
      body: founder
        ? `${founder.full_name || founder.username} يقود هذه الوكالة نحو التميز.`
        : 'قائد الوكالة يرحب بك.',
      action: () => completeMut.mutate({ viewed_founder_message: true }),
    },
    {
      key: 'recruiter',
      title: 'مجندك',
      body: recruiter
        ? `راعيك: @${recruiter.username} — ${recruiter.full_name || ''}`
        : 'انضممت مباشرة تحت الوكالة.',
      action: () => completeMut.mutate({ viewed_recruiter_card: true }),
    },
    {
      key: 'done',
      title: 'جاهز للانطلاق',
      body: `${achievements_unlocked?.length || 0} إنجازات للوكالة · ${agency.total_members || 0} عضو`,
      action: () =>
        completeMut.mutate({
          welcomed: true,
          viewed_intro: true,
          viewed_founder_message: true,
          viewed_recruiter_card: true,
          completed_checklist: true,
        }),
    },
  ]

  const current = steps[step]

  return (
    <div className="guild-wizard" dir="rtl">
      <div className="guild-wizard__hero">
        <motion.div
          className="guild-wizard__flame"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          🏛️
        </motion.div>
        <h1 className="guild-wizard__title">انضمام المنظمة</h1>
        <div
          style={{
            height: 4,
            maxWidth: 320,
            margin: '12px auto',
            background: 'var(--border)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${((step + 1) / steps.length) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${primary}, #e8c96a)`,
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="guild-wizard__card"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          style={{ maxWidth: 480, margin: '0 auto' }}
        >
          <h2 style={{ marginTop: 0 }}>{current.title}</h2>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>{current.body}</p>

          <ul style={{ fontSize: 13, color: 'var(--text-3)', paddingRight: 20 }}>
            {(checklist || []).map((c) => (
              <li key={c.key} style={{ textDecoration: c.done ? 'line-through' : 'none' }}>
                {c.done ? '✓' : '○'} {c.label}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {step > 0 && (
              <button type="button" className="guild-btn-secondary" onClick={() => setStep((s) => s - 1)}>
                رجوع
              </button>
            )}
            <button
              type="button"
              className="guild-btn-primary"
              style={{ flex: 1 }}
              disabled={completeMut.isPending}
              onClick={() => {
                current.action()
                if (step < steps.length - 1) setStep((s) => s + 1)
              }}
            >
              {step === steps.length - 1 ? 'إنهاء' : 'التالي'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

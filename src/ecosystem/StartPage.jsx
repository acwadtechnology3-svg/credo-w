import { useState, useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useLandingLocale } from '../landing/i18n/landingLocale'
import useGateAction from './hooks/useGateAction'

const PACKAGE_REC = {
  learn: { tier: '1', name: 'أحادي', why: 'لفهم المنظومة بدون ضغط توسع كبير.' },
  grow: { tier: '3', name: 'ثلاثي', why: 'لبدء قيادة فريق ونمو BV مبكر.' },
  agency: { tier: '3', name: 'ثلاثي', why: 'أهلية انضمام وكالة قوية وقيادة.' },
}

const STEPS = [
  {
    id: 'goal',
    title: 'ما هدفك من Credo W؟',
    subtitle: 'نرشّح لك: باقة · وكالة · ومسار onboarding.',
    options: [
      { id: 'learn', label: 'أفهم المنظومة أولًا — استكشاف', next: 'explore' },
      { id: 'grow', label: 'أريد التوسع والقيادة — نمو', next: 'package' },
      { id: 'agency', label: 'أريد وكالة أو شريك — توسع', next: 'agency' },
      { id: 'partner', label: 'أبني منظمة توسع — شريك', next: 'partner' },
    ],
  },
  {
    id: 'explore',
    title: 'مسار الاستكشاف الحر',
    subtitle: 'لا شراء الآن — فهم ثم قرار.',
    body: 'اقرأ بالترتيب: المنظومة → الباقات → المكافآت → الوكالات → الأسئلة.',
    links: [
      { href: '/ecosystem', label: 'المنظومة — الصورة الكاملة' },
      { href: '/packages', label: 'الباقات — 1 · 3 · 7' },
      { href: '/rewards', label: 'المكافآت — اقتصاد داخلي' },
      { href: '/agencies', label: 'الوكالات — نموذج التوسع' },
      { href: '/faq', label: 'الأسئلة — شفافية' },
    ],
    next: 'onboarding',
  },
  {
    id: 'package',
    title: 'توصية الباقة (جاهزية)',
    subtitle: 'ليس شراءً — مستوى وصول مقترح.',
    dynamicPackage: true,
    next: 'onboarding',
  },
  {
    id: 'agency',
    title: 'توصية الوكالة',
    subtitle: 'انضم لوكالة قائمة أو اسأل عن تأسيس لاحقًا.',
    body: 'طرق الانضمام بعد الحساب: رمز دعوة · راعٍ · معرّف وكالة · QR. استكشف /agencies للتفاصيل الكاملة.',
    links: [
      { href: '/agencies', label: 'تعرف على الوكالات' },
      { href: '/agencies#join', label: 'طرق الانضمام' },
      { href: '/partners', label: 'كن شريك توسع' },
    ],
    next: 'onboarding',
  },
  {
    id: 'partner',
    title: 'مسار الشريك',
    subtitle: 'بناء كيان توسع — ليس عضوًا عاديًا فقط.',
    links: [
      { href: '/partners', label: 'صفحة الشركاء' },
      { href: '/packages#compare', label: 'قارن الباقات (3 أو 7)' },
      { href: '/academy', label: 'أكاديمية القيادة' },
    ],
    next: 'onboarding',
  },
  {
    id: 'onboarding',
    title: 'ماذا يحدث في Onboarding؟',
    subtitle: 'بعد إنشاء الحساب — AI يرشدك.',
    checklist: [
      'تأكيد البريد والهوية الأساسية',
      'اختيار وتفعيل الباقة (دفع + KYC)',
      'Credo AI يشرح خطوتك التالية',
      'اختيار وكالة أو ربط راعٍ',
      'أول مهام PV/BV ومشاهدة المحفظة',
      'فتح التعلّم والمجتمع',
    ],
    next: 'growth',
  },
  {
    id: 'growth',
    title: 'مسار النمو بعد التفعيل',
    subtitle: 'Expansion path — قصة متصلة.',
    growthSteps: [
      { t: 'أسبوع 1', d: 'فهم لوحتك، أول دعوة أخلاقية، أول PV.' },
      { t: 'شهر 1', d: 'انضمام وكالة، BV جماعي، أول مكافآت.' },
      { t: 'شهر 3', d: 'رتبة أعلى، ترقية باقة إن لزم، قادة فرعيون.' },
      { t: '6+ أشهر', d: 'شريك توسع، وكالة نشطة، مجتمع وقصة نجاح.' },
    ],
    next: 'account',
  },
  {
    id: 'account',
    title: 'جاهز للانضمام؟',
    subtitle: 'التحويل المباشر — onboarding حقيقي يبدأ هنا.',
    note: 'بعد التسجيل: لا يمكن الشراء أو الشجرة أو المكافآت الشخصية قبل التفعيل — لحمايتك وللشفافية.',
    cta: { register: '/register', login: '/login' },
  },
]

export default function StartPage() {
  const { dir } = useLandingLocale()
  const { isAuthenticated } = useGateAction()
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({ goal: 'learn' })

  const step = STEPS[stepIndex]
  const pkgRec = useMemo(() => PACKAGE_REC[answers.goal] || PACKAGE_REC.learn, [answers.goal])

  const goToStep = (id) => {
    const idx = STEPS.findIndex((s) => s.id === id)
    if (idx >= 0) setStepIndex(idx)
  }

  const goNext = (option) => {
    if (step.id === 'goal' && option) {
      setAnswers((a) => ({ ...a, goal: option.id }))
      goToStep(option.next)
      return
    }
    if (step.next) {
      goToStep(step.next)
      return
    }
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1)
  }

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <main className="eco-main eco-start" dir={dir}>
      <div className="eco-start-inner eco-start-inner--wide">
        <p className="eco-eyebrow">/start — تحويل مباشر</p>
        <h1 className="eco-hero-title">مرشد بداية رحلتك</h1>
        <p className="eco-hero-sub">
          اسأل هدفك → نرشّح باقة ووكالة → نشرح onboarding → نعرض مسار النمو → ثم التسجيل.
        </p>

        <div className="eco-start-progress">
          {STEPS.map((s, i) => (
            <span key={s.id} className={i <= stepIndex ? 'is-active' : ''} title={s.id} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            className="eco-start-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
          >
            <h2>{step.title}</h2>
            <p>{step.subtitle}</p>

            {step.options && (
              <div className="eco-start-options">
                {step.options.map((opt) => (
                  <button key={opt.id} type="button" className="eco-start-opt" onClick={() => goNext(opt)}>
                    {opt.label}
                    <ArrowLeft size={16} />
                  </button>
                ))}
              </div>
            )}

            {step.dynamicPackage && (
              <div className="eco-start-reco">
                <p>بناءً على هدفك «{answers.goal}»:</p>
                <div className="eco-tier-pill eco-start-reco-tier">
                  <span className="eco-tier-num">{pkgRec.tier}</span>
                  <strong>{pkgRec.name}</strong>
                  <span>{pkgRec.why}</span>
                </div>
                <Link to="/packages#compare" className="ld-btn-ghost eco-cta-sm">
                  قارن كل الباقات
                </Link>
              </div>
            )}

            {step.checklist && (
              <ul className="eco-start-checklist">
                {step.checklist.map((c) => (
                  <li key={c}>
                    <CheckCircle2 size={16} />
                    {c}
                  </li>
                ))}
              </ul>
            )}

            {step.growthSteps && (
              <ol className="eco-start-growth">
                {step.growthSteps.map((g) => (
                  <li key={g.t}>
                    <strong>{g.t}</strong>
                    <span>{g.d}</span>
                  </li>
                ))}
              </ol>
            )}

            {step.links && (
              <div className="eco-start-links">
                {step.links.map((l) => (
                  <Link key={l.href} to={l.href} className="eco-start-opt">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}

            {step.body && <p className="eco-start-body">{step.body}</p>}
            {step.note && <p className="eco-section-note">{step.note}</p>}

            {step.cta && (
              <div className="eco-start-final">
                <Link to={step.cta.register} className="ld-btn-primary">
                  إنشاء حساب — ابدأ Onboarding
                  <ArrowLeft size={14} />
                </Link>
                <Link to={step.cta.login} className="ld-btn-ghost">
                  لدي حساب — دخول
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="eco-start-nav">
          {stepIndex > 0 && (
            <button type="button" className="ld-btn-ghost" onClick={goBack}>
              <ArrowRight size={14} />
              رجوع
            </button>
          )}
          {step.next && step.id !== 'goal' && (
            <button type="button" className="ld-btn-primary" onClick={() => goNext()}>
              التالي
              <ArrowLeft size={14} />
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completeOnboardingStep, skipTreeOnboarding } from '../../api/tree.api'
import { toast } from '../shared/Toast'
import Tree3DScene from './Tree3DScene'
import EarningsSimulation from './EarningsSimulation'

const METRIC_CARDS = [
  { key: 'PV', title: 'PV — الحجم الشخصي', desc: 'مشترياتك ومبيعاتك المباشرة — أساس تقدمك الشخصي' },
  { key: 'BV', title: 'BV — حجم الأعمال', desc: 'يُوزَّع على أرجل الشجرة ويُحسب للمطابقة والعمولات' },
  { key: 'GV', title: 'GV — حجم المجموعة', desc: 'مجموع فريقك — مؤشر نمو المنظمة' },
  { key: 'TV', title: 'TV — الحجم الكلي', desc: 'عمق الشبكة بالكامل — للرتب القيادية' },
  { key: 'CV', title: 'CV — حجم العمولة', desc: 'ما يتحول فعلياً لأرباح قابلة للسحب' },
]

function StepContent({ step, tree, vizConfig }) {
  const content = step.content_json || {}
  switch (step.visualization_type) {
    case 'tree_3d':
      return (
        <div>
          <p style={{ color: 'var(--text-2)', marginBottom: 12, fontSize: 13 }}>
            الرجل الأيسر والأيمن، الراعي، الوضع، الخطوط العليا والسفلى
          </p>
          <Tree3DScene
            tree={tree || { id: 'demo', username: 'أنت', left: { id: 'l', username: 'يسار' }, right: { id: 'r', username: 'يمين' } }}
            config={vizConfig}
            className="tree-onboarding__canvas"
          />
        </div>
      )
    case 'metrics':
      return (
        <div className="tree-onboarding__metrics">
          {METRIC_CARDS.map((m) => (
            <div key={m.key} className="tree-onboarding__metric-card">
              <h4>{m.title}</h4>
              <p>{m.desc}</p>
            </div>
          ))}
        </div>
      )
    case 'simulation':
      return <EarningsSimulation defaults={content} />
    case 'activation':
      return (
        <motion.div
          className="tree-onboarding__activation"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h2>🔥 موقعك في الشبكة أصبح نشطاً</h2>
          <p>تم فتح الشجرة، لوحة التحكم، المهام، وأنظمة الوكالة</p>
        </motion.div>
      )
    default:
      return (
        <ul className="tree-onboarding__bullets">
          {(content.bullets || content.topics || [step.subtitle_ar || '']).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )
  }
}

export default function TreeOnboardingWizard({ steps, currentStepKey, completedSteps, tree, vizConfig, onComplete }) {
  const queryClient = useQueryClient()
  const idx = Math.max(0, steps.findIndex((s) => s.step_key === currentStepKey))
  const step = steps[idx] || steps[0]
  const [direction, setDirection] = useState(1)

  const completeMut = useMutation({
    mutationFn: () => completeOnboardingStep(step.step_key),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tree-access'] })
      queryClient.invalidateQueries({ queryKey: ['tree-onboarding'] })
      if (data.isCompleted) {
        toast.success('اكتمل التعريف — مرحباً بك في الإمبراطورية!')
        onComplete?.()
      } else {
        setDirection(1)
      }
    },
  })

  const skipMut = useMutation({
    mutationFn: skipTreeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree-access'] })
      onComplete?.()
    },
  })

  if (!step) return null

  return (
    <div className="tree-onboarding" dir="rtl">
      <div className="tree-onboarding__progress">
        {steps.map((s, i) => (
          <div
            key={s.step_key}
            className={`tree-onboarding__dot ${
              completedSteps.includes(s.step_key) ? 'done' : i === idx ? 'active' : ''
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step.step_key}
          custom={direction}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.35 }}
          className="tree-onboarding__panel module-card"
        >
          <span className="tree-onboarding__step-label">
            الخطوة {idx + 1} من {steps.length}
          </span>
          <h2 className="font-display">{step.title_ar}</h2>
          {step.subtitle_ar && <p className="tree-onboarding__subtitle">{step.subtitle_ar}</p>}
          <StepContent step={step} tree={tree} vizConfig={vizConfig} />
        </motion.div>
      </AnimatePresence>

      <div className="tree-onboarding__actions">
        <button
          type="button"
          className="tree-locked__btn tree-locked__btn--secondary"
          onClick={() => skipMut.mutate()}
          disabled={skipMut.isPending}
        >
          تخطي
        </button>
        <button
          type="button"
          className="tree-locked__btn tree-locked__btn--primary"
          onClick={() => completeMut.mutate()}
          disabled={completeMut.isPending}
        >
          {idx >= steps.length - 1 ? 'إنهاء وتفعيل' : 'التالي'}
        </button>
      </div>
    </div>
  )
}

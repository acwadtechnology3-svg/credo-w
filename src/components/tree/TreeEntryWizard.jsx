import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  completeTreeEntry,
  getTreeEntrySession,
  previewTreePlacement,
  saveTreeEntryStep,
} from '../../api/tree.api'
import { toast } from '../shared/Toast'

const STEPS = [
  { key: 1, title: 'كود الدعوة', question: 'هل لديك كود دعوة؟' },
  { key: 2, title: 'الوكالة', question: 'هل تريد الانضمام تحت وكالة؟' },
  { key: 3, title: 'التوسع', question: 'هل تريد اختيار جهة التوسع؟' },
  { key: 4, title: 'الوضع', question: 'AUTO placement أو MANUAL؟' },
]

export default function TreeEntryWizard({ onComplete }) {
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [hasInvite, setHasInvite] = useState(null)
  const [sponsorCode, setSponsorCode] = useState('')
  const [joinAgency, setJoinAgency] = useState(null)
  const [pickSide, setPickSide] = useState(null)
  const [expansionSide, setExpansionSide] = useState('AUTO')
  const [placementMode, setPlacementMode] = useState('AUTO')
  const [preview, setPreview] = useState(null)

  const { data: entryData } = useQuery({
    queryKey: ['tree-entry'],
    queryFn: getTreeEntrySession,
  })

  useEffect(() => {
    const s = entryData?.session
    if (!s) return
    if (s.current_step) setStep(s.current_step)
    if (s.has_invite_code != null) setHasInvite(s.has_invite_code)
    if (s.sponsor_code) setSponsorCode(s.sponsor_code)
    if (s.join_under_agency != null) setJoinAgency(s.join_under_agency)
    if (s.expansion_side) setExpansionSide(s.expansion_side)
    if (s.placement_mode) setPlacementMode(s.placement_mode)
  }, [entryData])

  const saveMut = useMutation({
    mutationFn: (patch) => saveTreeEntryStep(patch),
  })

  const completeMut = useMutation({
    mutationFn: () =>
      completeTreeEntry({
        sponsorCode: hasInvite ? sponsorCode.trim() : undefined,
        placementSide: pickSide ? expansionSide : 'AUTO',
        placementMode,
      }),
    onSuccess: () => {
      toast.success('تم تفعيل موضعك في المنظومة')
      qc.invalidateQueries({ queryKey: ['tree-access'] })
      qc.invalidateQueries({ queryKey: ['placement-tree'] })
      onComplete?.()
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'تعذّر الإكمال'),
  })

  const handleNext = async () => {
    await saveMut.mutateAsync({
      step: step + 1,
      hasInviteCode: hasInvite,
      joinUnderAgency: joinAgency,
      sponsorCode: hasInvite ? sponsorCode : null,
      expansionSide: pickSide ? expansionSide : 'AUTO',
      placementMode,
    })

    if (step === 3 && hasInvite && sponsorCode.trim()) {
      try {
        const { preview: p } = await previewTreePlacement({
          sponsorCode: sponsorCode.trim(),
          strategy: placementMode === 'AUTO' ? 'AUTO_BALANCE' : expansionSide,
          manualSide: placementMode === 'MANUAL' ? expansionSide : null,
        })
        setPreview(p)
      } catch {
        /* preview optional */
      }
    }

    if (step < 4) setStep((s) => s + 1)
    else completeMut.mutate()
  }

  const canProceed = () => {
    if (step === 1) return hasInvite !== null && (!hasInvite || sponsorCode.trim().length > 3)
    if (step === 2) return joinAgency !== null
    if (step === 3) return pickSide !== null && (!pickSide || ['LEFT', 'RIGHT', 'AUTO'].includes(expansionSide))
    if (step === 4) return !!placementMode
    return false
  }

  return (
    <div className="tree-entry-wizard" dir="rtl">
      <motion.div className="tree-entry-wizard__hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display">ابدأ بناء منظومتك</h1>
        <p>راعٍ ≠ موضع — اختر استراتيجية التوسع الذكية</p>
        <div className="tree-entry-wizard__steps">
          {STEPS.map((s) => (
            <span key={s.key} className={step >= s.key ? 'active' : ''}>
              {s.key}
            </span>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="tree-entry-wizard__panel module-card module-card-body"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <h3>{STEPS[step - 1].question}</h3>

          {step === 1 && (
            <div className="tree-entry-wizard__choices">
              <button type="button" className={hasInvite === true ? 'active' : ''} onClick={() => setHasInvite(true)}>
                نعم — لدي كود
              </button>
              <button type="button" className={hasInvite === false ? 'active' : ''} onClick={() => setHasInvite(false)}>
                لا — سأستخدم الراعي الافتراضي
              </button>
              {hasInvite && (
                <input
                  className="tree-entry-wizard__input"
                  placeholder="USR-000123"
                  value={sponsorCode}
                  onChange={(e) => setSponsorCode(e.target.value)}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="tree-entry-wizard__choices">
              <button type="button" className={joinAgency === true ? 'active' : ''} onClick={() => setJoinAgency(true)}>
                نعم — تحت وكالة
              </button>
              <button type="button" className={joinAgency === false ? 'active' : ''} onClick={() => setJoinAgency(false)}>
                لا — شبكة عامة
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="tree-entry-wizard__choices">
              <button type="button" className={pickSide === false ? 'active' : ''} onClick={() => setPickSide(false)}>
                تلقائي (أضعف رجل)
              </button>
              <button type="button" className={pickSide === true ? 'active' : ''} onClick={() => setPickSide(true)}>
                أختار يدوياً
              </button>
              {pickSide && (
                <select value={expansionSide} onChange={(e) => setExpansionSide(e.target.value)} className="tree-entry-wizard__input">
                  <option value="LEFT">يسار</option>
                  <option value="RIGHT">يمين</option>
                  <option value="AUTO">توازن تلقائي</option>
                </select>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="tree-entry-wizard__choices">
              <button
                type="button"
                className={placementMode === 'AUTO' ? 'active' : ''}
                onClick={() => setPlacementMode('AUTO')}
              >
                AUTO — توازن ذكي
              </button>
              <button
                type="button"
                className={placementMode === 'MANUAL' ? 'active' : ''}
                onClick={() => setPlacementMode('MANUAL')}
              >
                MANUAL — تحكم كامل
              </button>
              {preview && (
                <div className="tree-entry-wizard__preview">
                  <span>الجانب المتوقع: {preview.resolvedSide}</span>
                  {preview.willSpillover && <span className="warn">توسع عميق (BFS)</span>}
                  <div className="tree-entry-wizard__legs">
                    <span>يسار: {preview.leftBv}</span>
                    <span>يمين: {preview.rightBv}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="tree-entry-wizard__actions">
            {step > 1 && (
              <button type="button" className="tree-locked__btn tree-locked__btn--secondary" onClick={() => setStep((s) => s - 1)}>
                رجوع
              </button>
            )}
            <button
              type="button"
              className="tree-locked__btn tree-locked__btn--primary"
              disabled={!canProceed() || completeMut.isPending || saveMut.isPending}
              onClick={handleNext}
            >
              {step === 4 ? (completeMut.isPending ? 'جاري التفعيل...' : 'تفعيل المنظومة') : 'التالي'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRef, useState } from 'react'
import { getMyPackageStatus } from '../../api/packages.api'
import {
  createCheckoutSession,
  executePurchase,
  createPurchaseIdempotencyKey,
} from '../../api/checkout.api'
import SupportQuickLink from '../../components/support/SupportQuickLink'

const LEVEL_NAMES = { 0: 'غير مشترك', 1: 'أحادي', 2: 'ثنائي', 3: 'ثلاثي', 4: 'رباعي', 7: 'سباعي' }
const TIER_HINTS = {
  1: 'الباقة الأساسية',
  3: 'تخطّى الأحادي',
  7: 'الباقة الكاملة',
}
const UPGRADE_PATH = {
  1: 'بعد الاشتراك يمكنك الترقية عبر باقة ثنائي → ثلاثي',
  3: 'بعد الاشتراك يمكنك الترقية عبر باقة رباعي → سباعي',
  7: 'أعلى مستوى — لا توجد ترقية بعدها',
}

const DETAIL_STATS = (pkg) => [
  { label: 'Slots في الشجرة', value: pkg.slots, accent: true },
  { label: 'نقاط BV', value: `+${pkg.bv_points}` },
  { label: 'نقاط PV', value: `+${pkg.pv_points ?? pkg.bv_points}` },
  {
    label: 'عمولة مباشرة',
    value: `EGP ${parseFloat(pkg.direct_commission_egp).toLocaleString()}`,
    accent: true,
  },
]

export default function PackageDetailPage() {
  const { level } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const packageLevel = Number(level)

  const [confirm, setConfirm] = useState(null)
  const [err, setErr] = useState('')
  const idempotencyRef = useRef(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-package-status'],
    queryFn: getMyPackageStatus,
  })

  const mutation = useMutation({
    mutationFn: async ({ packageId, idempotencyKey }) => {
      const checkout = await createCheckoutSession(packageId)
      return executePurchase({
        package_id: packageId,
        checkout_session_id: checkout.session.id,
        idempotency_key: idempotencyKey,
        payment_method: 'cmoney',
      })
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['my-package-status'] })
      qc.invalidateQueries({ queryKey: ['membership-me'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setConfirm(null)
      idempotencyRef.current = null
      navigate('/packages', { state: { purchaseMessage: r.message } })
    },
    onError: (e) => {
      const code = e.response?.data?.code
      setErr(
        code === 'PURCHASE_IN_PROGRESS' || code === 'PURCHASE_LOCKED'
          ? e.response?.data?.error || 'عملية قيد المعالجة — انتظر ثم حدّث الصفحة'
          : e.response?.data?.error || 'حدث خطأ'
      )
      idempotencyRef.current = null
    },
  })

  if (isLoading) {
    return (
      <div className="pkg-detail" dir="rtl" style={{ textAlign: 'center', color: 'var(--text-3)' }}>
        جاري التحميل...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="pkg-detail module-page page-enter" dir="rtl">
        <p className="pill bad">تعذّر تحميل تفاصيل الباقة</p>
        <Link to="/packages" className="pkg-detail-back">
          ← العودة للباقات
        </Link>
      </div>
    )
  }

  const allPackages = [
    ...(data.directPackages || []),
    ...(data.upgradePackage ? [data.upgradePackage] : []),
  ]
  const pkg = allPackages.find((p) => p.package_level === packageLevel)

  if (!pkg || Number.isNaN(packageLevel)) {
    return (
      <div className="pkg-detail module-page page-enter" dir="rtl">
        <p className="pkg-detail-note" style={{ textAlign: 'right' }}>
          الباقة غير موجودة أو غير متاحة حالياً.
        </p>
        <Link to="/packages" className="pkg-detail-back">
          ← العودة للباقات
        </Link>
      </div>
    )
  }

  const hint = TIER_HINTS[packageLevel] || (pkg.is_upgrade_only ? 'باقة ترقية' : '')
  const canSubscribe = data.currentLevel === 0 && !pkg.is_upgrade_only && !data.isFull
  const perms = pkg.permissions_json || {}
  const canTeam = perms.can_create_team
  const maxTeam = perms.max_team_members ?? 0
  const lvlClass = `pkg-detail--lvl-${packageLevel}`

  const openConfirm = () => {
    idempotencyRef.current = createPurchaseIdempotencyKey()
    setErr('')
    setConfirm(pkg)
  }

  return (
    <div className={`pkg-detail module-page page-enter ${lvlClass}`} dir="rtl">
      <SupportQuickLink category="packages" />
      <Link to="/packages" className="pkg-detail-back">
        ← العودة للباقات
      </Link>

      {err ? (
        <div className="pill bad" style={{ marginBottom: 'var(--s-4)', padding: '12px 16px', fontSize: '13px' }}>
          ⚠️ {err}
        </div>
      ) : null}

      <header className="pkg-detail-hero">
        {hint ? <span className="pkg-detail-badge">{hint}</span> : null}
        <h1 className="pkg-detail-title">{LEVEL_NAMES[packageLevel] || pkg.name}</h1>
        <p className="pkg-detail-desc">{pkg.description}</p>
        <div className="pkg-detail-price">
          EGP {parseFloat(pkg.price_egp).toLocaleString()}
          <span>سعر الاشتراك</span>
        </div>
      </header>

      <section className="pkg-detail-panel">
        <h2 className="pkg-detail-panel-title">تفاصيل الباقة</h2>
        <div className="pkg-detail-stats">
          {DETAIL_STATS(pkg).map((s) => (
            <div key={s.label} className={`pkg-detail-stat${s.accent ? ' pkg-detail-stat--accent' : ''}`}>
              <span className="pkg-detail-stat-label">{s.label}</span>
              <span className="pkg-detail-stat-value">{s.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'var(--s-4)' }}>
          <div className="pkg-detail-row">
            <span className="pkg-detail-row-label">المستوى</span>
            <span className="pkg-detail-row-value">{pkg.name}</span>
          </div>
          <div className="pkg-detail-row">
            <span className="pkg-detail-row-label">نوع الشراء</span>
            <span className="pkg-detail-row-value">
              {pkg.is_upgrade_only ? 'ترقية فقط' : 'اشتراك مباشر'}
            </span>
          </div>
          {pkg.can_upgrade_to_level ? (
            <div className="pkg-detail-row">
              <span className="pkg-detail-row-label">الترقية التالية</span>
              <span className="pkg-detail-row-value pkg-detail-row-value--accent">
                {LEVEL_NAMES[pkg.can_upgrade_to_level] || `مستوى ${pkg.can_upgrade_to_level}`}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="pkg-detail-panel">
        <h2 className="pkg-detail-panel-title">المميزات والصلاحيات</h2>
        <ul className="pkg-detail-features">
          <li>
            {canTeam
              ? `يمكنك إنشاء فريق (حتى ${maxTeam} عضو)`
              : 'لا يتضمن إنشاء فريق — مناسب للبداية'}
          </li>
          <li>{UPGRADE_PATH[packageLevel] || '—'}</li>
          <li>الدفع من محفظة C Money عند الاشتراك</li>
          <li>يُضاف BV و PV لحسابك فور تأكيد الشراء</li>
        </ul>
      </section>

      {canSubscribe ? (
        <button type="button" className="btn btn-primary pkg-detail-cta" onClick={openConfirm}>
          اشترك الآن ✓
        </button>
      ) : data.currentLevel === 0 && pkg.is_upgrade_only ? (
        <p className="pkg-detail-note">
          هذه باقة ترقية — اشترك أولاً في إحدى الباقات المباشرة من{' '}
          <Link to="/packages">صفحة الباقات</Link>
        </p>
      ) : data.isFull ? (
        <p className="pkg-detail-note">لديك بالفعل الباقة الكاملة</p>
      ) : null}

      {confirm ? (
        <div className="pkg-confirm-overlay" dir="rtl">
          <div className="pkg-confirm-modal">
            <h3>تأكيد الاشتراك</h3>
            <div className="pkg-confirm-box">
              <div className="pkg-confirm-row">
                <span>الباقة</span>
                <span>{confirm.name}</span>
              </div>
              <div className="pkg-confirm-row pkg-confirm-row--price">
                <span>السعر</span>
                <span>EGP {parseFloat(confirm.price_egp).toLocaleString()}</span>
              </div>
              <div className="pkg-confirm-row">
                <span>Slots</span>
                <span>+{confirm.slots}</span>
              </div>
            </div>
            <p className="pkg-confirm-hint">سيتم خصم المبلغ من محفظة C Money</p>
            <div className="pkg-confirm-actions">
              <button type="button" className="pkg-confirm-cancel" onClick={() => setConfirm(null)}>
                إلغاء
              </button>
              <button
                type="button"
                className="pkg-confirm-submit"
                disabled={mutation.isPending}
                onClick={() => {
                  if (!idempotencyRef.current) {
                    idempotencyRef.current = createPurchaseIdempotencyKey()
                  }
                  mutation.mutate({
                    packageId: confirm.id,
                    idempotencyKey: idempotencyRef.current,
                  })
                }}
              >
                {mutation.isPending ? 'جاري...' : 'تأكيد ✓'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

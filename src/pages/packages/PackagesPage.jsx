import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyPackageStatus } from '../../api/packages.api'
import { getMyAgency } from '../../api/agencies.api'
import {
  createCheckoutSession,
  executePurchase,
  createPurchaseIdempotencyKey,
} from '../../api/checkout.api'
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const LEVEL_NAMES = { 0: 'غير مشترك', 1: 'أحادي', 2: 'ثنائي', 3: 'ثلاثي', 4: 'رباعي', 7: 'سباعي' }
const LEVEL_COLORS = { 0: '#888', 1: '#378ADD', 2: '#534AB7', 3: '#27500A', 4: '#BA7517', 7: '#A32D2D' }
const LEVEL_BG = { 0: '#f5f5f5', 1: '#E6F1FB', 2: '#EEEDFE', 3: '#EAF3DE', 4: '#FAEEDA', 7: '#FCEBEB' }
const DIRECT_TIERS = [
  { level: 1, slots: 1, hint: 'الباقة الأساسية' },
  { level: 3, slots: 3, hint: 'تخطّى الأحادي' },
  { level: 7, slots: 7, hint: 'الباقة الكاملة' },
]

function resultingLevel(row) {
  return row.resulting_level ?? row.packages?.can_upgrade_to_level ?? row.package_level
}

export default function PackagesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const location = useLocation()
  const [confirm, setConfirm] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const idempotencyRef = useRef(null)

  useEffect(() => {
    if (location.state?.purchaseMessage) {
      setMsg(location.state.purchaseMessage)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-package-status'],
    queryFn: getMyPackageStatus,
  })

  const openConfirm = (pkg) => {
    idempotencyRef.current = createPurchaseIdempotencyKey()
    setErr('')
    setConfirm(pkg)
  }

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
    onSuccess: async (r) => {
      qc.invalidateQueries({ queryKey: ['my-package-status'] })
      qc.invalidateQueries({ queryKey: ['membership-me'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['foundation-status'] })
      setConfirm(null)
      setMsg(r.message)
      setErr('')
      idempotencyRef.current = null
      try {
        const { getTreeAccess } = await import('../../api/tree.api')
        const treeCtx = await getTreeAccess()
        if (treeCtx?.needsOnboarding || (treeCtx?.hasActivePackage && !treeCtx?.canViewLiveTree)) {
          navigate('/team/placement-tree', {
            state: { fromPurchase: true, message: r.message },
          })
          return
        }
      } catch {
        /* tree tables optional until migration */
      }
      try {
        const { agency, onboarding } = await getMyAgency()
        if (agency && onboarding?.checklist?.some((c) => !c.done)) {
          navigate('/agencies/onboarding', {
            state: { fromPurchase: true, message: r.message },
          })
        } else if (!agency) {
          navigate('/agencies/discover', {
            state: { fromPurchase: true, message: r.message },
          })
        }
      } catch {
        /* foundation optional until P4 migration */
      }
    },
    onError: (e) => {
      const code = e.response?.data?.code
      if (code === 'PURCHASE_IN_PROGRESS' || code === 'PURCHASE_LOCKED') {
        setErr(e.response?.data?.error || 'عملية قيد المعالجة — انتظر ثم حدّث الصفحة')
      } else {
        setErr(e.response?.data?.error || 'حدث خطأ')
      }
      idempotencyRef.current = null
    },
  })

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', color: 'var(--text-3)', textAlign: 'center' }}>جاري التحميل...</div>
    )
  }

  if (isError) {
    return (
      <div className="module-page page-enter" dir="rtl" style={{ padding: '1.5rem' }}>
        <p className="pill bad">تعذّر تحميل الباقات — تأكد أن السيرفر يعمل وأن جدول packages موجود في Supabase</p>
      </div>
    )
  }

  const currentLevel = data?.currentLevel || 0
  const isFull = data?.isFull
  const directByLevel = Object.fromEntries(
    (data?.directPackages || []).map((p) => [p.package_level, p])
  )

  return (
    <div className="module-page page-enter" dir="rtl" style={{ padding: '1.5rem', maxWidth: '800px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: 'var(--text-1)' }}>
        الباقات والترقية
      </h2>
      {currentLevel === 0 && (
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px', lineHeight: 1.6 }}>
          اختر إحدى الباقات أدناه ثم اضغط <strong style={{ color: 'var(--lavender)' }}>اشترك الآن</strong> — يُخصم
          السعر من محفظة <strong>C Money</strong>.
        </p>
      )}

      {msg && (
        <div
          style={{
            background: '#EAF3DE',
            border: '1px solid #C0DD97',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#27500A',
            fontWeight: '500',
          }}
        >
          🎉 {msg}
        </div>
      )}
      {err && (
        <div
          style={{
            background: '#FCEBEB',
            border: '1px solid #F7C1C1',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#c00',
          }}
        >
          ⚠️ {err}
        </div>
      )}

      <div
        style={{
          background: LEVEL_BG[currentLevel],
          border: `2px solid ${LEVEL_COLORS[currentLevel]}`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>مستواك الحالي</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: LEVEL_COLORS[currentLevel] }}>
              {currentLevel === 0 ? 'غير مشترك' : `باقة ${LEVEL_NAMES[currentLevel]}`}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Slots الحالية</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: LEVEL_COLORS[currentLevel] }}>
              {data?.currentSlots || 0}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#888',
              marginBottom: '6px',
            }}
          >
            <span>أحادي (1)</span>
            <span>ثلاثي (3)</span>
            <span>سباعي (7)</span>
          </div>
          <div style={{ height: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{
                height: '10px',
                background: LEVEL_COLORS[currentLevel],
                borderRadius: '5px',
                width:
                  currentLevel === 0
                    ? '0%'
                    : currentLevel === 1
                      ? '14%'
                      : currentLevel === 3
                        ? '43%'
                        : currentLevel === 7
                          ? '100%'
                          : '0%',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#888',
              marginTop: '4px',
            }}
          >
            <span
              style={{
                color: currentLevel >= 1 ? LEVEL_COLORS[currentLevel] : '#ccc',
                fontWeight: currentLevel >= 1 ? '600' : '400',
              }}
            >
              {currentLevel >= 1 ? '✓' : '○'} أحادي
            </span>
            <span
              style={{
                color: currentLevel >= 3 ? LEVEL_COLORS[currentLevel] : '#ccc',
                fontWeight: currentLevel >= 3 ? '600' : '400',
              }}
            >
              {currentLevel >= 3 ? '✓' : '○'} ثلاثي
            </span>
            <span
              style={{
                color: currentLevel >= 7 ? LEVEL_COLORS[currentLevel] : '#ccc',
                fontWeight: currentLevel >= 7 ? '600' : '400',
              }}
            >
              {currentLevel >= 7 ? '✓' : '○'} سباعي
            </span>
          </div>
        </div>

        {isFull && (
          <div
            style={{
              marginTop: '12px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: '500',
              textAlign: 'center',
            }}
          >
            🏆 لديك الباقة الكاملة — السباعي
          </div>
        )}
      </div>

      {data?.upgradePackage && !isFull && (
        <div
          style={{
            background: '#1a1a2e',
            border: '2px solid #534AB7',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>⬆️</span>
            <div>
              <div style={{ fontSize: '11px', color: '#AFA9EC', marginBottom: '2px' }}>متاح للترقية</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#EEEDFE' }}>
                {data.upgradePackage.upgrade_message}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            {[
              { label: 'السعر', value: `EGP ${parseFloat(data.upgradePackage.price_egp).toLocaleString()}` },
              { label: 'BV يُضاف', value: `+${data.upgradePackage.bv_points}` },
              { label: 'Slots تُضاف', value: `+${data.upgradePackage.slots}` },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '3px' }}>{s.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#EEEDFE' }}>{s.value}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => openConfirm(data.upgradePackage)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#534AB7',
              color: '#EEEDFE',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ترقية الآن ⬆️
          </button>
        </div>
      )}

      {currentLevel === 0 && !isFull && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '14px', color: 'var(--text-1)' }}>
            اختر باقتك للاشتراك
          </div>
          {(data?.directPackages || []).length === 0 ? (
            <div
              className="card"
              style={{
                padding: '16px 18px',
                marginBottom: '12px',
                borderColor: 'var(--warning, #BA7517)',
                color: 'var(--text-2)',
                fontSize: '13px',
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: 'var(--text-1)' }}>جدول الباقات فاضي في Supabase.</strong>
              <br />
              افتح Supabase → SQL Editor → الصق وشغّل الملف:
              <br />
              <code style={{ fontSize: '11px', display: 'block', marginTop: 8 }}>
                server/src/db/phase-d-reseed-packages.sql
              </code>
              في آخر النتيجة لازم تشوف 5 صفوف (أحادي، ثنائي، ثلاثي، رباعي، سباعي). بعدها حدّث الصفحة.
              {data?.catalogEmpty ? (
                <span style={{ display: 'block', marginTop: 8, fontSize: '12px', color: 'var(--text-3)' }}>
                  (السيرفر مش قادر يملأ الجدول تلقائياً — راجع SUPABASE_SERVICE_KEY في .env)
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="pkg-tier-grid">
            {DIRECT_TIERS.map((tier) => {
              const pkg = directByLevel[tier.level]
              return (
                <div
                  key={tier.level}
                  className={`pkg-tier-card pkg-tier-card--lvl-${tier.level}${pkg ? '' : ' pkg-tier-card--disabled'}`}
                >
                  <div className="pkg-tier-hint">{tier.hint}</div>
                  <div className="pkg-tier-name">{LEVEL_NAMES[tier.level]}</div>
                  <div className="pkg-tier-slots">
                    {tier.slots} slot{tier.slots > 1 ? 's' : ''} في الشجرة
                  </div>
                  {pkg ? (
                    <>
                      <div className="pkg-tier-price">
                        EGP {parseFloat(pkg.price_egp).toLocaleString()}
                      </div>
                      <div className="pkg-tier-meta">
                        BV +{pkg.bv_points} · عمولة مباشرة EGP {pkg.direct_commission_egp}
                      </div>
                      <div className="pkg-tier-actions">
                        <button type="button" className="btn btn-primary" onClick={() => openConfirm(pkg)}>
                          اشترك الآن ✓
                        </button>
                        <Link to={`/packages/${tier.level}`} className="pkg-tier-details-link">
                          تفاصيل أكثر
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="pkg-tier-meta">غير متوفرة حالياً</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {currentLevel !== 0 && (data?.directPackages || []).length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '12px', color: 'var(--text-1)' }}>
            باقات مباشرة متاحة
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data.directPackages || []).map((pkg) => (
              <div key={pkg.id} className="card" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px', color: 'var(--text-1)' }}>
                    باقة {pkg.name}
                    <span className="pill" style={{ marginRight: '8px', fontSize: '11px' }}>
                      {pkg.slots} slots
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{pkg.description}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--lavender)', marginBottom: '8px' }}>
                    EGP {parseFloat(pkg.price_egp).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => openConfirm(pkg)}>
                      اشترك الآن
                    </button>
                    <Link
                      to={`/packages/${pkg.package_level}`}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '12px' }}
                    >
                      تفاصيل أكثر
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentLevel === 0 && !isFull && !data?.upgradePackage && (data?.directPackages || []).length > 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '-12px', marginBottom: '20px' }}>
          💡 بعد اشتراك <strong>أحادي</strong> ستظهر لك ترقية <strong>ثنائي → ثلاثي</strong>؛ وبعد <strong>ثلاثي</strong>{' '}
          ترقية <strong>رباعي → سباعي</strong>.
        </p>
      )}

      {(data?.history || []).length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '10px' }}>سجل الباقات</div>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  {['التاريخ', 'الباقة', 'نوع العملية', 'Slots المضافة', 'المستوى السابق', 'المستوى الجديد'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          color: '#888',
                          fontWeight: '500',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {(data.history || []).map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                    <td style={{ padding: '8px 12px', color: '#888' }}>
                      {new Date(h.purchased_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>{h.packages?.name}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span
                        style={{
                          background: h.is_upgrade ? '#EEEDFE' : '#EAF3DE',
                          color: h.is_upgrade ? '#3C3489' : '#27500A',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        {h.is_upgrade ? 'ترقية ⬆️' : 'اشتراك جديد'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '600', color: '#534AB7', textAlign: 'center' }}>
                      +{h.slots_added}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#888', textAlign: 'center' }}>
                      {LEVEL_NAMES[h.previous_level] || '—'}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '500', textAlign: 'center' }}>
                      {LEVEL_NAMES[resultingLevel(h)] || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              width: '380px',
              maxWidth: '90vw',
            }}
          >
            <h3 style={{ fontWeight: '600', fontSize: '16px', marginBottom: '16px' }}>
              {confirm.is_upgrade_only ? 'تأكيد الترقية' : 'تأكيد الاشتراك'}
            </h3>
            <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>الباقة</span>
                <span style={{ fontWeight: '600' }}>
                  {confirm.name}
                  {confirm.upgrade_message ? ` (${confirm.upgrade_message})` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>السعر</span>
                <span style={{ fontWeight: '700', color: '#534AB7' }}>
                  EGP {parseFloat(confirm.price_egp).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>BV يُضاف</span>
                <span style={{ fontWeight: '600', color: '#27500A' }}>+{confirm.bv_points}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>Slots تُضاف</span>
                <span style={{ fontWeight: '600', color: '#534AB7' }}>+{confirm.slots}</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px', textAlign: 'center' }}>
              C Money فوري — أو دفع هجين (محفظة + Instapay / بنك / USDT)
            </p>
            <button
              type="button"
              onClick={() => {
                setConfirm(null)
                navigate(`/packages/pay?package_id=${confirm.id}`)
              }}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                background: 'linear-gradient(135deg, #1a1a2e, #534AB7)',
                color: '#EEEDFE',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              دفع هجين / خارجي
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!idempotencyRef.current) {
                    idempotencyRef.current = createPurchaseIdempotencyKey()
                  }
                  mutation.mutate({
                    packageId: confirm.id,
                    idempotencyKey: idempotencyRef.current,
                  })
                }}
                disabled={mutation.isPending}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#534AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {mutation.isPending ? 'جاري...' : 'تأكيد ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

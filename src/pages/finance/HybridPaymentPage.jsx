import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  quoteHybridPayment,
  createPaymentSession,
  getFinancePaymentMethods,
  getFinanceWallets,
  completeWalletPayment,
  uploadPaymentProof,
  getPaymentSession,
  reservePaymentWallets,
} from '../../api/finance.api'
import { createCheckoutSession } from '../../api/checkout.api'
import PageLoader from '../../components/shared/PageLoader'
import { toast } from '../../components/shared/Toast'
import '../../styles/wallet-page.css'

const STATUS_LABEL = {
  INITIATED: 'بدء',
  WALLET_RESERVED: 'محجوز',
  EXTERNAL_PENDING: 'بانتظار خارجي',
  UNDER_REVIEW: 'مراجعة',
  COMPLETED: 'مكتمل',
  REJECTED: 'مرفوض',
  EXPIRED: 'منتهي',
}

export default function HybridPaymentPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const packageId = params.get('package_id')

  const [phase, setPhase] = useState('init')
  const [checkoutSessionId, setCheckoutSessionId] = useState(null)
  const [paymentSessionId, setPaymentSessionId] = useState(null)
  const [quote, setQuote] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [externalRef, setExternalRef] = useState('')
  const [timeline, setTimeline] = useState([])

  const { data: methods } = useQuery({
    queryKey: ['finance-methods'],
    queryFn: getFinancePaymentMethods,
    enabled: phase !== 'init',
  })

  const { data: wallets } = useQuery({
    queryKey: ['finance-ecosystem-pay'],
    queryFn: getFinanceWallets,
    enabled: phase !== 'init',
  })

  const startMutation = useMutation({
    mutationFn: async () => {
      const checkout = await createCheckoutSession(packageId)
      const sid = checkout.session?.id
      setCheckoutSessionId(sid)
      const q = await quoteHybridPayment({ checkout_session_id: sid })
      setQuote(q)
      const ps = await createPaymentSession({
        checkout_session_id: sid,
        allocations: q.allocations,
        idempotency_key: `ps-${packageId}-${Date.now()}`,
      })
      const pid = ps.session?.id
      setPaymentSessionId(pid)
      setTimeline([{ status: 'INITIATED', at: new Date().toISOString() }])
      return { q, pid }
    },
    onSuccess: () => setPhase('split'),
    onError: (e) => toast.error(e.response?.data?.error || e.message),
  })

  const payMutation = useMutation({
    mutationFn: async () => {
      const result = await completeWalletPayment(paymentSessionId, {
        idempotency_key: `pay-${paymentSessionId}`,
      })
      return result
    },
    onSuccess: async (data) => {
      if (data) {
        setPhase('done')
        toast.success(data.message || 'تم التفعيل')
        const refreshed = await getPaymentSession(paymentSessionId)
        setTimeline(refreshed.transitions || [])
      }
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message),
  })

  const proofMutation = useMutation({
    mutationFn: async () => {
      if (!proofFile) throw new Error('ارفع صورة الإثبات')
      const reader = new FileReader()
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(proofFile)
      })
      return uploadPaymentProof(paymentSessionId, {
        image_base64: base64,
        filename: proofFile.name,
        external_reference: externalRef,
      })
    },
    onSuccess: async () => {
      setPhase('review')
      toast.success('تم إرسال الإثبات للمراجعة')
      const refreshed = await getPaymentSession(paymentSessionId)
      setTimeline(refreshed.transitions || [])
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message),
  })

  if (!packageId) {
    return (
      <div className="finance-pay-shell">
        <p>لم يتم تحديد باقة</p>
        <button type="button" className="finance-btn-gold" onClick={() => navigate('/packages')}>
          العودة
        </button>
      </div>
    )
  }

  if (phase === 'init') {
    return (
      <div className="finance-pay-shell">
        <div className="finance-pay-hero">
          <span className="finance-pay-hero__badge">Phase P3</span>
          <h1>دفع هجين آمن</h1>
          <p>محفظة C Money + Instapay · فودافون · بنك · USDT</p>
          <button
            type="button"
            className="finance-btn-gold"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            {startMutation.isPending ? 'جاري التحضير...' : 'بدء جلسة الدفع'}
          </button>
        </div>
      </div>
    )
  }

  if (startMutation.isPending) return <PageLoader />

  const externalAmt = quote?.externalAmount ?? 0
  const walletAmt = quote?.walletAmount ?? 0
  const total = quote?.total ?? 0

  return (
    <div className="finance-pay-shell finance-pay-flow">
      <header className="finance-pay-top">
        <button type="button" className="finance-btn-ghost" onClick={() => navigate('/packages')}>
          ← رجوع
        </button>
        <div className="finance-pay-progress">
          <div className="finance-pay-progress__fill" style={{ width: phase === 'done' ? '100%' : phase === 'review' ? '85%' : phase === 'proof' ? '70%' : phase === 'split' ? '40%' : '20%' }} />
        </div>
      </header>

      <div className="finance-pay-grid">
        <section className="finance-pay-card">
          <h2>توزيع الدفع</h2>
          <div className="finance-split-total">
            <span>الإجمالي</span>
            <strong>EGP {total.toLocaleString()}</strong>
          </div>
          <div className="finance-split-bars">
            <div className="finance-split-bar wallet" style={{ flex: walletAmt || 0.01 }}>
              <span>محفظة {walletAmt.toLocaleString()}</span>
            </div>
            {externalAmt > 0 && (
              <div className="finance-split-bar external" style={{ flex: externalAmt }}>
                <span>خارجي {externalAmt.toLocaleString()}</span>
              </div>
            )}
          </div>
          {(quote?.allocations || []).map((a) => (
            <div key={a.wallet_type} className="finance-alloc-row">
              <span>{a.wallet_type}</span>
              <span>EGP {a.amount.toLocaleString()}</span>
            </div>
          ))}
          {(quote?.suggestions || []).map((s, i) => (
            <p key={i} className="finance-hint">
              {s.message_ar}
            </p>
          ))}

          {phase === 'split' && (
            <div className="finance-pay-actions">
              {externalAmt === 0 ? (
                <button
                  type="button"
                  className="finance-btn-gold"
                  disabled={payMutation.isPending}
                  onClick={() => payMutation.mutate()}
                >
                  {payMutation.isPending ? 'جاري الدفع...' : 'ادفع بالكامل من المحفظة'}
                </button>
              ) : (
                <button type="button" className="finance-btn-gold" onClick={() => setPhase('method')}>
                  متابعة — دفع خارجي EGP {externalAmt.toLocaleString()}
                </button>
              )}
            </div>
          )}
        </section>

        <aside className="finance-pay-side">
          <h3>محافظك</h3>
          {(wallets || []).slice(0, 4).map((w) => (
            <div key={w.type} className="finance-side-wallet">
              <span>{w.name_ar || w.type}</span>
              <strong>{(w.available_balance ?? w.balance).toLocaleString()}</strong>
            </div>
          ))}

          {timeline.length > 0 && (
            <>
              <h3>المسار</h3>
              <ul className="finance-timeline">
                {timeline.map((t, i) => (
                  <li key={i}>
                    <span className="dot" />
                    <div>
                      <strong>{STATUS_LABEL[t.to_status] || t.to_status}</strong>
                      <time>{new Date(t.created_at).toLocaleString('ar-EG')}</time>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      {phase === 'method' && (
        <section className="finance-pay-card">
          <h2>طريقة الدفع الخارجي</h2>
          <div className="finance-methods-grid">
            {(methods || [])
              .filter((m) => m.method_type !== 'internal_wallet' && m.code !== 'cmoney')
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`finance-method-card ${selectedMethod === m.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(m.id)}
                >
                  <strong>{m.name_ar || m.name}</strong>
                  <span>{m.config_json?.instructions_ar || m.method_type}</span>
                </button>
              ))}
          </div>
          <button
            type="button"
            className="finance-btn-gold"
            style={{ marginTop: 16 }}
            onClick={async () => {
              try {
                await reservePaymentWallets(paymentSessionId)
                const refreshed = await getPaymentSession(paymentSessionId)
                setTimeline(refreshed.transitions || [])
                setPhase('proof')
              } catch (e) {
                toast.error(e.response?.data?.error || e.message)
              }
            }}
          >
            تم التحويل — رفع الإثبات
          </button>
        </section>
      )}

      {phase === 'proof' && (
        <section className="finance-pay-card">
          <h2>إثبات الدفع</h2>
          <p className="finance-muted">صورة واضحة · رقم العملية · كشف حساب</p>
          <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0])} />
          <input
            className="finance-input"
            placeholder="رقم العملية / المرجع"
            value={externalRef}
            onChange={(e) => setExternalRef(e.target.value)}
          />
          <button
            type="button"
            className="finance-btn-gold"
            disabled={proofMutation.isPending}
            onClick={() => proofMutation.mutate()}
          >
            {proofMutation.isPending ? 'جاري الرفع...' : 'إرسال للمراجعة المالية'}
          </button>
        </section>
      )}

      {(phase === 'done' || phase === 'review') && (
        <section className="finance-pay-card finance-success">
          <h2>{phase === 'done' ? 'تم بنجاح' : 'قيد المراجعة'}</h2>
          <p>
            {phase === 'done'
              ? 'تم تفعيل اشتراكك. شكراً لثقتك.'
              : 'فريق المالية يراجع إثباتك خلال 24 ساعة.'}
          </p>
          <button type="button" className="finance-btn-gold" onClick={() => navigate('/packages')}>
            العودة للباقات
          </button>
        </section>
      )}
    </div>
  )
}

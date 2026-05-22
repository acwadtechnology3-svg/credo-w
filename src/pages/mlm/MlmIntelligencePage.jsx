import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getMlmDashboard } from '../../api/mlm.api'
import { useSocket } from '../../hooks/useSocket'
function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="mlm-metric-card" style={{ '--accent': accent || '#7B6CF6' }}>
      <span className="mlm-metric-card__label">{label}</span>
      <strong className="mlm-metric-card__value">{value}</strong>
      {sub && <span className="mlm-metric-card__sub">{sub}</span>}
    </div>
  )
}

export default function MlmIntelligencePage() {
  useSocket()

  const { data, isLoading } = useQuery({
    queryKey: ['mlm-dashboard'],
    queryFn: getMlmDashboard,
    refetchInterval: 45_000,
  })

  const m = data?.metrics
  const match = data?.matching

  return (
    <div className="mlm-intel module-page page-enter" dir="rtl">
      <header className="mlm-intel__header">
        <h1 className="font-display mlm-intel__title">ذكاء التعويضات MLM</h1>
        <p className="mlm-intel__sub">PV · BV · CV · مطابقة ثنائية · carry · عمولات</p>
      </header>

      {isLoading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '3rem' }}>جاري التحميل...</p>
      ) : (
        <>
          <div className="mlm-intel__grid">
            <MetricCard label="PV" value={(m?.pv ?? 0).toLocaleString('ar-EG')} accent="#C4B8FF" />
            <MetricCard label="BV يسار" value={(m?.bv_left ?? 0).toLocaleString('ar-EG')} accent="#C4B8FF" />
            <MetricCard label="BV يمين" value={(m?.bv_right ?? 0).toLocaleString('ar-EG')} accent="#6BE4FF" />
            <MetricCard label="مطابقة" value={(m?.bv_matching ?? 0).toLocaleString('ar-EG')} accent="#7B6CF6" />
            <MetricCard label="CV" value={(m?.cv ?? 0).toLocaleString('ar-EG')} />
            <MetricCard label="GV" value={(m?.gv ?? 0).toLocaleString('ar-EG')} />
            <MetricCard label="TV" value={(m?.tv ?? 0).toLocaleString('ar-EG')} />
            <MetricCard
              label="توازن الأرجل"
              value={`${data?.summary?.balanceRatio ?? 0}%`}
              sub="كلما اقترب من 100% كان أفضل"
            />
          </div>

          <div className="mlm-intel__panels">
            <motion.div className="mlm-panel module-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h3>⚖️ المطابقة الثنائية (أسبوعي)</h3>
              <div className="mlm-balance-viz">
                <div className="mlm-balance-viz__leg mlm-balance-viz__leg--l" style={{ flex: match?.leftTotal || 1 }}>
                  <span>يسار</span>
                  <strong>{(match?.leftTotal ?? 0).toLocaleString('ar-EG')}</strong>
                </div>
                <div className="mlm-balance-viz__match">
                  <span>مطابق</span>
                  <strong>{(match?.matched ?? 0).toLocaleString('ar-EG')}</strong>
                </div>
                <div className="mlm-balance-viz__leg mlm-balance-viz__leg--r" style={{ flex: match?.rightTotal || 1 }}>
                  <span>يمين</span>
                  <strong>{(match?.rightTotal ?? 0).toLocaleString('ar-EG')}</strong>
                </div>
              </div>
              <p className="mlm-panel__carry">
                Carry: يسار {(match?.newLeftCarry ?? 0).toLocaleString('ar-EG')} · يمين{' '}
                {(match?.newRightCarry ?? 0).toLocaleString('ar-EG')}
              </p>
              <p className="mlm-panel__est">
                عمولة تقديرية: <strong>{(match?.estimatedPayout ?? 0).toLocaleString('ar-EG')} EGP</strong>
                <small> (تُصرف في الدورة الأسبوعية)</small>
              </p>
            </motion.div>

            <motion.div className="mlm-panel module-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <h3>💰 العمولات</h3>
              <div className="mlm-payout-summary">
                <div>
                  <span>معلّقة</span>
                  <strong>{(data?.summary?.totalPending ?? 0).toLocaleString('ar-EG')} EGP</strong>
                </div>
                <div>
                  <span>مدفوعة</span>
                  <strong>{(data?.summary?.totalPaid ?? 0).toLocaleString('ar-EG')} EGP</strong>
                </div>
              </div>
              <ul className="mlm-comm-list">
                {(data?.commissions || []).slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <span>{c.commission_type}</span>
                    <em>{parseFloat(c.capped_amount ?? c.calculated_amount).toLocaleString('ar-EG')} EGP</em>
                    <span className={`mlm-status mlm-status--${c.status}`}>{c.status}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div className="mlm-panel module-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <h3>📋 أحداث MLM</h3>
            <ul className="mlm-events-list">
              {(data?.recentEvents || []).map((ev) => (
                <li key={ev.id}>
                  <span className="mlm-events-list__type">{ev.event_type}</span>
                  <span>BV {ev.bv_amount}</span>
                  <span className={`mlm-status mlm-status--${ev.processing_status}`}>{ev.processing_status}</span>
                  <time>{new Date(ev.created_at).toLocaleString('ar-EG')}</time>
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      )}
    </div>
  )
}

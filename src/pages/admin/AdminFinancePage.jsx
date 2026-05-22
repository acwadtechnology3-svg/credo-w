import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFinanceAdminDashboard,
  getPaymentReviewQueue,
  approvePaymentReview,
  rejectPaymentReview,
  requestMoreProof,
  getAdminPaymentSessions,
  getAdminLedger,
  getFraudSignals,
} from '../../api/finance.api'
import AdminPanel from '../../components/admin/AdminPanel'
import PageLoader from '../../components/shared/PageLoader'

export default function AdminFinancePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('queue')
  const [queueFilter, setQueueFilter] = useState('pending')

  const { data: dash, isLoading } = useQuery({
    queryKey: ['finance-admin-dash'],
    queryFn: getFinanceAdminDashboard,
  })

  const { data: queue } = useQuery({
    queryKey: ['finance-review-queue', queueFilter],
    queryFn: () => getPaymentReviewQueue({ status: queueFilter }),
    enabled: tab === 'queue',
  })

  const { data: sessions } = useQuery({
    queryKey: ['finance-sessions'],
    queryFn: () => getAdminPaymentSessions({}),
    enabled: tab === 'sessions',
  })

  const { data: ledger } = useQuery({
    queryKey: ['finance-admin-ledger'],
    queryFn: () => getAdminLedger({ limit: 80 }),
    enabled: tab === 'ledger',
  })

  const { data: fraud } = useQuery({
    queryKey: ['finance-fraud'],
    queryFn: getFraudSignals,
    enabled: tab === 'fraud',
  })

  const approveMutation = useMutation({
    mutationFn: (reviewId) =>
      approvePaymentReview(reviewId, { idempotency_key: `admin-${reviewId}` }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-review-queue'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ reviewId, note }) => rejectPaymentReview(reviewId, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-review-queue'] }),
  })

  const moreProofMutation = useMutation({
    mutationFn: ({ reviewId, note }) => requestMoreProof(reviewId, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-review-queue'] }),
  })

  if (isLoading) return <PageLoader />

  const overview = dash?.overview || dash

  return (
    <AdminPanel title="Finance Hub" subtitle="Phase P3 — المالية · الموافقات · الدفتر · الاحتيال">
      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'مراجعات معلّقة', value: overview?.pendingReviews ?? 0 },
          { label: 'سحوبات معلّقة', value: overview?.pendingWithdrawals ?? 0 },
          { label: 'إيراد أسبوعي', value: `EGP ${(overview?.weeklyRevenue ?? 0).toLocaleString()}` },
          { label: 'تداول محافظ 7d', value: (overview?.walletCirculation7d ?? 0).toLocaleString() },
          { label: 'إشارات احتيال', value: overview?.openFraudSignals ?? 0 },
        ].map((s) => (
          <div key={s.label} className="admin-stat">
            <div className="admin-stat__label">{s.label}</div>
            <div className="admin-stat__value">{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['queue', 'الموافقات'],
          ['sessions', 'جلسات الدفع'],
          ['ledger', 'دفتر الحركات'],
          ['fraud', 'احتيال'],
          ['analytics', 'تحليلات'],
        ].map(([t, label]) => (
          <button
            key={t}
            type="button"
            className={`admin-btn ${tab === t ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
            onClick={() => setTab(t)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'queue' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['pending', 'needs_review', 'fraud_suspected', 'all'].map((s) => (
              <button
                key={s}
                type="button"
                className={`admin-btn admin-btn--sm ${queueFilter === s ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                onClick={() => setQueueFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {(queue || []).length === 0 ? (
            <p style={{ color: 'var(--text-3)' }}>لا توجد مدفوعات في هذه الحالة</p>
          ) : (
            (queue || []).map((r) => (
              <div key={r.id} className="admin-card" style={{ marginBottom: 12 }}>
                <div className="admin-card__body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <strong>{r.user?.username || '—'}</strong>
                      <span className="pill" style={{ marginRight: 8 }}>
                        {r.status}
                      </span>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        مخاطر {r.risk_score} · {r.payment_sessions?.status}
                      </div>
                      <div>
                        EGP {r.payment_sessions?.total_amount} (محفظة{' '}
                        {r.payment_sessions?.wallet_amount} + خارجي{' '}
                        {r.payment_sessions?.external_amount})
                      </div>
                      {(r.payment_proofs || []).map((p) => (
                        <div key={p.id} style={{ fontSize: 11, marginTop: 4 }}>
                          إثبات: {p.external_reference || p.storage_path}
                          {p.is_duplicate && <span style={{ color: '#f90' }}> · مكرر</span>}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(r.id)}
                      >
                        موافقة
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() => {
                          const note = prompt('طلب إثبات إضافي؟') || ''
                          if (note) moreProofMutation.mutate({ reviewId: r.id, note })
                        }}
                      >
                        طلب إثبات
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        style={{ color: '#f66' }}
                        onClick={() => {
                          const note = prompt('سبب الرفض؟') || ''
                          rejectMutation.mutate({ reviewId: r.id, note })
                        }}
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'sessions' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>مستخدم</th>
                <th>حالة</th>
                <th>إجمالي</th>
                <th>محفظة</th>
                <th>خارجي</th>
                <th>تاريخ</th>
              </tr>
            </thead>
            <tbody>
              {(sessions || []).map((s) => (
                <tr key={s.id}>
                  <td>{s.users?.username}</td>
                  <td>{s.status}</td>
                  <td>{s.total_amount}</td>
                  <td>{s.wallet_amount}</td>
                  <td>{s.external_amount}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ledger' && (
        <div style={{ maxHeight: 480, overflow: 'auto' }}>
          {(ledger || []).map((e) => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--line-soft)',
                fontSize: 12,
              }}
            >
              <span>
                {e.users?.username} · {e.wallet_type} · {e.category}
              </span>
              <span>
                {parseFloat(e.amount) >= 0 ? '+' : ''}
                {parseFloat(e.amount).toLocaleString()} ({parseFloat(e.balance_after).toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'fraud' && (
        <div>
          {(fraud || []).length === 0 ? (
            <p style={{ color: 'var(--text-3)' }}>لا إشارات مفتوحة</p>
          ) : (
            (fraud || []).map((f) => (
              <div key={f.id} className="admin-card" style={{ marginBottom: 8 }}>
                <div className="admin-card__body">
                  <strong>{f.signal_type}</strong> — {f.severity} (+{f.score_delta})
                  <div style={{ fontSize: 12 }}>{f.users?.username}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="admin-card">
          <div className="admin-card__body">
            <h4>جلسات الدفع (7 أيام)</h4>
            <pre style={{ fontSize: 11, overflow: 'auto' }}>
              {JSON.stringify(overview?.paymentSessions7d || {}, null, 2)}
            </pre>
            <h4 style={{ marginTop: 16 }}>أعلى المنفقين</h4>
            <pre style={{ fontSize: 11 }}>{JSON.stringify(dash?.topSpenders || [], null, 2)}</pre>
          </div>
        </div>
      )}
    </AdminPanel>
  )
}

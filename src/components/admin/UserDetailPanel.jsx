import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { banUser, unbanUser } from '../../api/admin.api'
import PageLoader from '../shared/PageLoader'

const TABS = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'profile', label: 'الملف الشخصي' },
  { id: 'wallets', label: 'المحافظ' },
  { id: 'orders', label: 'الطلبات' },
  { id: 'transactions', label: 'المعاملات' },
  { id: 'team', label: 'الفريق' },
  { id: 'kyc', label: 'الهوية KYC' },
  { id: 'security', label: 'الأمان والحظر' },
  { id: 'activity', label: 'السجل' },
]

function statusPill(status) {
  const map = {
    active: 'admin-pill--ok',
    pending: 'admin-pill--warn',
    suspended: 'admin-pill--bad',
    verified: 'admin-pill--ok',
    rejected: 'admin-pill--bad',
  }
  return map[status] || 'admin-pill--purple'
}

export default function UserDetailPanel({ userId, data, isLoading, backTo = '/admin/users' }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')
  const [showBanForm, setShowBanForm] = useState(false)
  const [banForm, setBanForm] = useState({
    ban_type: 'temporary',
    ban_reason: '',
    ban_scope: ['all'],
    ban_duration_days: 7,
  })

  const banMutation = useMutation({
    mutationFn: (body) => banUser(userId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-detail', userId] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setShowBanForm(false)
    },
  })

  const unbanMutation = useMutation({
    mutationFn: () => unbanUser(userId, { reason: 'Admin unban' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-detail', userId] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  if (isLoading) return <PageLoader />

  const {
    user,
    sponsor,
    wallets,
    recentOrders,
    recentTransactions,
    commissions,
    bv,
    totalCommission,
    referrals,
    referralCount,
    kycDoc,
    banHistory,
  } = data || {}

  const rankName = user?.ranks?.name || (Array.isArray(user?.ranks) ? user.ranks[0]?.name : null) || 'BAP'
  const isBanned = user?.ban_type != null
  const tree = user?.tree_nodes

  return (
    <div className="admin-panel">
      <Link to={backTo} style={{ fontSize: '0.78rem', color: 'var(--lavender)', textDecoration: 'none' }}>
        ← العودة للمستخدمين
      </Link>

      <div className="user-detail-hero" style={{ marginTop: 12 }}>
        <div className="user-detail-avatar">{user?.full_name?.slice(0, 2).toUpperCase() || '?'}</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-1)' }}>{user?.full_name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>
            @{user?.username} · {user?.user_code}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className={`admin-pill ${statusPill(user?.status)}`}>{user?.status}</span>
            <span className="admin-pill admin-pill--purple">{rankName}</span>
            <span className="admin-pill admin-pill--purple">{user?.role}</span>
            {isBanned && (
              <span className="admin-pill admin-pill--bad">
                محظور — {user?.ban_type}
                {user?.ban_expires_at
                  ? ` حتى ${new Date(user.ban_expires_at).toLocaleDateString('ar-EG')}`
                  : ''}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isBanned ? (
            <button
              type="button"
              className="admin-btn admin-btn--success"
              onClick={() => confirm('إلغاء الحظر؟') && unbanMutation.mutate()}
            >
              إلغاء الحظر
            </button>
          ) : (
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={() => {
                setTab('security')
                setShowBanForm(true)
              }}
            >
              حظر المستخدم
            </button>
          )}
        </div>
      </div>

      <div className="admin-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`admin-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="admin-stat-grid" style={{ marginBottom: 16 }}>
          {[
            { label: 'إجمالي PV', value: user?.total_pv ?? 0 },
            { label: 'المباشرين', value: user?.direct_count ?? 0 },
            { label: 'حجم الفريق', value: referralCount ?? 0 },
            { label: 'BV يسار', value: Math.round(bv?.sideA || 0) },
            { label: 'BV يمين', value: Math.round(bv?.sideB || 0) },
            { label: 'عمولات الفريق', value: `EGP ${totalCommission ?? 0}` },
            {
              label: 'عمولات مدفوعة',
              value: `EGP ${parseFloat(user?.commission_paid_total || 0).toLocaleString()}`,
            },
            { label: 'KYC', value: user?.kyc_status || kycDoc?.status || 'not_submitted' },
          ].map((s) => (
            <div key={s.label} className="admin-stat">
              <div className="admin-stat__label">{s.label}</div>
              <div className="admin-stat__value">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'profile' && (
        <div className="admin-card">
          <div className="admin-card__body">
            <dl className="user-detail-info-grid">
              {[
                ['الاسم الكامل', user?.full_name],
                ['البريد', user?.email],
                ['الهاتف', user?.phone || '—'],
                ['الرقم القومي', user?.national_id || '—'],
                ['الدولة', user?.country],
                ['العملة', user?.currency],
                ['تاريخ التسجيل', user?.created_at ? new Date(user.created_at).toLocaleString('ar-EG') : '—'],
                ['تاريخ التفعيل', user?.active_date ? new Date(user.active_date).toLocaleString('ar-EG') : '—'],
                ['آخر دخول', user?.last_login_at ? new Date(user.last_login_at).toLocaleString('ar-EG') : '—'],
                [
                  'الراعي',
                  sponsor ? `${sponsor.full_name} (@${sponsor.username})` : '—',
                ],
                ['جانب الشجرة', tree?.side || '—'],
                ['عمق الشجرة', tree?.depth_level ?? '—'],
                ['عمولة الشهر', `EGP ${user?.commission_earned_this_month ?? 0}`],
                ['سحب الشهر', `EGP ${user?.withdrawal_this_month ?? 0}`],
              ].map(([label, val]) => (
                <div key={label} className="user-detail-info-item">
                  <dt>{label}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {tab === 'wallets' && (
        <div className="admin-stat-grid">
          {(wallets || []).map((w) => (
            <div key={w.type} className="admin-stat" style={{ textAlign: 'center' }}>
              <div className="admin-stat__label">{w.type}</div>
              <div className="admin-stat__value" style={{ color: 'var(--lavender)' }}>
                EGP {parseFloat(w.balance).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="admin-card">
          <div className="admin-card__head">الطلبات ({recentOrders?.length || 0})</div>
          <div className="admin-card__body" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {['المرجع', 'المبلغ', 'الحالة', 'الدفع', 'التاريخ'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentOrders || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  (recentOrders || []).map((o) => (
                    <tr key={o.id}>
                      <td style={{ color: 'var(--lavender)', fontWeight: 500 }}>{o.order_ref}</td>
                      <td>EGP {parseFloat(o.total).toLocaleString()}</td>
                      <td>
                        <span className={`admin-pill ${statusPill(o.status === 'delivered' ? 'active' : 'pending')}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>{o.payment_method || '—'}</td>
                      <td>{new Date(o.created_at).toLocaleString('ar-EG')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="admin-card">
          <div className="admin-card__head">معاملات المحفظة</div>
          <div className="admin-card__body" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {['النوع', 'المبلغ', 'الرصيد بعد', 'الوصف', 'التاريخ'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentTransactions || []).map((t) => (
                  <tr key={t.id}>
                    <td>{t.category}</td>
                    <td style={{ color: parseFloat(t.amount) >= 0 ? '#c0dd97' : '#ff8a8a', fontWeight: 600 }}>
                      {parseFloat(t.amount) >= 0 ? '+' : ''}
                      {parseFloat(t.amount).toFixed(2)}
                    </td>
                    <td>{parseFloat(t.balance_after).toFixed(2)}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.description}
                    </td>
                    <td>{new Date(t.created_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'team' && (
        <>
          <div className="admin-card" style={{ marginBottom: 12 }}>
            <div className="admin-card__head">عمولات الفريق</div>
            <div className="admin-card__body" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    {['التاريخ', 'الرتبة', 'حجم الساق', 'النسبة', 'المبلغ'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(commissions || []).map((c, i) => (
                    <tr key={i}>
                      <td>{new Date(c.created_at).toLocaleDateString('ar-EG')}</td>
                      <td>{c.rank_at_time}</td>
                      <td>{c.pay_leg_volume}</td>
                      <td>{c.commission_pct}%</td>
                      <td style={{ color: '#c0dd97' }}>EGP {parseFloat(c.commission_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card__head">الإحالات المباشرة ({referralCount})</div>
            <div className="admin-card__body" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    {['المستخدم', 'الاسم', 'الرتبة', 'PV', 'الحالة', 'تاريخ الانضمام'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(referrals || []).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link to={`/admin/users/${r.id}`} style={{ color: 'var(--lavender)' }}>
                          {r.username}
                        </Link>
                      </td>
                      <td>{r.full_name}</td>
                      <td>{r.ranks?.name || '—'}</td>
                      <td>{r.total_pv}</td>
                      <td>
                        <span className={`admin-pill ${statusPill(r.status)}`}>{r.status}</span>
                      </td>
                      <td>{new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'kyc' && (
        <div className="admin-card">
          <div className="admin-card__body">
            <div style={{ marginBottom: 16 }}>
              <span className={`admin-pill ${statusPill(kycDoc?.status || user?.kyc_status)}`}>
                {kycDoc?.status || user?.kyc_status || 'not_submitted'}
              </span>
            </div>
            {kycDoc ? (
              <>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  {kycDoc.national_id_front_url && (
                    <a href={kycDoc.national_id_front_url} target="_blank" rel="noreferrer">
                      <img
                        src={kycDoc.national_id_front_url}
                        alt="وجه البطاقة"
                        style={{ width: 180, borderRadius: 10, border: '1px solid var(--line)' }}
                      />
                    </a>
                  )}
                  {kycDoc.national_id_back_url && (
                    <a href={kycDoc.national_id_back_url} target="_blank" rel="noreferrer">
                      <img
                        src={kycDoc.national_id_back_url}
                        alt="ظهر البطاقة"
                        style={{ width: 180, borderRadius: 10, border: '1px solid var(--line)' }}
                      />
                    </a>
                  )}
                  {kycDoc.selfie_url && (
                    <a href={kycDoc.selfie_url} target="_blank" rel="noreferrer">
                      <img
                        src={kycDoc.selfie_url}
                        alt="سيلفي"
                        style={{
                          width: 120,
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '1px solid var(--line)',
                        }}
                      />
                    </a>
                  )}
                </div>
                {kycDoc.rejection_reason && (
                  <p style={{ color: '#ff8a8a', fontSize: '0.85rem' }}>
                    سبب الرفض: {kycDoc.rejection_reason}
                  </p>
                )}
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                  تاريخ التقديم: {new Date(kycDoc.submitted_at).toLocaleString('ar-EG')}
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-3)' }}>لم يُقدّم المستخدم مستندات KYC بعد.</p>
            )}
            <Link
              to="/admin/kyc"
              style={{ display: 'inline-block', marginTop: 12, color: 'var(--lavender)', fontSize: '0.8rem' }}
            >
              مراجعة طلبات KYC →
            </Link>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <>
          {user?.ban_reason && (
            <div className="admin-card" style={{ marginBottom: 12, borderColor: 'rgba(220,60,60,0.4)' }}>
              <div className="admin-card__head" style={{ color: '#ff8a8a' }}>
                حالة الحظر الحالية
              </div>
              <div className="admin-card__body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  <strong>النوع:</strong> {user.ban_type} · <strong>النطاق:</strong>{' '}
                  {(user.ban_scope || []).join(', ')}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: 8 }}>
                  <strong>السبب:</strong> {user.ban_reason}
                </p>
              </div>
            </div>
          )}

          {showBanForm && !isBanned && (
            <div className="admin-card" style={{ marginBottom: 12 }}>
              <div className="admin-card__head">حظر المستخدم</div>
              <div className="admin-card__body">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <label className="admin-field-label">نوع الحظر</label>
                    <select
                      className="admin-select"
                      value={banForm.ban_type}
                      onChange={(e) => setBanForm((p) => ({ ...p, ban_type: e.target.value }))}
                    >
                      <option value="temporary">مؤقت</option>
                      <option value="permanent">دائم</option>
                    </select>
                  </div>
                  {banForm.ban_type === 'temporary' && (
                    <div>
                      <label className="admin-field-label">المدة (أيام)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={banForm.ban_duration_days}
                        onChange={(e) =>
                          setBanForm((p) => ({ ...p, ban_duration_days: e.target.value }))
                        }
                      />
                    </div>
                  )}
                  <div>
                    <label className="admin-field-label">نطاق الحظر</label>
                    <select
                      className="admin-select"
                      onChange={(e) => setBanForm((p) => ({ ...p, ban_scope: [e.target.value] }))}
                    >
                      <option value="all">كامل الحساب</option>
                      <option value="withdraw">السحب فقط</option>
                      <option value="purchase">الشراء فقط</option>
                      <option value="referrals">الإحالات فقط</option>
                    </select>
                  </div>
                </div>
                <label className="admin-field-label">السبب (يظهر للمستخدم)</label>
                <textarea
                  className="admin-textarea"
                  rows={3}
                  value={banForm.ban_reason}
                  onChange={(e) => setBanForm((p) => ({ ...p, ban_reason: e.target.value }))}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowBanForm(false)}>
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    disabled={!banForm.ban_reason || banMutation.isPending}
                    onClick={() => banMutation.mutate(banForm)}
                  >
                    {banMutation.isPending ? 'جاري الحظر...' : 'تأكيد الحظر'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'activity' && (
        <div className="admin-card">
          <div className="admin-card__head">سجل التدقيق</div>
          <div className="admin-card__body" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {['الإجراء', 'التفاصيل', 'التاريخ'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(banHistory || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      لا يوجد سجل
                    </td>
                  </tr>
                ) : (
                  (banHistory || []).map((log, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{log.action}</td>
                      <td style={{ fontSize: '0.72rem', maxWidth: 280 }}>
                        {log.new_value ? JSON.stringify(log.new_value) : '—'}
                      </td>
                      <td>{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

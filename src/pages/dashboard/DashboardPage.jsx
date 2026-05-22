import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../../api/dashboard.api'
import { getMyPackageStatus } from '../../api/packages.api'
import { getPearlsWallet } from '../../api/pearls.api'
import { getProgressionHub } from '../../api/gamification.api'
import { getMyAgency } from '../../api/agencies.api'
import { GlowBg } from '../../components/ui/GlowBg'
import SupportQuickLink from '../../components/support/SupportQuickLink'

const PKG_LEVEL_NAMES = { 0: 'غير مشترك', 1: 'أحادي', 3: 'ثلاثي', 7: 'سباعي' }

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
  const { data: pkgStatus } = useQuery({
    queryKey: ['my-package-status'],
    queryFn: getMyPackageStatus,
  })
  const { data: pearlsWallet } = useQuery({
    queryKey: ['pearls-wallet'],
    queryFn: getPearlsWallet,
  })
  const { data: myAgencyData } = useQuery({
    queryKey: ['my-agency'],
    queryFn: getMyAgency,
  })
  const { data: progression } = useQuery({
    queryKey: ['progression-hub'],
    queryFn: getProgressionHub,
    staleTime: 120_000,
  })

  if (isLoading) {
    return (
      <div className="module-page page-enter" dir="rtl">
        <GlowBg />
        <p style={{ color: 'var(--text-2)', position: 'relative' }}>جاري التحميل...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="module-page page-enter" dir="rtl">
        <p className="pill bad">تعذّر تحميل لوحة التحكم</p>
      </div>
    )
  }

  const d = data || {}
  const matchBv = d.nextRank?.matching_bv_required || 1
  const matchPct = Math.min(100, (Math.min(d.bv?.sideA || 0, d.bv?.sideB || 0) / matchBv) * 100)

  return (
    <div className="module-page page-enter" dir="rtl" style={{ position: 'relative' }}>
      <GlowBg />
      <SupportQuickLink label="مركز الدعم والإدارة" />

      {myAgencyData?.agency &&
        myAgencyData?.onboarding?.checklist?.some((c) => !c.done) && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/agencies/onboarding')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/agencies/onboarding')}
          style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 14,
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(123,108,246,0.25), rgba(232,201,106,0.12))',
            border: '1px solid rgba(123,108,246,0.4)',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 22 }}>🏛️</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>
            أكمل انضمام {myAgencyData.agency.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
            تجربة ترحيب المنظمة — قائمة البداية
          </div>
        </div>
      )}

      {!myAgencyData?.agency && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/agencies/discover')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/agencies/discover')}
          style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 14,
            cursor: 'pointer',
            background: 'rgba(123,108,246,0.08)',
            border: '1px solid var(--border)',
            position: 'relative',
          }}
        >
          <div style={{ fontWeight: 600 }}>انضم لوكالة رسمية</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
            الوكالات تُنشأ من الإدارة — استخدم رابط الدعوة أو اكتشف الوكالات
          </div>
        </div>
      )}

      <div
        className="dashboard-metrics-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 16,
          position: 'relative',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/packages')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/packages')}
          className="card"
          style={{
            background: '#EEEDFE',
            borderRadius: 12,
            padding: 14,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: '#888' }}>مستوى الباقة</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#534AB7', marginTop: 4 }}>
            {pkgStatus?.currentLevel === 0
              ? 'غير مشترك'
              : `${PKG_LEVEL_NAMES[pkgStatus?.currentLevel] || pkgStatus?.currentLevel} (${pkgStatus?.currentSlots || 0} slots)`}
          </div>
          {pkgStatus?.upgradePackage && (
            <div style={{ fontSize: 11, color: '#534AB7', marginTop: 3 }}>⬆️ ترقية متاحة</div>
          )}
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/customer/pearls')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/customer/pearls')}
          style={{
            background: 'rgba(201,168,76,0.06)',
            border: '0.5px solid rgba(201,168,76,0.2)',
            borderRadius: 12,
            padding: 14,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: '#8A6F2E', marginBottom: 4 }}>⬡ Pearls Wallet</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#C9A84C' }}>
            {(pearlsWallet?.available_balance || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#5A5754', marginTop: 3 }}>
            {(pearlsWallet?.tier?.charAt(0).toUpperCase() || '') +
              (pearlsWallet?.tier?.slice(1) || 'bronze')}{' '}
            tier · {pearlsWallet?.current_streak || 0} day streak
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/progression')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/progression')}
          style={{
            background: 'linear-gradient(135deg, rgba(123,108,246,0.15), rgba(20,20,28,0.9))',
            border: '1px solid rgba(123,108,246,0.35)',
            borderRadius: 12,
            padding: 14,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: '#7B6CF6', marginBottom: 4 }}>⚡ Progression</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#E8E6FF' }}>
            Lv {progression?.progress?.level ?? 1}
          </div>
          <div style={{ fontSize: 11, color: '#5A5754', marginTop: 3 }}>
            {progression?.progress?.xp_global?.toLocaleString() ?? 0} XP ·{' '}
            {progression?.active_events?.length ? '🔥 Live event' : 'Missions & prestige'}
          </div>
        </div>
      </div>

      <div
        className="dashboard-bv-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 12,
          marginBottom: 16,
          position: 'relative',
        }}
      >
        <div className="card" style={{ padding: 16 }}>
          <div className="module-metric" style={{ color: 'var(--side-left)' }}>
            {Math.round(d.bv?.sideA || 0)}
          </div>
          <div className="t-eyebrow" style={{ marginTop: 4 }}>TOTAL BV — SIDE A</div>
        </div>
        <div
          className="dashboard-bv-divider"
          style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', fontWeight: 600 }}
        >
          A | B
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'end' }}>
          <div className="module-metric" style={{ color: 'var(--side-right)' }}>
            {Math.round(d.bv?.sideB || 0)}
          </div>
          <div className="t-eyebrow" style={{ marginTop: 4 }}>TOTAL BV — SIDE B</div>
        </div>
      </div>

      <div className="module-card" style={{ marginBottom: 12 }}>
        <div className="module-card-header purple">Rank Advancement</div>
        <div className="module-card-body">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 12,
              color: 'var(--text-2)',
              marginBottom: 8,
            }}
          >
            <span>
              Current: <strong style={{ color: 'var(--text-1)' }}>{d.user?.rank?.name || 'BAP'}</strong>
            </span>
            <span>
              Next: <strong style={{ color: 'var(--text-1)' }}>{d.nextRank?.name || '—'}</strong>
            </span>
            <span>
              Required BV: <strong>{d.nextRank?.matching_bv_required || 0}</strong>
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--surface-0)', borderRadius: 4, marginBottom: 12 }}>
            <div
              style={{
                height: 8,
                background: 'linear-gradient(90deg, var(--purple), var(--lavender))',
                borderRadius: 4,
                width: `${matchPct}%`,
              }}
            />
          </div>
          <div className="rank-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
            <div>
              <div className="font-num" style={{ fontWeight: 700 }}>
                {Math.round(d.user?.total_pv || 0)}/{d.nextRank?.pbv_required || 10}
              </div>
              <div className="t-eyebrow">Personal BV</div>
            </div>
            <div>
              <div className="font-num" style={{ fontWeight: 700 }}>
                {Math.round(Math.min(d.bv?.sideA || 0, d.bv?.sideB || 0))}/{matchBv}
              </div>
              <div className="t-eyebrow">Matching BV</div>
            </div>
            <div>
              <div className="font-num" style={{ fontWeight: 700 }}>
                {d.user?.direct_count || 0}/{d.nextRank?.directs_required || 0}
              </div>
              <div className="t-eyebrow">Directs</div>
            </div>
          </div>
        </div>
      </div>

      <div className="module-card" style={{ marginBottom: 12 }}>
        <div className="module-card-header green">Fast Start Bonus</div>
        <div className="module-card-body">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-2)',
              marginBottom: 8,
            }}
          >
            <span>
              Directs: {d.fastStart?.directCount || 0} / {d.fastStart?.directRequired || 3}
            </span>
            <span>
              Bonus cycles: <strong>{d.fastStart?.bonusCycles || 0}</strong>
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--surface-0)', borderRadius: 3 }}>
            <div
              style={{
                height: 6,
                background: 'var(--success)',
                borderRadius: 3,
                width: `${(((d.fastStart?.directCount || 0) % 3) / 3) * 100}%`,
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Every 3 directs = 3,000 EGP bonus</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div className="module-card">
          <div className="module-card-header purple">Business Snapshot</div>
          <div className="table-scroll-x">
            <table className="module-table">
              <thead>
                <tr>
                  <th></th>
                  <th style={{ textAlign: 'center' }}>Side A</th>
                  <th style={{ textAlign: 'center' }}>Side B</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Active', d.snapshot?.sideA?.active, d.snapshot?.sideB?.active],
                  ['Inactive', d.snapshot?.sideA?.inactive, d.snapshot?.sideB?.inactive],
                  ['Total Amb.', d.snapshot?.sideA?.total, d.snapshot?.sideB?.total],
                  ['Direct Amb.', d.snapshot?.sideA?.direct, d.snapshot?.sideB?.direct],
                  [
                    'Unsettled BV',
                    Math.round(d.snapshot?.sideA?.unsettledBv || 0),
                    Math.round(d.snapshot?.sideB?.unsettledBv || 0),
                  ],
                ].map(([label, a, b]) => (
                  <tr key={label}>
                    <td style={{ color: 'var(--text-2)' }}>{label}</td>
                    <td style={{ textAlign: 'center' }}>{a}</td>
                    <td style={{ textAlign: 'center' }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="module-card">
          <div className="module-card-header teal">Recent Ambassadors</div>
          <div className="module-card-body">
            {(d.recentAmbassadors || []).length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>No ambassadors yet</p>
            ) : (
              (d.recentAmbassadors || []).map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--line-soft)',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {new Date(a.joining_date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`pill ${a.status === 'active' ? 'ok' : ''}`}>{a.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="module-card">
        <div className="module-card-header gold">روابط الدعوة (يحدد الفرانشايز الجانب)</div>
        <div className="module-card-body">
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
            شارك رابط يسار أو يمين حسب توازن شجرتك — العميل لا يختار الجانب بنفسه.
          </p>
          {[
            { label: 'جانب يسار (A)', url: d.referralLinks?.sideA },
            { label: 'جانب يمين (B)', url: d.referralLinks?.sideB },
            { label: 'توازن تلقائي', url: d.referralLinks?.auto },
            { label: 'عميل (بدون شجرة)', url: d.referralLinks?.customer },
          ].map(({ label, url }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div className="t-eyebrow" style={{ marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div
                  className="input font-mono"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 11,
                    padding: '8px 10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {window.location.origin}
                  {url}
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigator.clipboard.writeText(window.location.origin + url)}
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

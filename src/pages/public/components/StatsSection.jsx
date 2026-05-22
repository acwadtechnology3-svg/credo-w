import { useQuery } from '@tanstack/react-query'
import Icon from '../../../components/ui/Icon'
import AnimatedCounter from '../../../components/ui/AnimatedCounter'
import { getPublicStats } from '../../../api/public.api'

function formatCommission(value) {
  const n = Number(value) || 0
  if (n >= 1_000_000) return { v: n / 1_000_000, suf: 'M', dec: 1 }
  if (n >= 1000) return { v: n / 1000, suf: 'K', dec: 1 }
  return { v: n, suf: '', dec: 0 }
}

function StatsSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 1,
        background: 'var(--line)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ padding: '32px 24px', background: 'var(--surface-0)', minHeight: 140 }}>
          <div
            style={{
              height: 14,
              width: '40%',
              borderRadius: 6,
              background: 'var(--surface-2)',
              marginBottom: 16,
            }}
          />
          <div style={{ height: 36, width: '60%', borderRadius: 8, background: 'var(--surface-2)' }} />
        </div>
      ))}
    </div>
  )
}

export default function StatsSection() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['public-stats'],
    queryFn: getPublicStats,
  })

  const commission = formatCommission(stats?.totalCommissionPaid)

  const metrics = stats
    ? [
        { v: stats.activeMarketers, l: 'مسوّق نشط', sub: 'حالة active', icon: 'team', dec: 0 },
        {
          v: commission.v,
          suf: commission.suf,
          l: 'عمولات مدفوعة (ج.م)',
          sub: 'فريق · TEAM_COMMISSION',
          icon: 'trend-up',
          dec: commission.dec,
        },
        { v: stats.totalOrders, l: 'عملية معالَجة', sub: 'إجمالي الطلبات', icon: 'cycle', dec: 0 },
        { v: stats.countries, l: 'دول نشطة', sub: 'شبكة عالمية', icon: 'globe', dec: 0 },
      ]
    : []

  return (
    <section style={{ padding: '80px 32px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="pill info" style={{ marginBottom: 16 }}>
            <Icon name="activity" size={11} />
            الأداء الحيّ
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 12 }}>
            أرقام تتحدث عن نفسها
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 560, margin: '0 auto' }}>
            محرّكنا يعالج عمليات حقيقية لمسوّقين حقيقيين، بدقّة وأمان مستوى المؤسسات.
          </p>
        </div>

        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 1,
              background: 'var(--line)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {metrics.map((m) => (
              <div key={m.l} style={{ padding: '32px 24px', background: 'var(--surface-0)', position: 'relative' }}>
                <Icon name={m.icon} size={14} style={{ color: 'var(--lavender)', marginBottom: 12 }} />
                <div
                  className="font-num metric-glow"
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    color: 'var(--text-1)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  <AnimatedCounter value={m.v} decimals={m.dec || 0} suffix={m.suf || ''} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, fontWeight: 500 }}>{m.l}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

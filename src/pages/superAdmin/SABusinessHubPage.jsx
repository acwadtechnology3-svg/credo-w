import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBCOverview } from '../../api/businessControl.api'
import AdminPanel from '../../components/admin/AdminPanel'
import PageLoader from '../../components/shared/PageLoader'

const MODULES = [
  { to: '/super-admin/packages', label: 'استوديو الباقات', desc: 'الأسعار، BV، العرض، الصلاحيات' },
  { to: '/super-admin/upgrades', label: 'مسارات الترقية', desc: 'قواعد ديناميكية بدون كود' },
  { to: '/super-admin/ranks', label: 'الرتب والمتطلبات', desc: 'متطلبات ومكافآت قابلة للتعديل' },
  { to: '/super-admin/payments', label: 'طرق الدفع', desc: 'Instapay، بنك، عملات' },
  { to: '/super-admin/promotions', label: 'العروض والحملات', desc: 'خصومات، مضاعف BV، بونص' },
  { to: '/super-admin/feature-flags', label: 'مفاتيح الميزات', desc: 'تشغيل/إيقاف بدون نشر' },
  { to: '/super-admin/gamification', label: 'محرك التقدم P5', desc: 'XP، مهام، إنجازات، مواسم' },
  { to: '/super-admin/progression', label: 'محرك الرتب P8', desc: 'رتب، بونص، مسار مهني، لوحات' },
]

export default function SABusinessHubPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['bc-overview'],
    queryFn: getBCOverview,
  })

  if (isLoading) return <PageLoader />

  return (
    <AdminPanel
      title="مركز التحكم بالأعمال"
      subtitle="Phase P2 — محرك القواعد الديناميكي (بدون تعديل كود)"
    >
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'باقات نشطة', value: overview?.activePackages ?? 0 },
          { label: 'قواعد ترقية', value: overview?.activeUpgradeRules ?? 0 },
          { label: 'رتب', value: overview?.ranks ?? 0 },
          { label: 'مفاتيح مفعّلة', value: overview?.enabledFlags ?? 0 },
          { label: 'عروض نشطة', value: overview?.activePromotions ?? 0 },
        ].map((s) => (
          <div key={s.label} className="admin-stat">
            <div className="admin-stat__label">{s.label}</div>
            <div className="admin-stat__value">{s.value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {MODULES.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            style={{
              display: 'block',
              padding: 16,
              background: 'var(--surface-2, #1a1a2e)',
              border: '1px solid var(--border, #2a2a3e)',
              borderRadius: 12,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-1)' }}>{m.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.desc}</div>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-3)' }}>
        شغّل <code>phase-p2-business-control.sql</code> في Supabase قبل تعديل القواعد. كل تغيير يُسجّل في
        سجل التدقيق.
      </p>
    </AdminPanel>
  )
}

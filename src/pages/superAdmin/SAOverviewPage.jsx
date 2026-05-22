import { useQuery } from '@tanstack/react-query'
import { getPlatformStats } from '../../api/superAdmin.api'
import AdminPanel from '../../components/admin/AdminPanel'
import PageLoader from '../../components/shared/PageLoader'

export default function SAOverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['sa-stats'], queryFn: getPlatformStats })

  if (isLoading) return <PageLoader />

  return (
    <AdminPanel title="نظرة المنصة" subtitle="إحصائيات شاملة لأداء Credo W">
      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'إجمالي المستخدمين', value: data?.totalUsers || 0 },
          { label: 'نشط', value: data?.activeUsers || 0 },
          { label: 'بانتظار التفعيل', value: data?.pendingUsers || 0 },
          { label: 'سحوبات معلّقة', value: data?.pendingWithdrawals || 0 },
          { label: 'الطلبات', value: data?.totalOrders || 0 },
          { label: 'إيرادات (ج.م)', value: (data?.totalRevenue || 0).toLocaleString() },
          { label: 'عمولات مدفوعة', value: (data?.totalCommissionPaid || 0).toLocaleString() },
          {
            label: 'صافي الإيراد',
            value: ((data?.totalRevenue || 0) - (data?.totalCommissionPaid || 0)).toLocaleString(),
          },
        ].map((s) => (
          <div key={s.label} className="admin-stat">
            <div className="admin-stat__label">{s.label}</div>
            <div className="admin-stat__value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card__head">أفضل 10 مسوّقين</div>
        <div className="admin-card__body" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                {['#', 'المستخدم', 'الرتبة', 'PV', 'عمولات مدفوعة'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.topMarketers || []).map((m, i) => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--lavender)', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{m.username}</td>
                  <td>{m.ranks?.name}</td>
                  <td>{m.total_pv}</td>
                  <td style={{ color: '#c0dd97' }}>
                    EGP {parseFloat(m.commission_paid_total || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPanel>
  )
}

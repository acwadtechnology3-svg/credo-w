import { useQuery } from '@tanstack/react-query'
import { getPersonalVolume } from '../../api/team.api'

export default function PersonalVolumePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['pv'],
    queryFn: getPersonalVolume,
  })

  return (
    <div className="module-page page-enter" dir="rtl">
      <h2 className="font-display" style={{ fontSize: 20, marginBottom: 16 }}>
        Personal Volume
      </h2>

      <div className="card" style={{ padding: 20, marginBottom: 16, maxWidth: 280 }}>
        <div className="t-eyebrow">Total PV</div>
        <div className="module-metric" style={{ color: 'var(--lavender)' }}>
          {isLoading ? '…' : Math.round(data?.total_pv || 0)}
        </div>
      </div>

      <div className="module-card">
        <div className="module-card-header teal">PV history</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="module-table">
            <thead>
              <tr>
                {['Date', 'Category', 'Amount', 'Description'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>
                    Loading...
                  </td>
                </tr>
              ) : (data?.logs || []).length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
                    No record found
                  </td>
                </tr>
              ) : (
                (data?.logs || []).map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleDateString()}</td>
                    <td>{log.category}</td>
                    <td className="font-num">{log.amount}</td>
                    <td style={{ color: 'var(--text-2)' }}>{log.description || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

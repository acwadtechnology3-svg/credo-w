import { useQuery } from '@tanstack/react-query'
import { getBusinessVolume } from '../../api/team.api'

export default function BusinessVolumePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['bv'],
    queryFn: getBusinessVolume,
  })

  return (
    <div className="module-page page-enter" dir="rtl">
      <h2 className="font-display" style={{ fontSize: 20, marginBottom: 16 }}>
        Business Volume
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'Side A', value: Math.round(data?.sideA || 0), color: 'var(--side-left)' },
          { label: 'Side B', value: Math.round(data?.sideB || 0), color: 'var(--side-right)' },
          { label: 'Business To Cycle', value: Math.round(data?.businessToCycle || 0), color: 'var(--lavender)' },
        ].map((c) => (
          <div key={c.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div className="module-metric" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="t-eyebrow" style={{ marginTop: 4 }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="module-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="module-table">
            <thead>
              <tr>
                {['Date', 'Note', 'Bonus Volume', 'Side'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
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
                    <td style={{ color: 'var(--text-2)' }}>
                      {log.note || `From ${log.source?.username || '—'}`}
                    </td>
                    <td className="font-num" style={{ fontWeight: 600 }}>
                      {log.amount}
                    </td>
                    <td>
                      <span className={`pill ${log.side === 'LEFT' ? 'info' : 'live'}`}>{log.side}</span>
                    </td>
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

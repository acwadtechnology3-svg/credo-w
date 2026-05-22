import { useQuery } from '@tanstack/react-query'
import { getReferrals } from '../../api/team.api'

/** Direct enrollments (sponsor tree) — same data as referrals list */
export default function EnrollerTreePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['referrals', 'enroller'],
    queryFn: () => getReferrals({ limit: 100 }),
  })

  return (
    <div className="module-page page-enter" dir="rtl">
      <h2 className="font-display" style={{ fontSize: 20, marginBottom: 8 }}>
        Enroller Tree
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
        Members you personally enrolled (sponsor relationship).
      </p>

      <div className="module-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="module-table">
            <thead>
              <tr>
                {['Username', 'Rank', 'Status', 'Country', 'Joined'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>
                    Loading...
                  </td>
                </tr>
              ) : (data?.data || []).length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
                    No direct enrollments yet
                  </td>
                </tr>
              ) : (
                (data?.data || []).map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.username}</td>
                    <td>{r.rank}</td>
                    <td>
                      <span className={`pill ${r.status === 'active' ? 'ok' : ''}`}>{r.status}</span>
                    </td>
                    <td>{r.country}</td>
                    <td style={{ color: 'var(--text-2)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
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

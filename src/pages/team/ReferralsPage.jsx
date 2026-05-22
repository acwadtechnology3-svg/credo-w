import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReferrals } from '../../api/team.api'

export default function ReferralsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['referrals', search],
    queryFn: () => getReferrals({ search, limit: 50 }),
  })

  return (
    <div className="module-page page-enter" dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 className="font-display" style={{ fontSize: 20, margin: 0 }}>
          Referrals
        </h2>
        <input
          className="input"
          placeholder="Search username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
      </div>

      <div className="module-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="module-table">
            <thead>
              <tr>
                {['Username', 'Full Name', 'Email', 'Rank', 'Side', 'Status', 'Country', 'Joined', 'Activated'].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
                    Loading...
                  </td>
                </tr>
              ) : (data?.data || []).length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
                    No record found
                  </td>
                </tr>
              ) : (
                (data?.data || []).map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.username}</td>
                    <td>{r.full_name}</td>
                    <td style={{ color: 'var(--text-2)' }}>{r.email}</td>
                    <td>{r.rank}</td>
                    <td>
                      <span className="pill info">{r.side}</span>
                    </td>
                    <td>
                      <span className={`pill ${r.status === 'active' ? 'ok' : ''}`}>{r.status}</span>
                    </td>
                    <td>{r.country}</td>
                    <td style={{ color: 'var(--text-2)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {r.active_date ? new Date(r.active_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-3)', borderTop: '1px solid var(--line)' }}>
          Total: {data?.total || 0} records
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGenealogy } from '../../api/team.api'

export default function GenealogyPage() {
  const [search, setSearch] = useState('')
  const [side, setSide] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['genealogy', search, side],
    queryFn: () => getGenealogy({ search, side, limit: 100 }),
  })

  return (
    <div className="module-page page-enter" dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 className="font-display" style={{ fontSize: 20, margin: 0 }}>
          My Genealogy
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="input" value={side} onChange={(e) => setSide(e.target.value)} style={{ width: 120 }}>
            <option value="">All sides</option>
            <option value="LEFT">LEFT</option>
            <option value="RIGHT">RIGHT</option>
          </select>
          <input
            className="input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 200 }}
          />
        </div>
      </div>

      <div className="module-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="module-table">
            <thead>
              <tr>
                {['Username', 'Country', 'Side', 'Level', 'Rank', 'Status', 'Joined', 'Activated'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center' }}>
                    Loading...
                  </td>
                </tr>
              ) : (data?.data || []).length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
                    No record found
                  </td>
                </tr>
              ) : (
                (data?.data || []).map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.username}</td>
                    <td>{r.country}</td>
                    <td>
                      <span className="pill info">{r.side}</span>
                    </td>
                    <td>{r.placement_level}</td>
                    <td>{r.rank}</td>
                    <td>
                      <span className={`pill ${r.status === 'active' ? 'ok' : ''}`}>{r.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {r.joining_date ? new Date(r.joining_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {r.activation_date ? new Date(r.activation_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 10, fontSize: 12, color: 'var(--text-3)' }}>Total: {data?.total || 0}</div>
      </div>
    </div>
  )
}

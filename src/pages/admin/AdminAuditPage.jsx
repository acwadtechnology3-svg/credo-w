import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '../../api/admin.api'
import { useState } from 'react'

export default function AdminAuditPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => getAuditLogs({ page, limit: 50 }),
  })

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Audit Log</h2>
      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: '12px',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Time', 'Actor', 'Action', 'Entity', 'Details'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    color: '#888',
                    fontWeight: '500',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data?.data || []).map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '7px 12px', color: '#888', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '7px 12px', fontWeight: '500' }}>
                    {log.actor?.username || '—'}
                  </td>
                  <td style={{ padding: '7px 12px' }}>
                    <span
                      style={{
                        background: '#EEEDFE',
                        color: '#3C3489',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '7px 12px', color: '#888' }}>{log.entity}</td>
                  <td
                    style={{
                      padding: '7px 12px',
                      color: '#555',
                      fontSize: '11px',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {log.new_value ? JSON.stringify(log.new_value) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div
          style={{
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #eee',
          }}
        >
          <span style={{ fontSize: '12px', color: '#888' }}>Total: {data?.total || 0}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid #eee',
                borderRadius: '6px',
                cursor: page === 1 ? 'default' : 'pointer',
                background: page === 1 ? '#f5f5f5' : '#fff',
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '12px', color: '#888', padding: '4px 8px' }}>Page {page}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid #eee',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

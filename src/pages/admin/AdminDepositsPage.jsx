import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminDeposits, processDeposit } from '../../api/admin.api'

export default function AdminDepositsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedDeposit, setSelectedDeposit] = useState(null)
  const [adminNote, setAdminNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deposits', statusFilter],
    queryFn: () => getAdminDeposits({ status: statusFilter, limit: 50 }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, action }) => processDeposit(id, { action, admin_note: adminNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-deposits'] })
      setSelectedDeposit(null)
      setAdminNote('')
    },
  })

  const statusColor = { pending: '#BA7517', confirmed: '#27500A', rejected: '#c00' }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Deposit Requests</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['pending', 'confirmed', 'rejected'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                background: statusFilter === s ? '#534AB7' : '#f5f5f5',
                color: statusFilter === s ? '#fff' : '#555',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: statusFilter === s ? '500' : '400',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {selectedDeposit && (
        <div
          style={{
            background: '#fff',
            border: '2px solid #eee',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '12px' }}>
            Process Deposit — EGP {parseFloat(selectedDeposit.amount).toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
            User: <strong>{selectedDeposit.users?.username}</strong> | Method:{' '}
            <strong>{selectedDeposit.payment_method}</strong> | Date:{' '}
            {new Date(selectedDeposit.created_at).toLocaleString()}
          </div>
          {selectedDeposit.receipt_url && (
            <a
              href={selectedDeposit.receipt_url}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-block', marginBottom: '12px', color: '#534AB7', fontSize: '13px' }}
            >
              View Receipt
            </a>
          )}
          {selectedDeposit.receipt_note && (
            <div
              style={{
                background: '#f8f8f8',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#555',
                marginBottom: '10px',
              }}
            >
              Note: {selectedDeposit.receipt_note}
            </div>
          )}
          <input
            placeholder="Admin note (optional for confirm, required for reject)..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #eee',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedDeposit(null)}
              style={{
                padding: '8px 18px',
                background: '#f5f5f5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate({ id: selectedDeposit.id, action: 'confirmed' })}
              style={{
                padding: '8px 18px',
                background: '#EAF3DE',
                color: '#27500A',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Confirm Deposit
            </button>
            <button
              type="button"
              onClick={() => {
                if (!adminNote.trim()) return alert('Rejection reason required')
                mutation.mutate({ id: selectedDeposit.id, action: 'rejected' })
              }}
              style={{
                padding: '8px 18px',
                background: '#FCEBEB',
                color: '#c00',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}

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
              {['Date', 'User', 'Amount', 'Method', 'Receipt', 'Note', 'Status', 'Actions'].map((h) => (
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
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (data?.data || []).length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  No deposits
                </td>
              </tr>
            ) : (
              (data?.data || []).map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ fontWeight: '500' }}>{d.users?.username}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{d.users?.email}</div>
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#534AB7' }}>
                    EGP {parseFloat(d.amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#555' }}>{d.payment_method}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {d.receipt_url ? (
                      <a
                        href={d.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#534AB7', fontSize: '11px' }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ color: '#ccc' }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      color: '#888',
                      fontSize: '11px',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.receipt_note || '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        color: statusColor[d.status] || '#888',
                        fontWeight: '500',
                        fontSize: '11px',
                      }}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {d.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => setSelectedDeposit(d)}
                        style={{
                          background: '#EEEDFE',
                          color: '#3C3489',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', fontSize: '12px', color: '#888', borderTop: '1px solid #eee' }}>
          Total: {data?.total || 0}
        </div>
      </div>
    </div>
  )
}

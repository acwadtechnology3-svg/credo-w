import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminWithdrawals, processWithdrawal } from '../../api/admin.api'
import { useState } from 'react'

export default function AdminWithdrawalsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('requested')
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter],
    queryFn: () => getAdminWithdrawals({ status: statusFilter, limit: 50 }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, action }) => processWithdrawal(id, { action, admin_note: note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      setNote('')
    },
  })

  const statusColor = {
    requested: '#BA7517',
    processing: '#378ADD',
    paid: '#27500A',
    rejected: '#c00',
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Withdrawals</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['requested', 'processing', 'paid', 'rejected'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                background: statusFilter === s ? '#534AB7' : '#f5f5f5',
                color: statusFilter === s ? '#fff' : '#555',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {['requested', 'processing'].includes(statusFilter) && (
        <input
          placeholder="Admin note (optional, used on reject)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '7px 12px',
            border: '1px solid #eee',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '12px',
          }}
        />
      )}

      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: '12px',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Date', 'User', 'Amount', 'Fee', 'Payable', 'Bank', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
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
            ) : (
              (data?.data || []).map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <div style={{ fontWeight: '500' }}>{w.users?.username}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{w.users?.email}</div>
                  </td>
                  <td style={{ padding: '7px 10px', fontWeight: '500' }}>
                    EGP {parseFloat(w.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    EGP {parseFloat(w.processing_fee || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '7px 10px', fontWeight: '600', color: '#27500A' }}>
                    EGP {parseFloat(w.payable_amount || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '7px 10px', color: '#555', fontSize: '11px' }}>
                    {w.bank_accounts
                      ? `${w.bank_accounts.bank_name} — ${w.bank_accounts.account_number}`
                      : '—'}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <span
                      style={{
                        color: statusColor[w.status] || '#888',
                        fontWeight: '500',
                        fontSize: '11px',
                      }}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    {['requested', 'processing'].includes(w.status) && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => mutation.mutate({ id: w.id, action: 'paid' })}
                          disabled={mutation.isPending}
                          style={{
                            background: '#EAF3DE',
                            color: '#27500A',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => mutation.mutate({ id: w.id, action: 'rejected' })}
                          disabled={mutation.isPending}
                          style={{
                            background: '#FCEBEB',
                            color: '#c00',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
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

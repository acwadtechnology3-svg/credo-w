import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWithdrawals, requestWithdrawal, getBankAccounts } from '../../api/withdrawal.api'
import { useState } from 'react'

export default function WithdrawalPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [bankId, setBankId] = useState('')
  const [error, setError] = useState('')

  const { data } = useQuery({ queryKey: ['withdrawals'], queryFn: getWithdrawals })
  const { data: accounts } = useQuery({ queryKey: ['bank-accounts'], queryFn: getBankAccounts })

  const mutation = useMutation({
    mutationFn: () =>
      requestWithdrawal({ amount: parseFloat(amount), bank_account_id: bankId || undefined }),
    onSuccess: () => {
      qc.invalidateQueries(['withdrawals'])
      setShowForm(false)
      setAmount('')
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed'),
  })

  const statusColor = {
    requested: '#BA7517',
    processing: '#378ADD',
    paid: '#27500A',
    rejected: '#c00',
    cancelled: '#888',
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
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Withdrawal</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#534AB7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          + New Withdrawal
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {[
          { label: 'Available Amount', value: data?.available_balance || 0, color: '#27500A' },
          { label: 'Requested Amount', value: data?.requested_amount || 0, color: '#BA7517' },
          { label: 'Paid Amount', value: data?.paid_amount || 0, color: '#534AB7' },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{c.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: c.color }}>
              EGP {parseFloat(c.value).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
            New Withdrawal Request
          </h3>
          {error && <div style={{ color: 'red', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}
          <input
            type="number"
            placeholder="Amount (EGP)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #eee',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '8px',
            }}
          />
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #eee',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          >
            <option value="">Select bank account (optional)</option>
            {(accounts || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.bank_name} — {a.account_number}
              </option>
            ))}
          </select>
          <button
            onClick={() => mutation.mutate()}
            disabled={!amount || mutation.isPending}
            style={{
              background: '#534AB7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 20px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      )}

      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Date', 'Requested', 'Processing Fee', 'Payable', 'Paid On', 'Pay To', 'Status'].map(
                (h) => (
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
                )
              )}
            </tr>
          </thead>
          <tbody>
            {(data?.withdrawals || []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  No withdrawals yet
                </td>
              </tr>
            ) : (
              (data?.withdrawals || []).map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: '500' }}>
                    EGP {parseFloat(w.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    EGP {parseFloat(w.processing_fee || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#27500A' }}>
                    EGP {parseFloat(w.payable_amount || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {w.paid_at ? new Date(w.paid_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#555' }}>
                    {w.bank_accounts?.bank_name || '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        background: '#f5f5f5',
                        color: statusColor[w.status] || '#888',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}
                    >
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminVouchers, generateVouchers } from '../../api/admin.api'
import { useState } from 'react'
import { toast } from '../../components/shared/Toast'

export default function AdminVouchersPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [showGen, setShowGen] = useState(false)
  const [genForm, setGenForm] = useState({
    user_id: '',
    count: '1',
    discount_amount: '',
    expires_days: '365',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vouchers', statusFilter],
    queryFn: () => getAdminVouchers({ status: statusFilter || undefined, limit: 50 }),
  })

  const genMutation = useMutation({
    mutationFn: generateVouchers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vouchers'] })
      setShowGen(false)
      toast.success('Vouchers generated')
    },
  })

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
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Vouchers</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              border: '1px solid #eee',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
          <button
            type="button"
            onClick={() => setShowGen(true)}
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
            Generate
          </button>
        </div>
      </div>

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
              {['Code', 'User', 'Amount', 'Status', 'Expires', 'Redeemed By'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    color: '#888',
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
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data?.data || []).map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '11px' }}>
                    {v.code || v.id.slice(0, 8)}
                  </td>
                  <td style={{ padding: '7px 10px' }}>{v.users?.username || '—'}</td>
                  <td style={{ padding: '7px 10px', fontWeight: '500' }}>
                    EGP {parseFloat(v.discount_amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '7px 10px' }}>{v.status}</td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {v.expires_at ? new Date(v.expires_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '7px 10px' }}>{v.redeemed?.username || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', fontSize: '12px', color: '#888', borderTop: '1px solid #eee' }}>
          Total: {data?.total || 0}
        </div>
      </div>

      {showGen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '360px' }}>
            <h3 style={{ fontWeight: '500', marginBottom: '16px' }}>Generate Vouchers</h3>
            <input
              placeholder="User UUID"
              value={genForm.user_id}
              onChange={(e) => setGenForm((p) => ({ ...p, user_id: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #eee',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            />
            <input
              type="number"
              placeholder="Count"
              value={genForm.count}
              onChange={(e) => setGenForm((p) => ({ ...p, count: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #eee',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            />
            <input
              type="number"
              placeholder="Discount amount (EGP)"
              value={genForm.discount_amount}
              onChange={(e) => setGenForm((p) => ({ ...p, discount_amount: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #eee',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            />
            <input
              type="number"
              placeholder="Expires in days"
              value={genForm.expires_days}
              onChange={(e) => setGenForm((p) => ({ ...p, expires_days: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #eee',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowGen(false)}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  genMutation.mutate({
                    user_id: genForm.user_id,
                    count: parseInt(genForm.count),
                    discount_amount: parseFloat(genForm.discount_amount),
                    expires_days: parseInt(genForm.expires_days),
                  })
                }
                disabled={!genForm.user_id || !genForm.discount_amount || genMutation.isPending}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: '#534AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

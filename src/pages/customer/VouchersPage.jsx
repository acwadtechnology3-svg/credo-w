import { useQuery } from '@tanstack/react-query'
import { getVouchers } from '../../api/customer.api'
import { useState } from 'react'

export default function VouchersPage() {
  const [status, setStatus] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['vouchers', status],
    queryFn: () => getVouchers({ status: status || undefined }),
  })

  const statusColor = { available: '#27500A', redeemed: '#888', expired: '#c00' }
  const statusBg = { available: '#EAF3DE', redeemed: '#f5f5f5', expired: '#FCEBEB' }

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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid #eee',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="redeemed">Redeemed</option>
          <option value="expired">Expired</option>
        </select>
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
              {[
                'Date',
                'Voucher Code',
                'Note',
                'Status',
                'Expiry On',
                'Redeem On',
                'Redeemed By',
              ].map((h) => (
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
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (data || []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  No vouchers
                </td>
              </tr>
            ) : (
              (data || []).map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#534AB7' }}>
                    {v.code?.slice(0, 8)}...
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(v.code)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#888',
                        fontSize: '10px',
                        marginLeft: '4px',
                      }}
                    >
                      📋
                    </button>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#555', fontSize: '11px' }}>
                    {v.order_id ? 'From Order' : '—'}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <span
                      style={{
                        background: statusBg[v.status] || '#f5f5f5',
                        color: statusColor[v.status] || '#888',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {v.expires_at ? new Date(v.expires_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {v.redeemed_at ? new Date(v.redeemed_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {v.redeemed_user?.username || '—'}
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

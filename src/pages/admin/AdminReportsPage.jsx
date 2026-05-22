import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getAdminReports } from '../../api/admin.api'

export default function AdminReportsPage() {
  const [from, setFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', from, to],
    queryFn: () => getAdminReports({ from: `${from}T00:00:00`, to: `${to}T23:59:59` }),
  })

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', data.summary.totalRevenue],
      ['Total Commission Paid', data.summary.totalCommission],
      ['Net Revenue', data.summary.netRevenue],
      ['Total Deposits', data.summary.totalDeposits],
      ['Total Withdrawals', data.summary.totalWithdrawals],
      ['New Users', data.summary.newUsers],
      ['Total Orders', data.summary.totalOrders],
      ['Cancelled Orders', data.summary.cancelledOrders],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credo-w-report-${from}-${to}.csv`
    a.click()
  }

  const s = data?.summary || {}

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
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Reports & Analytics</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #eee',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
          <span style={{ color: '#888' }}>→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #eee',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
          <button
            type="button"
            onClick={exportCSV}
            style={{
              background: '#534AB7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 16px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: '#888' }}>Loading...</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            {[
              {
                label: 'Total Revenue',
                value: `EGP ${(s.totalRevenue || 0).toLocaleString()}`,
                color: '#27500A',
                bg: '#EAF3DE',
              },
              {
                label: 'Commission Paid',
                value: `EGP ${(s.totalCommission || 0).toLocaleString()}`,
                color: '#c00',
                bg: '#FCEBEB',
              },
              {
                label: 'Net Revenue',
                value: `EGP ${(s.netRevenue || 0).toLocaleString()}`,
                color: '#534AB7',
                bg: '#EEEDFE',
              },
              {
                label: 'Total Deposits',
                value: `EGP ${(s.totalDeposits || 0).toLocaleString()}`,
                color: '#378ADD',
                bg: '#E6F1FB',
              },
              {
                label: 'Total Withdrawals',
                value: `EGP ${(s.totalWithdrawals || 0).toLocaleString()}`,
                color: '#BA7517',
                bg: '#FAEEDA',
              },
              { label: 'New Users', value: s.newUsers || 0, color: '#27500A', bg: '#EAF3DE' },
              { label: 'Total Orders', value: s.totalOrders || 0, color: '#534AB7', bg: '#EEEDFE' },
              {
                label: 'Cancelled Orders',
                value: s.cancelledOrders || 0,
                color: '#c00',
                bg: '#FCEBEB',
              },
            ].map((c) => (
              <div key={c.label} style={{ background: c.bg, borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: c.color, marginBottom: '4px', opacity: 0.8 }}>
                  {c.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '12px' }}>
              Daily Revenue (EGP)
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.revenueByDay || []}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#534AB7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                fontWeight: '500',
                fontSize: '13px',
                borderBottom: '1px solid #eee',
              }}
            >
              Top Products by Revenue
            </div>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  {['#', 'Product', 'Units Sold', 'Revenue'].map((h) => (
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
                {(data?.topProducts || []).map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: '1px solid #f8f8f8' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600', color: '#534AB7' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>{p.name}</td>
                    <td style={{ padding: '8px 12px', color: '#888' }}>{p.quantity} units</td>
                    <td style={{ padding: '8px 12px', fontWeight: '600', color: '#27500A' }}>
                      EGP {Math.round(p.revenue).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

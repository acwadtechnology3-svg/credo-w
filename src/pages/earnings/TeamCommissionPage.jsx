import { useQuery } from '@tanstack/react-query'
import { getTeamCommission } from '../../api/earnings.api'

export default function TeamCommissionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['team-commission'],
    queryFn: getTeamCommission,
  })

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Team Commission</h2>
      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '11px', color: '#888' }}>Total Bonus</div>
        <div style={{ fontSize: '24px', fontWeight: '600', color: '#534AB7' }}>
          {data?.totalBonus || 0}
        </div>
      </div>
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
              {[
                'Date',
                'Period',
                'Pay Leg Vol.',
                'Left Carry',
                'Right Carry',
                'Commission%',
                'Rank',
                'Commission',
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
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (data?.commissions || []).length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  No record found
                </td>
              </tr>
            ) : (
              (data?.commissions || []).map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {new Date(c.commission_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '7px 10px', color: '#555', fontSize: '11px' }}>
                    {c.commission_period}
                  </td>
                  <td style={{ padding: '7px 10px', fontWeight: '500' }}>{c.pay_leg_volume}</td>
                  <td style={{ padding: '7px 10px', color: '#378ADD' }}>{c.left_carry}</td>
                  <td style={{ padding: '7px 10px', color: '#378ADD' }}>{c.right_carry}</td>
                  <td style={{ padding: '7px 10px' }}>{c.commission_pct}%</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span
                      style={{
                        background: '#EEEDFE',
                        color: '#3C3489',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10px',
                      }}
                    >
                      {c.rank}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', fontWeight: '600', color: '#27500A' }}>
                    EGP {parseFloat(c.commission_amount).toFixed(2)}
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

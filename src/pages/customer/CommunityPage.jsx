import { useQuery } from '@tanstack/react-query'
import { getCommunity } from '../../api/customer.api'

export default function CommunityPage() {
  const { data, isLoading } = useQuery({ queryKey: ['community'], queryFn: getCommunity })

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Customer Community</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {[
          { label: 'Saver', value: data?.saverCount || 0 },
          { label: 'Super Saver', value: data?.superSaverCount || 0 },
          { label: 'Total', value: data?.total || 0 },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{c.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '600', color: '#534AB7' }}>{c.value}</div>
          </div>
        ))}
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
              {['Signup On', 'Name', 'Email', 'Membership', 'Expiry', 'Referral'].map((h) => (
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
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (data?.community || []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  No customers yet
                </td>
              </tr>
            ) : (
              (data?.community || []).map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {new Date(c.signup_on).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: '500' }}>{c.name}</td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>{c.email}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        background: '#EEEDFE',
                        color: '#3C3489',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                      }}
                    >
                      {c.membership}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {c.expiry ? new Date(c.expiry).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#555' }}>{c.referral}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

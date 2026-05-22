import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFranchiseOverview, getNetworkAmbassadors, activateAmbassador } from '../../api/franchise.api'
import { useState } from 'react'

export default function FranchiseDashboardPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: overview } = useQuery({
    queryKey: ['franchise-overview'],
    queryFn: getFranchiseOverview,
  })
  const { data: network, isLoading } = useQuery({
    queryKey: ['franchise-network', search, statusFilter],
    queryFn: () => getNetworkAmbassadors({ search, status: statusFilter, limit: 50 }),
  })

  const activateMutation = useMutation({
    mutationFn: activateAmbassador,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['franchise-network'] })
      qc.invalidateQueries({ queryKey: ['franchise-overview'] })
    },
  })

  const stats = [
    { label: 'Network Size', value: overview?.networkSize || 0, color: '#534AB7' },
    { label: 'Active', value: overview?.activeCount || 0, color: '#27500A' },
    { label: 'Pending', value: overview?.pendingCount || 0, color: '#BA7517' },
    { label: 'Network BV (A)', value: Math.round(overview?.networkBV?.sideA || 0), color: '#378ADD' },
    { label: 'Network BV (B)', value: Math.round(overview?.networkBV?.sideB || 0), color: '#378ADD' },
    {
      label: 'Total Commission',
      value: `EGP ${(overview?.totalCommission || 0).toLocaleString()}`,
      color: '#27500A',
    },
  ]

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Franchise Dashboard</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {overview?.license && (
        <div
          style={{
            background: '#EEEDFE',
            border: '1px solid #AFA9EC',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontWeight: '500', color: '#3C3489' }}>
              License: {overview.license.subscriptions?.name}
            </span>
            <span style={{ color: '#888', marginLeft: '12px' }}>
              Expires: {new Date(overview.license.expiry_date).toLocaleDateString()}
            </span>
          </div>
          <span
            style={{
              background:
                new Date(overview.license.expiry_date) > new Date() ? '#EAF3DE' : '#FCEBEB',
              color: new Date(overview.license.expiry_date) > new Date() ? '#27500A' : '#c00',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
            }}
          >
            {new Date(overview.license.expiry_date) > new Date() ? 'Active' : 'Expired'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <input
          placeholder="Search name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '7px 12px',
            border: '1px solid #eee',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
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
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
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
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {[
                'Username',
                'Full Name',
                'Rank',
                'Side',
                'Depth',
                'Status',
                'Country',
                'Joined',
                'Action',
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
                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (network?.data || []).map((u) => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '7px 10px', fontWeight: '500' }}>{u.username}</td>
                  <td style={{ padding: '7px 10px' }}>{u.full_name}</td>
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
                      {u.rank}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>{u.side}</td>
                  <td style={{ padding: '7px 10px', color: '#888', textAlign: 'center' }}>{u.depth}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span
                      style={{
                        background:
                          u.status === 'active'
                            ? '#EAF3DE'
                            : u.status === 'pending'
                              ? '#FAEEDA'
                              : '#FCEBEB',
                        color:
                          u.status === 'active'
                            ? '#27500A'
                            : u.status === 'pending'
                              ? '#BA7517'
                              : '#c00',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>{u.country}</td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {new Date(u.joined).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    {u.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => activateMutation.mutate(u.user_id)}
                        disabled={activateMutation.isPending}
                        style={{
                          background: '#EAF3DE',
                          color: '#27500A',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            color: '#888',
            borderTop: '1px solid #eee',
          }}
        >
          Total in network: {network?.total || 0}
        </div>
      </div>
    </div>
  )
}

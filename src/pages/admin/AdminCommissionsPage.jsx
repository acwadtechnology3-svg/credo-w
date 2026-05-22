import { useQuery, useMutation } from '@tanstack/react-query'
import { getCommissionCycles, getCycleDetails, runCommission } from '../../api/admin.api'
import { useState } from 'react'
import { toast } from '../../components/shared/Toast'

export default function AdminCommissionsPage() {
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [commResult, setCommResult] = useState(null)

  const { data: cycles, isLoading } = useQuery({
    queryKey: ['admin-commission-cycles'],
    queryFn: getCommissionCycles,
  })

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin-cycle-details', selectedCycle],
    queryFn: () => getCycleDetails(selectedCycle),
    enabled: !!selectedCycle,
  })

  const commMutation = useMutation({
    mutationFn: runCommission,
    onSuccess: (r) => {
      setCommResult(r)
      toast.success('Commission cycle completed')
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
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Commission Cycles</h2>
        <button
          type="button"
          onClick={() => commMutation.mutate()}
          disabled={commMutation.isPending}
          style={{
            background: commMutation.isPending ? '#aaa' : '#534AB7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {commMutation.isPending ? 'Running...' : 'Run Weekly Commission'}
        </button>
      </div>

      {commResult && (
        <div
          style={{
            background: '#EAF3DE',
            border: '1px solid #C0DD97',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '12px',
            fontSize: '12px',
            color: '#27500A',
          }}
        >
          ✓ {commResult.usersProcessed} users — EGP {commResult.totalPaid} paid
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading...</div>
          ) : (
            (cycles || []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCycle(c.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  border: 0,
                  borderBottom: '1px solid #f5f5f5',
                  background: selectedCycle === c.id ? '#EEEDFE' : '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: '500' }}>
                  {c.week_start} → {c.week_end}
                </div>
                <div style={{ color: '#888', marginTop: 2 }}>
                  {c.status} · {c.users_processed || 0} users · EGP {c.total_paid || 0}
                </div>
              </button>
            ))
          )}
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            overflow: 'auto',
          }}
        >
          {!selectedCycle ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              Select a cycle to view payouts
            </div>
          ) : detailsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  {['User', 'Rank', 'Left BV', 'Right BV', 'Commission'].map((h) => (
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
                {(details || []).map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                    <td style={{ padding: '7px 10px', fontWeight: '500' }}>
                      {row.users?.username || row.users?.full_name}
                    </td>
                    <td style={{ padding: '7px 10px' }}>{row.users?.ranks?.name || '—'}</td>
                    <td style={{ padding: '7px 10px' }}>{row.left_bv}</td>
                    <td style={{ padding: '7px 10px' }}>{row.right_bv}</td>
                    <td style={{ padding: '7px 10px', color: '#27500A', fontWeight: '600' }}>
                      EGP {parseFloat(row.commission_amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

import { useQuery, useMutation } from '@tanstack/react-query'
import { getAdminOverview, runCommission } from '../../api/admin.api'
import { useState } from 'react'
import { toast } from '../../components/shared/Toast'

export default function AdminDashboardPage() {
  const [commResult, setCommResult] = useState(null)
  const { data, isLoading } = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview })

  const commMutation = useMutation({
    mutationFn: runCommission,
    onSuccess: (r) => setCommResult(r),
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading...</div>

  const stats = [
    { label: 'Total Users', value: data?.totalUsers || 0, color: '#534AB7' },
    { label: 'Active Users', value: data?.activeUsers || 0, color: '#27500A' },
    { label: 'Pending Activation', value: data?.pendingUsers || 0, color: '#BA7517' },
    { label: 'Total Orders', value: data?.totalOrders || 0, color: '#378ADD' },
    {
      label: 'Total Revenue',
      value: `EGP ${(data?.totalRevenue || 0).toLocaleString()}`,
      color: '#27500A',
    },
    { label: 'Pending Withdrawals', value: data?.pendingWithdrawals || 0, color: '#c00' },
  ]

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Admin Dashboard</h2>

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
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '600', color: s.color }}>{s.value}</div>
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
        <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '10px' }}>
          Commission Engine
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
          Last cycle:{' '}
          <strong>
            {data?.lastCycle
              ? `${data.lastCycle.week_start} — ${data.lastCycle.status}`
              : 'Never ran'}
          </strong>
        </div>
        {commResult && (
          <div
            style={{
              background: '#EAF3DE',
              border: '1px solid #C0DD97',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '10px',
              fontSize: '12px',
              color: '#27500A',
            }}
          >
            ✓ Commission completed — {commResult.usersProcessed} users processed, EGP{' '}
            {commResult.totalPaid} paid
          </div>
        )}
        <button
          type="button"
          onClick={() => commMutation.mutate()}
          disabled={commMutation.isPending}
          style={{
            background: commMutation.isPending ? '#aaa' : '#534AB7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 20px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          {commMutation.isPending ? 'Running...' : '▶ Run Weekly Commission Now'}
        </button>
      </div>
    </div>
  )
}

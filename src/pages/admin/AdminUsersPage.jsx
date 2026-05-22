import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, updateUserStatus, updateUserRole, grantBonus } from '../../api/admin.api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '../../components/shared/Toast'

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [bonusForm, setBonusForm] = useState({
    amount: '',
    wallet_type: 'EARNINGS',
    description: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, status],
    queryFn: () => getAdminUsers({ search, status, limit: 50 }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status: s }) => updateUserStatus(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Status updated')
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Role updated')
    },
  })

  const bonusMutation = useMutation({
    mutationFn: ({ id, body }) => grantBonus(id, body),
    onSuccess: () => {
      toast.success('Bonus granted!')
      setSelected(null)
    },
  })

  const statusColor = { active: '#27500A', pending: '#BA7517', suspended: '#c00' }
  const statusBg = { active: '#EAF3DE', pending: '#FAEEDA', suspended: '#FCEBEB' }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Users Management</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search username / email / name / code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '7px 12px',
            border: '1px solid #eee',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {[
                'Code',
                'Username',
                'Full Name',
                'Email',
                'Rank',
                'Role',
                'Status',
                'Country',
                'Joined',
                'Actions',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    color: '#888',
                    fontWeight: '500',
                    borderBottom: '1px solid #eee',
                    whiteSpace: 'nowrap',
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
                <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data?.data || []).map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '7px 10px', color: '#888', fontSize: '11px' }}>{u.user_code}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      style={{
                        fontWeight: '600',
                        cursor: 'pointer',
                        color: '#534AB7',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        textDecoration: 'underline',
                      }}
                    >
                      {u.username}
                    </button>
                  </td>
                  <td style={{ padding: '7px 10px' }}>{u.full_name}</td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>{u.email}</td>
                  <td style={{ padding: '7px 10px' }}>{u.ranks?.name || 'BAP'}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <select
                      defaultValue={u.role}
                      onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                      style={{
                        padding: '3px 6px',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        fontSize: '11px',
                      }}
                    >
                      <option value="ambassador">Ambassador</option>
                      <option value="franchise">Franchise</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <span
                      style={{
                        background: statusBg[u.status] || '#f5f5f5',
                        color: statusColor[u.status] || '#888',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>{u.country}</td>
                  <td style={{ padding: '7px 10px', color: '#888' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {u.status !== 'active' && (
                        <button
                          type="button"
                          onClick={() => statusMutation.mutate({ id: u.id, status: 'active' })}
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
                          Activate
                        </button>
                      )}
                      {u.status !== 'suspended' && (
                        <button
                          type="button"
                          onClick={() => statusMutation.mutate({ id: u.id, status: 'suspended' })}
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
                          Suspend
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        style={{
                          background: '#EEEDFE',
                          color: '#3C3489',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        ملف كامل
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelected(u)}
                        style={{
                          background: '#f5f5f5',
                          color: '#555',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Bonus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', fontSize: '12px', color: '#888', borderTop: '1px solid #eee' }}>
          Total: {data?.total || 0} users
        </div>
      </div>

      {selected && (
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
            <h3 style={{ fontWeight: '500', marginBottom: '16px' }}>Grant Bonus — {selected.username}</h3>
            <input
              type="number"
              placeholder="Amount (EGP)"
              value={bonusForm.amount}
              onChange={(e) => setBonusForm((p) => ({ ...p, amount: e.target.value }))}
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
              value={bonusForm.wallet_type}
              onChange={(e) => setBonusForm((p) => ({ ...p, wallet_type: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #eee',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            >
              <option value="EARNINGS">Earnings Wallet</option>
              <option value="CMONEY">C Money Wallet</option>
            </select>
            <input
              placeholder="Description (optional)"
              value={bonusForm.description}
              onChange={(e) => setBonusForm((p) => ({ ...p, description: e.target.value }))}
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
                onClick={() => setSelected(null)}
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
                onClick={() => bonusMutation.mutate({ id: selected.id, body: bonusForm })}
                disabled={!bonusForm.amount || bonusMutation.isPending}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: '#534AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Grant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSAAdmins, createSAAdmin, updateSAAdminRole } from '../../api/superAdmin.api'

export default function SAAdminsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'admin',
  })

  const { data, isLoading } = useQuery({ queryKey: ['sa-admins'], queryFn: getSAAdmins })

  const createMutation = useMutation({
    mutationFn: createSAAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-admins'] })
      setShowForm(false)
      setForm({ username: '', email: '', password: '', full_name: '', role: 'admin' })
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateSAAdminRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-admins'] }),
  })

  const cardStyle = {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  }
  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#EEEDFE',
    marginBottom: '8px',
  }
  const labelStyle = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '3px' }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ color: '#EEEDFE', fontSize: '18px', fontWeight: '500' }}>Admin Management</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            background: '#534AB7',
            color: '#EEEDFE',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          + New Admin
        </button>
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h3 style={{ color: '#EEEDFE', marginBottom: '12px', fontSize: '14px' }}>Create Admin</h3>
          {[
            { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email' },
            { key: 'full_name', label: 'Full Name' },
            { key: 'password', label: 'Password', type: 'password' },
          ].map((f) => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}
          <label style={labelStyle}>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            style={inputStyle}
          >
            <option value="admin">Admin</option>
            <option value="franchise">Franchise</option>
          </select>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 18px',
                background: 'transparent',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                color: '#888',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              style={{
                padding: '8px 18px',
                background: '#534AB7',
                border: 'none',
                borderRadius: '8px',
                color: '#EEEDFE',
                cursor: 'pointer',
              }}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ color: '#888' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Code', 'Username', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '6px 10px',
                      textAlign: 'left',
                      color: '#888',
                      borderBottom: '1px solid #2a2a3e',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data || []).map((a) => (
                <tr key={a.id}>
                  <td style={{ padding: '8px 10px', color: '#888' }}>{a.user_code}</td>
                  <td style={{ padding: '8px 10px', color: '#EEEDFE' }}>{a.username}</td>
                  <td style={{ padding: '8px 10px', color: '#888' }}>{a.email}</td>
                  <td style={{ padding: '8px 10px', color: '#DCDCAA' }}>{a.role}</td>
                  <td style={{ padding: '8px 10px', color: '#888' }}>{a.status}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {a.role !== 'super_admin' && (
                      <select
                        value={a.role}
                        onChange={(e) => roleMutation.mutate({ id: a.id, role: e.target.value })}
                        style={{
                          padding: '4px 8px',
                          background: '#0f0f1a',
                          border: '1px solid #2a2a3e',
                          borderRadius: '4px',
                          color: '#EEEDFE',
                          fontSize: '11px',
                        }}
                      >
                        <option value="admin">admin</option>
                        <option value="franchise">franchise</option>
                        <option value="ambassador">ambassador</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

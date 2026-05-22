import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminCoupons, createAdminCoupon, deleteAdminCoupon } from '../../api/adminProducts.api'
import { useState } from 'react'

export default function AdminCouponsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    min_order_amount: '0',
    max_uses: '-1',
    max_uses_per_user: '1',
    expires_at: '',
  })

  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: getAdminCoupons })

  const createMutation = useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      setShowForm(false)
      setForm({
        code: '',
        type: 'percentage',
        value: '',
        min_order_amount: '0',
        max_uses: '-1',
        max_uses_per_user: '1',
        expires_at: '',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid #eee',
    borderRadius: '8px',
    fontSize: '13px',
  }
  const labelStyle = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '3px' }

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
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Coupons & Discounts</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#534AB7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          + Create Coupon
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '14px' }}>New Coupon</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Coupon Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                style={inputStyle}
                placeholder="e.g. WELCOME20"
              />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                style={inputStyle}
              >
                <option value="percentage">Percentage %</option>
                <option value="fixed">Fixed Amount (EGP)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Value *</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                style={inputStyle}
                placeholder={form.type === 'percentage' ? '20 = 20%' : '100 = EGP 100'}
              />
            </div>
            <div>
              <label style={labelStyle}>Min Order (EGP)</label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm((p) => ({ ...p, min_order_amount: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Uses (-1 = unlimited)</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Expires At</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 18px',
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
                createMutation.mutate({
                  ...form,
                  expires_at: form.expires_at ? `${form.expires_at}T23:59:59Z` : null,
                })
              }
              disabled={!form.code || !form.value || createMutation.isPending}
              style={{
                padding: '8px 18px',
                background: '#534AB7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </div>
      )}

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
              {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Status', 'Actions'].map(
                (h) => (
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
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data || []).map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td
                    style={{
                      padding: '8px 12px',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      color: '#534AB7',
                    }}
                  >
                    {c.code}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        background: '#EEEDFE',
                        color: '#3C3489',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '11px',
                      }}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#27500A' }}>
                    {c.type === 'percentage' ? `${c.value}%` : `EGP ${c.value}`}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {parseFloat(c.min_order_amount) > 0 ? `EGP ${c.min_order_amount}` : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {c.used_count || 0} / {c.max_uses === -1 ? '∞' : c.max_uses}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '∞'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        background: c.is_active ? '#EAF3DE' : '#f5f5f5',
                        color: c.is_active ? '#27500A' : '#888',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                      }}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Deactivate coupon?')) deleteMutation.mutate(c.id)
                      }}
                      style={{
                        background: '#FCEBEB',
                        color: '#c00',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminOrders, updateOrderStatus } from '../../api/adminProducts.api'
import { useState } from 'react'

export default function AdminOrdersPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [updateForm, setUpdateForm] = useState({
    status: '',
    tracking_number: '',
    shipping_company: '',
    admin_note: '',
    cancellation_reason: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders-full', statusFilter],
    queryFn: () => getAdminOrders({ status: statusFilter, limit: 50 }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, body }) => updateOrderStatus(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders-full'] })
      setSelected(null)
    },
  })

  const statusColor = {
    pending: '#BA7517',
    processing: '#378ADD',
    shipped: '#534AB7',
    delivered: '#27500A',
    cancelled: '#c00',
    refunded: '#888',
  }
  const statuses = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

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
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Orders Management</h2>
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
          {statuses.map((s) => (
            <option key={s || 'all'} value={s}>
              {s || 'All Status'}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '12px' }}>
            Update Order — {selected.order_ref}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '3px' }}>
                New Status
              </label>
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                {statuses.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '3px' }}>
                Tracking Number
              </label>
              <input
                value={updateForm.tracking_number}
                onChange={(e) => setUpdateForm((p) => ({ ...p, tracking_number: e.target.value }))}
                placeholder="e.g. AX123456789EG"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '3px' }}>
                Shipping Company
              </label>
              <input
                value={updateForm.shipping_company}
                onChange={(e) => setUpdateForm((p) => ({ ...p, shipping_company: e.target.value }))}
                placeholder="e.g. Aramex, Bosta"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '3px' }}>
                Admin Note
              </label>
              <input
                value={updateForm.admin_note}
                onChange={(e) => setUpdateForm((p) => ({ ...p, admin_note: e.target.value }))}
                placeholder="Internal note..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
            </div>
            {updateForm.status === 'cancelled' && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '3px' }}>
                  Cancellation Reason
                </label>
                <input
                  value={updateForm.cancellation_reason}
                  onChange={(e) =>
                    setUpdateForm((p) => ({ ...p, cancellation_reason: e.target.value }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelected(null)}
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
              onClick={() => mutation.mutate({ id: selected.id, body: updateForm })}
              disabled={!updateForm.status || mutation.isPending}
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
              {mutation.isPending ? 'Updating...' : 'Update Order'}
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
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Order Ref', 'User', 'Date', 'Items', 'Total', 'Tracking', 'Status', 'Actions'].map(
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
              (data?.data || []).map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#534AB7', fontSize: '11px' }}>
                    {o.order_ref}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ fontWeight: '500' }}>{o.users?.username}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{o.users?.phone}</div>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>{o.order_items?.length || 0} items</td>
                  <td style={{ padding: '8px 12px', fontWeight: '600' }}>
                    EGP {parseFloat(o.total).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: o.tracking_number ? '#534AB7' : '#ccc',
                    }}
                  >
                    {o.tracking_number || '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        color: statusColor[o.status] || '#888',
                        fontWeight: '500',
                        fontSize: '11px',
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(o)
                        setUpdateForm({
                          status: o.status,
                          tracking_number: o.tracking_number || '',
                          shipping_company: o.shipping_company || '',
                          admin_note: '',
                          cancellation_reason: '',
                        })
                      }}
                      style={{
                        background: '#EEEDFE',
                        color: '#3C3489',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Update
                    </button>
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
          Total: {data?.total || 0}
        </div>
      </div>
    </div>
  )
}

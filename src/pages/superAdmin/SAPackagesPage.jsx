import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSAPackages,
  createSAPackage,
  updateSAPackage,
  deleteSAPackage,
} from '../../api/superAdmin.api'
import AdminPanel from '../../components/admin/AdminPanel'

const emptyForm = {
  name: '',
  description: '',
  price_egp: '',
  bv_points: '',
  pv_points: '',
  direct_commission_egp: '',
  sort_order: '',
}

export default function SAPackagesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['sa-packages'], queryFn: getSAPackages })

  const saveMutation = useMutation({
    mutationFn: (body) => (editing ? updateSAPackage(editing, body) : createSAPackage(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-packages'] })
      setShowForm(false)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSAPackage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-packages'] }),
  })

  const labelStyle = { display: 'block', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }

  const openCreate = () => {
    setShowForm(true)
    setEditing(null)
    setForm(emptyForm)
  }

  const openEdit = (pkg) => {
    setEditing(pkg.id)
    setForm({
      name: pkg.name,
      description: pkg.description || '',
      price_egp: String(pkg.price_egp),
      bv_points: String(pkg.bv_points),
      pv_points: String(pkg.pv_points),
      direct_commission_egp: String(pkg.direct_commission_egp),
      sort_order: String(pkg.sort_order),
    })
    setShowForm(true)
  }

  return (
    <AdminPanel
      title="إدارة الباقات"
      subtitle="الباقات والعمولات المباشرة — منفصلة عن منتجات المتجر"
      actions={
        <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate}>
          + باقة جديدة
        </button>
      }
    >
      {showForm && (
        <div className="admin-card" style={{ marginBottom: 12 }}>
          <div className="admin-card__head">
            {editing ? 'تعديل الباقة' : 'باقة جديدة'}
          </div>
          <div className="admin-card__body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {[
              { key: 'name', label: 'Package Name' },
              { key: 'price_egp', label: 'Price (EGP)', type: 'number' },
              { key: 'direct_commission_egp', label: 'Direct Commission (EGP)', type: 'number' },
              { key: 'bv_points', label: 'BV Points', type: 'number' },
              { key: 'pv_points', label: 'PV Points', type: 'number' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
            ].map((f) => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="admin-input"
                />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="admin-textarea"
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowForm(false)}>
              إلغاء
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ color: 'var(--text-3)' }}>جاري التحميل...</div>
      ) : (
        (data || []).map((pkg) => (
          <div key={pkg.id} className="admin-card" style={{ marginBottom: 12 }}>
            <div className="admin-card__body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--text-1)', fontWeight: '600', fontSize: '16px', marginBottom: '6px' }}>
                  {pkg.name}
                  {!pkg.is_active && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#c00' }}>(inactive)</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#534AB7', fontWeight: '500' }}>
                    EGP {parseFloat(pkg.price_egp).toLocaleString()}
                  </span>
                  <span style={{ color: '#27500A' }}>
                    Commission: EGP {parseFloat(pkg.direct_commission_egp).toLocaleString()}
                  </span>
                  <span style={{ color: '#888' }}>BV: {pkg.bv_points}</span>
                  <span style={{ color: '#888' }}>PV: {pkg.pv_points}</span>
                </div>
                {pkg.description && (
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>{pkg.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => openEdit(pkg)}
                  style={{
                    background: '#EEEDFE20',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    color: '#EEEDFE',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Deactivate this package?')) deleteMutation.mutate(pkg.id)
                  }}
                  style={{
                    background: '#c0020220',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    color: '#f00',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            </div>
          </div>
        ))
      )}
    </AdminPanel>
  )
}

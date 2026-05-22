import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBCPaymentMethods, saveBCPaymentMethod } from '../../api/businessControl.api'
import AdminPanel from '../../components/admin/AdminPanel'

const empty = {
  method_key: '',
  name: '',
  name_ar: '',
  provider: '',
  is_active: true,
  requires_manual_approval: true,
  min_amount: 0,
}

export default function SAPaymentMethodsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['bc-payments'],
    queryFn: getBCPaymentMethods,
  })

  const saveMutation = useMutation({
    mutationFn: () => saveBCPaymentMethod(form, editingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bc-payments'] })
      setForm(empty)
      setEditingId(null)
    },
  })

  const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }

  return (
    <AdminPanel title="طرق الدفع" subtitle="payment_methods_config">
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card__body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {[
              { key: 'method_key', label: 'المفتاح' },
              { key: 'name', label: 'الاسم (EN)' },
              { key: 'name_ar', label: 'الاسم (AR)' },
              { key: 'provider', label: 'المزوّد' },
            ].map((f) => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input
                  className="admin-input"
                  value={form[f.key] || ''}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            style={{ marginTop: 12 }}
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            حفظ
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-3)' }}>جاري التحميل...</div>
      ) : (
        (data || []).map((pm) => (
          <div key={pm.id} className="admin-card" style={{ marginBottom: 8 }}>
            <div className="admin-card__body" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{pm.name_ar || pm.name}</strong>
                <span style={{ marginRight: 8, fontSize: 12, color: 'var(--text-3)' }}>
                  {pm.method_key}
                </span>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setEditingId(pm.id)
                  setForm(pm)
                }}
              >
                تعديل
              </button>
            </div>
          </div>
        ))
      )}
    </AdminPanel>
  )
}

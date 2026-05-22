import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBCPromotions, saveBCPromotion } from '../../api/businessControl.api'
import AdminPanel from '../../components/admin/AdminPanel'

const empty = {
  code: '',
  name: '',
  name_ar: '',
  promo_type: 'discount',
  discount_pct: 0,
  is_active: true,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
}

export default function SAPromotionsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)

  const { data, isLoading } = useQuery({ queryKey: ['bc-promos'], queryFn: getBCPromotions })

  const saveMutation = useMutation({
    mutationFn: () =>
      saveBCPromotion(
        {
          ...form,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
        },
        editingId
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bc-promos'] })
      setForm(empty)
      setEditingId(null)
    },
  })

  const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }

  return (
    <AdminPanel title="العروض والحملات" subtitle="promotions">
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card__body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <label style={labelStyle}>الكود</label>
              <input
                className="admin-input"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>الاسم</label>
              <input
                className="admin-input"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>النوع</label>
              <select
                className="admin-input"
                value={form.promo_type}
                onChange={(e) => setForm((p) => ({ ...p, promo_type: e.target.value }))}
              >
                <option value="discount">خصم</option>
                <option value="bv_multiplier">مضاعف BV</option>
                <option value="cash_bonus">بونص نقدي</option>
                <option value="bundle">باقة</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>يبدأ</label>
              <input
                type="datetime-local"
                className="admin-input"
                value={form.starts_at}
                onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>ينتهي</label>
              <input
                type="datetime-local"
                className="admin-input"
                value={form.ends_at}
                onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            style={{ marginTop: 12 }}
            onClick={() => saveMutation.mutate()}
          >
            حفظ العرض
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-3)' }}>جاري التحميل...</div>
      ) : (
        (data || []).map((p) => (
          <div key={p.id} className="admin-card" style={{ marginBottom: 8 }}>
            <div className="admin-card__body" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{p.name}</strong> — {p.promo_type}
                {!p.is_active && <span style={{ color: '#f66' }}> (معطّل)</span>}
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setEditingId(p.id)
                  setForm({
                    ...p,
                    starts_at: p.starts_at?.slice(0, 16),
                    ends_at: p.ends_at?.slice(0, 16),
                  })
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

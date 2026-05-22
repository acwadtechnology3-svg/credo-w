import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBCUpgradeRules,
  getBCPackages,
  saveBCUpgradeRule,
  deleteBCUpgradeRule,
} from '../../api/businessControl.api'
import AdminPanel from '../../components/admin/AdminPanel'

const emptyRule = {
  rule_type: 'direct',
  from_membership_level: 0,
  via_package_id: '',
  resulting_level: 1,
  priority: 10,
  is_active: true,
}

export default function SAUpgradeRulesPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyRule)
  const [editingId, setEditingId] = useState(null)

  const { data: rules, isLoading } = useQuery({
    queryKey: ['bc-upgrade-rules'],
    queryFn: getBCUpgradeRules,
  })
  const { data: packages } = useQuery({ queryKey: ['bc-packages'], queryFn: getBCPackages })

  const saveMutation = useMutation({
    mutationFn: () => saveBCUpgradeRule(form, editingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bc-upgrade-rules'] })
      setForm(emptyRule)
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBCUpgradeRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bc-upgrade-rules'] }),
  })

  const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }

  return (
    <AdminPanel
      title="مسارات الترقية الديناميكية"
      subtitle="package_upgrade_rules — أي مسار بدون نشر كود"
    >
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card__head">{editingId ? 'تعديل قاعدة' : 'قاعدة جديدة'}</div>
        <div className="admin-card__body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <label style={labelStyle}>النوع</label>
              <select
                className="admin-input"
                value={form.rule_type}
                onChange={(e) => setForm((p) => ({ ...p, rule_type: e.target.value }))}
              >
                <option value="direct">شراء مباشر</option>
                <option value="upgrade">ترقية</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>من مستوى</label>
              <input
                type="number"
                className="admin-input"
                value={form.from_membership_level}
                onChange={(e) =>
                  setForm((p) => ({ ...p, from_membership_level: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>الباقة</label>
              <select
                className="admin-input"
                value={form.via_package_id}
                onChange={(e) => setForm((p) => ({ ...p, via_package_id: e.target.value }))}
              >
                <option value="">— اختر —</option>
                {(packages || []).map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} (L{pkg.package_level})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>المستوى الناتج</label>
              <input
                type="number"
                className="admin-input"
                value={form.resulting_level}
                onChange={(e) => setForm((p) => ({ ...p, resulting_level: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label style={labelStyle}>الأولوية</label>
              <input
                type="number"
                className="admin-input"
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))}
              />
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            style={{ marginTop: 12 }}
            disabled={!form.via_package_id || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            حفظ القاعدة
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-3)' }}>جاري التحميل...</div>
      ) : (
        <div className="admin-card">
          <div className="admin-card__body" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {['النوع', 'من', 'الباقة', 'إلى مستوى', 'نشط', ''].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(rules || []).map((r) => (
                  <tr key={r.id}>
                    <td>{r.rule_type}</td>
                    <td>{r.from_membership_level}</td>
                    <td>{r.packages?.name || r.via_package_id?.slice(0, 8)}</td>
                    <td>{r.resulting_level}</td>
                    <td>{r.is_active ? 'نعم' : 'لا'}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() => {
                          setEditingId(r.id)
                          setForm({
                            rule_type: r.rule_type,
                            from_membership_level: r.from_membership_level,
                            via_package_id: r.via_package_id,
                            resulting_level: r.resulting_level,
                            priority: r.priority,
                            is_active: r.is_active,
                          })
                        }}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        style={{ color: '#f66' }}
                        onClick={() => {
                          if (confirm('تعطيل هذه القاعدة؟')) deleteMutation.mutate(r.id)
                        }}
                      >
                        تعطيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminPanel>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBCFeatureFlags, saveBCFeatureFlag } from '../../api/businessControl.api'
import AdminPanel from '../../components/admin/AdminPanel'

export default function SAFeatureFlagsPage() {
  const qc = useQueryClient()
  const { data: flags, isLoading } = useQuery({
    queryKey: ['bc-flags'],
    queryFn: getBCFeatureFlags,
  })

  const toggleMutation = useMutation({
    mutationFn: (flag) => saveBCFeatureFlag({ ...flag, is_enabled: !flag.is_enabled }, flag.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bc-flags'] }),
  })

  return (
    <AdminPanel
      title="مفاتيح الميزات"
      subtitle="تشغيل/إيقاف ميزات المنصة بدون نشر"
    >
      {isLoading ? (
        <div style={{ color: 'var(--text-3)' }}>جاري التحميل...</div>
      ) : (
        (flags || []).map((flag) => (
          <div key={flag.id} className="admin-card" style={{ marginBottom: 10 }}>
            <div
              className="admin-card__body"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{flag.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{flag.flag_key}</div>
                {flag.description && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>{flag.description}</div>
                )}
              </div>
              <button
                type="button"
                className={`admin-btn ${flag.is_enabled ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                disabled={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate(flag)}
              >
                {flag.is_enabled ? 'مفعّل' : 'معطّل'}
              </button>
            </div>
          </div>
        ))
      )}
    </AdminPanel>
  )
}

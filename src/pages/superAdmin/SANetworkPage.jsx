import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminFreezeNode,
  adminMovePlacement,
  adminNetworkOverview,
  adminPlacementSettings,
  adminSimulatePlacement,
} from '../../api/tree.api'

const card = {
  background: '#1a1a2e',
  border: '1px solid #2a2a3e',
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
}

export default function SANetworkPage() {
  const qc = useQueryClient()
  const [searchQ, setSearchQ] = useState('')
  const [moveForm, setMoveForm] = useState({ userId: '', newParentUserId: '', side: 'LEFT', reason: '' })
  const [simForm, setSimForm] = useState({ sponsorId: '', strategy: 'AUTO_BALANCE', manualSide: '' })
  const [strategy, setStrategy] = useState('AUTO_BALANCE')
  const [msg, setMsg] = useState('')

  const { data: overview } = useQuery({
    queryKey: ['sa-network', searchQ],
    queryFn: () => adminNetworkOverview(searchQ),
    enabled: searchQ.length >= 2,
  })

  const { data: settingsData } = useQuery({
    queryKey: ['sa-placement-settings'],
    queryFn: () => adminPlacementSettings(),
  })

  const saveSettings = useMutation({
    mutationFn: () => adminPlacementSettings({ default_strategy: strategy }),
    onSuccess: () => {
      setMsg('تم حفظ إعدادات الوضع')
      qc.invalidateQueries({ queryKey: ['sa-placement-settings'] })
    },
  })

  const moveMut = useMutation({
    mutationFn: () => adminMovePlacement(moveForm),
    onSuccess: () => {
      setMsg('تم نقل الموضع')
      qc.invalidateQueries({ queryKey: ['sa-network'] })
    },
    onError: (e) => setMsg(e?.response?.data?.error || 'فشل النقل'),
  })

  const simMut = useMutation({
    mutationFn: () => adminSimulatePlacement(simForm),
    onSuccess: (r) => setMsg(`معاينة: ${r.preview?.resolvedSide} — ${r.preview?.message}`),
  })

  const freezeMut = useMutation({
    mutationFn: (frozen) => adminFreezeNode({ userId: moveForm.userId, frozen, reason: moveForm.reason }),
    onSuccess: () => setMsg('تم تحديث حالة التجميد'),
  })

  const settings = settingsData?.settings

  return (
    <div className="sa-network-page" dir="rtl" style={{ color: '#EEEDFE' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>محرك الشبكة — Phase 7</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        تحكم كامل: نقل مواضع، تجميد عقد، محاكاة وضع، إعدادات استراتيجية
      </p>

      {msg && (
        <p style={{ padding: 10, background: '#2a2a3e', borderRadius: 8, marginBottom: 12 }}>{msg}</p>
      )}

      <div style={card}>
        <h3 style={{ marginBottom: 12 }}>إحصاء الشبكة</h3>
        <p>عقد مسجّلة: <strong>{overview?.nodeCount ?? '—'}</strong></p>
        <label style={{ fontSize: 11, color: '#888' }}>بحث عضو</label>
        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="USR / username" />
        <ul style={{ marginTop: 12, fontSize: 13 }}>
          {(overview?.searchResults || []).map((u) => (
            <li key={u.id} style={{ marginBottom: 6 }}>
              {u.full_name || u.username} — {u.user_code} — tree: {u.tree_status}
              {u.network?.is_frozen && ' [مجمد]'}
            </li>
          ))}
        </ul>
      </div>

      <div style={card}>
        <h3 style={{ marginBottom: 12 }}>استراتيجية الوضع الافتراضية</h3>
        <select
          value={strategy || settings?.default_strategy || 'AUTO_BALANCE'}
          onChange={(e) => setStrategy(e.target.value)}
        >
          <option value="AUTO_BALANCE">توازن تلقائي</option>
          <option value="WEAKER_LEG">الرجل الأضعف</option>
          <option value="STRONGER_LEG">الرجل الأقوى</option>
          <option value="LEFT">يسار دائماً</option>
          <option value="RIGHT">يمين دائماً</option>
          <option value="MANUAL_ONLY">يدوي فقط</option>
        </select>
        <button
          type="button"
          onClick={() => saveSettings.mutate()}
          style={{ marginTop: 8, padding: '8px 16px', background: '#7B6CF6', border: 'none', borderRadius: 8, color: '#fff' }}
        >
          حفظ
        </button>
      </div>

      <div style={card}>
        <h3 style={{ marginBottom: 12 }}>نقل موضع (override)</h3>
        <input placeholder="userId" value={moveForm.userId} onChange={(e) => setMoveForm({ ...moveForm, userId: e.target.value })} />
        <input
          placeholder="newParentUserId"
          value={moveForm.newParentUserId}
          onChange={(e) => setMoveForm({ ...moveForm, newParentUserId: e.target.value })}
        />
        <select value={moveForm.side} onChange={(e) => setMoveForm({ ...moveForm, side: e.target.value })}>
          <option value="LEFT">LEFT</option>
          <option value="RIGHT">RIGHT</option>
        </select>
        <input placeholder="سبب" value={moveForm.reason} onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={() => moveMut.mutate()} style={{ padding: '8px 14px', background: '#7B6CF6', border: 'none', borderRadius: 8, color: '#fff' }}>
            نقل
          </button>
          <button type="button" onClick={() => freezeMut.mutate(true)} style={{ padding: '8px 14px', background: '#c44', border: 'none', borderRadius: 8, color: '#fff' }}>
            تجميد
          </button>
          <button type="button" onClick={() => freezeMut.mutate(false)} style={{ padding: '8px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff' }}>
            إلغاء تجميد
          </button>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ marginBottom: 12 }}>محاكاة وضع</h3>
        <input placeholder="sponsorId (UUID)" value={simForm.sponsorId} onChange={(e) => setSimForm({ ...simForm, sponsorId: e.target.value })} />
        <select value={simForm.strategy} onChange={(e) => setSimForm({ ...simForm, strategy: e.target.value })}>
          <option value="AUTO_BALANCE">AUTO_BALANCE</option>
          <option value="WEAKER_LEG">WEAKER_LEG</option>
          <option value="STRONGER_LEG">STRONGER_LEG</option>
        </select>
        <button type="button" onClick={() => simMut.mutate()} style={{ marginTop: 8, padding: '8px 16px', background: '#6BE4FF', border: 'none', borderRadius: 8, color: '#0f0f1a' }}>
          محاكاة
        </button>
      </div>
    </div>
  )
}

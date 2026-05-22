import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Icon from '../ui/Icon'
import UserAvatar from '../ui/UserAvatar'
import { getTeamMember, notifyTeamMember } from '../../api/team.api'
import { useProfileAvatar } from '../../hooks/useProfileAvatar'
import { toast } from '../shared/Toast'

const STATUS_LABELS = {
  active: 'نشط',
  pending: 'قيد التفعيل',
  suspended: 'موقوف',
}

const SIDE_LABELS = {
  LEFT: 'يسار · A',
  RIGHT: 'يمين · B',
}

const PRESETS = [
  {
    id: 'activate',
    title: 'تذكير بالتفعيل',
    body: 'مرحباً! حسابك ما زال قيد التفعيل. أكمل التفعيل للاستفادة من الشبكة والعمولات.',
  },
  {
    id: 'motivate',
    title: 'تحفيز',
    body: 'أداؤك ممتاز! استمر في بناء فريقك — نحن معك في كل خطوة.',
  },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DetailRow({ label, value, icon }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '11px 14px',
        background: 'var(--surface-1)',
        fontSize: 13,
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
        {icon && <Icon name={icon} size={12} />}
        {label}
      </span>
      <span style={{ fontWeight: 600, textAlign: 'end' }}>{value}</span>
    </div>
  )
}

export default function PlacementTreeMemberPanel({ userId, branchSide, onClose }) {
  const qc = useQueryClient()
  const [showNotify, setShowNotify] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['team-member', userId],
    queryFn: () => getTeamMember(userId),
    enabled: Boolean(userId),
  })

  const notifyMutation = useMutation({
    mutationFn: (payload) => notifyTeamMember(userId, payload),
    onSuccess: () => {
      toast.success('تم إرسال الإشعار بنجاح')
      setShowNotify(false)
      setTitle('')
      setBody('')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (e) => {
      toast.error(e.response?.data?.error || 'تعذّر إرسال الإشعار')
    },
  })

  const member = data?.member
  const isSelf = data?.is_self
  const myAvatar = useProfileAvatar()
  const canNotify = data?.can_notify
  const displayName = member?.full_name || member?.username || '—'
  const initials = (displayName.trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2) || '?').toUpperCase()
  const avatarSrc = isSelf ? myAvatar || member?.profile_image : member?.profile_image
  const branchLabel =
    branchSide === 'L' ? 'يسار · A' : branchSide === 'R' ? 'يمين · B' : member?.tree_side ? SIDE_LABELS[member.tree_side] : null

  const applyPreset = (preset) => {
    setTitle(preset.title)
    setBody(preset.body)
    setShowNotify(true)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error('اكتب عنواناً ونص الرسالة')
      return
    }
    notifyMutation.mutate({ title: title.trim(), body: body.trim() })
  }

  return (
    <div
      className="card anim-scale-in"
      style={{
        position: 'absolute',
        top: 72,
        insetInlineStart: 14,
        width: 300,
        maxWidth: 'calc(100% - 28px)',
        zIndex: 12,
        padding: 0,
        overflow: 'hidden',
        maxHeight: 'calc(100% - 100px)',
        overflowY: 'auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      }}
      dir="rtl"
    >
      <div
        style={{
          padding: '16px 18px',
          background: 'linear-gradient(135deg, rgba(123,108,246,0.16), transparent)',
          position: 'relative',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-ghost"
          aria-label="إغلاق"
          style={{ position: 'absolute', top: 10, insetInlineEnd: 10, padding: 4 }}
        >
          <Icon name="x" size={14} />
        </button>

        {isLoading ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>جاري تحميل التفاصيل...</p>
        ) : isError ? (
          <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>
            {error?.response?.data?.error || 'تعذّر تحميل بيانات العضو'}
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
              <UserAvatar
                src={avatarSrc}
                initials={initials}
                size={52}
                fontSize={18}
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--line-purple)',
                  background: isSelf && !avatarSrc ? 'linear-gradient(135deg, #7B6CF6, #C4B8FF)' : undefined,
                }}
                imageStyle={{ borderRadius: 12 }}
              />
              {member?.status === 'active' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    insetInlineEnd: -2,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: 'var(--success)',
                    border: '2px solid var(--surface-1)',
                    boxShadow: '0 0 6px var(--success)',
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingInlineEnd: 24 }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>
                {member?.username}
              </div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                {member?.user_code}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {isSelf && (
                  <span className="pill info" style={{ fontSize: 9 }}>
                    أنت
                  </span>
                )}
                {member?.rank && (
                  <span className="pill warn" style={{ fontSize: 9 }}>
                    <Icon name="rank" size={9} />
                    {member.rank}
                  </span>
                )}
                {branchLabel && (
                  <span
                    className="pill"
                    style={{
                      fontSize: 9,
                      background: branchSide === 'L' ? 'var(--side-left-soft)' : 'var(--side-right-soft)',
                      color: branchSide === 'L' ? 'var(--side-left)' : 'var(--side-right)',
                    }}
                  >
                    {branchLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {member && !isLoading && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-0)', border: '1px solid var(--line)' }}>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>
                PV إجمالي
              </div>
              <div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--lavender)', marginTop: 4 }}>
                {Number(member.total_pv || 0).toLocaleString('ar-EG')}
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-0)', border: '1px solid var(--line)' }}>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>
                إحالات مباشرة
              </div>
              <div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>
                {member.direct_count ?? 0}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              background: 'var(--line)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              overflow: 'hidden',
              marginBottom: 14,
            }}
          >
            <DetailRow label="الاسم الكامل" value={member.full_name || '—'} icon="team" />
            <DetailRow label="البريد" value={member.email || '—'} />
            <DetailRow label="الهاتف" value={member.phone || '—'} />
            <DetailRow label="الدولة" value={member.country || '—'} icon="globe" />
            <DetailRow label="الحالة" value={STATUS_LABELS[member.status] || member.status} icon="circle" />
            <DetailRow label="الراعي" value={member.sponsor_username || '—'} icon="team" />
            <DetailRow label="تاريخ الانضمام" value={formatDate(member.created_at)} icon="calendar" />
            <DetailRow label="تاريخ التفعيل" value={formatDate(member.active_date)} icon="calendar" />
            {member.tree_depth != null && (
              <DetailRow label="عمق الشجرة" value={member.tree_depth} />
            )}
          </div>

          {canNotify && (
            <>
              {!showNotify ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setShowNotify(true)}
                  >
                    <Icon name="bell" size={12} />
                    إرسال إشعار
                  </button>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="btn btn-sm"
                        style={{ flex: 1, minWidth: 120, fontSize: 11 }}
                        onClick={() => applyPreset(p)}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="t-eyebrow" style={{ fontSize: 10 }}>
                    إرسال إشعار لـ {member.username}
                  </div>
                  <input
                    className="input"
                    placeholder="عنوان الإشعار"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    required
                  />
                  <textarea
                    className="input"
                    placeholder="نص الرسالة..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    maxLength={500}
                    required
                    style={{ resize: 'vertical', minHeight: 80 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                      disabled={notifyMutation.isPending}
                    >
                      <Icon name="message" size={12} />
                      {notifyMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setShowNotify(false)
                        setTitle('')
                        setBody('')
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {isSelf && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, textAlign: 'center' }}>
              هذا حسابك — يمكنك مراجعة الإعدادات من لوحة التحكم.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

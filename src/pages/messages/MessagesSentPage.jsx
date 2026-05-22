import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSentMessages, markNotificationsRead } from '../../api/notification.api'
import Icon from '../../components/ui/Icon'

function formatWhen(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessagesSentPage() {
  const [expandedId, setExpandedId] = useState(null)
  const qc = useQueryClient()

  const markReadMutation = useMutation({
    mutationFn: (ids) => markNotificationsRead(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sent-messages'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sent-messages'],
    queryFn: getSentMessages,
    refetchInterval: 30_000,
  })

  const messages = data?.messages || []
  const unreadReplies = data?.unreadRepliesTotal || 0

  return (
    <div className="page anim-fade-in" dir="rtl" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>
          رسائلي المرسلة
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
          الرسائل التي أرسلتها لفريقك — والردود الواردة عليها
        </p>
        {unreadReplies > 0 && (
          <span className="pill live" style={{ marginTop: 10, fontSize: 11 }}>
            <span className="dot" />
            {unreadReplies} رد جديد
          </span>
        )}
      </div>

      {isLoading && (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
          جاري التحميل...
        </div>
      )}

      {isError && (
        <div className="card" style={{ padding: 24, color: 'var(--danger)' }}>
          تعذّر تحميل الرسائل
        </div>
      )}

      {!isLoading && !isError && messages.length === 0 && (
        <div className="card notif-panel-empty" style={{ padding: 48 }}>
          <Icon name="message" size={32} style={{ color: 'var(--text-4)', opacity: 0.4 }} />
          <p style={{ marginTop: 12 }}>لم ترسل أي رسائل بعد</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            من شجرة الشبكة، اختر عضواً واضغط «إرسال إشعار»
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m) => {
          const open = expandedId === m.id
          const hasReplies = (m.replies || []).length > 0
          return (
            <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => {
                  const next = open ? null : m.id
                  setExpandedId(next)
                  if (!open && m.unread_replies > 0) {
                    const unreadIds = (m.replies || []).filter((r) => !r.is_read).map((r) => r.id)
                    if (unreadIds.length) markReadMutation.mutate(unreadIds)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'start',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      إلى: {m.recipient?.full_name || m.recipient?.username || '—'}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-2)',
                        margin: '8px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: open ? 'normal' : 'nowrap',
                      }}
                    >
                      {m.body}
                    </p>
                  </div>
                  <div style={{ textAlign: 'end', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{formatWhen(m.created_at)}</div>
                    {hasReplies && (
                      <span
                        className="pill"
                        style={{
                          marginTop: 6,
                          fontSize: 10,
                          background: m.unread_replies > 0 ? 'var(--electric-soft)' : 'var(--surface-1)',
                          color: m.unread_replies > 0 ? 'var(--electric)' : 'var(--text-3)',
                        }}
                      >
                        {m.reply_count} رد
                        {m.unread_replies > 0 && ` · ${m.unread_replies} جديد`}
                      </span>
                    )}
                    <Icon
                      name="arrow-down"
                      size={12}
                      style={{
                        display: 'block',
                        marginTop: 8,
                        marginInlineStart: 'auto',
                        color: 'var(--text-4)',
                        transform: open ? 'rotate(180deg)' : undefined,
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>
                </div>
              </button>

              {open && hasReplies && (
                <div
                  style={{
                    borderTop: '1px solid var(--line)',
                    padding: '12px 16px 16px',
                    background: 'var(--surface-0)',
                  }}
                >
                  <div className="t-eyebrow" style={{ fontSize: 10, marginBottom: 10 }}>
                    الردود
                  </div>
                  {(m.replies || []).map((r) => (
                    <div key={r.id} className="notif-thread-item" style={{ marginBottom: 8 }}>
                      <div className="notif-thread-meta">
                        <span style={{ color: 'var(--lavender)' }}>
                          {r.sender?.full_name || r.sender?.username || 'عضو'}
                        </span>
                        <span>{formatWhen(r.created_at)}</span>
                      </div>
                      <p className="notif-thread-body" style={{ margin: '6px 0 0' }}>
                        {r.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {open && !hasReplies && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--line)',
                    fontSize: 12,
                    color: 'var(--text-3)',
                  }}
                >
                  لا توجد ردود بعد
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotification, replyToNotification } from '../../api/notification.api'
import Icon from '../ui/Icon'
import { toast } from '../shared/Toast'

function formatWhen(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function senderName(sender) {
  if (!sender) return 'النظام'
  return sender.full_name || sender.username || 'عضو'
}

const TYPE_LABELS = {
  team_message: 'رسالة من الفريق',
  team_reply: 'رد على رسالة',
}

export default function NotificationDetailModal({ notificationId, onClose }) {
  const qc = useQueryClient()
  const [replyText, setReplyText] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notification', notificationId],
    queryFn: () => getNotification(notificationId),
    enabled: Boolean(notificationId),
  })

  const replyMutation = useMutation({
    mutationFn: (body) => replyToNotification(notificationId, body),
    onSuccess: () => {
      toast.success('تم إرسال الرد')
      setReplyText('')
      qc.invalidateQueries({ queryKey: ['notification', notificationId] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['sent-messages'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'تعذّر إرسال الرد'),
  })

  const notification = data?.notification
  const thread = data?.thread || []
  const canReply = data?.canReply

  const handleReply = (e) => {
    e.preventDefault()
    if (!replyText.trim()) {
      toast.error('اكتب نص الرد')
      return
    }
    replyMutation.mutate(replyText.trim())
  }

  return (
    <div className="notif-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="notif-modal card anim-scale-in"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="notif-modal-title"
      >
        <div className="notif-modal-header">
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="إغلاق">
            <Icon name="x" size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>
              {TYPE_LABELS[notification?.type] || 'إشعار'}
            </div>
            <h3 id="notif-modal-title" className="font-display" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              {isLoading ? 'جاري التحميل...' : notification?.title || '—'}
            </h3>
            {notification?.sender && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                من: <span style={{ color: 'var(--lavender)' }}>{senderName(notification.sender)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="notif-modal-body">
          {isError && (
            <p style={{ color: 'var(--danger)', fontSize: 13 }}>تعذّر تحميل الرسالة</p>
          )}

          {!isError && thread.length > 0 && (
            <div className="notif-thread">
              {thread.map((msg) => (
                <div
                  key={msg.id}
                  className={`notif-thread-item ${msg.id === notificationId ? 'notif-thread-item--active' : ''}`}
                >
                  <div className="notif-thread-meta">
                    <span>{senderName(msg.sender)}</span>
                    <span>{formatWhen(msg.created_at)}</span>
                  </div>
                  {msg.title && msg.id === thread[0]?.id && (
                    <div className="notif-thread-title">{msg.title}</div>
                  )}
                  <p className="notif-thread-body">{msg.body}</p>
                </div>
              ))}
            </div>
          )}

          {canReply && (
            <form onSubmit={handleReply} className="notif-reply-form">
              <label className="t-eyebrow" style={{ fontSize: 10, display: 'block', marginBottom: 8 }}>
                رد إلى {senderName(notification?.sender)}
              </label>
              <textarea
                className="input"
                placeholder="اكتب ردك هنا..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                maxLength={500}
                style={{ resize: 'vertical', minHeight: 72 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={replyMutation.isPending}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Icon name="message" size={14} />
                  {replyMutation.isPending ? 'جاري الإرسال...' : 'إرسال الرد'}
                </button>
                <button type="button" className="btn" onClick={onClose}>
                  إغلاق
                </button>
              </div>
            </form>
          )}

          {!canReply && !isLoading && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, textAlign: 'center' }}>
              هذا الإشعار للعرض فقط — لا يمكن الرد عليه.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

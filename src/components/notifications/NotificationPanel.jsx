import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'

function formatWhen(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `منذ ${diffMins} د`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `منذ ${diffHours} س`
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
}

function senderLabel(n) {
  if (n.type === 'team_reply' && n.sender) {
    return `رد من ${n.sender.full_name || n.sender.username}`
  }
  if (n.type === 'team_message' && n.sender) {
    return n.sender.full_name || n.sender.username
  }
  return null
}

const TYPE_ICONS = {
  team_message: 'message',
  team_reply: 'message',
  commission: 'trend-up',
  wallet: 'wallet',
  rank: 'rank',
  order: 'shop',
}

export default function NotificationPanel({
  notifications,
  unread,
  onMarkAllRead,
  onSelect,
  onClose,
}) {
  const navigate = useNavigate()
  const canReply = (n) => ['team_message', 'team_reply'].includes(n.type) && n.sender_id

  return (
    <div className="notif-panel" dir="rtl">
      <div className="notif-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="bell" size={14} style={{ color: 'var(--lavender)' }} />
          <span className="font-display" style={{ fontWeight: 700, fontSize: 14 }}>
            الإشعارات
          </span>
          {unread > 0 && (
            <span className="pill info" style={{ fontSize: 10, padding: '2px 8px' }}>
              {unread} جديد
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {unread > 0 && (
            <button type="button" className="notif-panel-link" onClick={onMarkAllRead}>
              قراءة الكل
            </button>
          )}
          <button
            type="button"
            className="notif-panel-link"
            onClick={() => {
              onClose?.()
              navigate('/messages/sent')
            }}
          >
            رسائلي
          </button>
        </div>
      </div>

      <div className="notif-panel-list">
        {notifications.length === 0 ? (
          <div className="notif-panel-empty">
            <Icon name="bell" size={28} style={{ color: 'var(--text-4)', opacity: 0.5 }} />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          notifications.map((n) => {
            const from = senderLabel(n)
            const icon = TYPE_ICONS[n.type] || 'bell'
            return (
              <button
                key={n.id}
                type="button"
                className={`notif-item ${!n.is_read ? 'notif-item--unread' : ''}`}
                onClick={() => onSelect(n)}
              >
                <div className={`notif-item-icon ${canReply(n) ? 'notif-item-icon--message' : ''}`}>
                  <Icon name={icon} size={14} />
                </div>
                <div className="notif-item-content">
                  <div className="notif-item-top">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-time">{formatWhen(n.created_at)}</span>
                  </div>
                  {from && <div className="notif-item-from">{from}</div>}
                  <p className="notif-item-body">{n.body}</p>
                  {canReply(n) && (
                    <span className="notif-item-action">
                      <Icon name="message" size={10} />
                      اضغط للرد
                    </span>
                  )}
                </div>
                {!n.is_read && <span className="notif-item-dot" aria-hidden="true" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

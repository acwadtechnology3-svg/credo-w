import Icon from '../../components/ui/Icon'
import { getCategoryById } from '../constants'

export default function SupportQuickMessages({ categoryId, onPick, disabled }) {
  const cat = getCategoryById(categoryId)
  if (!cat?.starterMessages?.length) return null

  return (
    <div className="support-quick-messages" role="group" aria-label="رسائل جاهزة">
      <div className="support-quick-messages-head">
        <span className="support-quick-messages-badge" style={{ '--cat-color': cat.color }}>
          <Icon name="message" size={14} />
        </span>
        <div>
          <div className="support-quick-messages-title">رسائل جاهزة — {cat.label}</div>
          <div className="support-quick-messages-sub">اضغط لملء الرسالة، يمكنك التعديل قبل الإرسال</div>
        </div>
      </div>
      <div className="support-quick-messages-chips">
        {cat.starterMessages.map((msg) => (
          <button
            key={msg}
            type="button"
            disabled={disabled}
            className="support-quick-chip"
            style={{ '--cat-color': cat.color }}
            onClick={() => onPick(msg)}
          >
            <Icon name="sparkles" size={12} className="support-quick-chip-icon" />
            <span>{msg}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

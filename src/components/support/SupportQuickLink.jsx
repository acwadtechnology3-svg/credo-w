import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'

export default function SupportQuickLink({ category, label = 'تحتاج مساعدة؟ تواصل مع الدعم' }) {
  const to = category ? `/support?category=${category}` : '/support'
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        padding: '8px 14px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 600,
        color: '#c4b8ff',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        background: 'rgba(99, 102, 241, 0.12)',
        textDecoration: 'none',
      }}
    >
      <Icon name="support" size={16} />
      {label}
    </Link>
  )
}

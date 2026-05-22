const KINDS = {
  ok: { color: 'var(--success)', bg: 'var(--success-soft)', border: 'var(--success-edge)' },
  warn: { color: 'var(--warn)', bg: 'var(--warn-soft)', border: 'var(--warn-edge)' },
  bad: { color: 'var(--danger)', bg: 'var(--danger-soft)', border: 'var(--danger-edge)' },
  info: { color: 'var(--lavender)', bg: 'var(--info-soft)', border: 'var(--info-edge)' },
}

export default function StatusPill({ kind = 'info', label, children }) {
  const s = KINDS[kind] || KINDS.info
  return (
    <span
      className="pill"
      style={{
        fontSize: 10,
        padding: '2px 8px',
        color: s.color,
        background: s.bg,
        borderColor: s.border,
      }}
    >
      {children || label}
    </span>
  )
}

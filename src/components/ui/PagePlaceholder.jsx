import { GlowBg } from './GlowBg'

export default function PagePlaceholder({ title, subtitle = 'Coming in next phase' }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <GlowBg />
      <div className="page-enter" style={{ position: 'relative' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, marginBottom: 8 }}>
          {title}
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{subtitle}</p>
      </div>
    </div>
  )
}

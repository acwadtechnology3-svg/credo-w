import Icon from '../ui/Icon'
import Logo from '../ui/Logo'
import AnimatedCounter from '../ui/AnimatedCounter'

export default function WalletCard({
  type,
  active,
  onClick,
  balance,
  label,
  subtitle,
  currency,
  gradient,
  accentColor,
  onAction,
  actionLabel,
  actionIcon,
  stats,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`wallet-card ${active ? 'is-active' : ''}`}
      style={{
        background: gradient,
        border: active ? `1px solid ${accentColor}66` : '1px solid rgba(255,255,255,0.08)',
        boxShadow: active
          ? `0 0 0 1px ${accentColor}55, 0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${accentColor}33`
          : '0 12px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.18 }} />
      <div
        style={{
          position: 'absolute',
          insetInlineEnd: -60,
          top: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}40, transparent 65%)`,
          filter: 'blur(36px)',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 700,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="lock" size={11} />
            {subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {active && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: accentColor,
                boxShadow: `0 0 12px ${accentColor}`,
              }}
            />
          )}
          <Logo size="sm" />
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>الرصيد المتاح</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            className="font-num"
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.03em',
              textShadow: `0 0 32px ${accentColor}88`,
              lineHeight: 1,
            }}
          >
            <AnimatedCounter value={balance} />
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: accentColor }}>{currency}</span>
        </div>
        {type === 'cmoney' && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            ≈ {Number(balance).toLocaleString('en-US')} ج.م
          </div>
        )}
      </div>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 18, fontSize: 10 }}>
          {stats.map(([title, val, unit]) => (
            <div key={title}>
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>{title}</div>
              <div
                className="font-num"
                style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginTop: 2 }}
              >
                {val}{' '}
                <span style={{ fontSize: 9, opacity: 0.6 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction?.()
          }}
          className="btn btn-sm"
          style={
            type === 'cmoney'
              ? { background: '#fff', color: '#0A0A0A', border: 0, fontWeight: 700 }
              : {
                  background: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.20)',
                }
          }
        >
          <Icon name={actionIcon} size={12} />
          {actionLabel}
        </button>
      </div>

      {type === 'cmoney' && (
        <div className="wallet-card-chip">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <span key={i} />
          ))}
        </div>
      )}
    </div>
  )
}

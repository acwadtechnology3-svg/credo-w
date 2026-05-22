import { isDemoMode } from '../../config/demoMode'

export default function DemoModeBanner() {
  if (!isDemoMode) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: 'rgba(15,12,35,0.88)',
        color: '#c4b5fd',
        border: '1px solid rgba(123,108,246,0.45)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        pointerEvents: 'none',
      }}
    >
      Demo build · بيانات تجريبية
    </div>
  )
}

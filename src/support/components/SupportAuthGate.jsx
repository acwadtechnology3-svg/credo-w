import { Link } from 'react-router-dom'

export default function SupportAuthGate() {
  return (
    <div className="support-auth-gate">
      <div className="support-particles" aria-hidden>
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="support-particle"
            style={{
              left: `${(i * 17) % 100}%`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        سجل دخولك أولاً للتواصل مع الإدارة
      </h3>
      <p style={{ color: '#a78bfa', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
        مركز الدعم متاح للأعضاء المسجّلين. يمكنك معاينة الواجهة، وإرسال الرسائل بعد تسجيل الدخول.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to="/login?redirect=/support"
          className="support-send-btn"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          تسجيل الدخول
        </Link>
        <Link
          to="/register"
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid rgba(139,92,246,0.5)',
            color: '#c4b8ff',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          إنشاء حساب
        </Link>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  {
    title: 'من نحن',
    links: [
      { label: 'المنظومة', to: '/ecosystem' },
      { label: 'حول كريدو', to: '/about' },
      { label: 'Credo AI', to: '/ai' },
    ],
  },
  {
    title: 'رحلة كريدو',
    links: [
      { label: 'ابدأ الآن', to: '/start' },
      { label: 'الباقات', to: '/packages' },
      { label: 'الوكالات', to: '/agencies' },
      { label: 'المكافآت', to: '/rewards' },
    ],
  },
  {
    title: 'الدعم',
    links: [
      { label: 'الأسئلة', to: '/faq' },
      { label: 'مركز المساعدة', to: '/support' },
      { label: 'الأكاديمية', to: '/academy' },
    ],
  },
]

export default function LandingFooter() {
  return (
    <footer className="ld-footer">
      <div className="ld-container ld-footer-grid">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 800,
              fontSize: 18,
              fontFamily: 'var(--ld-font-display)',
              marginBottom: 16,
            }}
          >
            <span className="ld-gradient-text" style={{ fontSize: 24 }}>
              W
            </span>
            Credo W
          </div>
          <p style={{ fontSize: 14, color: 'var(--ld-text-muted)', lineHeight: 1.7, maxWidth: 280 }}>
            منصة تنظيم رقمي للقيادة والتوسع — Beyond Expectations.
          </p>
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--ld-text-dim)' }}>
            القاهرة، مصر
            <br />
            support@credow.com
          </p>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.title}>
            <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ld-purple)', marginBottom: 16 }}>
              {col.title}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link to={link.to} style={{ color: 'var(--ld-text-muted)', fontSize: 14, textDecoration: 'none' }}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} style={{ color: 'var(--ld-text-muted)', fontSize: 14, textDecoration: 'none' }}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="ld-container"
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid var(--ld-border)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12,
          color: 'var(--ld-text-dim)',
        }}
      >
        <span>© {new Date().getFullYear()} Credo W. جميع الحقوق محفوظة.</span>
        <span>3D Purple · Dark Luxury · EN / عربي</span>
      </div>
    </footer>
  )
}

import Logo from '../../../components/ui/Logo'
import Icon from '../../../components/ui/Icon'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '56px 32px 32px', background: 'var(--bg-page-2)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div
          className="landing-footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(4, 1fr)',
            gap: 40,
            marginBottom: 40,
          }}
        >
          <div>
            <Logo to="/" size="md" />
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 16, lineHeight: 1.6, maxWidth: 280 }}>
              البنية التحتية المالية للشبكات الذكية. صُنع بدقّة. مبنيّ على الثقة.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {['globe', 'message', 'link'].map((ic) => (
                <a
                  key={ic}
                  href="#"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--surface-1)',
                    border: '1px solid var(--line)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--text-3)',
                    transition: 'color 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--lavender)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-3)'
                  }}
                >
                  <Icon name={ic} size={13} />
                </a>
              ))}
            </div>
          </div>
          {[
            { t: 'المنصة', l: ['نظرة عامة', 'الشجرة الثنائية', 'C Money', 'العمولات', 'المتجر'] },
            { t: 'المطوّرون', l: ['Docs', 'API Reference', 'Webhooks', 'SDKs', 'Status'] },
            { t: 'الشركة', l: ['من نحن', 'وظائف', 'الأخبار', 'الشركاء', 'الأمان'] },
            { t: 'قانوني', l: ['الشروط', 'الخصوصية', 'الكوكيز', 'GDPR', 'الامتثال'] },
          ].map((g) => (
            <div key={g.t}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 14,
                }}
              >
                {g.t}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {g.l.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{
                        color: 'var(--text-3)',
                        textDecoration: 'none',
                        fontSize: 13,
                        transition: 'color 150ms',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--text-1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-3)'
                      }}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>© 2026 Credo W Technologies, Inc. جميع الحقوق محفوظة.</div>
          <div style={{ display: 'flex', gap: 18, fontSize: 11, color: 'var(--text-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--success)',
                  boxShadow: '0 0 6px var(--success)',
                }}
              />
              كل الأنظمة تعمل
            </span>
            <span>v1.0.42</span>
            <span>API · 99.99%</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

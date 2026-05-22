import Icon from '../../../components/ui/Icon'

export default function HowItWorks() {
  return (
    <>
      <section id="how-it-works" style={{ padding: '60px 32px', position: 'relative' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: 48,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <span className="pill" style={{ marginBottom: 14 }}>
                كيف يشتغل النظام
              </span>
              <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', maxWidth: 700 }}>
                كل المكوّنات التي تحتاجها <span className="gradient-text">في مكان واحد</span>
              </h2>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 400, lineHeight: 1.6 }}>
              بدلاً من تجميع أدوات متفرّقة، Credo W يدمج محرّك العمولات، المحفظة، التجارة الإلكترونية، والأكاديمية في
              منصة موحّدة.
            </p>
          </div>

          <div
            className="landing-platform-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}
          >
            <div
              className="card-elevated"
              style={{
                gridColumn: 'span 4',
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                minHeight: 380,
              }}
            >
              <div
                className="glow-blob"
                style={{
                  width: 400,
                  height: 400,
                  background: 'radial-gradient(circle, rgba(123,108,246,0.20), transparent)',
                  insetInlineEnd: '-100px',
                  top: '50%',
                  filter: 'blur(50px)',
                }}
              />
              <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.2 }} />
              <div
                style={{
                  position: 'relative',
                  padding: 32,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 32,
                  alignItems: 'center',
                  height: '100%',
                  minHeight: 380,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 10px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--info-soft)',
                      border: '1px solid var(--info-edge)',
                      fontSize: 10,
                      color: 'var(--lavender)',
                      fontWeight: 700,
                      marginBottom: 16,
                    }}
                  >
                    <Icon name="tree" size={10} />
                    BINARY ENGINE
                  </div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.15 }}>
                    محرّك الشجرة الثنائية، الأسرع في السوق
                  </h3>
                  <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 20 }}>
                    وضع تلقائي للأعضاء الجدد، حسابات BV لكل ancestor خلال 50ms، spillover ذكي، ومعالجة آلاف المسوّقين في
                    أقل من 30 ثانية.
                  </p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, flexWrap: 'wrap' }}>
                    {[
                      ['50ms', 'Placement latency'],
                      ['30s', 'Full commission run'],
                      ['100%', 'Race-condition safe'],
                    ].map(([n, l]) => (
                      <div key={n}>
                        <div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--lavender)' }}>
                          {n}
                        </div>
                        <div style={{ color: 'var(--text-3)', marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <MiniTreeMock />
                </div>
              </div>
            </div>

            <div
              className="card-elevated"
              style={{
                gridColumn: 'span 2',
                padding: 26,
                position: 'relative',
                overflow: 'hidden',
                minHeight: 380,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                className="glow-blob"
                style={{
                  width: 280,
                  height: 280,
                  background: 'radial-gradient(circle, rgba(196,184,255,0.16), transparent)',
                  insetInlineStart: '-60px',
                  top: '40%',
                  filter: 'blur(40px)',
                }}
              />
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 10px',
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--info-soft)',
                    border: '1px solid var(--info-edge)',
                    fontSize: 10,
                    color: 'var(--lavender)',
                    fontWeight: 700,
                    marginBottom: 16,
                  }}
                >
                  <Icon name="wallet" size={10} />
                  C MONEY
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.2 }}>
                  محفظة داخلية بـ PIN argon2id
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  تحويلات فورية بين المسوّقين، محمية بـ PIN 6 أرقام، rate-limited على مستوى الـ user والـ IP.
                </p>
              </div>
              <div
                style={{
                  marginTop: 'auto',
                  padding: 18,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #1A1A2E 0%, #2D1F5C 50%, #7B6CF6 130%)',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(196,184,255,0.20)',
                }}
              >
                <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.2 }} />
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                    }}
                  >
                    C Money
                  </div>
                  <div
                    className="font-num"
                    style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 8, letterSpacing: '-0.025em' }}
                  >
                    2,450 <span style={{ fontSize: 13, color: '#C4B8FF' }}>C</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
                    USR-102458
                  </div>
                </div>
              </div>
            </div>

            {[
              {
                span: 2,
                badge: 'COMMISSION ENGINE',
                badgeStyle: { background: 'rgba(43,217,160,0.12)', border: '1px solid var(--success-edge)', color: 'var(--success)' },
                icon: 'cycle',
                title: 'محرّك العمولات الأسبوعي',
                desc: 'BV fan-out، carry rollover، weekly caps، idempotency على مستوى الـ cycle.',
                lines: ['✓ Atomic per-user transactions', '✓ Redis-locked cycles (no double-run)', '✓ Audit log per credit'],
              },
              {
                span: 2,
                badge: 'COMMERCE',
                badgeStyle: { background: 'rgba(107,228,255,0.12)', border: '1px solid rgba(107,228,255,0.32)', color: 'var(--electric)' },
                icon: 'shop',
                title: 'متجر ذكي بـ BV',
                desc: 'كل مشترى من المتجر يحسب BV تلقائياً لكل ancestors في الشجرة.',
                lines: ['✓ Voucher generation API', '✓ Multi-currency support', '✓ Tax-aware checkout'],
              },
              {
                span: 2,
                badge: 'OPS COCKPIT',
                badgeStyle: { background: 'rgba(255,178,63,0.12)', border: '1px solid var(--warning-edge)', color: 'var(--warning)' },
                icon: 'cpu',
                title: 'غرفة عمليات متكاملة',
                desc: 'مراقبة مباشرة، تشغيل دورات يدوي، Audit log كامل، صلاحيات دقيقة.',
                lines: ['✓ Real-time WebSocket events', '✓ Role-based permissions', '✓ Manual override + Audit'],
              },
            ].map((card) => (
              <div
                key={card.title}
                className="card"
                style={{ gridColumn: `span ${card.span}`, padding: 26, position: 'relative', minHeight: 260 }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 10px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 10,
                    fontWeight: 700,
                    marginBottom: 16,
                    ...card.badgeStyle,
                  }}
                >
                  <Icon name={card.icon} size={10} />
                  {card.badge}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>{card.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                  {card.lines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 32px', position: 'relative', borderTop: '1px solid var(--line)' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 60,
            alignItems: 'center',
          }}
        >
          <div>
            <span className="pill" style={{ marginBottom: 14 }}>
              <Icon name="cpu" size={11} />
              للمطوّرين
            </span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 18, lineHeight: 1.1 }}>
              API نظيف.
              <br />
              <span className="gradient-text">Webhooks موثوقة.</span>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 28 }}>
              ادمج Credo W مع نظامك الحالي. شغّل تسجيلات، اقرأ BV، استقبل أحداث العمولات في الوقت الفعلي.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                { ic: 'database', t: 'RESTful + GraphQL', d: 'كلا الواجهتين متاحتان · OpenAPI 3.1' },
                { ic: 'wifi', t: 'WebSocket Live Events', d: 'Socket.io · رومز لكل user' },
                { ic: 'shield', t: 'JWT + Refresh Token', d: 'مدّة 15 دقيقة · تدوير آمن' },
              ].map((f) => (
                <div key={f.t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--info-soft)',
                      color: 'var(--lavender)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--line-purple)',
                    }}
                  >
                    <Icon name={f.ic} size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn">
              استكشف الـ Docs
              <Icon name="arrow-left" size={12} />
            </button>
          </div>

          <div className="card-elevated" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            <div
              className="glow-blob"
              style={{
                width: 320,
                height: 320,
                background: 'radial-gradient(circle, rgba(123,108,246,0.16), transparent)',
                insetInlineEnd: '-80px',
                top: '-80px',
                filter: 'blur(50px)',
              }}
            />
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--surface-0)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#FF5C7A' }} />
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#FFB23F' }} />
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#2BD9A0' }} />
              </div>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                example.ts · POST /api/v1/orders
              </span>
              <button type="button" className="btn btn-sm btn-ghost" style={{ padding: 4 }}>
                <Icon name="copy" size={12} />
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: 22,
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                color: 'var(--text-2)',
                lineHeight: 1.7,
                overflowX: 'auto',
                position: 'relative',
              }}
            >
              <code>
                <span style={{ color: 'var(--text-3)' }}>{'// Create an order — BV fan-out is automatic'}</span>
                {'\n'}
                <span style={{ color: 'var(--lavender)' }}>const</span> order ={' '}
                <span style={{ color: 'var(--lavender)' }}>await</span> credow.
                <span style={{ color: 'var(--electric)' }}>orders</span>.create({'{'}
                {'\n'}
                {'  '}userId: <span style={{ color: 'var(--warning)' }}>"USR-102458"</span>,{'\n'}
                {'  '}items: [{'{'} productId: <span style={{ color: 'var(--warning)' }}>"PRD-001"</span>, qty:{' '}
                <span style={{ color: 'var(--success)' }}>1</span> {'}'}],{'\n'}
                {'  '}payment: {'{'} method: <span style={{ color: 'var(--warning)' }}>"cmoney"</span>, pin:{' '}
                <span style={{ color: 'var(--warning)' }}>"******"</span> {'}'},{'\n'}
                {'}'}
                );{'\n\n'}
                <span style={{ color: 'var(--text-3)' }}>{'// Fan-out triggers automatically'}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>
    </>
  )
}

function MiniTreeMock() {
  return (
    <svg viewBox="0 0 360 220" width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="mtA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#C4B8FF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#C4B8FF" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="mtB" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6BE4FF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#6BE4FF" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="mtRoot" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#7B6CF6" />
          <stop offset="100%" stopColor="#C4B8FF" />
        </linearGradient>
      </defs>
      <path d="M180,35 C180,70 100,70 100,110" stroke="url(#mtA)" strokeWidth="1.5" fill="none" />
      <path d="M180,35 C180,70 260,70 260,110" stroke="url(#mtB)" strokeWidth="1.5" fill="none" />
      <path d="M100,110 C100,150 60,150 60,180" stroke="url(#mtA)" strokeWidth="1.2" fill="none" />
      <path d="M100,110 C100,150 140,150 140,180" stroke="url(#mtA)" strokeWidth="1.2" fill="none" />
      <path d="M260,110 C260,150 220,150 220,180" stroke="url(#mtB)" strokeWidth="1.2" fill="none" />
      <path d="M260,110 C260,150 300,150 300,180" stroke="url(#mtB)" strokeWidth="1.2" fill="none" />
      <circle r="2.5" fill="#C4B8FF">
        <animateMotion path="M180,35 C180,70 100,70 100,110" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle r="2.5" fill="#6BE4FF">
        <animateMotion path="M180,35 C180,70 260,70 260,110" dur="2.4s" repeatCount="indefinite" begin="0.5s" />
      </circle>
      <circle cx="180" cy="35" r="26" fill="url(#mtRoot)" style={{ filter: 'drop-shadow(0 0 14px rgba(123,108,246,0.6))' }} />
      <text x="180" y="40" textAnchor="middle" fill="#0A0A0A" fontSize="12" fontWeight="800" fontFamily="Inter">
        W
      </text>
      {[
        [100, 110, 'A', '#C4B8FF'],
        [260, 110, 'B', '#6BE4FF'],
      ].map(([x, y, l, c]) => (
        <g key={l}>
          <rect x={x - 18} y={y - 14} width="36" height="28" rx="8" fill="var(--surface-2)" stroke={c} strokeWidth="1.2" />
          <text x={x} y={y + 4} textAnchor="middle" fill={c} fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">
            {l}
          </text>
        </g>
      ))}
    </svg>
  )
}

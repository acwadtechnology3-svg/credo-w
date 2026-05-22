import { Link } from 'react-router-dom'
import Icon from '../../../components/ui/Icon'
import AnimatedCounter from '../../../components/ui/AnimatedCounter'
import Sparkline from '../../../components/ui/Sparkline'
import { useAuthStore } from '../../../store/authStore'

export default function HeroSection() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 72 }}>
      <div
        className="glow-blob"
        style={{
          width: 900,
          height: 900,
          background: 'radial-gradient(circle, rgba(123,108,246,0.22), transparent 65%)',
          top: '-300px',
          insetInlineStart: '50%',
          transform: 'translateX(-50%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="dot-grid-dense"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.4,
          maskImage: 'radial-gradient(900px 700px at 50% 0%, #000 30%, transparent 75%)',
        }}
      />

      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '88px 32px 60px',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <a
          href="#packages"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 6px 6px 14px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--surface-1)',
            border: '1px solid var(--line-strong)',
            fontSize: 12,
            color: 'var(--text-2)',
            textDecoration: 'none',
            marginBottom: 36,
            transition: 'border-color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--line-purple)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line-strong)'
          }}
        >
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--info-soft)',
              color: 'var(--lavender)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            جديد
          </span>
          <span>انضم لمنصة Credo W وابدأ رحلتك في التسويق الشبكي الاحترافي</span>
          <Icon name="arrow-left" size={12} style={{ color: 'var(--text-3)' }} />
        </a>

        <h1
          style={{
            fontSize: 'clamp(40px, 8vw, 88px)',
            lineHeight: 1.0,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: 24,
            maxWidth: 1100,
            margin: '0 auto 24px',
          }}
        >
          البنية التحتية المالية
          <br />
          <span className="gradient-text">للشبكات الذكية.</span>
        </h1>
        <p
          style={{
            fontSize: 19,
            color: 'var(--text-2)',
            maxWidth: 680,
            margin: '0 auto 40px',
            lineHeight: 1.55,
          }}
        >
          منصة موحّدة للتسويق الشبكي الثنائي. محرّك عمولات يدير ملايين العمليات، محفظة{' '}
          <span className="font-mono" style={{ color: 'var(--lavender)' }}>
            C&nbsp;Money
          </span>{' '}
          داخلية، ولوحة تحكم بمستوى مؤسسات Fortune 500.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 56, flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-xl">
              لوحة التحكم
              <Icon name="arrow-left" size={14} />
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-xl">
              بدء التجربة مجاناً
              <Icon name="arrow-left" size={14} />
            </Link>
          )}
          <button
            type="button"
            className="btn btn-xl"
            onClick={() =>
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            <Icon name="play" size={13} />
            عرض توضيحي · 2 دقيقة
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            fontSize: 11,
            color: 'var(--text-3)',
            marginBottom: 56,
            flexWrap: 'wrap',
          }}
        >
          {[
            ['shield', 'PCI DSS Level 1'],
            ['cpu', 'SOC 2 Type II'],
            ['lock', 'ISO 27001'],
            ['globe', 'GDPR Compliant'],
            ['check-circle', '99.99% Uptime SLA'],
          ].map((b) => (
            <span key={b[1]} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name={b[0]} size={11} style={{ color: 'var(--text-2)' }} />
              {b[1]}
            </span>
          ))}
        </div>

        <HeroDashboardMock />
      </div>
    </section>
  )
}

function HeroDashboardMock() {
  return (
    <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', marginTop: 36 }}>
      <div
        className="card-elevated"
        style={{
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 60px 120px rgba(0,0,0,0.55), 0 0 0 1px var(--line-purple)',
          borderRadius: 16,
        }}
      >
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'var(--bg-page-2)',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 6, background: '#FF5C7A' }} />
            <span style={{ width: 11, height: 11, borderRadius: 6, background: '#FFB23F' }} />
            <span style={{ width: 11, height: 11, borderRadius: 6, background: '#2BD9A0' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div
              className="font-mono"
              style={{
                padding: '5px 14px',
                borderRadius: 8,
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                fontSize: 11,
                color: 'var(--text-3)',
              }}
            >
              <Icon name="lock" size={10} style={{ display: 'inline', marginInlineEnd: 6, verticalAlign: '-1px' }} />
              app.credow.com/dashboard
            </div>
          </div>
          <span className="pill live">
            <span className="dot" />
            LIVE
          </span>
        </div>

        <div
          style={{
            padding: 22,
            background: 'var(--bg-page)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          <div className="card-elevated" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
            <div style={{ position: 'relative' }}>
              <div className="t-eyebrow" style={{ color: 'var(--lavender)' }}>
                التوازن الثنائي · BV
              </div>
              <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 2, marginBottom: 18 }}>
                دورة 18 — نشطة
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid var(--side-left-soft)',
                    background: 'rgba(196,184,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: 'var(--side-left)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    A · يمين
                  </div>
                  <div
                    className="font-num metric-glow"
                    style={{ fontSize: 32, fontWeight: 800, color: 'var(--side-left)', lineHeight: 1, marginTop: 6 }}
                  >
                    210 <span style={{ fontSize: 11, color: 'var(--text-3)' }}>CV</span>
                  </div>
                </div>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid rgba(107,228,255,0.32)',
                    background: 'rgba(107,228,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: 'var(--side-right)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    B · يسار
                  </div>
                  <div
                    className="font-num metric-glow"
                    style={{ fontSize: 32, fontWeight: 800, color: 'var(--side-right)', lineHeight: 1, marginTop: 6 }}
                  >
                    240 <span style={{ fontSize: 11, color: 'var(--text-3)' }}>CV</span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'linear-gradient(90deg, rgba(43,217,160,0.12), rgba(43,217,160,0.02))',
                  border: '1px solid var(--success-edge)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>عمولة الدورة (مقدّرة)</span>
                <span className="font-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>
                  + 6,000 <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>ج.م</span>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                t: 'C Money',
                v: '2,450',
                s: 'C',
                c: 'var(--lavender)',
                spark: [2100, 2200, 2150, 2300, 2280, 2380, 2450],
                icon: 'wallet',
              },
              { t: 'الفريق النشط', v: '64', s: '', c: 'var(--success)', spark: [42, 48, 52, 55, 58, 62, 64], icon: 'team' },
              { t: 'الرتبة', v: 'Silver', s: '· 85% Gold', c: 'var(--warning)', icon: 'rank' },
            ].map((m) => (
              <div key={m.t} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: `${m.c}18`,
                    color: m.c,
                    display: 'grid',
                    placeItems: 'center',
                    border: `1px solid ${m.c}30`,
                    flexShrink: 0,
                  }}
                >
                  <Icon name={m.icon} size={13} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="t-eyebrow" style={{ fontSize: 9 }}>
                    {m.t}
                  </div>
                  <div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: m.c, marginTop: 2 }}>
                    {m.v} <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{m.s}</span>
                  </div>
                </div>
                {m.spark && <Sparkline data={m.spark} width={50} height={20} color={m.c} glow />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="card-elevated landing-hero-float-card"
        style={{
          position: 'absolute',
          insetInlineStart: -40,
          top: '40%',
          padding: 12,
          width: 240,
          transform: 'rotate(-3deg)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          zIndex: 3,
          borderColor: 'var(--success-edge)',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--success-soft)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--success)',
              flexShrink: 0,
            }}
          >
            <Icon name="check" size={14} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>عمولة جديدة</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
              + <span className="font-mono" style={{ color: 'var(--success)' }}>400 ج.م</span> · من USR-9821
            </div>
          </div>
        </div>
      </div>

      <div
        className="landing-hero-float-wallet"
        style={{
          position: 'absolute',
          insetInlineEnd: -36,
          bottom: '8%',
          padding: 14,
          width: 200,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #1A1A2E, #2D1F5C 70%, #7B6CF6)',
          transform: 'rotate(3.5deg)',
          boxShadow: '0 30px 64px rgba(123,108,246,0.4)',
          zIndex: 1,
          border: '1px solid rgba(196,184,255,0.22)',
        }}
      >
        <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.18, borderRadius: 14, overflow: 'hidden' }} />
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
            style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 6, letterSpacing: '-0.02em' }}
          >
            2,450 <span style={{ fontSize: 11, color: '#C4B8FF' }}>C</span>
          </div>
          <div className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
            USR-102458
          </div>
        </div>
      </div>
    </div>
  )
}

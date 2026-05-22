/* global React */

/* ============================================================
   PREMIUM LOGIN — Cinematic split with animated tree
   ============================================================ */
const LoginPage = ({ onGoto }) => {
  const [tab, setTab] = useState('franchise');
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-page)' }}>
      {/* Visual side */}
      <div style={{ position: 'relative', overflow: 'hidden', borderInlineEnd: '1px solid var(--line)' }}>
        <div className="glow-blob" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(123,108,246,0.30), transparent 65%)', top: '20%', insetInlineStart: '20%', filter: 'blur(60px)' }}/>
        <div className="glow-blob" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(107,228,255,0.16), transparent 65%)', bottom: '15%', insetInlineEnd: '10%', filter: 'blur(50px)', animationDelay: '-7s' }}/>
        <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}/>

        <div style={{ position: 'absolute', top: 32, insetInlineStart: 32, zIndex: 2 }}>
          <button onClick={() => onGoto('landing')} className="btn btn-ghost glass" style={{ borderColor: 'var(--glass-edge)' }}>
            <Icon name="arrow-right" size={13}/>الرئيسية
          </button>
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 60 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 540 }}>
            <svg viewBox="0 0 540 460" width="100%" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="lgA" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#C4B8FF" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#C4B8FF" stopOpacity="0.05"/>
                </linearGradient>
                <linearGradient id="lgB" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6BE4FF" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#6BE4FF" stopOpacity="0.05"/>
                </linearGradient>
                <radialGradient id="rootGlow">
                  <stop offset="0%" stopColor="#7B6CF6" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#7B6CF6" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="rootNode" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7B6CF6"/>
                  <stop offset="100%" stopColor="#C4B8FF"/>
                </linearGradient>
              </defs>

              <circle cx="270" cy="100" r="160" fill="url(#rootGlow)"/>

              {/* Lines with curves */}
              <path d="M270,100 C270,140 130,140 130,200" stroke="url(#lgA)" strokeWidth="1.5" fill="none"/>
              <path d="M270,100 C270,140 410,140 410,200" stroke="url(#lgB)" strokeWidth="1.5" fill="none"/>
              <path d="M130,200 C130,260 60,260 60,320" stroke="url(#lgA)" strokeWidth="1.2" fill="none"/>
              <path d="M130,200 C130,260 200,260 200,320" stroke="url(#lgA)" strokeWidth="1.2" fill="none"/>
              <path d="M410,200 C410,260 340,260 340,320" stroke="url(#lgB)" strokeWidth="1.2" fill="none"/>
              <path d="M410,200 C410,260 480,260 480,320" stroke="url(#lgB)" strokeWidth="1.2" fill="none"/>

              {/* Particles flowing */}
              <circle r="3" fill="#C4B8FF"><animateMotion path="M270,100 C270,140 130,140 130,200" dur="2s" repeatCount="indefinite"/></circle>
              <circle r="3" fill="#6BE4FF"><animateMotion path="M270,100 C270,140 410,140 410,200" dur="2s" repeatCount="indefinite" begin="0.5s"/></circle>
              <circle r="2" fill="#C4B8FF" opacity="0.7"><animateMotion path="M130,200 C130,260 60,260 60,320" dur="2.5s" repeatCount="indefinite" begin="1s"/></circle>
              <circle r="2" fill="#6BE4FF" opacity="0.7"><animateMotion path="M410,200 C410,260 480,260 480,320" dur="2.5s" repeatCount="indefinite" begin="1.5s"/></circle>

              {/* Root */}
              <circle cx="270" cy="100" r="50" fill="none" stroke="#C4B8FF" strokeWidth="1" opacity="0.4">
                <animate attributeName="r" values="32;48;32" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="270" cy="100" r="32" fill="url(#rootNode)" style={{ filter: 'drop-shadow(0 0 18px rgba(123,108,246,0.6))' }}/>
              <text x="270" y="106" textAnchor="middle" fill="#0A0A0A" fontSize="16" fontWeight="800" fontFamily="Inter">W</text>

              {/* Level 2 */}
              {[[130, 200, 'A', '#C4B8FF'], [410, 200, 'B', '#6BE4FF']].map(([x, y, l, c], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="22" fill="var(--surface-2)" stroke={c} strokeWidth="1.4" style={{ filter: `drop-shadow(0 0 10px ${c}55)` }}/>
                  <text x={x} y={y + 5} textAnchor="middle" fill={c} fontSize="13" fontFamily="JetBrains Mono" fontWeight="700">{l}</text>
                </g>
              ))}

              {/* Level 3 */}
              {[[60, 320, '#C4B8FF'], [200, 320, '#C4B8FF'], [340, 320, '#6BE4FF'], [480, 320, '#6BE4FF']].map(([x, y, c], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="14" fill="var(--surface-1)" stroke={c} strokeWidth="1" opacity="0.9"/>
                  <circle cx={x + 9} cy={y - 9} r="3" fill="#2BD9A0" style={{ filter: 'drop-shadow(0 0 4px #2BD9A0)' }}/>
                </g>
              ))}

              {/* Placeholder slots */}
              {[40, 90, 170, 220, 320, 370, 460, 510].map((x, i) => (
                <circle key={i} cx={x} cy={400} r="6" fill="none" stroke="var(--text-mute)" strokeWidth="1" opacity="0.4" strokeDasharray="2 2"/>
              ))}
            </svg>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <div className="font-display" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}>
                توازن. ثقة. <span className="gradient-text">دقّة.</span>
              </div>
              <div style={{ color: 'var(--text-2)', fontSize: 13, maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
                "Crafted with precision. Built for trust." شعار نعيشه في كل عملية تحويل وكل عمولة تحتسب.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div style={{ display: 'grid', placeItems: 'center', padding: 40, position: 'relative' }}>
        <div className="anim-fade-up" style={{ width: '100%', maxWidth: 420 }}>
          <Logo size="lg"/>
          <h1 style={{ fontSize: 36, marginTop: 36, marginBottom: 8, fontWeight: 800, letterSpacing: '-0.025em' }}>أهلاً بعودتك</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>سجّل دخولك لتستكمل بناء شبكتك.</p>

          {/* Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 4, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 24 }}>
            {[['customer', 'عميل'], ['franchise', 'مسوّق'], ['admin', 'أدمن']].map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: '10px', border: 0, borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                background: tab === id ? 'var(--surface-3)' : 'transparent',
                color: tab === id ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow: tab === id ? 'inset 0 0 0 1px var(--line-purple)' : 'none',
                transition: 'all 150ms var(--ease-out)'
              }}>{l}</button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onGoto('dashboard'); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="field">
              <span>User ID</span>
              <input className="input font-mono" placeholder="USR-XXXXXX" defaultValue="USR-102458"/>
            </label>
            <label className="field">
              <span>كلمة المرور</span>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPwd ? 'text' : 'password'} placeholder="••••••••" defaultValue="password" style={{ paddingInlineEnd: 40 }}/>
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, color: 'var(--text-3)', cursor: 'pointer' }}>
                  <Icon name={showPwd ? 'eye-off' : 'eye'} size={15}/>
                </button>
              </div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--text-2)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--purple)' }}/>تذكّرني
              </label>
              <a href="#" style={{ color: 'var(--lavender)', textDecoration: 'none', fontWeight: 600 }}>نسيت كلمة المرور؟</a>
            </div>

            <button type="submit" className="btn btn-primary btn-xl" style={{ width: '100%', marginTop: 6 }}>
              دخول<Icon name="arrow-left" size={14}/>
            </button>
          </form>

          <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: 'var(--info-soft)', border: '1px solid var(--info-edge)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--lavender)', flexShrink: 0 }}>
              <Icon name="shield" size={15}/>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
              سيتم طلب <strong style={{ color: 'var(--text-1)' }}>PIN المحفظة (6 أرقام)</strong> عند أي عملية مالية. مدعوم بـ argon2id.
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-2)' }}>
            ليس لديك حساب؟ <a href="#" style={{ color: 'var(--lavender)', textDecoration: 'none', fontWeight: 600 }}>سجّل عبر رابط راعٍ</a>
          </div>
        </div>
      </div>
    </div>
  );
};

window.LoginPage = LoginPage;

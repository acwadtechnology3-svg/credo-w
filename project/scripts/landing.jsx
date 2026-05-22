/* global React */

/* ============================================================
   ENTERPRISE LANDING — Stripe / Linear / Vercel grade
   B2B fintech feel, no MLM-style hype
   ============================================================ */
const LandingPage = ({ onGoto }) => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', overflowX: 'hidden', position: 'relative' }}>
      {/* ───── NAV ───── */}
      <header className="glass-strong" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <Logo/>
            <nav style={{ display: 'flex', gap: 24 }}>
              {[
                { l: 'المنصة', sub: ['البنية الثنائية', 'محفظة C Money', 'محرّك العمولات', 'الأمان والامتثال'] },
                { l: 'الحلول', sub: ['للشركات', 'للقادة', 'للأكاديميات'] },
                { l: 'المطوّرون', sub: ['API', 'Webhooks', 'SDKs'] },
                { l: 'الموارد', sub: ['Docs', 'Status', 'Changelog'] },
                { l: 'الأسعار' },
              ].map((m, i) => (
                <a key={i} href="#" style={{ color: 'var(--text-2)', textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'color 150ms' }}
                   onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                   onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                  {m.l}{m.sub && <Icon name="arrow-down" size={10} strokeWidth={2} style={{ opacity: 0.5 }}/>}
                </a>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="#" style={{ color: 'var(--text-2)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>تواصل المبيعات</a>
            <button className="btn btn-ghost" onClick={() => onGoto('login')}>تسجيل دخول</button>
            <button className="btn btn-primary" onClick={() => onGoto('login')}>بدء تجربة<Icon name="arrow-left" size={12}/></button>
          </div>
        </div>
      </header>

      {/* ───── HERO ───── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="glow-blob" style={{ width: 900, height: 900, background: 'radial-gradient(circle, rgba(123,108,246,0.22), transparent 65%)', top: '-300px', insetInlineStart: '50%', transform: 'translateX(-50%)', filter: 'blur(80px)' }}/>
        <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.4, maskImage: 'radial-gradient(900px 700px at 50% 0%, #000 30%, transparent 75%)' }}/>

        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '88px 32px 60px', position: 'relative', textAlign: 'center' }}>
          {/* Announcement banner */}
          <a href="#" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 6px 6px 14px', borderRadius: 'var(--r-pill)',
            background: 'var(--surface-1)', border: '1px solid var(--line-strong)',
            fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', marginBottom: 36,
            transition: 'border-color 150ms'
          }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line-purple)'}
             onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line-strong)'}>
            <span style={{ padding: '2px 8px', borderRadius: 'var(--r-pill)', background: 'var(--info-soft)', color: 'var(--lavender)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>جديد</span>
            <span>أُطلق Credo W API — اربط منصتك بمحرّك العمولات مباشرة</span>
            <Icon name="arrow-left" size={12} style={{ color: 'var(--text-3)' }}/>
          </a>

          <h1 style={{
            fontSize: 88, lineHeight: 1.0, fontWeight: 800,
            letterSpacing: '-0.04em', marginBottom: 24,
            maxWidth: 1100, margin: '0 auto 24px'
          }}>
            البنية التحتية المالية<br/>
            <span className="gradient-text">للشبكات الذكية.</span>
          </h1>
          <p style={{ fontSize: 19, color: 'var(--text-2)', maxWidth: 680, margin: '0 auto 40px', lineHeight: 1.55 }}>
            منصة موحّدة للتسويق الشبكي الثنائي. محرّك عمولات يدير ملايين العمليات،
            محفظة <span className="font-mono" style={{ color: 'var(--lavender)' }}>C&nbsp;Money</span> داخلية،
            ولوحة تحكم بمستوى مؤسسات Fortune 500.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 56 }}>
            <button className="btn btn-primary btn-xl" onClick={() => onGoto('login')}>بدء التجربة مجاناً<Icon name="arrow-left" size={14}/></button>
            <button className="btn btn-xl"><Icon name="play" size={13}/>عرض توضيحي · 2 دقيقة</button>
          </div>

          {/* Trust strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 11, color: 'var(--text-3)', marginBottom: 56, flexWrap: 'wrap' }}>
            {[
              ['shield', 'PCI DSS Level 1'],
              ['cpu', 'SOC 2 Type II'],
              ['lock', 'ISO 27001'],
              ['globe', 'GDPR Compliant'],
              ['check-circle', '99.99% Uptime SLA'],
            ].map((b, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name={b[0]} size={11} style={{ color: 'var(--text-2)' }}/>{b[1]}
              </span>
            ))}
          </div>

          {/* Hero product visualization */}
          <HeroDashboardMock/>
        </div>
      </section>

      {/* ───── TRUSTED BY ───── */}
      <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '40px 32px', background: 'var(--bg-page-2)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 28 }}>
            موثوقة من قِبَل أكثر من 12,000 منشأة عبر 14 دولة
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40, opacity: 0.5, flexWrap: 'wrap' }}>
            {['Sigma Group', 'Vector Co.', 'Atlas Capital', 'Nexus Tech', 'Cobalt', 'Pulse', 'Helios', 'Quanta'].map(n => (
              <div key={n} className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '-0.02em' }}>{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── METRICS BAND ───── */}
      <section style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="pill info" style={{ marginBottom: 16 }}><Icon name="activity" size={11}/>الأداء الحيّ</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 12 }}>أرقام تتحدث عن نفسها</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 560, margin: '0 auto' }}>محرّكنا يعالج عمليات حقيقية لمسوّقين حقيقيين، بدقّة وأمان مستوى المؤسسات.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { v: 12480, l: 'مسوّق نشط', sub: '↑ 18% YoY', icon: 'team' },
              { v: 3.4, suf: 'M', l: 'عمولات مدفوعة (ج.م)', sub: 'آخر 30 يوم', icon: 'trend-up', dec: 1 },
              { v: 1.2, suf: 'M', l: 'عملية معالَجة', sub: 'منذ الإطلاق', icon: 'cycle', dec: 1 },
              { v: 99.99, suf: '%', l: 'وقت التشغيل', sub: 'SLA · 12 شهر', icon: 'shield', dec: 2 },
            ].map((m, i) => (
              <div key={i} style={{ padding: '32px 24px', background: 'var(--surface-0)', position: 'relative' }}>
                <Icon name={m.icon} size={14} style={{ color: 'var(--lavender)', marginBottom: 12 }}/>
                <div className="font-num metric-glow" style={{ fontSize: 44, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <AnimatedCounter value={m.v} decimals={m.dec || 0} suffix={m.suf || ''}/>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, fontWeight: 500 }}>{m.l}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PLATFORM PILLARS ───── */}
      <section style={{ padding: '60px 32px', position: 'relative' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="pill" style={{ marginBottom: 14 }}>المنصة</span>
              <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', maxWidth: 700 }}>كل المكوّنات التي تحتاجها <span className="gradient-text">في مكان واحد</span></h2>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 400, lineHeight: 1.6 }}>
              بدلاً من تجميع أدوات متفرّقة، Credo W يدمج محرّك العمولات، المحفظة، التجارة الإلكترونية، والأكاديمية في منصة موحّدة.
            </p>
          </div>

          {/* Feature cards — big */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            {/* Binary Engine — large */}
            <div className="card-elevated" style={{ gridColumn: 'span 4', padding: 0, overflow: 'hidden', position: 'relative', minHeight: 380 }}>
              <div className="glow-blob" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(123,108,246,0.20), transparent)', insetInlineEnd: '-100px', top: '50%', filter: 'blur(50px)' }}/>
              <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}/>
              <div style={{ position: 'relative', padding: 32, display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 32, alignItems: 'center', height: '100%', minHeight: 380 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'var(--info-soft)', border: '1px solid var(--info-edge)', fontSize: 10, color: 'var(--lavender)', fontWeight: 700, marginBottom: 16 }}>
                    <Icon name="tree" size={10}/>BINARY ENGINE
                  </div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.15 }}>محرّك الشجرة الثنائية، الأسرع في السوق</h3>
                  <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 20 }}>
                    وضع تلقائي للأعضاء الجدد، حسابات BV لكل ancestor خلال 50ms،
                    spillover ذكي، ومعالجة 12,480 مسوّق في أقل من 30 ثانية.
                  </p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                    {[['50ms', 'Placement latency'], ['30s', 'Full commission run'], ['100%', 'Race-condition safe']].map(([n, l]) => (
                      <div key={n}><div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--lavender)' }}>{n}</div><div style={{ color: 'var(--text-3)', marginTop: 2 }}>{l}</div></div>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <MiniTreeMock/>
                </div>
              </div>
            </div>

            {/* C Money — medium */}
            <div className="card-elevated" style={{ gridColumn: 'span 2', padding: 26, position: 'relative', overflow: 'hidden', minHeight: 380, display: 'flex', flexDirection: 'column' }}>
              <div className="glow-blob" style={{ width: 280, height: 280, background: 'radial-gradient(circle, rgba(196,184,255,0.16), transparent)', insetInlineStart: '-60px', top: '40%', filter: 'blur(40px)' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'var(--info-soft)', border: '1px solid var(--info-edge)', fontSize: 10, color: 'var(--lavender)', fontWeight: 700, marginBottom: 16 }}>
                  <Icon name="wallet" size={10}/>C MONEY
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.2 }}>محفظة داخلية بـ PIN argon2id</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>تحويلات فورية بين المسوّقين، محمية بـ PIN 6 أرقام، rate-limited على مستوى الـ user والـ IP.</p>
              </div>
              {/* mini wallet card */}
              <div style={{ marginTop: 'auto', padding: 18, borderRadius: 14, background: 'linear-gradient(135deg, #1A1A2E 0%, #2D1F5C 50%, #7B6CF6 130%)', position: 'relative', overflow: 'hidden', border: '1px solid rgba(196,184,255,0.20)' }}>
                <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}/>
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>C Money</div>
                  <div className="font-num" style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 8, letterSpacing: '-0.025em' }}>2,450 <span style={{ fontSize: 13, color: '#C4B8FF' }}>C</span></div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>USR-102458</div>
                </div>
              </div>
            </div>

            {/* Commission Engine */}
            <div className="card" style={{ gridColumn: 'span 2', padding: 26, position: 'relative', overflow: 'hidden', minHeight: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'rgba(43,217,160,0.12)', border: '1px solid var(--success-edge)', fontSize: 10, color: 'var(--success)', fontWeight: 700, marginBottom: 16 }}>
                <Icon name="cycle" size={10}/>COMMISSION ENGINE
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.25 }}>محرّك العمولات الأسبوعي</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>BV fan-out، carry rollover، weekly caps، idempotency على مستوى الـ cycle.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                <div>✓ Atomic per-user transactions</div>
                <div>✓ Redis-locked cycles (no double-run)</div>
                <div>✓ Audit log per credit</div>
              </div>
            </div>

            {/* Shop */}
            <div className="card" style={{ gridColumn: 'span 2', padding: 26, position: 'relative', minHeight: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'rgba(107,228,255,0.12)', border: '1px solid rgba(107,228,255,0.32)', fontSize: 10, color: 'var(--electric)', fontWeight: 700, marginBottom: 16 }}>
                <Icon name="shop" size={10}/>COMMERCE
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.25 }}>متجر ذكي بـ BV</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>كل مشترى من المتجر يحسب BV تلقائياً لكل ancestors في الشجرة.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                <div>✓ Voucher generation API</div>
                <div>✓ Multi-currency support</div>
                <div>✓ Tax-aware checkout</div>
              </div>
            </div>

            {/* Admin */}
            <div className="card" style={{ gridColumn: 'span 2', padding: 26, position: 'relative', minHeight: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'rgba(255,178,63,0.12)', border: '1px solid var(--warning-edge)', fontSize: 10, color: 'var(--warning)', fontWeight: 700, marginBottom: 16 }}>
                <Icon name="cpu" size={10}/>OPS COCKPIT
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.25 }}>غرفة عمليات متكاملة</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>مراقبة مباشرة، تشغيل دورات يدوي، Audit log كامل، صلاحيات دقيقة.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                <div>✓ Real-time WebSocket events</div>
                <div>✓ Role-based permissions</div>
                <div>✓ Manual override + Audit</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── ARCHITECTURE / API ───── */}
      <section style={{ padding: '80px 32px', position: 'relative', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <span className="pill" style={{ marginBottom: 14 }}><Icon name="cpu" size={11}/>للمطوّرين</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 18, lineHeight: 1.1 }}>API نظيف.<br/><span className="gradient-text">Webhooks موثوقة.</span></h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 28 }}>
              ادمج Credo W مع نظامك الحالي. شغّل تسجيلات، اقرأ BV، استقبل أحداث العمولات في الوقت الفعلي.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                { ic: 'database', t: 'RESTful + GraphQL', d: 'كلا الواجهتين متاحتان · OpenAPI 3.1' },
                { ic: 'wifi', t: 'WebSocket Live Events', d: 'Socket.io · رومز لكل user' },
                { ic: 'shield', t: 'JWT + Refresh Token', d: 'مدّة 15 دقيقة · تدوير آمن' },
              ].map(f => (
                <div key={f.t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--info-soft)', color: 'var(--lavender)', display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid var(--line-purple)' }}>
                    <Icon name={f.ic} size={14}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn">استكشف الـ Docs<Icon name="arrow-left" size={12}/></button>
          </div>

          {/* Code block */}
          <div className="card-elevated" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            <div className="glow-blob" style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(123,108,246,0.16), transparent)', insetInlineEnd: '-80px', top: '-80px', filter: 'blur(50px)' }}/>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-0)', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#FF5C7A' }}/>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#FFB23F' }}/>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#2BD9A0' }}/>
              </div>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>example.ts · POST /api/v1/orders</span>
              <button className="btn btn-sm btn-ghost" style={{ padding: 4 }}><Icon name="copy" size={12}/></button>
            </div>
            <pre style={{ margin: 0, padding: 22, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7, overflowX: 'auto', position: 'relative' }}>
              <code>
<span style={{ color: 'var(--text-3)' }}>{'// Create an order — BV fan-out is automatic'}</span>{'\n'}
<span style={{ color: 'var(--lavender)' }}>const</span> order = <span style={{ color: 'var(--lavender)' }}>await</span> credow.<span style={{ color: 'var(--electric)' }}>orders</span>.create({'{'}{'\n'}
{'  '}userId:      <span style={{ color: 'var(--warning)' }}>"USR-102458"</span>,{'\n'}
{'  '}items: [{'{'} productId: <span style={{ color: 'var(--warning)' }}>"PRD-001"</span>, qty: <span style={{ color: 'var(--success)' }}>1</span> {'}'}],{'\n'}
{'  '}payment: {'{'} method: <span style={{ color: 'var(--warning)' }}>"cmoney"</span>, pin: <span style={{ color: 'var(--warning)' }}>"******"</span> {'}'},{'\n'}
{'}'});{'\n\n'}
<span style={{ color: 'var(--text-3)' }}>{'// Fan-out triggers automatically:'}</span>{'\n'}
<span style={{ color: 'var(--text-3)' }}>{'// → ancestors get BV credit on their respective side'}</span>{'\n'}
<span style={{ color: 'var(--text-3)' }}>{'// → direct sponsor gets immediate commission'}</span>{'\n'}
<span style={{ color: 'var(--text-3)' }}>{'// → fires "order.completed" webhook'}</span>{'\n\n'}
<span style={{ color: 'var(--lavender)' }}>console</span>.log(order.refNo)<span style={{ color: 'var(--text-3)' }}>{' // → "PO-1248"'}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ───── PRICING ───── */}
      <section style={{ padding: '80px 32px', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="pill" style={{ marginBottom: 16 }}>الباقات</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 12 }}>أسعار شفّافة. <span className="gradient-text">لا مفاجآت</span>.</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 560, margin: '0 auto' }}>اختر باقتك حسب حجم عملياتك. التحديث متاح في أي وقت.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { name: 'Starter', tag: 'للأفراد', price: '5,000', commission: '400', cv: '30', cap: '6,000 ج.م', features: ['عمولة مباشرة 400 ج.م لكل ترقية', 'BV cap أسبوعي 6,000 ج.م', 'وصول للمتجر والأكاديمية الأساسية', 'دعم بريد إلكتروني', 'API access · 1,000 req/day'] },
              { name: 'Growth', tag: 'الأكثر شيوعاً', price: '10,000', commission: '1,000', cv: '90', cap: '15,000 ج.م', popular: true, features: ['عمولة مباشرة 1,000 ج.م', 'BV cap أسبوعي 15,000 ج.م', 'وصول كامل للأكاديمية', 'مسار الرتب المتقدّم', 'دعم أولوية · 12 ساعة SLA', 'API access · 50,000 req/day', 'Webhooks مخصّصة'] },
              { name: 'Elite', tag: 'للشركات والقادة', price: '22,000', commission: '1,800', cv: '210', cap: '50,000 ج.م', features: ['عمولة مباشرة 1,800 ج.م', 'BV cap أسبوعي 50,000 ج.م', 'مرشد شخصي + ورش حصرية', 'مسار الرتب الماسيّة', 'دعم 24/7 + Account Manager', 'API access غير محدود', 'SAML SSO + Audit export'] },
            ].map((p) => (
              <div key={p.name} className={p.popular ? 'card-elevated' : 'card'} style={{ padding: 28, position: 'relative', overflow: 'hidden', ...(p.popular && { border: '1px solid var(--line-purple)', boxShadow: 'var(--elev-glow)' }) }}>
                {p.popular && <div style={{ position: 'absolute', insetInlineEnd: -50, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,184,255,0.18), transparent)', filter: 'blur(40px)' }}/>}
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div className="font-display" style={{ fontSize: 22, fontWeight: 800 }}>{p.name}</div>
                    {p.popular && <span className="pill info" style={{ fontSize: 10 }}><Icon name="flame" size={10}/>الأكثر شيوعاً</span>}
                    {!p.popular && <span style={{ fontSize: 10, color: 'var(--text-3)', padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'var(--surface-2)', border: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{p.tag}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 16, marginBottom: 6 }}>
                    <span className="font-num" style={{ fontSize: 44, fontWeight: 800, color: p.popular ? 'var(--lavender)' : 'var(--text-1)', letterSpacing: '-0.03em' }}>{p.price}</span>
                    <span style={{ color: 'var(--text-3)', fontSize: 13 }}>ج.م · مرة واحدة</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 22 }}>BV cap أسبوعي: <span style={{ color: 'var(--text-2)' }}>{p.cap}</span></div>

                  <button className={`btn ${p.popular ? 'btn-primary' : ''} btn-lg`} style={{ width: '100%', justifyContent: 'center', marginBottom: 22 }}>
                    اختر {p.name}<Icon name="arrow-left" size={13}/>
                  </button>

                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {p.features.map((f) => (
                      <div key={f} style={{ display: 'flex', gap: 10, fontSize: 12.5, alignItems: 'flex-start' }}>
                        <Icon name="check" size={14} strokeWidth={2.2} style={{ color: p.popular ? 'var(--lavender)' : 'var(--success)', flexShrink: 0, marginTop: 2 }}/>
                        <span style={{ color: 'var(--text-2)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise strip */}
          <div className="card-elevated" style={{ marginTop: 16, padding: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, position: 'relative', overflow: 'hidden', borderColor: 'var(--line-purple)' }}>
            <div className="glow-blob" style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(123,108,246,0.12), transparent)', insetInlineEnd: '0%', top: '-50%', filter: 'blur(50px)' }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'var(--info-soft)', border: '1px solid var(--info-edge)', fontSize: 10, color: 'var(--lavender)', fontWeight: 700, marginBottom: 12 }}>
                <Icon name="briefcase" size={10}/>ENTERPRISE
              </div>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>هل لديك شبكة بأكثر من 10,000 عضو؟</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 600 }}>تواصل مع فريق المبيعات لباقة مخصّصة تشمل White-label، API limits مخصّصة، SAML SSO، وضمانات SLA متقدّمة.</div>
            </div>
            <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
              <button className="btn"><Icon name="calendar" size={12}/>احجز عرضاً</button>
              <button className="btn btn-primary">تواصل مع المبيعات<Icon name="arrow-left" size={12}/></button>
            </div>
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIALS ───── */}
      <section style={{ padding: '80px 32px', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="pill" style={{ marginBottom: 14 }}><Icon name="star" size={11}/>قصص نجاح</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.025em' }}>كيف يستخدمها <span className="gradient-text">قادة الشبكات</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { q: 'انتقلنا من Excel ولوحات يدوية إلى Credo W. وفّر علينا 40 ساعة شهرياً في احتساب العمولات وحدها.', n: 'فاطمة عيسى', t: 'مديرة شبكة · 2,400 مسوّق', avatar: '#7B6CF6' },
              { q: 'الـ API هو الفارق. ربطنا نظام CRM الخاص بنا في 3 أيام. أعضاؤنا يرون عمولاتهم لحظياً.', n: 'محمد طارق', t: 'CTO · Helios Marketing', avatar: '#6BE4FF' },
              { q: 'محرّك الـ Carry يعمل بدقّة لم نَرها في أي منصة أخرى. صفر شكاوى من المسوّقين منذ 8 أشهر.', n: 'سارة المنصور', t: 'COO · Atlas Network', avatar: '#FFB23F' },
            ].map((t, i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[0,1,2,3,4].map(s => <Icon key={s} name="star" size={14} style={{ color: 'var(--warning)' }} strokeWidth={1.6}/>)}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.65, marginBottom: 24 }}>"{t.q}"</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${t.avatar}, ${t.avatar}66)`, display: 'grid', placeItems: 'center', color: '#0A0A0A', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{t.n[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.n}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.t}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section style={{ padding: '80px 32px', position: 'relative', overflow: 'hidden' }}>
        <div className="glow-blob" style={{ width: 800, height: 800, background: 'radial-gradient(circle, rgba(123,108,246,0.18), transparent)', top: '0', insetInlineStart: '50%', transform: 'translateX(-50%)', filter: 'blur(70px)' }}/>
        <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.4, maskImage: 'radial-gradient(700px 400px at 50% 50%, #000 30%, transparent 75%)' }}/>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}>ابدأ خلال <span className="gradient-text">دقيقتين.</span></h2>
          <p style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.65 }}>سجّل حسابك، ادعُ أول عضو في فريقك، وشاهد محرّك العمولات يعمل بنفسك.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary btn-xl" onClick={() => onGoto('login')}>بدء التجربة المجانية<Icon name="arrow-left" size={14}/></button>
            <button className="btn btn-xl">تواصل المبيعات</button>
          </div>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 24, fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="check" size={11} style={{ color: 'var(--success)' }}/>بدون بطاقة ائتمان</span>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="check" size={11} style={{ color: 'var(--success)' }}/>إعداد فوري</span>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="check" size={11} style={{ color: 'var(--success)' }}/>إلغاء في أي وقت</span>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '56px 32px 32px', background: 'var(--bg-page-2)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 40, marginBottom: 40 }}>
            <div>
              <Logo/>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 16, lineHeight: 1.6, maxWidth: 280 }}>البنية التحتية المالية للشبكات الذكية. صُنع بدقّة. مبنيّ على الثقة.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {['globe', 'message', 'link'].map(ic => (
                  <a key={ic} href="#" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--text-3)', transition: 'color 150ms' }}
                     onMouseEnter={e => e.currentTarget.style.color = 'var(--lavender)'}
                     onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                    <Icon name={ic} size={13}/>
                  </a>
                ))}
              </div>
            </div>
            {[
              { t: 'المنصة', l: ['نظرة عامة', 'الشجرة الثنائية', 'C Money', 'العمولات', 'المتجر'] },
              { t: 'المطوّرون', l: ['Docs', 'API Reference', 'Webhooks', 'SDKs', 'Status'] },
              { t: 'الشركة', l: ['من نحن', 'وظائف', 'الأخبار', 'الشركاء', 'الأمان'] },
              { t: 'قانوني', l: ['الشروط', 'الخصوصية', 'الكوكيز', 'GDPR', 'الامتثال'] },
            ].map(g => (
              <div key={g.t}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{g.t}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {g.l.map(item => (
                    <li key={item}><a href="#" style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: 13, transition: 'color 150ms' }}
                       onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                       onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>{item}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>© 2026 Credo W Technologies, Inc. جميع الحقوق محفوظة.</div>
            <div style={{ display: 'flex', gap: 18, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}/>كل الأنظمة تعمل</span>
              <span>v1.0.42</span>
              <span>API · 99.99%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ============================================================
   HERO PRODUCT MOCKUP — floating dashboard panels
   ============================================================ */
const HeroDashboardMock = () => (
  <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', marginTop: 36 }}>
    {/* Main dashboard frame */}
    <div className="card-elevated" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.55), 0 0 0 1px var(--line-purple)', borderRadius: 16 }}>
      {/* macOS-like topbar */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-page-2)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: 6, background: '#FF5C7A' }}/>
          <span style={{ width: 11, height: 11, borderRadius: 6, background: '#FFB23F' }}/>
          <span style={{ width: 11, height: 11, borderRadius: 6, background: '#2BD9A0' }}/>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div className="font-mono" style={{ padding: '5px 14px', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--line)', fontSize: 11, color: 'var(--text-3)' }}>
            <Icon name="lock" size={10} style={{ display: 'inline', marginInlineEnd: 6, verticalAlign: '-1px' }}/>app.credow.com/dashboard
          </div>
        </div>
        <span className="pill live"><span className="dot"></span>LIVE</span>
      </div>

      {/* Dashboard body */}
      <div style={{ padding: 22, background: 'var(--bg-page)', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        {/* Left side: BV module */}
        <div className="card-elevated" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}/>
          <div style={{ position: 'relative' }}>
            <div className="t-eyebrow" style={{ color: 'var(--lavender)' }}>التوازن الثنائي · BV</div>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 2, marginBottom: 18 }}>دورة 18 — نشطة</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--side-left-soft)', background: 'rgba(196,184,255,0.06)' }}>
                <div style={{ fontSize: 9, color: 'var(--side-left)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>A · يمين</div>
                <div className="font-num metric-glow" style={{ fontSize: 32, fontWeight: 800, color: 'var(--side-left)', lineHeight: 1, marginTop: 6 }}>210 <span style={{ fontSize: 11, color: 'var(--text-3)' }}>CV</span></div>
              </div>
              <div style={{ padding: 14, borderRadius: 10, border: '1px solid rgba(107,228,255,0.32)', background: 'rgba(107,228,255,0.06)' }}>
                <div style={{ fontSize: 9, color: 'var(--side-right)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>B · يسار</div>
                <div className="font-num metric-glow" style={{ fontSize: 32, fontWeight: 800, color: 'var(--side-right)', lineHeight: 1, marginTop: 6 }}>240 <span style={{ fontSize: 11, color: 'var(--text-3)' }}>CV</span></div>
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: 'linear-gradient(90deg, rgba(43,217,160,0.12), rgba(43,217,160,0.02))', border: '1px solid var(--success-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>عمولة الدورة (مقدّرة)</span>
              <span className="font-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>+ 6,000 <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>ج.م</span></span>
            </div>
          </div>
        </div>

        {/* Right side: metrics + sparklines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { t: 'C Money', v: '2,450', s: 'C', c: 'var(--lavender)', spark: [2100,2200,2150,2300,2280,2380,2450], icon: 'wallet' },
            { t: 'الفريق النشط', v: '64', s: '', c: 'var(--success)', spark: [42,48,52,55,58,62,64], icon: 'team' },
            { t: 'الرتبة', v: 'Silver', s: '· 85% Gold', c: 'var(--warning)', icon: 'rank' },
          ].map((m, i) => (
            <div key={i} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${m.c}18`, color: m.c, display: 'grid', placeItems: 'center', border: `1px solid ${m.c}30`, flexShrink: 0 }}>
                <Icon name={m.icon} size={13}/>
              </div>
              <div style={{ flex: 1 }}>
                <div className="t-eyebrow" style={{ fontSize: 9 }}>{m.t}</div>
                <div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: m.c, marginTop: 2 }}>{m.v} <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{m.s}</span></div>
              </div>
              {m.spark && <Sparkline data={m.spark} width={50} height={20} color={m.c} glow/>}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Floating notification */}
    <div className="card-elevated" style={{ position: 'absolute', insetInlineStart: -40, top: '40%', padding: 12, width: 240, transform: 'rotate(-3deg)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', zIndex: 3, borderColor: 'var(--success-edge)' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--success-soft)', display: 'grid', placeItems: 'center', color: 'var(--success)', flexShrink: 0 }}>
          <Icon name="check" size={14} strokeWidth={2.5}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>عمولة جديدة</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>+ <span className="font-mono" style={{ color: 'var(--success)' }}>400 ج.م</span> · من USR-9821</div>
        </div>
      </div>
    </div>

    {/* Floating wallet card */}
    <div style={{ position: 'absolute', insetInlineEnd: -36, bottom: '8%', padding: 14, width: 200, borderRadius: 14, background: 'linear-gradient(135deg, #1A1A2E, #2D1F5C 70%, #7B6CF6)', transform: 'rotate(3.5deg)', boxShadow: '0 30px 64px rgba(123,108,246,0.4)', zIndex: 1, border: '1px solid rgba(196,184,255,0.22)' }}>
      <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.18, borderRadius: 14, overflow: 'hidden' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>C Money</div>
        <div className="font-num" style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 6, letterSpacing: '-0.02em' }}>2,450 <span style={{ fontSize: 11, color: '#C4B8FF' }}>C</span></div>
        <div className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>USR-102458</div>
      </div>
    </div>
  </div>
);

/* ============================================================
   MINI TREE MOCKUP for feature card
   ============================================================ */
const MiniTreeMock = () => (
  <svg viewBox="0 0 360 220" width="100%" style={{ display: 'block' }}>
    <defs>
      <linearGradient id="mtA" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#C4B8FF" stopOpacity="0.85"/>
        <stop offset="100%" stopColor="#C4B8FF" stopOpacity="0.1"/>
      </linearGradient>
      <linearGradient id="mtB" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#6BE4FF" stopOpacity="0.85"/>
        <stop offset="100%" stopColor="#6BE4FF" stopOpacity="0.1"/>
      </linearGradient>
      <linearGradient id="mtRoot" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#7B6CF6"/>
        <stop offset="100%" stopColor="#C4B8FF"/>
      </linearGradient>
    </defs>
    <path d="M180,35 C180,70 100,70 100,110" stroke="url(#mtA)" strokeWidth="1.5" fill="none"/>
    <path d="M180,35 C180,70 260,70 260,110" stroke="url(#mtB)" strokeWidth="1.5" fill="none"/>
    <path d="M100,110 C100,150 60,150 60,180" stroke="url(#mtA)" strokeWidth="1.2" fill="none"/>
    <path d="M100,110 C100,150 140,150 140,180" stroke="url(#mtA)" strokeWidth="1.2" fill="none"/>
    <path d="M260,110 C260,150 220,150 220,180" stroke="url(#mtB)" strokeWidth="1.2" fill="none"/>
    <path d="M260,110 C260,150 300,150 300,180" stroke="url(#mtB)" strokeWidth="1.2" fill="none"/>
    <circle r="2.5" fill="#C4B8FF"><animateMotion path="M180,35 C180,70 100,70 100,110" dur="2.4s" repeatCount="indefinite"/></circle>
    <circle r="2.5" fill="#6BE4FF"><animateMotion path="M180,35 C180,70 260,70 260,110" dur="2.4s" repeatCount="indefinite" begin="0.5s"/></circle>
    <circle cx="180" cy="35" r="26" fill="url(#mtRoot)" style={{ filter: 'drop-shadow(0 0 14px rgba(123,108,246,0.6))' }}/>
    <circle cx="180" cy="35" r="36" fill="none" stroke="#C4B8FF" strokeWidth="1" opacity="0.5">
      <animate attributeName="r" values="26;42;26" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite"/>
    </circle>
    <text x="180" y="40" textAnchor="middle" fill="#0A0A0A" fontSize="12" fontWeight="800" fontFamily="Inter">W</text>
    {[[100,110,'A','#C4B8FF'],[260,110,'B','#6BE4FF']].map(([x,y,l,c],i)=>(
      <g key={i}>
        <rect x={x-18} y={y-14} width="36" height="28" rx="8" fill="var(--surface-2)" stroke={c} strokeWidth="1.2"/>
        <text x={x} y={y+4} textAnchor="middle" fill={c} fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">{l}</text>
      </g>
    ))}
    {[[60,180],[140,180],[220,180],[300,180]].map(([x,y],i)=>(
      <g key={i}>
        <circle cx={x} cy={y} r="13" fill="var(--surface-1)" stroke={i<2?'#C4B8FF':'#6BE4FF'} strokeOpacity="0.6" strokeWidth="1"/>
        <circle cx={x+9} cy={y-9} r="2.5" fill="#2BD9A0" style={{ filter: 'drop-shadow(0 0 4px #2BD9A0)' }}/>
      </g>
    ))}
  </svg>
);

window.LandingPage = LandingPage;

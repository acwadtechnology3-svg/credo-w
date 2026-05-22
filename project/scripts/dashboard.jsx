/* global React */

/* ============================================================
   PREMIUM DASHBOARD — Cinematic Ambassador Home
   ============================================================ */
const Dashboard = ({ onNav }) => {
  const weekly = [3200, 4800, 6200, 5400, 7800, 5400, 6480];
  const sparkA = [120, 145, 155, 170, 168, 195, 210];
  const sparkB = [180, 175, 195, 210, 230, 235, 240];

  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      <Topbar
        title="مرحباً، أحمد"
        breadcrumbs={['Credo W', 'لوحة المسوّق', 'الرئيسية']}
        onInvite={() => onNav('team')}
      />

      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <GlowBg/>

        <div className="page-enter" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>

          {/* ────────────── CINEMATIC HERO ────────────── */}
          <div className="card-elevated" style={{
            padding: 28, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(123,108,246,0.16) 0%, rgba(107,228,255,0.06) 60%, transparent 100%), var(--surface-1)',
            borderColor: 'var(--line-purple)',
            minHeight: 220
          }}>
            <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.4, maskImage: 'radial-gradient(circle at 90% 50%, #000 0%, transparent 70%)' }}/>

            {/* Floating orbs */}
            <div style={{ position: 'absolute', insetInlineEnd: -80, top: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,184,255,0.30), transparent 65%)', filter: 'blur(40px)' }}/>
            <div style={{ position: 'absolute', insetInlineEnd: 60, bottom: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,228,255,0.30), transparent 65%)', filter: 'blur(30px)' }}/>

            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  <span className="pill info"><Icon name="sparkles" size={11}/>كابتن الأسبوع</span>
                  <span className="pill live"><span className="dot"></span>الدورة 18 نشطة</span>
                </div>
                <div className="font-display" style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 10 }}>
                  أنت على بُعد <span className="gradient-text">32 CV</span><br/>من الرتبة الذهبية
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 480, lineHeight: 1.6 }}>
                  أداء استثنائي هذه الدورة. أكمل التوازن بين جهتيك واحصل على <strong style={{ color: 'var(--warning)' }}>5,000 ج.م + رحلة</strong> فور تحقيق الرتبة الذهبية.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-primary" onClick={() => onNav('tree')}><Icon name="tree" size={14}/>افتح شجرة الشبكة</button>
                  <button className="btn" onClick={() => onNav('ranks')}><Icon name="rank" size={14}/>مسار الرتب</button>
                </div>
              </div>

              {/* Rank progress visualization */}
              <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                <svg viewBox="0 0 200 200" width="200" height="200">
                  <defs>
                    <linearGradient id="rankProg" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#FFD180"/>
                      <stop offset="100%" stopColor="#FFB23F"/>
                    </linearGradient>
                  </defs>
                  {/* Background ring */}
                  <circle cx="100" cy="100" r="80" fill="none" stroke="var(--surface-3)" strokeWidth="6"/>
                  {/* Progress ring */}
                  <circle cx="100" cy="100" r="80" fill="none" stroke="url(#rankProg)" strokeWidth="6"
                    strokeDasharray={`${502 * 0.85} ${502 * 0.15}`} strokeLinecap="round"
                    transform="rotate(-90 100 100)" style={{ filter: 'drop-shadow(0 0 12px rgba(255,178,63,0.6))' }}>
                    <animate attributeName="stroke-dasharray" from="0 502" to={`${502 * 0.85} ${502 * 0.15}`} dur="1.4s" fill="freeze"/>
                  </circle>
                  {/* Dots around */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i / 12) * Math.PI * 2 - Math.PI/2;
                    const x = 100 + Math.cos(a) * 95;
                    const y = 100 + Math.sin(a) * 95;
                    return <circle key={i} cx={x} cy={y} r="1.5" fill={i <= 10 ? 'var(--warning)' : 'var(--text-4)'}/>;
                  })}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                  <div>
                    <div className="t-eyebrow" style={{ color: 'var(--warning)' }}>التقدّم للذهبية</div>
                    <div className="metric metric-glow" style={{ fontSize: 44, color: 'var(--text-1)', lineHeight: 1 }}>
                      <AnimatedCounter value={85} suffix="%"/>
                    </div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>178 / 210 CV</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ────────────── METRIC ROW ────────────── */}
          <div className="anim-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <MetricCard label="رصيد C Money" icon="coin" color="var(--lavender)" value={2450} suffix=" C" sub="≈ 2,450 ج.م" spark={[2100,2200,2150,2300,2280,2380,2450]} accent />
            <MetricCard label="رصيد الأرباح" icon="wallet" color="var(--success)" value={6480} suffix=" ج.م" sub="هذه الدورة" spark={[3200,4100,4800,5400,5800,6200,6480]} />
            <MetricCard label="فريقي النشط" icon="team" color="var(--purple-bright)" value={64} suffix="" sub="+5 هذا الأسبوع" spark={[42,48,52,55,58,62,64]} />
            <MetricCard label="الرتبة" icon="rank" color="var(--warning)" value={null} sub="68% → Gold" custom={
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="font-display metric" style={{ fontSize: 28, color: 'var(--warning)' }}>Silver</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>· فضية</span>
              </div>
            }/>
          </div>

          {/* ────────────── BV BALANCE — HERO MODULE ────────────── */}
          <div className="card-elevated" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div className="t-eyebrow" style={{ color: 'var(--lavender)' }}>التوازن الثنائي · BV</div>
                  <div className="font-display" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>دورة 18 — تنتهي بعد 3 أيام</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>كل CV من الجهة المتوازنة = 28.5 ج.م عمولة</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="pill ok"><span className="dot"></span>توازن جيد</span>
                  <button className="btn btn-sm" onClick={() => onNav('earnings')}>التفاصيل <Icon name="arrow-left" size={12}/></button>
                </div>
              </div>

              {/* Dual side cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'stretch' }}>
                <SideCard side="A" label="الجهة A · يمين" value={210} carry={0} carryLabel="Carry Right" color="var(--side-left)" spark={sparkA}/>
                <DividerWithBalance left={210} right={240}/>
                <SideCard side="B" label="الجهة B · يسار" value={240} carry={30} carryLabel="Carry Left" color="var(--side-right)" spark={sparkB}/>
              </div>

              {/* Pay leg + commission strip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 22 }}>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface-0)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="t-eyebrow">Pay Leg المحتسبة</span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>min(A, B)</span>
                  </div>
                  <div className="font-num metric-glow" style={{ fontSize: 34, fontWeight: 800, color: 'var(--lavender)', lineHeight: 1 }}>
                    <AnimatedCounter value={210}/> <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>CV</span>
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(43,217,160,0.32)', background: 'linear-gradient(135deg, rgba(43,217,160,0.12), rgba(43,217,160,0.02))', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', insetInlineEnd: -20, top: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(43,217,160,0.30), transparent)', filter: 'blur(20px)' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, position: 'relative' }}>
                    <span className="t-eyebrow" style={{ color: 'var(--success)' }}>عمولة هذا الأسبوع · مقدّرة</span>
                    <Icon name="trend-up" size={14} style={{ color: 'var(--success)' }}/>
                  </div>
                  <div className="font-num" style={{ fontSize: 34, fontWeight: 800, color: 'var(--success)', lineHeight: 1, position: 'relative' }}>
                    + <AnimatedCounter value={6000}/> <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ────────────── AI INSIGHT + ACTIVITY ────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>

            {/* AI Insights */}
            <div className="card" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', insetInlineEnd: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,228,255,0.12), transparent 65%)', filter: 'blur(20px)' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6BE4FF, #7B6CF6)', display: 'grid', placeItems: 'center', color: '#0A0A0A', boxShadow: '0 0 18px rgba(107,228,255,0.45)' }}>
                    <Icon name="sparkles" size={14}/>
                  </div>
                  <div>
                    <div className="font-display" style={{ fontSize: 14, fontWeight: 700 }}>Credo Intelligence</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>توصيات مبنية على نشاطك</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-ghost"><Icon name="settings" size={12}/></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { tag: 'فرصة', tagKind: 'info', t: 'الجهة A متأخرة بـ 30 CV', d: 'أضف عضواً واحداً للجهة اليمنى لتتوازن وتفتح 1,200 ج.م إضافية هذا الأسبوع.', cta: 'ادعُ الآن', icon: 'corner-up-right' },
                  { tag: 'تنبيه', tagKind: 'warn', t: '3 أعضاء غير نشطين', d: 'محمد سامي، ليلى ح.، وكريم ف. لم يجدّدوا منذ 14 يوماً. تواصل معهم قبل انتهاء الدورة.', cta: 'عرض القائمة', icon: 'message' },
                  { tag: 'اقتراح', tagKind: 'ok', t: 'حدّث باقتك إلى Elite', d: 'بإضافة 12,000 ج.م ستفتح حد عمولات أعلى (50,000 ج.م) ومسار الرتب الماسيّة.', cta: 'عرض الباقة', icon: 'arrow-up' },
                ].map((it, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 12, background: 'var(--surface-0)', border: '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'border-color 180ms' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line-strong)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--lavender)', flexShrink: 0, border: '1px solid var(--line)' }}>
                      <Icon name={it.icon} size={14}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className={`pill ${it.tagKind}`} style={{ fontSize: 9, padding: '1px 6px' }}>{it.tag}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{it.t}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{it.d}</div>
                    </div>
                    <button className="btn btn-sm" style={{ flexShrink: 0 }}>{it.cta}</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live activity feed */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 12px' }}>
                <div>
                  <div className="font-display" style={{ fontSize: 14, fontWeight: 700 }}>النشاط المباشر</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Real-time · WebSocket</div>
                </div>
                <span className="pill live"><span className="dot"></span>LIVE</span>
              </div>
              <div style={{ padding: '0 8px 12px', maxHeight: 360, overflowY: 'auto' }}>
                {[
                  { type: 'commission', icon: 'trend-up', color: 'var(--success)', t: 'عمولة مباشرة جديدة', a: '+ 400 ج.م', sub: 'من اشتراك سارة ع.', time: 'منذ ثانيتين' },
                  { type: 'join', icon: 'plus', color: 'var(--purple-bright)', t: 'انضمام جديد · جهة A', a: 'يارا ك.', sub: 'USR-104112 · باقة Growth', time: 'منذ 4 دقائق' },
                  { type: 'purchase', icon: 'shop', color: 'var(--lavender)', t: 'شراء من المتجر', a: '950 ج.م', sub: 'في جهة B · +9 CV لشبكتك', time: 'منذ 12 دقيقة' },
                  { type: 'transfer', icon: 'send', color: 'var(--electric)', t: 'تحويل C Money', a: '+ 250 C', sub: 'من USR-991204', time: 'منذ ساعة' },
                  { type: 'rank', icon: 'rank', color: 'var(--warning)', t: 'ترقّت ليلى ح. إلى Bronze', a: 'مكافأة 500', sub: 'في فريقك المباشر', time: 'منذ ساعتين' },
                  { type: 'commission', icon: 'trend-up', color: 'var(--success)', t: 'عمولة توازن', a: '+ 1,200 ج.م', sub: 'أسبوع 17', time: 'منذ يوم' },
                ].map((it, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 10, transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,184,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: it.color, flexShrink: 0, border: '1px solid var(--line)' }}>
                      <Icon name={it.icon} size={13}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{it.t}</span>
                        <span className="font-num" style={{ fontSize: 12, fontWeight: 700, color: it.color }}>{it.a}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{it.sub}</span>
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-4)' }}>{it.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
                <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }}>عرض كل النشاط <Icon name="arrow-left" size={11}/></button>
              </div>
            </div>
          </div>

          {/* ────────────── EARNINGS CHART + WEEKLY CAP ────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div className="t-eyebrow">الأرباح الأسبوعية</div>
                  <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>آخر 7 دورات</div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                  <span style={{ color: 'var(--text-2)' }}>الإجمالي · <span className="font-num" style={{ color: 'var(--text-1)', fontWeight: 700 }}>37,280 ج.م</span></span>
                  <span style={{ color: 'var(--success)' }}>↑ 24% vs دورة 17</span>
                </div>
              </div>
              <Bars data={weekly} height={180} cap={9000} capLabel="حد التفعيل"/>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div className="t-eyebrow">الحد الأقصى الأسبوعي</div>
              <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 4, marginBottom: 18 }}>Silver · 30,000 ج.م</div>

              {/* Circular cap meter */}
              <div style={{ position: 'relative', display: 'grid', placeItems: 'center', margin: '0 auto', width: 160, height: 160 }}>
                <svg viewBox="0 0 160 160" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="64" fill="none" stroke="var(--surface-3)" strokeWidth="8"/>
                  <circle cx="80" cy="80" r="64" fill="none" stroke="url(#capGrad)" strokeWidth="8"
                    strokeDasharray={`${402 * 0.216} ${402 * 0.784}`} strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="capGrad" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#7B6CF6"/>
                      <stop offset="100%" stopColor="#C4B8FF"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="font-num" style={{ fontSize: 28, fontWeight: 800, color: 'var(--lavender)', lineHeight: 1 }}><AnimatedCounter value={21.6} decimals={1}/>%</div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>مُستهلَك</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 12 }}>
                <span style={{ color: 'var(--text-2)' }}>المتبقي</span>
                <span className="font-num" style={{ fontWeight: 700, color: 'var(--success)' }}>23,520 ج.م</span>
              </div>
            </div>
          </div>

          {/* ────────────── QUICK ACTIONS ────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { icon: 'send', label: 'تحويل C Money', desc: 'محمي بـ PIN', go: 'wallet', color: 'var(--electric)' },
              { icon: 'link', label: 'رابط الإحالة', desc: 'A / B / Auto', go: 'team', color: 'var(--lavender)' },
              { icon: 'shop', label: 'تصفّح المتجر', desc: '184 منتج', go: 'shop', color: 'var(--purple-bright)' },
              { icon: 'academy', label: 'بث مباشر الآن', desc: 'بناء شبكة 100', go: 'academy', color: 'var(--warning)' },
            ].map((q, i) => (
              <button key={i} onClick={() => onNav(q.go)} className="card card-interactive" style={{ padding: 16, textAlign: 'start', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', color: q.color, display: 'grid', placeItems: 'center', border: '1px solid var(--line)' }}>
                  <Icon name={q.icon} size={18}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{q.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{q.desc}</div>
                </div>
                <Icon name="arrow-left" size={14} style={{ color: 'var(--text-3)' }}/>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
const MetricCard = ({ label, icon, color, value, suffix, sub, spark, accent, custom }) => (
  <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden', ...(accent && { borderColor: 'var(--line-purple)' }) }}>
    {accent && <div style={{ position: 'absolute', insetInlineEnd: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${color}33, transparent 65%)`, filter: 'blur(20px)' }}/>}
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span className="t-eyebrow">{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color, border: '1px solid var(--line)' }}>
          <Icon name={icon} size={12}/>
        </div>
      </div>
      {custom || (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="font-num metric" style={{ fontSize: 28, color }}>
            <AnimatedCounter value={value}/>
          </span>
          {suffix && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{suffix}</span>}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>
        {spark && <Sparkline data={spark} width={70} height={22} color={color} glow/>}
      </div>
    </div>
  </div>
);

const SideCard = ({ side, label, value, carry, carryLabel, color, spark }) => (
  <div style={{ padding: 18, borderRadius: 14, border: `1px solid ${color}38`, background: `linear-gradient(180deg, ${color}10, ${color}02)`, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', insetInlineEnd: -20, top: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${color}25, transparent 65%)`, filter: 'blur(16px)' }}/>
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: `${color}25`, color, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{side}</span>
      </div>
      <div className="font-num metric-glow" style={{ fontSize: 40, fontWeight: 800, color, lineHeight: 1 }}>
        <AnimatedCounter value={value}/> <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>CV</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{carryLabel}</div>
          <div className="font-num" style={{ fontSize: 13, fontWeight: 600, color: carry > 0 ? color : 'var(--text-3)' }}>{carry}</div>
        </div>
        <Sparkline data={spark} width={80} height={28} color={color}/>
      </div>
    </div>
  </div>
);

const DividerWithBalance = ({ left, right }) => {
  const total = left + right;
  const pctL = (left / total) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minWidth: 90 }}>
      <div className="t-eyebrow">التوازن</div>
      <svg viewBox="0 0 80 80" width="80" height="80">
        <defs>
          <linearGradient id="balGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--side-left)"/>
            <stop offset="100%" stopColor="var(--side-right)"/>
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--surface-3)" strokeWidth="3"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="url(#balGrad)" strokeWidth="3"
          strokeDasharray={`${(2*Math.PI*32) * (Math.min(left,right)/Math.max(left,right))} 999`}
          strokeLinecap="round" transform="rotate(-90 40 40)"/>
        <text x="40" y="44" textAnchor="middle" fill="var(--text-1)" fontSize="14" fontWeight="700" fontFamily="var(--font-num)">{Math.round((Math.min(left,right)/Math.max(left,right))*100)}%</text>
      </svg>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>A/B</span>
    </div>
  );
};

window.Dashboard = Dashboard;

/* global React */

/* ============================================================
   EARNINGS — Premium commission breakdown
   ============================================================ */
const EarningsPage = () => {
  const weeks = [3200, 4800, 6200, 5400, 7800, 8200, 6480];
  const labels = ['W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18'];
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Topbar title="الأرباح والعمولات" breadcrumbs={['Credo W', 'المالية', 'الأرباح']}/>
      <div className="page-enter" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Cycle banner */}
        <div className="card-elevated" style={{ padding: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', insetInlineEnd: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,108,246,0.16), transparent)', filter: 'blur(40px)' }}/>
          <div style={{ position: 'relative' }}>
            <div className="t-eyebrow" style={{ color: 'var(--lavender)' }}>الدورة الحالية</div>
            <div className="font-display" style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>دورة 18 · 28 أبريل → 4 مايو</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>تنتهي بعد <strong style={{ color: 'var(--warning)' }}>3 أيام</strong> · الاحتساب يوم الجمعة 23:59</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
            <span className="pill info"><Icon name="rank" size={11}/>Silver · 12% balance rate</span>
            <button className="btn"><Icon name="download" size={12}/>تقرير PDF</button>
          </div>
        </div>

        {/* Big numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <EarnCard t="عمولة مباشرة" v={2400} sub="3 مبيعات · 800 ج.م متوسط" c="var(--lavender)" icon="sparkles"/>
          <EarnCard t="عمولة التوازن" v={3600} sub="210 CV × 17.1 ج.م" c="var(--purple-bright)" icon="cycle"/>
          <EarnCard t="عمولة مستويات" v={480} sub="32 BV × 15 ج.م" c="var(--warning)" icon="layers"/>
          <EarnCard t="الإجمالي" v={6480} sub="/ 30,000 ج.م حد أسبوعي" c="var(--success)" icon="trend-up" big/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>تاريخ العمولات</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>آخر 7 دورات</div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--success)' }}>↑ 24% vs دورة 17</span>
            </div>
            <Bars data={weeks} height={200} cap={9000} capLabel="حد التفعيل" labels={labels}/>
          </div>
          <div className="card" style={{ padding: 22 }}>
            <div className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>تفاصيل التوازن</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['A · يمين', 210, 0, 210, 'var(--side-left)'],
                ['B · يسار', 90, 150, 240, 'var(--side-right)']
              ].map(([label, current, carry, total, color], i) => (
                <div key={i} style={{ padding: 14, borderRadius: 12, background: `${color}10`, border: `1px solid ${color}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                    <span className="font-num" style={{ fontWeight: 800, fontSize: 18, color }}>{total} CV</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
                    <span>الدورة: <span className="font-mono" style={{ color: 'var(--text-1)' }}>{current}</span></span>
                    <span>+ Carry: <span className="font-mono" style={{ color: 'var(--text-1)' }}>{carry}</span></span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: 'var(--info-soft)', border: '1px solid var(--line-purple)', marginTop: 12 }}>
              <div className="t-eyebrow" style={{ color: 'var(--lavender)' }}>Pay Leg المحتسبة</div>
              <div className="font-num" style={{ fontSize: 26, fontWeight: 800, color: 'var(--lavender)', marginTop: 4 }}>210 <span style={{ fontSize: 12, color: 'var(--text-3)' }}>CV</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Carry للدورة التالية: <span className="font-mono">30 CV (left)</span></div>
            </div>
          </div>
        </div>

        {/* Cycles table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>سجل الدورات</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ display: 'flex', padding: 3, background: 'var(--surface-0)', borderRadius: 8, border: '1px solid var(--line)' }}>
                {['أسبوع', 'شهر', 'كل الوقت'].map((l, i) => (
                  <button key={l} style={{ padding: '5px 10px', border: 0, borderRadius: 6, background: i === 0 ? 'var(--surface-2)' : 'transparent', color: i === 0 ? 'var(--text-1)' : 'var(--text-3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <table className="tbl">
            <thead><tr><th>الدورة</th><th>CV يمين</th><th>CV يسار</th><th>متوازن</th><th>المعدل</th><th>عمولة</th><th>الرتبة</th><th>الحالة</th></tr></thead>
            <tbody>
              {[['18', 210, 240, 210, '12%', 6480, 'Silver', 'pending'], ['17', 180, 195, 180, '12%', 5400, 'Silver', 'paid'], ['16', 240, 165, 165, '12%', 4950, 'Silver', 'paid'], ['15', 210, 230, 210, '10%', 5040, 'Bronze', 'paid'], ['14', 150, 145, 145, '10%', 3480, 'Bronze', 'paid']].map(([w, r, l, b, rt, c, rk, s]) => (
                <tr key={w}>
                  <td className="font-mono" style={{ color: 'var(--lavender)', fontWeight: 600 }}>W{w}</td>
                  <td className="font-mono">{r}</td>
                  <td className="font-mono">{l}</td>
                  <td className="font-mono" style={{ color: 'var(--purple-bright)', fontWeight: 700 }}>{b}</td>
                  <td className="font-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{rt}</td>
                  <td className="font-num" style={{ fontWeight: 700 }}>{c.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>ج.م</span></td>
                  <td><span className="pill" style={{ fontSize: 10 }}><span className="dot" style={{ background: rk === 'Silver' ? '#C0C0C0' : '#CD7F32' }}/>{rk}</span></td>
                  <td>{s === 'paid' ? <StatusPill kind="ok" label="مدفوعة"/> : <StatusPill kind="warn" label="معلّقة"/>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const EarnCard = ({ t, v, sub, c, icon, big }) => (
  <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden', ...(big && { borderColor: 'var(--success-edge)' }) }}>
    {big && <div style={{ position: 'absolute', insetInlineEnd: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(43,217,160,0.20), transparent)', filter: 'blur(20px)' }}/>}
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span className="t-eyebrow">{t}</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${c}18`, color: c, display: 'grid', placeItems: 'center', border: `1px solid ${c}30` }}><Icon name={icon} size={12}/></div>
      </div>
      <div className="font-num" style={{ fontSize: big ? 30 : 26, fontWeight: 800, color: c, letterSpacing: '-0.025em' }}>
        <AnimatedCounter value={v}/> <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>ج.م</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{sub}</div>
    </div>
  </div>
);

/* ============================================================
   TEAM
   ============================================================ */
const TeamPage = () => {
  const members = [
    ['أحمد المنصوري', 'USR-103021', 'A', 'Growth', 90, 'active', '12 أبريل', 2400],
    ['فاطمة عيسى', 'USR-103022', 'B', 'Elite', 210, 'active', '14 أبريل', 6800],
    ['محمد سامي', 'USR-104112', 'A', 'Starter', 30, 'active', '18 أبريل', 750],
    ['ليلى حسن', 'USR-104113', 'A', 'Starter', 30, 'inactive', '20 أبريل', 0],
    ['أنس رؤوف', 'USR-104214', 'B', 'Growth', 90, 'active', '22 أبريل', 2400],
    ['كريم فرحات', 'USR-105204', 'A', 'Starter', 30, 'active', '25 أبريل', 600],
    ['مريم نور', 'USR-105420', 'B', 'Growth', 45, 'pending', '28 أبريل', 0],
  ];
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Topbar title="الفريق والإحالات" breadcrumbs={['Credo W', 'الفريق']} onInvite={() => {}}/>
      <div className="page-enter" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[['Active', 64, 'var(--success)', 'circle'], ['Inactive', 14, 'var(--text-3)', 'minus'], ['Pending', 3, 'var(--warning)', 'circle'], ['Total Team', 81, 'var(--lavender)', 'team']].map(([k, v, c, ic], i) => (
            <div key={k} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}18`, color: c, display: 'grid', placeItems: 'center', border: `1px solid ${c}30` }}><Icon name={ic} size={14}/></div>
              <div style={{ flex: 1 }}>
                <div className="t-eyebrow">{k}</div>
                <div className="font-num" style={{ fontSize: 24, fontWeight: 800, color: c, marginTop: 2 }}><AnimatedCounter value={v}/></div>
              </div>
            </div>
          ))}
        </div>

        {/* Referral links */}
        <div className="card-elevated" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', insetInlineEnd: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,108,246,0.14), transparent)', filter: 'blur(40px)' }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div className="t-eyebrow" style={{ color: 'var(--lavender)' }}>روابط الإحالة</div>
                <div className="font-display" style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>شارك رابطك واحصد العمولات</div>
              </div>
              <button className="btn"><Icon name="qr" size={12}/>عرض QR</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { side: 'A', label: 'الجهة A · يمين', color: 'var(--side-left)', url: 'credow.com/r/USR-102458?side=L' },
                { side: 'AUTO', label: 'Auto Spillover', color: 'var(--purple-bright)', url: 'credow.com/r/USR-102458' },
                { side: 'B', label: 'الجهة B · يسار', color: 'var(--side-right)', url: 'credow.com/r/USR-102458?side=R' },
              ].map((r, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 12, background: 'var(--surface-0)', border: `1px solid ${r.color}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.label}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: `${r.color}18`, color: r.color, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.side}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <code style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-page)', fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</code>
                    <button className="btn btn-sm" style={{ padding: 8 }}><Icon name="copy" size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Members table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', padding: 3, background: 'var(--surface-0)', borderRadius: 10, border: '1px solid var(--line)' }}>
              {['إحالاتي المباشرة', 'الفريق الكامل (Genealogy)'].map((l, i) => (
                <button key={l} style={{ padding: '7px 12px', border: 0, borderRadius: 8, fontSize: 12, fontWeight: 600, background: i === 0 ? 'var(--surface-2)' : 'transparent', color: i === 0 ? 'var(--text-1)' : 'var(--text-3)', cursor: 'pointer', boxShadow: i === 0 ? 'inset 0 0 0 1px var(--line-purple)' : 'none', fontFamily: 'var(--font-body)' }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 480 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Icon name="search" size={13} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}/>
                <input className="input" style={{ paddingInlineStart: 36 }} placeholder="بحث..."/>
              </div>
              <button className="btn"><Icon name="filter" size={12}/></button>
            </div>
            <button className="btn btn-primary"><Icon name="plus" size={13}/>إحالة جديدة</button>
          </div>
          <table className="tbl">
            <thead><tr><th>العضو</th><th>الجهة</th><th>الباقة</th><th>CV</th><th>أرباحي منه</th><th>الانضمام</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7B6CF6, #C4B8FF)', display: 'grid', placeItems: 'center', color: '#0A0A0A', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11 }}>{m[0][0]}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m[0]}</div>
                        <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{m[1]}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pill" style={{ background: m[2] === 'A' ? 'var(--side-left-soft)' : 'var(--side-right-soft)', color: m[2] === 'A' ? 'var(--side-left)' : 'var(--side-right)', borderColor: m[2] === 'A' ? 'rgba(196,184,255,0.32)' : 'rgba(107,228,255,0.32)' }}>{m[2]} · {m[2] === 'A' ? 'يمين' : 'يسار'}</span></td>
                  <td>{m[3]}</td>
                  <td className="font-mono" style={{ color: 'var(--lavender)' }}>{m[4]} CV</td>
                  <td className="font-num" style={{ color: m[7] > 0 ? 'var(--success)' : 'var(--text-3)', fontWeight: 600 }}>{m[7] > 0 ? `+${m[7].toLocaleString()}` : '—'} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>ج.م</span></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{m[6]}</td>
                  <td>
                    {m[5] === 'active' && <StatusPill kind="ok" label="نشط"/>}
                    {m[5] === 'inactive' && <StatusPill kind="bad" label="غير نشط"/>}
                    {m[5] === 'pending' && <StatusPill kind="warn" label="معلّق"/>}
                  </td>
                  <td><button className="btn btn-sm"><Icon name="arrow-left" size={11}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   RANKS
   ============================================================ */
const RanksPage = () => {
  const ranks = [
    { name: 'Starter', color: '#9CA3AF', cv: 30, bonus: 'أهلاً بك', achieved: true, current: false },
    { name: 'Bronze', color: '#CD7F32', cv: 90, bonus: '500 ج.م', achieved: true, current: false },
    { name: 'Silver', color: '#C0C0C0', cv: 210, bonus: '2,000 ج.م', achieved: true, current: true },
    { name: 'Gold', color: '#FFB23F', cv: 450, bonus: '5,000 ج.م + رحلة', achieved: false, current: false },
    { name: 'Diamond', color: '#7B6CF6', cv: 1200, bonus: '15,000 ج.م + سيارة', achieved: false, current: false },
    { name: 'Elite', color: '#C4B8FF', cv: 3000, bonus: '50,000 ج.م + شراكة', achieved: false, current: false },
  ];
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Topbar title="الرتب والمكافآت" breadcrumbs={['Credo W', 'الرتب']}/>
      <div className="page-enter" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="card-elevated" style={{ padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', insetInlineEnd: -80, top: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,192,192,0.18), transparent)', filter: 'blur(40px)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <svg viewBox="0 0 100 100" width="100" height="100" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--surface-3)" strokeWidth="5"/>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#silverGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${276 * 0.85} ${276 * 0.15}`}/>
                <defs><linearGradient id="silverGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#C0C0C0"/><stop offset="100%" stopColor="#6E6C8A"/></linearGradient></defs>
              </svg>
              <div style={{ position: 'absolute', inset: 16, borderRadius: 22, background: 'linear-gradient(135deg, #C0C0C0, #6E6C8A)', display: 'grid', placeItems: 'center', color: '#0A0A0A', boxShadow: '0 0 30px rgba(192,192,192,0.30)' }}>
                <Icon name="rank" size={32}/>
              </div>
            </div>
            <div>
              <div className="t-eyebrow">رتبتك الحالية</div>
              <div className="font-display" style={{ fontSize: 36, fontWeight: 800 }}>Silver · فضية</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>تحققت في 18 أبريل · مكافأة 2,000 ج.م مُستحقة</div>
            </div>
          </div>
          <div style={{ textAlign: 'end', position: 'relative' }}>
            <div className="t-eyebrow">الرتبة التالية</div>
            <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--warning)', marginTop: 4 }}>Gold · ذهبية</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>متبقي 240 CV · 85% مكتمل</div>
            <div style={{ width: 280, height: 8, background: 'var(--surface-0)', borderRadius: 4, overflow: 'hidden', marginTop: 12, border: '1px solid var(--line)' }}>
              <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, var(--warning), #FFD180)', boxShadow: '0 0 16px rgba(255,178,63,0.5)' }}/>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>مسار الرتب</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>6 رتب · 3 محقّقة</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ranks.length}, 1fr)`, gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 40, insetInlineStart: '8%', insetInlineEnd: '8%', height: 2, background: 'var(--line)' }}/>
            <div style={{ position: 'absolute', top: 40, insetInlineStart: '8%', width: '34%', height: 2, background: 'linear-gradient(90deg, var(--purple), var(--lavender))', boxShadow: '0 0 10px var(--lavender)' }}/>
            {ranks.map((r) => (
              <div key={r.name} style={{ position: 'relative', textAlign: 'center', padding: '0 8px' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 22, margin: '0 auto 18px',
                  background: r.achieved || r.current ? `linear-gradient(135deg, ${r.color}, ${r.color}88)` : 'var(--surface-2)',
                  border: r.current ? '2px solid #fff' : (r.achieved ? `1px solid ${r.color}` : '1px solid var(--line)'),
                  display: 'grid', placeItems: 'center', color: r.achieved || r.current ? '#0A0A0A' : 'var(--text-3)',
                  boxShadow: r.current ? `0 0 0 4px ${r.color}33, 0 0 30px ${r.color}77` : (r.achieved ? `0 0 16px ${r.color}33` : 'none'),
                  position: 'relative', zIndex: 1,
                }}>
                  {r.achieved && !r.current ? <Icon name="check" size={32} strokeWidth={2.5}/> : r.current ? <Icon name="rank" size={32}/> : <Icon name="lock" size={24}/>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: r.current ? 'var(--lavender)' : (r.achieved ? 'var(--text-1)' : 'var(--text-3)') }}>{r.name}</div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{r.cv} CV / side</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.4 }}>{r.bonus}</div>
                {r.current && <div className="pill info" style={{ marginTop: 8, fontSize: 10 }}><span className="dot"></span>أنت هنا</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.EarningsPage = EarningsPage;
window.TeamPage = TeamPage;
window.RanksPage = RanksPage;

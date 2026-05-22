/* global React */

/* ============================================================
   PREMIUM ADMIN COCKPIT
   Mission-control feel: live ticker, command center, ops cards
   ============================================================ */
const AdminPage = () => {
  const [section, setSection] = useState('overview');
  const [runningCommission, setRunningCommission] = useState(false);
  const [commissionStage, setCommissionStage] = useState(0);

  // Simulate commission run progression
  useEffect(() => {
    if (!runningCommission) return;
    const timer = setInterval(() => {
      setCommissionStage(s => s >= 4 ? (setRunningCommission(false), 0) : s + 1);
    }, 1400);
    return () => clearInterval(timer);
  }, [runningCommission]);

  const sections = [
    { id: 'overview',     l: 'نظرة عامة',         ic: 'cpu' },
    { id: 'users',        l: 'المستخدمون',         ic: 'team' },
    { id: 'commissions',  l: 'دورات العمولات',     ic: 'cycle' },
    { id: 'withdrawals',  l: 'طلبات السحب',        ic: 'upload' },
    { id: 'cmoney',       l: 'منح C Money',        ic: 'wallet' },
    { id: 'vouchers',     l: 'Vouchers',          ic: 'voucher' },
    { id: 'ranks',        l: 'الرتب',              ic: 'rank' },
    { id: 'audit',        l: 'Audit Log',         ic: 'shield' },
  ];

  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      <Topbar title="Admin Cockpit" breadcrumbs={['Credo W', 'الإدارة', 'لوحة التحكم']}/>

      <div className="page-enter" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Section nav */}
        <div className="card" style={{ padding: 8, display: 'flex', gap: 4, flexWrap: 'wrap', overflowX: 'auto' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              padding: '8px 14px', borderRadius: 8, border: 0,
              background: section === s.id ? 'var(--surface-3)' : 'transparent',
              color: section === s.id ? 'var(--lavender)' : 'var(--text-2)',
              boxShadow: section === s.id ? 'inset 0 0 0 1px var(--line-purple)' : 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
              display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 150ms',
              whiteSpace: 'nowrap'
            }}>
              <Icon name={s.ic} size={13}/>{s.l}
            </button>
          ))}
        </div>

        {section === 'overview' && <AdminOverview onStartRun={() => { setRunningCommission(true); setCommissionStage(0); }} running={runningCommission} stage={commissionStage}/>}
        {section === 'users' && <AdminUsers/>}
        {section === 'commissions' && <AdminCommissions onRun={() => { setRunningCommission(true); setCommissionStage(0); }} running={runningCommission} stage={commissionStage}/>}
        {section === 'withdrawals' && <AdminWithdrawals/>}
        {section === 'cmoney' && <AdminCMoney/>}
        {section === 'vouchers' && <AdminVouchers/>}
        {section === 'ranks' && <AdminRanks/>}
        {section === 'audit' && <AdminAudit/>}
      </div>
    </div>
  );
};

/* ============================================================
   OVERVIEW
   ============================================================ */
const AdminOverview = ({ onStartRun, running, stage }) => (
  <>
    {/* KPI grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      <KPI label="مسوّقون نشطاء" value={12480} sub="↑ 8% هذا الأسبوع" color="var(--lavender)" icon="team" spark={[10200,10800,11200,11600,11900,12200,12480]}/>
      <KPI label="عمولات مدفوعة (ج.م)" value={3400000} format="M" sub="آخر 30 يوم" color="var(--success)" icon="trend-up" spark={[2.4,2.6,2.9,3.1,3.2,3.3,3.4]}/>
      <KPI label="رصيد C Money الإجمالي" value={1860000} format="K" sub="∑ كل المحافظ" color="var(--electric)" icon="coin" spark={[1.5,1.6,1.65,1.7,1.75,1.82,1.86]}/>
      <KPI label="طلبات سحب معلّقة" value={42} sub="↓ 12 منذ أمس" color="var(--warning)" icon="upload" spark={[58,54,52,48,46,44,42]}/>
    </div>

    {/* Commission run command center + Live ticker */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
      {/* Commission run */}
      <div className="card-elevated" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', insetInlineEnd: -80, top: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,108,246,0.18), transparent 65%)', filter: 'blur(40px)' }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, position: 'relative' }}>
          <div>
            <div className="t-eyebrow" style={{ color: 'var(--lavender)' }}>Commission Engine</div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>تشغيل دورة العمولات الأسبوعية</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>دورة 18 · 28 أبريل → 4 مايو · 12,480 مسوّق</div>
          </div>
          <button onClick={onStartRun} disabled={running} className={running ? 'btn' : 'btn btn-primary'} style={{ ...(running && { background: 'var(--surface-3)' }) }}>
            {running ? <><Icon name="cycle" size={14} style={{ animation: 'orbit 1.5s linear infinite' }}/>قيد التشغيل...</> : <><Icon name="play" size={14}/>تشغيل الدورة</>}
          </button>
        </div>

        {/* Pre-flight checks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18, position: 'relative' }}>
          {[
            ['BV credited', true, 'كل عمليات BV معتمدة'],
            ['No overlap', true, 'لا تداخل في الفترات'],
            ['Lock acquired', running, 'Redis lock نشط']
          ].map(([t, ok, sub], i) => (
            <div key={i} style={{ padding: 12, borderRadius: 10, background: ok ? 'var(--success-soft)' : 'var(--surface-0)', border: `1px solid ${ok ? 'var(--success-edge)' : 'var(--line)'}`, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: ok ? 'var(--success)' : 'var(--surface-2)', display: 'grid', placeItems: 'center', color: '#051A12', flexShrink: 0 }}>
                {ok ? <Icon name="check" size={12} strokeWidth={2.5}/> : <Icon name="circle" size={10}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline stages */}
        <div style={{ position: 'relative', padding: 16, borderRadius: 12, background: 'var(--surface-0)', border: '1px solid var(--line)' }}>
          <div className="t-eyebrow" style={{ marginBottom: 14 }}>مراحل التنفيذ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, insetInlineStart: '10%', insetInlineEnd: '10%', height: 2, background: 'var(--surface-2)' }}/>
            <div style={{ position: 'absolute', top: 12, insetInlineStart: '10%', width: `${stage * 20}%`, height: 2, background: 'linear-gradient(90deg, var(--purple), var(--lavender))', transition: 'width 800ms var(--ease-out)' }}/>
            {[
              ['Calculate BV', 'cycle'],
              ['Fan-out users', 'team'],
              ['Apply carry', 'corner-up-right'],
              ['Credit wallets', 'wallet'],
              ['Notify users', 'bell'],
            ].map(([t, ic], i) => {
              const active = stage > i, current = stage === i + 1 && running;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 12, display: 'grid', placeItems: 'center',
                    background: active ? 'var(--success)' : current ? 'var(--purple)' : 'var(--surface-2)',
                    color: active ? '#051A12' : current ? '#fff' : 'var(--text-3)',
                    border: '2px solid var(--surface-1)',
                    boxShadow: current ? '0 0 0 4px rgba(123,108,246,0.30), 0 0 20px var(--purple)' : 'none',
                    transition: 'all 400ms'
                  }}>
                    {active ? <Icon name="check" size={11} strokeWidth={3}/> : current ? <Icon name={ic} size={11} style={{ animation: 'orbit 1.5s linear infinite' }}/> : <Icon name={ic} size={11}/>}
                  </div>
                  <div style={{ fontSize: 10, color: active || current ? 'var(--text-1)' : 'var(--text-3)', fontWeight: current ? 700 : 500, textAlign: 'center' }}>{t}</div>
                </div>
              );
            })}
          </div>
        </div>

        {running && (
          <div className="anim-fade-up" style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--info-soft)', border: '1px solid var(--info-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="cpu" size={14} style={{ color: 'var(--lavender)' }}/>
              <span style={{ fontSize: 12 }}>معالجة <span className="font-mono">{Math.floor((stage / 5) * 12480).toLocaleString()}</span> / 12,480 مسوّق</span>
            </div>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--lavender)' }}>{Math.floor((stage / 5) * 100)}%</span>
          </div>
        )}
      </div>

      {/* Live ticker */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="font-display" style={{ fontSize: 14, fontWeight: 700 }}>Live Ops Ticker</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>System Events · Real-time</div>
          </div>
          <span className="pill live"><span className="dot"></span>LIVE</span>
        </div>
        <div style={{ padding: '8px 10px', maxHeight: 360, overflowY: 'auto' }}>
          {[
            { sev: 'info', msg: 'مسوّق جديد سُجّل', meta: 'USR-105532 · جهة A', ic: 'plus', t: '2s' },
            { sev: 'success', msg: 'تحويل C Money', meta: '250 C · USR-102458 → USR-103021', ic: 'send', t: '8s' },
            { sev: 'success', msg: 'عملية شراء', meta: 'PRD-001 · 950 ج.م · +9 BV', ic: 'shop', t: '14s' },
            { sev: 'warn', msg: 'محاولة PIN فاشلة', meta: 'USR-104112 · الثالثة', ic: 'shield', t: '32s' },
            { sev: 'info', msg: 'طلب سحب جديد', meta: '1,500 ج.م · USR-103022', ic: 'upload', t: '1m' },
            { sev: 'success', msg: 'BV processed', meta: 'Fan-out: 4 ancestors · order #1248', ic: 'tree', t: '2m' },
            { sev: 'success', msg: 'دورة 18 معدّة', meta: '12,480 مسوّق نشط', ic: 'cycle', t: '5m' },
            { sev: 'info', msg: 'ترقية رتبة', meta: 'USR-100204 → Diamond', ic: 'rank', t: '8m' },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 8, transition: 'background 120ms' }}
              onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(196,184,255,0.04)'}
              onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0,
                background: e.sev === 'success' ? 'var(--success-soft)' : e.sev === 'warn' ? 'var(--warning-soft)' : 'var(--info-soft)',
                color: e.sev === 'success' ? 'var(--success)' : e.sev === 'warn' ? 'var(--warning)' : 'var(--lavender)',
                border: '1px solid var(--line)'
              }}>
                <Icon name={e.ic} size={11}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{e.msg}</div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{e.meta}</div>
              </div>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-4)', flexShrink: 0 }}>{e.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Activity heatmap + ops shortcuts */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>خريطة النشاط · آخر 4 أسابيع</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>عدد المعاملات يومياً (Y) × ساعة (X)</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, color: 'var(--text-3)' }}>
            أقل
            <div style={{ display: 'flex', gap: 2 }}>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => <span key={o} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(123,108,246,${o})` }}/>)}
            </div>
            أكثر
          </div>
        </div>
        {/* Heatmap */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(24, 1fr)', gap: 2 }}>
          {['أحد', 'إثن', 'ثلا', 'أرب', 'خمس', 'جمع', 'سبت'].map((d, di) => (
            <React.Fragment key={d}>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-3)', display: 'flex', alignItems: 'center', paddingInlineEnd: 6 }}>{d}</div>
              {Array.from({length: 24}).map((_, hi) => {
                const seed = (di * 17 + hi * 7) % 100;
                let intensity = 0.05;
                if (hi >= 9 && hi <= 22) intensity = (seed / 100) * 0.85 + 0.05;
                if (hi >= 18 && hi <= 21) intensity = Math.min(1, intensity * 1.5);
                return <div key={hi} style={{ aspectRatio: '1/1', borderRadius: 2, background: `rgba(123,108,246,${intensity.toFixed(2)})` }} title={`${d} ${hi}:00 · ${Math.floor(intensity * 240)} txn`}/>;
              })}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-3)', marginTop: 8, paddingInlineStart: 36 }}>
          <span>0</span><span>6</span><span>12</span><span>18</span><span>23</span>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="font-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>اختصارات سريعة</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['منح C Money يدوياً', 'plus', 'var(--lavender)'],
            ['موافقة على سحوبات', 'check', 'var(--success)'],
            ['توليد Voucher', 'voucher', 'var(--warning)'],
            ['تحديث إعدادات النظام', 'settings', 'var(--text-2)'],
            ['تصدير تقرير شامل', 'download', 'var(--electric)'],
          ].map(([l, ic, c], i) => (
            <button key={i} className="btn" style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--surface-0)' }}>
              <Icon name={ic} size={13} style={{ color: c }}/>{l}
            </button>
          ))}
        </div>
      </div>
    </div>
  </>
);

/* ============================================================
   USERS
   ============================================================ */
const AdminUsers = () => (
  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
    <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>المستخدمون</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>12,480 إجمالي · 11,940 نشط · 540 معلّق</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}/>
          <input className="input" style={{ paddingInlineStart: 36, width: 260 }} placeholder="ابحث بالاسم أو ID..."/>
        </div>
        <button className="btn btn-sm"><Icon name="filter" size={12}/>الكل</button>
        <button className="btn btn-sm"><Icon name="download" size={12}/>تصدير</button>
      </div>
    </div>
    <table className="tbl">
      <thead><tr><th>المستخدم</th><th>الباقة</th><th>الرتبة</th><th>محفظة C</th><th>أرباح الدورة</th><th>الانضمام</th><th>الحالة</th><th></th></tr></thead>
      <tbody>
        {[
          ['أحمد المنصوري', 'USR-102458', 'Elite', 'Silver', 2450, 6480, '14 مارس', 'active', '#7B6CF6'],
          ['فاطمة عيسى', 'USR-100204', 'Elite', 'Gold', 5200, 14200, '02 فبراير', 'active', '#C4B8FF'],
          ['سامي حسن', 'USR-099821', 'Growth', 'Bronze', 840, 2100, '20 يناير', 'suspended', '#FFB23F'],
          ['ليلى كمال', 'USR-103021', 'Starter', '—', 120, 0, '12 أبريل', 'pending', '#6BE4FF'],
          ['محمد رؤوف', 'USR-104112', 'Growth', 'Bronze', 1800, 3400, '20 أبريل', 'active', '#7B6CF6'],
          ['مريم نور', 'USR-105420', 'Growth', '—', 540, 1100, '24 أبريل', 'active', '#C4B8FF'],
        ].map((u, i) => (
          <tr key={i}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${u[8]}, ${u[8]}88)`, display: 'grid', placeItems: 'center', color: '#0A0A0A', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11 }}>{u[0][0]}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{u[0]}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{u[1]}</div>
                </div>
              </div>
            </td>
            <td>{u[2]}</td>
            <td><span className="pill" style={{ fontSize: 10 }}><span className="dot" style={{ background: u[3] === 'Gold' ? '#FFB23F' : u[3] === 'Silver' ? '#C0C0C0' : '#CD7F32' }}/>{u[3]}</span></td>
            <td className="font-num" style={{ color: 'var(--lavender)', fontWeight: 600 }}>{u[4].toLocaleString()} C</td>
            <td className="font-num" style={{ fontWeight: 600 }}>{u[5].toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>ج.م</span></td>
            <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{u[6]}</td>
            <td>
              {u[7] === 'active' && <StatusPill kind="ok" label="نشط"/>}
              {u[7] === 'suspended' && <StatusPill kind="bad" label="موقوف"/>}
              {u[7] === 'pending' && <StatusPill kind="warn" label="معلّق"/>}
            </td>
            <td><button className="btn btn-sm"><Icon name="arrow-left" size={11}/></button></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ============================================================
   COMMISSIONS
   ============================================================ */
const AdminCommissions = ({ onRun, running, stage }) => (
  <>
    <AdminOverview onStartRun={onRun} running={running} stage={stage}/>
  </>
);

/* ============================================================
   WITHDRAWALS
   ============================================================ */
const AdminWithdrawals = () => (
  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
    <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>طلبات السحب</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>42 معلّق · إجمالي 145,200 ج.م</div>
      </div>
      <button className="btn btn-primary"><Icon name="check" size={12}/>الموافقة المجمّعة</button>
    </div>
    <table className="tbl">
      <thead><tr><th>الرقم المرجعي</th><th>المستخدم</th><th>المبلغ</th><th>طريقة الدفع</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead>
      <tbody>
        {[
          ['WD-2041', 'فاطمة عيسى', 'USR-100204', 8500, 'InstaPay', '01 مايو', 'requested'],
          ['WD-2040', 'أحمد المنصوري', 'USR-102458', 4200, 'بنك CIB', '01 مايو', 'requested'],
          ['WD-2038', 'محمد رؤوف', 'USR-104112', 1800, 'Vodafone Cash', '30 أبريل', 'processing'],
          ['WD-2035', 'مريم نور', 'USR-105420', 950, 'InstaPay', '29 أبريل', 'paid'],
          ['WD-2032', 'سامي حسن', 'USR-099821', 2100, 'بنك NBE', '28 أبريل', 'rejected'],
        ].map((w, i) => (
          <tr key={i}>
            <td className="font-mono" style={{ color: 'var(--lavender)', fontSize: 12 }}>{w[0]}</td>
            <td><div style={{ fontWeight: 600 }}>{w[1]}</div><div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{w[2]}</div></td>
            <td className="font-num" style={{ fontWeight: 700, fontSize: 15 }}>{w[3].toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>ج.م</span></td>
            <td>{w[4]}</td>
            <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{w[5]}</td>
            <td>
              {w[6] === 'requested' && <StatusPill kind="warn" label="مطلوب"/>}
              {w[6] === 'processing' && <StatusPill kind="info" label="قيد المعالجة"/>}
              {w[6] === 'paid' && <StatusPill kind="ok" label="مدفوع"/>}
              {w[6] === 'rejected' && <StatusPill kind="bad" label="مرفوض"/>}
            </td>
            <td>
              {w[6] === 'requested' && <div style={{ display: 'flex', gap: 4 }}><button className="btn btn-sm btn-success" style={{ padding: '4px 8px' }}>صرف</button><button className="btn btn-sm" style={{ padding: '4px 8px' }}>رفض</button></div>}
              {w[6] !== 'requested' && <button className="btn btn-sm">عرض</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AdminCMoney = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14 }}>
    <div className="card" style={{ padding: 22 }}>
      <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>منح / خصم C Money</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 18 }}>كل عملية تُسجّل في Audit Log إلزامياً</div>
      <label className="field" style={{ marginBottom: 12 }}><span>User ID</span><input className="input font-mono" placeholder="USR-XXXXXX"/></label>
      <label className="field" style={{ marginBottom: 12 }}><span>العملية</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn" style={{ background: 'var(--success-soft)', color: 'var(--success)', borderColor: 'var(--success-edge)' }}><Icon name="plus" size={12}/>منح</button>
          <button className="btn" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', borderColor: 'var(--danger-edge)' }}><Icon name="minus" size={12}/>خصم</button>
        </div>
      </label>
      <label className="field" style={{ marginBottom: 12 }}><span>المبلغ</span><input className="input font-num" placeholder="0"/></label>
      <label className="field" style={{ marginBottom: 14 }}><span>السبب · إلزامي</span><textarea className="input" rows="3" placeholder="اشرح السبب..."/></label>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Icon name="shield" size={12}/>تنفيذ مع التسجيل</button>
    </div>
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
        <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>آخر عمليات الإدارة</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>مسجلّ في Audit Log</div>
      </div>
      <table className="tbl">
        <thead><tr><th>الأدمن</th><th>العملية</th><th>المستخدم</th><th>المبلغ</th><th>السبب</th><th>التاريخ</th></tr></thead>
        <tbody>
          {[
            ['أ. سامي', 'منح', 'USR-102458', '+500', 'تعويض خطأ نظام', '01 مايو'],
            ['أ. منى', 'خصم', 'USR-103021', '−120', 'استرداد مكرر', '30 أبريل'],
            ['أ. سامي', 'منح', 'USR-099821', '+1000', 'مكافأة حدث', '29 أبريل'],
          ].map((r, i) => (
            <tr key={i}>
              <td style={{ fontSize: 12 }}>{r[0]}</td>
              <td><span className={`pill ${r[1] === 'منح' ? 'ok' : 'bad'}`} style={{ fontSize: 10 }}>{r[1]}</span></td>
              <td className="font-mono" style={{ fontSize: 11 }}>{r[2]}</td>
              <td className="font-num" style={{ fontWeight: 700, color: r[3].includes('+') ? 'var(--success)' : 'var(--danger)' }}>{r[3]} C</td>
              <td style={{ fontSize: 11, color: 'var(--text-2)' }}>{r[4]}</td>
              <td style={{ color: 'var(--text-3)', fontSize: 11 }}>{r[5]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AdminVouchers = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 14 }}>
    <div className="card" style={{ padding: 22 }}>
      <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>توليد Voucher جديد</div>
      <label className="field" style={{ marginBottom: 12 }}><span>نوع الخصم</span><select className="select"><option>مبلغ ثابت (ج.م)</option><option>نسبة %</option></select></label>
      <label className="field" style={{ marginBottom: 12 }}><span>القيمة</span><input className="input font-num" placeholder="200"/></label>
      <label className="field" style={{ marginBottom: 12 }}><span>عدد الاستخدامات</span><input className="input font-num" placeholder="100"/></label>
      <label className="field" style={{ marginBottom: 14 }}><span>تاريخ الانتهاء</span><input className="input" type="date"/></label>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Icon name="voucher" size={12}/>توليد الكود</button>
    </div>
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="tbl">
        <thead><tr><th>الكود</th><th>الخصم</th><th>الاستخدامات</th><th>الانتهاء</th><th>الحالة</th></tr></thead>
        <tbody>
          {[['CREDO-MAY100', '100 ج.م', '42 / 100', '15 مايو', 'ok', 'نشط'], ['SPRING25', '25%', '98 / 100', '7 مايو', 'warn', 'شبه منتهٍ'], ['WELCOME50', '50 ج.م', '100 / 100', '—', 'bad', 'مستنفد'], ['LAUNCH200', '200 ج.م', '12 / 50', '30 يونيو', 'ok', 'نشط']].map((v, i) => (
            <tr key={i}><td className="font-mono" style={{ color: 'var(--lavender)', fontWeight: 700 }}>{v[0]}</td><td className="font-num" style={{ fontWeight: 700 }}>{v[1]}</td><td className="font-mono" style={{ fontSize: 12 }}>{v[2]}</td><td style={{ color: 'var(--text-3)', fontSize: 12 }}>{v[3]}</td><td><StatusPill kind={v[4]} label={v[5]}/></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AdminRanks = () => (
  <div className="card" style={{ padding: 60, textAlign: 'center' }}>
    <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 16, background: 'var(--info-soft)', display: 'grid', placeItems: 'center', color: 'var(--lavender)', border: '1px solid var(--line-purple)' }}><Icon name="rank" size={32}/></div>
    <div className="font-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>إدارة الرتب والمكافآت</div>
    <div style={{ color: 'var(--text-2)', fontSize: 13, maxWidth: 420, margin: '0 auto' }}>تعديل شروط الرتب (CV، الإحالات المباشرة، PBV)، منح/إلغاء مكافآت يدوياً، تخصيص حد العمولات الأسبوعي لكل رتبة.</div>
  </div>
);

const AdminAudit = () => (
  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
    <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>Audit Log</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>كل عملية مالية أو إدارية مسجّلة بـ before/after</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select className="select" style={{ width: 'auto' }}><option>كل الأنواع</option><option>عمولات</option><option>سحب</option><option>منح يدوي</option></select>
        <button className="btn btn-sm"><Icon name="download" size={12}/>Export</button>
      </div>
    </div>
    <table className="tbl">
      <thead><tr><th>المرجع</th><th>الفاعل</th><th>الإجراء</th><th>الكيان</th><th>السبب</th><th>IP</th><th>التاريخ</th></tr></thead>
      <tbody>
        {[
          ['AUD-9032', 'أ. سامي', 'CMONEY_GRANT', 'USR-102458', 'تعويض خطأ نظام', '102.41.x.x', '01 مايو 22:14'],
          ['AUD-9031', 'SYSTEM', 'COMMISSION_RUN', 'Cycle-17', 'auto-trigger', '—', '01 مايو 00:01'],
          ['AUD-9030', 'أ. منى', 'WITHDRAWAL_APPROVE', 'WD-2038', 'verified bank account', '102.41.x.x', '30 أبريل 16:42'],
          ['AUD-9029', 'أ. سامي', 'USER_SUSPEND', 'USR-099821', 'مخالفة شروط الاستخدام', '102.41.x.x', '30 أبريل 11:30'],
        ].map((a, i) => (
          <tr key={i}>
            <td className="font-mono" style={{ color: 'var(--lavender)', fontSize: 12 }}>{a[0]}</td>
            <td style={{ fontSize: 12, fontWeight: 600 }}>{a[1]}</td>
            <td><span className="pill info" style={{ fontSize: 10 }}>{a[2]}</span></td>
            <td className="font-mono" style={{ fontSize: 11 }}>{a[3]}</td>
            <td style={{ fontSize: 11, color: 'var(--text-2)' }}>{a[4]}</td>
            <td className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{a[5]}</td>
            <td style={{ color: 'var(--text-3)', fontSize: 11 }}>{a[6]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ============================================================
   Reusable KPI
   ============================================================ */
const KPI = ({ label, value, sub, color, icon, spark, format }) => {
  const fmt = format === 'M' ? v => (v / 1e6).toFixed(2) + 'M' : format === 'K' ? v => (v / 1e3).toFixed(0) + 'K' : v => v.toLocaleString();
  return (
    <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', insetInlineEnd: -30, top: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${color}25, transparent)`, filter: 'blur(20px)' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span className="t-eyebrow">{label}</span>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}18`, color, display: 'grid', placeItems: 'center', border: `1px solid ${color}30` }}><Icon name={icon} size={12}/></div>
        </div>
        <div className="font-num" style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.025em' }}>{fmt(value)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{sub}</span>
          <Sparkline data={spark} width={60} height={20} color={color} glow/>
        </div>
      </div>
    </div>
  );
};

window.AdminPage = AdminPage;

/* global React */

/* ============================================================
   PREMIUM DUAL WALLET — Earnings + C Money
   Revolut/Apple Pay-level wallet experience
   ============================================================ */
const WalletPage = ({ onNav }) => {
  const [activeWallet, setActiveWallet] = useState('cmoney'); // 'cmoney' | 'earnings'
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [pinShake, setPinShake] = useState(false);

  const cmoneyBal = 2450;
  const earningsBal = 6480;

  const reset = () => { setStep(0); setRecipient(''); setAmount(''); setPin(''); };

  const tx = [
    { id: 'TRX-1004', from: 'USR-102458', fromName: 'أنت', to: 'USR-103021', toName: 'محمد سامي', amt: -250, date: '01 مايو 22:14', status: 'success', wallet: 'cmoney', category: 'TRANSFER_OUT' },
    { id: 'TRX-1003', from: 'USR-991204', fromName: 'سارة عبد الله', to: 'USR-102458', toName: 'أنت', amt: +500, date: '01 مايو 09:32', status: 'success', wallet: 'cmoney', category: 'TRANSFER_IN' },
    { id: 'CMS-892',  from: 'SYSTEM', fromName: 'نظام Credo', to: 'USR-102458', toName: 'أنت', amt: +1200, date: '29 أبريل 23:59', status: 'success', wallet: 'earnings', category: 'TEAM_COMMISSION' },
    { id: 'TRX-1002', from: 'USR-102458', fromName: 'أنت', to: 'USR-104112', toName: 'يارا كمال', amt: -120, date: '30 أبريل 18:01', status: 'success', wallet: 'cmoney', category: 'TRANSFER_OUT' },
    { id: 'DIR-445',  from: 'SYSTEM', fromName: 'عمولة مباشرة', to: 'USR-102458', toName: 'أنت', amt: +400, date: '30 أبريل 14:55', status: 'success', wallet: 'earnings', category: 'DIRECT_COMMISSION' },
    { id: 'TRX-1001', from: 'USR-102458', fromName: 'أنت', to: 'USR-XXXX', toName: '—', amt: -800, date: '30 أبريل 14:55', status: 'rejected', wallet: 'cmoney', category: 'TRANSFER_OUT' },
    { id: 'TRX-0999', from: 'USR-102458', fromName: 'أنت', to: 'USR-103022', toName: 'فاطمة عيسى', amt: -75, date: '29 أبريل 11:12', status: 'pending', wallet: 'cmoney', category: 'TRANSFER_OUT' },
  ];

  const filteredTx = tx.filter(t => activeWallet === 'all' || t.wallet === activeWallet);

  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      <Topbar title="المحفظة الذكية" breadcrumbs={['Credo W', 'المالية', 'المحفظة']} />

      <div className="page-enter" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ────────────── DUAL WALLET CARDS ────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <WalletCard
            type="cmoney"
            active={activeWallet === 'cmoney'}
            onClick={() => setActiveWallet('cmoney')}
            balance={cmoneyBal}
            label="C Money Wallet"
            subtitle="محفظة التحويلات الداخلية"
            currency="C"
            gradient="linear-gradient(135deg, #1A1A2E 0%, #2D1F5C 50%, #7B6CF6 130%)"
            accentColor="#C4B8FF"
            onTransfer={() => setStep(1)}
            stats={[
              ['الواردة شهرياً', '+1,700', 'C'],
              ['الصادرة شهرياً', '−1,170', 'C'],
              ['عدد العمليات', '24', ''],
            ]}
          />
          <WalletCard
            type="earnings"
            active={activeWallet === 'earnings'}
            onClick={() => setActiveWallet('earnings')}
            balance={earningsBal}
            label="Earnings Wallet"
            subtitle="محفظة الأرباح والعمولات"
            currency="ج.م"
            gradient="linear-gradient(135deg, #0A1F1A 0%, #1B4F3F 50%, #2BD9A0 130%)"
            accentColor="#2BD9A0"
            onTransfer={() => onNav('earnings')}
            stats={[
              ['عمولة مباشرة', '+2,400', 'ج.م'],
              ['عمولة توازن', '+3,600', 'ج.م'],
              ['عمولة مستويات', '+480', 'ج.م'],
            ]}
          />
        </div>

        {/* ────────────── ACTION GRID + TRANSFER FLOW ────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: step === 0 ? '1fr' : '1fr 540px', gap: 16, transition: 'all 300ms var(--ease-out)' }}>

          {/* Actions + Transactions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Action buttons */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { icon: 'send', label: 'تحويل', sub: 'C Money', action: () => setStep(1), primary: true },
                  { icon: 'download', label: 'استلام', sub: 'QR + Link' },
                  { icon: 'upload', label: 'سحب', sub: 'للحساب البنكي' },
                  { icon: 'cycle', label: 'تبادل', sub: 'بين المحافظ' },
                  { icon: 'shield', label: 'PIN', sub: 'تعديل / إعادة' },
                ].map((a, i) => (
                  <button key={i} onClick={a.action} className={`card card-interactive`} style={{
                    padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    background: a.primary ? 'linear-gradient(180deg, rgba(123,108,246,0.15), rgba(123,108,246,0.04))' : 'var(--surface-0)',
                    borderColor: a.primary ? 'var(--line-purple)' : 'var(--line)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: a.primary ? 'var(--lavender)' : 'var(--text-2)', border: '1px solid var(--line)' }}>
                      <Icon name={a.icon} size={16}/>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{a.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions log */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>سجل العمليات</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{filteredTx.length} عملية · آخر 30 يوماً</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ display: 'flex', padding: 3, background: 'var(--surface-0)', borderRadius: 8, border: '1px solid var(--line)' }}>
                    {[['cmoney', 'C Money'], ['earnings', 'الأرباح'], ['all', 'الكل']].map(([id, l]) => (
                      <button key={id} onClick={() => setActiveWallet(id)} style={{
                        padding: '6px 10px', border: 0, borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: activeWallet === id ? 'var(--surface-2)' : 'transparent',
                        color: activeWallet === id ? 'var(--text-1)' : 'var(--text-3)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)'
                      }}>{l}</button>
                    ))}
                  </div>
                  <button className="btn btn-sm"><Icon name="download" size={11}/>CSV</button>
                </div>
              </div>
              <div>
                {filteredTx.map(t => (
                  <TransactionRow key={t.id} tx={t}/>
                ))}
              </div>
            </div>
          </div>

          {/* Transfer flow side panel */}
          {step > 0 && (
            <div className="card anim-scale-in" style={{ padding: 0, alignSelf: 'start', position: 'sticky', top: 100, overflow: 'hidden' }}>
              <TransferFlow
                step={step} setStep={setStep}
                recipient={recipient} setRecipient={setRecipient}
                amount={amount} setAmount={setAmount}
                pin={pin} setPin={setPin}
                pinShake={pinShake} setPinShake={setPinShake}
                balance={cmoneyBal} onClose={reset}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   PREMIUM WALLET CARD — animated, layered
   ============================================================ */
const WalletCard = ({ type, active, onClick, balance, label, subtitle, currency, gradient, accentColor, onTransfer, stats }) => (
  <div onClick={onClick} style={{
    position: 'relative', borderRadius: 24, overflow: 'hidden', padding: 24,
    background: gradient,
    border: active ? `1px solid ${accentColor}66` : '1px solid rgba(255,255,255,0.08)',
    boxShadow: active
      ? `0 0 0 1px ${accentColor}55, 0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${accentColor}33`
      : '0 12px 32px rgba(0,0,0,0.4)',
    minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    cursor: 'pointer', transition: 'all 280ms var(--ease-out)',
    transform: active ? 'translateY(-2px)' : 'none'
  }}>
    <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}/>
    {/* Floating orb */}
    <div style={{ position: 'absolute', insetInlineEnd: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}40, transparent 65%)`, filter: 'blur(36px)' }}/>
    {/* Holographic ribbon */}
    <div style={{ position: 'absolute', insetInlineEnd: -120, bottom: -40, width: 280, height: 80, background: `linear-gradient(90deg, transparent, ${accentColor}15, transparent)`, transform: 'rotate(-12deg)', filter: 'blur(20px)' }}/>

    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="lock" size={11}/>{subtitle}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {active && <span style={{ width: 8, height: 8, borderRadius: 4, background: accentColor, boxShadow: `0 0 12px ${accentColor}` }}/>}
        <Logo size="sm"/>
      </div>
    </div>

    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>الرصيد المتاح</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="font-num" style={{ fontSize: 56, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', textShadow: `0 0 32px ${accentColor}88`, lineHeight: 1 }}>
          <AnimatedCounter value={balance}/>
        </span>
        <span style={{ fontSize: 18, fontWeight: 700, color: accentColor }}>{currency}</span>
      </div>
      {type === 'cmoney' && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>≈ {balance.toLocaleString()} ج.م</div>}
    </div>

    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: 18, fontSize: 10 }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>{s[0]}</div>
            <div className="font-num" style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginTop: 2 }}>{s[1]} <span style={{ fontSize: 9, opacity: 0.6 }}>{s[2]}</span></div>
          </div>
        ))}
      </div>
      {type === 'cmoney' && (
        <button onClick={(e) => { e.stopPropagation(); onTransfer(); }} className="btn btn-sm" style={{ background: '#fff', color: '#0A0A0A', border: 0, fontWeight: 700 }}>
          <Icon name="send" size={12}/>تحويل
        </button>
      )}
      {type === 'earnings' && (
        <button onClick={(e) => { e.stopPropagation(); onTransfer(); }} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.20)' }}>
          <Icon name="upload" size={12}/>سحب
        </button>
      )}
    </div>

    {/* Card chip texture */}
    <div style={{ position: 'absolute', top: 88, insetInlineEnd: 26, width: 28, height: 22, borderRadius: 4, background: 'linear-gradient(135deg, rgba(255,215,140,0.35), rgba(255,215,140,0.12))', border: '1px solid rgba(255,215,140,0.25)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: 1, padding: 2 }}>
      {[0,1,2,3,4,5,6,7,8].map(i => <span key={i} style={{ background: 'rgba(255,215,140,0.30)' }}/>)}
    </div>
  </div>
);

/* ============================================================
   TRANSACTION ROW
   ============================================================ */
const TransactionRow = ({ tx }) => {
  const out = tx.amt < 0;
  const catLabel = {
    'TRANSFER_OUT': 'تحويل صادر',
    'TRANSFER_IN': 'تحويل وارد',
    'TEAM_COMMISSION': 'عمولة توازن',
    'DIRECT_COMMISSION': 'عمولة مباشرة'
  }[tx.category] || tx.category;
  const catIcon = {
    'TRANSFER_OUT': 'send', 'TRANSFER_IN': 'arrow-down',
    'TEAM_COMMISSION': 'trend-up', 'DIRECT_COMMISSION': 'sparkles'
  }[tx.category] || 'circle';
  const catColor = tx.category === 'TEAM_COMMISSION' || tx.category === 'DIRECT_COMMISSION'
    ? 'var(--success)'
    : out ? 'var(--danger)' : 'var(--lavender)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--line-soft)', transition: 'background 120ms' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,184,255,0.025)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: catColor, flexShrink: 0, border: '1px solid var(--line)' }}>
        <Icon name={catIcon} size={15}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{catLabel}</span>
            <span className="pill" style={{ fontSize: 9, padding: '1px 6px', background: tx.wallet === 'cmoney' ? 'var(--info-soft)' : 'var(--success-soft)', color: tx.wallet === 'cmoney' ? 'var(--lavender)' : 'var(--success)', borderColor: tx.wallet === 'cmoney' ? 'var(--info-edge)' : 'var(--success-edge)' }}>{tx.wallet === 'cmoney' ? 'C Money' : 'Earnings'}</span>
          </div>
          <span className="font-num" style={{ fontSize: 15, fontWeight: 700, color: tx.amt > 0 ? 'var(--success)' : 'var(--text-1)' }}>
            {tx.amt > 0 ? '+' : ''}{Math.abs(tx.amt).toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{tx.wallet === 'cmoney' ? 'C' : 'ج.م'}</span>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {out ? 'إلى' : 'من'} <span className="font-mono" style={{ color: 'var(--text-2)' }}>{out ? tx.toName : tx.fromName}</span>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {tx.status === 'pending' && <StatusPill kind="warn" label="معلّقة"/>}
            {tx.status === 'rejected' && <StatusPill kind="bad" label="مرفوضة"/>}
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-4)' }}>{tx.id}</span>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{tx.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   TRANSFER FLOW — 5 cinematic steps
   ============================================================ */
const TransferFlow = ({ step, setStep, recipient, setRecipient, amount, setAmount, pin, setPin, pinShake, setPinShake, balance, onClose }) => {
  const stepLabels = ['', 'المستلم', 'المبلغ', 'المراجعة', 'PIN', 'مكتمل'];

  return (
    <div style={{ minHeight: 540 }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(123,108,246,0.12), transparent)' }}>
        <div>
          <div className="t-eyebrow">تحويل C Money</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{stepLabels[step]}</div>
        </div>
        <button onClick={onClose} className="btn btn-sm btn-ghost"><Icon name="x" size={14}/></button>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 22px', borderBottom: '1px solid var(--line)' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <React.Fragment key={i}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center',
              fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
              background: step >= i ? (step === 5 && i === 5 ? 'var(--success)' : 'var(--purple)') : 'var(--surface-2)',
              color: step >= i ? '#fff' : 'var(--text-3)',
              border: step === i ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--line)',
              boxShadow: step === i ? '0 0 0 3px rgba(123,108,246,0.18)' : 'none',
              transition: 'all 220ms'
            }}>{step > i ? '✓' : i}</div>
            {i < 5 && <div style={{ flex: 1, height: 2, background: step > i ? 'var(--purple)' : 'var(--surface-2)', borderRadius: 1, transition: 'background 220ms' }}/>}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div style={{ padding: 22 }}>
        {step === 1 && (
          <div className="anim-fade-up">
            <label className="field" style={{ marginBottom: 14 }}>
              <span>User ID المستلم</span>
              <input className="input font-mono" placeholder="USR-XXXXXX" value={recipient} onChange={e => setRecipient(e.target.value)} autoFocus style={{ fontSize: 15 }}/>
            </label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              <button className="btn btn-sm" onClick={() => setRecipient('USR-103021')}><Icon name="team" size={11}/>محمد سامي</button>
              <button className="btn btn-sm" onClick={() => setRecipient('USR-103022')}><Icon name="team" size={11}/>فاطمة عيسى</button>
              <button className="btn btn-sm"><Icon name="qr" size={11}/>QR</button>
            </div>

            {recipient.length >= 6 && (
              <div className="anim-scale-in" style={{ padding: 14, borderRadius: 12, background: 'var(--success-soft)', border: '1px solid var(--success-edge)', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7B6CF6, #C4B8FF)', display: 'grid', placeItems: 'center', color: '#0A0A0A', fontFamily: 'var(--font-display)', fontWeight: 800 }}>م</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>محمد سامي · Bronze</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{recipient.toUpperCase()} · موثّق</div>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--success)', display: 'grid', placeItems: 'center', color: '#051A12' }}>
                  <Icon name="check" size={14}/>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={onClose}>إلغاء</button>
              <button className="btn btn-primary" disabled={recipient.length < 6} onClick={() => setStep(2)}>متابعة<Icon name="arrow-left" size={12}/></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="anim-fade-up">
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>الرصيد المتاح: <span className="font-mono" style={{ color: 'var(--lavender)', fontSize: 13, fontWeight: 700 }}>{balance.toLocaleString()} C</span></div>

            <div style={{ padding: 22, borderRadius: 14, background: 'var(--surface-0)', border: '1px solid var(--line)', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>المبلغ بالـ C Money</div>
              <input className="font-num"
                type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                style={{
                  width: '100%', textAlign: 'center', fontSize: 48, fontWeight: 800,
                  background: 'transparent', border: 0, outline: 'none', color: 'var(--text-1)',
                  letterSpacing: '-0.03em', fontFamily: 'var(--font-num)'
                }}
              />
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                ≈ {(Number(amount) || 0).toLocaleString()} ج.م
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {[100, 250, 500, 1000, balance].map((a, i) => (
                <button key={i} className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAmount(String(a))}>
                  {i === 4 ? 'كامل' : a.toLocaleString()}
                </button>
              ))}
            </div>

            {amount && Number(amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: 'var(--surface-0)', border: '1px solid var(--line)', fontSize: 12, marginBottom: 14 }}>
                <span style={{ color: 'var(--text-3)' }}>الرصيد بعد التحويل</span>
                <span className="font-num" style={{ color: Number(amount) > balance ? 'var(--danger)' : 'var(--text-1)', fontWeight: 700 }}>
                  {(balance - Number(amount)).toLocaleString()} C
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button className="btn" onClick={() => setStep(1)}><Icon name="arrow-right" size={12}/>السابق</button>
              <button className="btn btn-primary" disabled={!amount || Number(amount) <= 0 || Number(amount) > balance} onClick={() => setStep(3)}>متابعة<Icon name="arrow-left" size={12}/></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="anim-fade-up">
            <div style={{ padding: 18, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface-0)', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
                <div className="t-eyebrow" style={{ marginBottom: 6 }}>سترسل</div>
                <div className="font-num metric-glow" style={{ fontSize: 44, fontWeight: 800, color: 'var(--lavender)' }}>{Number(amount).toLocaleString()} <span style={{ fontSize: 16, color: 'var(--text-3)' }}>C</span></div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>≈ {Number(amount).toLocaleString()} ج.م</div>
              </div>

              {[
                ['من', 'USR-102458 · أنت', 'team'],
                ['إلى', `${recipient.toUpperCase()} · محمد سامي`, 'team'],
                ['الرسوم', '0 C · مجاناً', 'gift'],
                ['الوصول', 'فوري', 'zap'],
              ].map(([k, v, ic]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: 12.5, borderBottom: '1px solid var(--line-soft)' }}>
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--text-3)' }}><Icon name={ic} size={11}/>{k}</span>
                  <span style={{ fontWeight: 600 }} className={k === 'من' || k === 'إلى' ? 'font-mono' : ''}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button className="btn" onClick={() => setStep(2)}><Icon name="arrow-right" size={12}/>السابق</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}><Icon name="shield" size={12}/>تأكيد بالـ PIN</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="anim-fade-up" style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 14, background: 'var(--info-soft)', display: 'grid', placeItems: 'center', color: 'var(--lavender)', border: '1px solid var(--line-purple)' }}>
              <Icon name="lock" size={24}/>
            </div>
            <div className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>أدخل PIN المحفظة</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 22, marginTop: 4 }}>6 أرقام · محمية بـ argon2id</div>

            <div className={pinShake ? 'pin-shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  width: 38, height: 50, borderRadius: 10,
                  border: pin.length === i ? '2px solid var(--purple)' : '1px solid var(--line)',
                  background: pin[i] ? 'var(--info-soft)' : 'var(--surface-0)',
                  display: 'grid', placeItems: 'center',
                  boxShadow: pin.length === i ? '0 0 0 3px rgba(123,108,246,0.18)' : 'none',
                  transition: 'all 150ms var(--ease-spring)',
                  transform: pin[i] ? 'scale(1.03)' : 'scale(1)'
                }}>
                  {pin[i] && <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--lavender)', boxShadow: '0 0 10px rgba(196,184,255,0.8)' }}/>}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 260, margin: '0 auto 14px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'face', 0, '⌫'].map((k, i) => {
                if (k === 'face') return <button key={i} className="btn" style={{ padding: 16, justifyContent: 'center', background: 'var(--surface-1)' }}><Icon name="shield" size={16}/></button>;
                return (
                  <button key={i} className="btn"
                    onClick={() => {
                      if (k === '⌫') setPin(pin.slice(0, -1));
                      else if (pin.length < 6) setPin(pin + k);
                    }}
                    style={{ padding: 16, justifyContent: 'center', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 600, background: 'var(--surface-1)' }}>{k}</button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 11 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => setStep(3)}><Icon name="arrow-right" size={11}/>تعديل</button>
              <a href="#" style={{ color: 'var(--lavender)', textDecoration: 'none' }}>نسيت PIN؟</a>
              <button className="btn btn-primary btn-sm" disabled={pin.length < 6} onClick={() => setStep(5)}>تأكيد<Icon name="check" size={12}/></button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="anim-fade-up" style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 18px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--success-soft)', display: 'grid', placeItems: 'center', color: 'var(--success)', boxShadow: '0 0 0 6px rgba(43,217,160,0.10), 0 0 40px rgba(43,217,160,0.4)' }}>
                <Icon name="check" size={44} strokeWidth={2.4}/>
              </div>
              <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '1px solid var(--success)', opacity: 0.6, animation: 'pulse-ring 1.5s ease-out infinite' }}/>
            </div>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>تم التحويل</div>
            <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 20 }}>
              تم إرسال <strong style={{ color: 'var(--success)' }}>{Number(amount).toLocaleString()} C</strong> إلى <span className="font-mono" style={{ color: 'var(--lavender)' }}>{recipient.toUpperCase()}</span>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-0)', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>رقم العملية</span>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--lavender)' }}>TRX-{Math.floor(1000 + Math.random()*9000)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn" onClick={onClose}>تحويل آخر</button>
              <button className="btn btn-primary" onClick={onClose}>تم</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.WalletPage = WalletPage;

/* global React */

/* ============================================================
   SHOP
   ============================================================ */
const ShopPage = () => {
  const products = [
    { name: 'مجموعة العناية المتقدّمة', price: 1200, cv: 12, badge: 'الأكثر مبيعاً', cat: 'العناية', tone: 'rose' },
    { name: 'مكمل الطاقة الذهبية', price: 950, cv: 9, badge: 'جديد', cat: 'مكمّلات', tone: 'amber' },
    { name: 'فيتامينات نباتية أساسية', price: 780, cv: 8, badge: null, cat: 'مكمّلات', tone: 'green' },
    { name: 'سيروم تجديد البشرة', price: 1450, cv: 15, badge: 'محدود', cat: 'العناية', tone: 'purple' },
    { name: 'بروتين البحر الأبيض', price: 2100, cv: 22, badge: null, cat: 'تغذية', tone: 'blue' },
    { name: 'زيت النخبة العطري', price: 680, cv: 6, badge: null, cat: 'العناية', tone: 'amber' },
    { name: 'مجموعة الرجيم الذكي', price: 3200, cv: 32, badge: 'الأكثر مبيعاً', cat: 'تغذية', tone: 'green' },
    { name: 'مرطب الفاخر اليومي', price: 540, cv: 5, badge: null, cat: 'العناية', tone: 'rose' },
  ];

  const toneGrad = {
    rose: 'linear-gradient(135deg, #FF6F8A 0%, #6E2840 100%)',
    amber: 'linear-gradient(135deg, #FFB23F 0%, #6E4A18 100%)',
    green: 'linear-gradient(135deg, #2BD9A0 0%, #1A4D3A 100%)',
    purple: 'linear-gradient(135deg, #C4B8FF 0%, #4F3DD1 100%)',
    blue: 'linear-gradient(135deg, #6BE4FF 0%, #1F4D6A 100%)',
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Topbar title="متجر Credo" breadcrumbs={['Credo W', 'المتجر']}/>
      <div className="page-enter" style={{ padding: 28, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        <aside className="card" style={{ padding: 20, alignSelf: 'start', position: 'sticky', top: 100 }}>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>الفئات</div>
          {['الكل', 'العناية', 'مكمّلات', 'تغذية', 'الأجهزة'].map((c, i) => (
            <button key={c} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '9px 10px', borderRadius: 8, border: 0, background: i === 0 ? 'var(--info-soft)' : 'transparent', color: i === 0 ? 'var(--lavender)' : 'var(--text-2)', fontSize: 13, fontWeight: i === 0 ? 600 : 500, fontFamily: 'var(--font-body)', cursor: 'pointer', textAlign: 'start', marginBottom: 2 }}>
              <span>{c}</span><span className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{i === 0 ? 184 : Math.floor(20 + i * 18)}</span>
            </button>
          ))}
          <hr className="hr"/>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>نطاق السعر</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input className="input font-mono" placeholder="من" defaultValue="0"/>
            <input className="input font-mono" placeholder="إلى" defaultValue="5000"/>
          </div>
          <hr className="hr"/>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>للباقات</div>
          {['Starter', 'Growth', 'Elite'].map(p => (
            <label key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--purple)' }}/>{p}
            </label>
          ))}
        </aside>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>عرض <strong style={{ color: 'var(--text-1)' }}>184</strong> منتج</div>
            <select className="select" style={{ width: 'auto' }}><option>الأحدث</option><option>الأكثر مبيعاً</option><option>السعر: من الأقل</option></select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {products.map((p, i) => (
              <div key={i} className="card card-interactive" style={{ padding: 14 }}>
                <div style={{ aspectRatio: '1/1', borderRadius: 12, background: toneGrad[p.tone] || toneGrad.purple, position: 'relative', marginBottom: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 8px, transparent 8px 16px)' }}/>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                    <span className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{p.cat}</span>
                  </div>
                  {p.badge && <span className="pill info" style={{ position: 'absolute', top: 8, insetInlineStart: 8, fontSize: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>{p.badge}</span>}
                  <span className="pill" style={{ position: 'absolute', top: 8, insetInlineEnd: 8, fontSize: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: '#fff' }}>+{p.cv} CV</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.3, minHeight: 34 }}>{p.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-num" style={{ fontWeight: 700, fontSize: 16 }}>{p.price.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>ج.م</span></span>
                  <button className="btn btn-sm btn-primary" style={{ padding: '6px 8px' }}><Icon name="plus" size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ACADEMY
   ============================================================ */
const AcademyPage = () => {
  const courses = [
    { t: 'بناء شبكة في 30 يوماً', d: '4 س', live: true, prog: 0, tone: 'purple' },
    { t: 'إتقان البيع المباشر', d: '2 س 30', live: false, prog: 65, tone: 'amber' },
    { t: 'استراتيجيات التوازن', d: '3 س', live: false, prog: 100, tone: 'green' },
    { t: 'إدارة الفريق', d: '2 س 15', live: false, prog: 30, tone: 'blue' },
    { t: 'محتوى السوشيال للمسوّق', d: '1 س 45', live: false, prog: 0, tone: 'rose' },
    { t: 'أساسيات C Money', d: '45 د', live: false, prog: 80, tone: 'purple' },
  ];
  const toneGrad = {
    purple: 'linear-gradient(135deg, #2D1F5C 0%, #7B6CF6 100%)',
    amber: 'linear-gradient(135deg, #6E4A18 0%, #FFB23F 100%)',
    green: 'linear-gradient(135deg, #1A4D3A 0%, #2BD9A0 100%)',
    blue: 'linear-gradient(135deg, #1F4D6A 0%, #6BE4FF 100%)',
    rose: 'linear-gradient(135deg, #6E2840 0%, #FF6F8A 100%)',
  };
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Topbar title="أكاديمية Credo" breadcrumbs={['Credo W', 'الأكاديمية']}/>
      <div className="page-enter" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Featured live */}
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: 260, background: 'linear-gradient(120deg, #1A1A2E 0%, #2D1F5C 100%)' }}>
          <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}/>
          <div style={{ position: 'absolute', insetInlineEnd: 0, top: 0, bottom: 0, width: '55%', background: 'radial-gradient(circle at 70% 50%, rgba(196,184,255,0.30), transparent 70%)' }}/>
          <div className="glow-blob" style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(107,228,255,0.20), transparent)', insetInlineEnd: '8%', top: '-50px', filter: 'blur(50px)' }}/>
          <div style={{ position: 'relative', padding: 38, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span className="pill bad" style={{ background: 'rgba(255,92,122,0.20)' }}><Icon name="live" size={11}/>مباشر الآن</span>
                <span className="pill"><Icon name="calendar" size={11}/>السبت · 10م</span>
                <span className="pill"><Icon name="team" size={11}/>1,240 مشاهد</span>
              </div>
              <div className="font-display" style={{ fontSize: 36, fontWeight: 800, maxWidth: 640, lineHeight: 1.15, letterSpacing: '-0.025em' }}>كيف تبني شبكة 100 عضو<br/><span className="gradient-text">في 30 يوماً</span></div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 10 }}>مع المدرّب أحمد طارق · من خبراء Diamond في Credo W</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary btn-xl"><Icon name="play" size={14}/>انضم للبث الآن</button>
              <button className="btn btn-xl"><Icon name="calendar" size={13}/>إضافة للتقويم</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>كل الكورسات</div>
              <div style={{ display: 'flex', padding: 3, background: 'var(--surface-0)', borderRadius: 8, border: '1px solid var(--line)' }}>
                {['الكل', 'مباشر', 'مسجل'].map((l, i) => (
                  <button key={l} style={{ padding: '6px 12px', border: 0, borderRadius: 6, background: i === 0 ? 'var(--surface-2)' : 'transparent', color: i === 0 ? 'var(--text-1)' : 'var(--text-3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {courses.map((c, i) => (
                <div key={i} className="card card-interactive" style={{ padding: 14 }}>
                  <div style={{ aspectRatio: '16/9', borderRadius: 10, background: toneGrad[c.tone], position: 'relative', marginBottom: 12, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 8px, transparent 8px 16px)' }}/>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', display: 'grid', placeItems: 'center', color: '#fff', position: 'relative', zIndex: 1, border: '1px solid rgba(255,255,255,0.15)' }}>
                      <Icon name="play" size={20}/>
                    </div>
                    {c.live && <span className="pill bad" style={{ position: 'absolute', top: 10, insetInlineStart: 10, fontSize: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}><Icon name="live" size={10}/>مباشر</span>}
                    <span className="pill" style={{ position: 'absolute', top: 10, insetInlineEnd: 10, fontSize: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: '#fff' }}>{c.d}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{c.t}</div>
                  {c.prog > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                        <span>{c.prog === 100 ? 'مكتمل ✓' : 'تقدّمك'}</span><span className="font-mono">{c.prog}%</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-0)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${c.prog}%`, height: '100%', background: c.prog === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--purple), var(--lavender))' }}/>
                      </div>
                    </>
                  )}
                  {c.prog === 0 && !c.live && <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>ابدأ الكورس<Icon name="arrow-left" size={12}/></button>}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20, alignSelf: 'start', position: 'sticky', top: 100 }}>
            <div className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>تقويم الأحداث</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>مايو 2026</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontSize: 11, marginBottom: 8 }}>
              {['س', 'ج', 'خ', 'أر', 'ث', 'ا', 'أح'].map(d => (
                <div key={d} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 4 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: 31 }, (_, i) => {
                const d = i + 1;
                const has = [3, 7, 12, 18, 22, 28].includes(d);
                const today = d === 1;
                return (
                  <button key={d} style={{
                    aspectRatio: '1/1', border: today ? '2px solid var(--purple)' : '1px solid var(--line)',
                    borderRadius: 6, background: has ? 'var(--info-soft)' : 'transparent',
                    color: has ? 'var(--lavender)' : 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-mono)',
                    cursor: 'pointer', position: 'relative', boxShadow: today ? '0 0 0 3px rgba(123,108,246,0.18)' : 'none'
                  }}>
                    {d}{has && <span style={{ position: 'absolute', bottom: 2, insetInlineStart: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 2, background: 'var(--lavender)', boxShadow: '0 0 4px var(--lavender)' }}/>}
                  </button>
                );
              })}
            </div>
            <hr className="hr"/>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>الأحداث القادمة</div>
            {[['1 مايو', 'البث المباشر · 10م', 'ok'], ['3 مايو', 'ورشة قادة الفرق', 'info'], ['7 مايو', 'إغلاق الدورة 18', 'warn']].map(([d, t, k]) => (
              <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)', minWidth: 50 }}>{d}</div>
                <span className={`pill ${k}`} style={{ fontSize: 10, padding: '2px 6px' }}><span className="dot"></span></span>
                <div style={{ fontSize: 12, flex: 1 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SUPPORT
   ============================================================ */
const SupportPage = () => {
  const tickets = [
    ['#TKT-2041', 'تأخر صرف عمولة الدورة 17', 'مالية', '01 مايو', 'replied', 'فريق المالية'],
    ['#TKT-2038', 'لا أستطيع تفعيل PIN جديد', 'تقنية', '30 أبريل', 'open', '—'],
    ['#TKT-2034', 'استفسار عن آلية Carry', 'عمولات', '28 أبريل', 'resolved', 'م. سامي'],
    ['#TKT-2029', 'تعديل عنوان الشحن', 'أخرى', '24 أبريل', 'pending', 'فريق الدعم'],
  ];
  const map = { open: ['info', 'مفتوحة'], pending: ['warn', 'معلّقة'], replied: ['info', 'تم الرد'], resolved: ['ok', 'محلولة'] };
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Topbar title="الدعم الفني" breadcrumbs={['Credo W', 'الدعم']}/>
      <div className="page-enter" style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>تذاكري</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>4 إجمالي · 2 نشطة</div>
            </div>
            <button className="btn btn-primary"><Icon name="plus" size={13}/>تذكرة جديدة</button>
          </div>
          <table className="tbl">
            <thead><tr><th>الرقم</th><th>الموضوع</th><th>القسم</th><th>التاريخ</th><th>آخر رد</th><th>الحالة</th></tr></thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t[0]} style={{ cursor: 'pointer' }}>
                  <td className="font-mono" style={{ color: 'var(--lavender)' }}>{t[0]}</td>
                  <td style={{ fontWeight: 600 }}>{t[1]}</td>
                  <td><span className="pill" style={{ fontSize: 10 }}>{t[2]}</span></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{t[3]}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{t[5]}</td>
                  <td><StatusPill kind={map[t[4]][0]} label={map[t[4]][1]}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 22, alignSelf: 'start' }}>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>تذكرة جديدة</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 18 }}>الرد خلال 24 ساعة عمل</div>
          <label className="field" style={{ marginBottom: 12 }}><span>القسم</span>
            <select className="select"><option>مالية</option><option>تقنية</option><option>عمولات</option><option>أخرى</option></select>
          </label>
          <label className="field" style={{ marginBottom: 12 }}><span>الموضوع</span><input className="input" placeholder="عنوان مختصر..."/></label>
          <label className="field" style={{ marginBottom: 14 }}><span>الوصف</span><textarea className="input" rows="5" placeholder="اشرح المشكلة..."/></label>
          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}><Icon name="upload" size={12}/>إرفاق ملف (اختياري)</button>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Icon name="send" size={12}/>إرسال</button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SETTINGS
   ============================================================ */
const SettingsPage = () => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <Topbar title="الإعدادات" breadcrumbs={['Credo W', 'الإعدادات']}/>
    <div className="page-enter" style={{ padding: 28, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
      <aside className="card" style={{ padding: 14, alignSelf: 'start' }}>
        {[['profile', 'الملف الشخصي', 'team', true], ['password', 'كلمة المرور', 'lock'], ['pin', 'PIN المحفظة', 'shield'], ['payments', 'حسابات الدفع', 'wallet'], ['address', 'عنوان الشحن', 'shop'], ['notif', 'الإشعارات', 'bell']].map(([id, l, ic, active]) => (
          <button key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, border: 0, background: active ? 'var(--info-soft)' : 'transparent', color: active ? 'var(--lavender)' : 'var(--text-2)', fontSize: 13, fontWeight: active ? 600 : 500, fontFamily: 'var(--font-body)', cursor: 'pointer', textAlign: 'start', marginBottom: 2 }}>
            <Icon name={ic} size={15}/>{l}
          </button>
        ))}
      </aside>
      <div className="card" style={{ padding: 28 }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>الملف الشخصي</div>
        <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 24 }}>هذه البيانات تظهر للراعي والإدارة فقط.</div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 26, padding: 18, borderRadius: 14, border: '1px solid var(--line-purple)', background: 'linear-gradient(135deg, rgba(123,108,246,0.10), transparent)' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, #7B6CF6, #C4B8FF)', display: 'grid', placeItems: 'center', color: '#0A0A0A', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, boxShadow: '0 0 24px rgba(123,108,246,0.4)' }}>أم</div>
            <button className="btn btn-sm" style={{ position: 'absolute', bottom: -8, insetInlineEnd: -8, padding: 6, background: 'var(--surface-2)', borderRadius: '50%' }}><Icon name="upload" size={12}/></button>
          </div>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 20 }}>أحمد المنصوري</div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>USR-102458 · مفعّل منذ 14 مارس 2026</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span className="pill info" style={{ fontSize: 10 }}><span className="dot"></span>Silver</span>
              <span className="pill ok" style={{ fontSize: 10 }}><span className="dot"></span>Elite Package</span>
              <span className="pill" style={{ fontSize: 10 }}><Icon name="check-circle" size={10}/>موثّق</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['الاسم الكامل', 'أحمد محمود المنصوري'], ['البريد الإلكتروني', 'ahmed.m@credow.com'], ['اللقب', 'Captain'], ['الدولة', 'مصر'], ['العملة', 'EGP · ج.م'], ['الرقم القومي', '298••••••••12'], ['الراعي المباشر', 'فاطمة عيسى · USR-100204'], ['تاريخ التفعيل', '14 مارس 2026']].map(([k, v]) => (
            <label key={k} className="field"><span>{k}</span><input className="input" defaultValue={v}/></label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn">إلغاء</button>
          <button className="btn btn-primary">حفظ التعديلات</button>
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================
   LEADS
   ============================================================ */
const LeadsPage = () => {
  const [count, setCount] = useState(50);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Topbar title="شراء البيانات" breadcrumbs={['Credo W', 'الموارد', 'Leads']}/>
      <div className="page-enter" style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card-elevated" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', insetInlineEnd: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,108,246,0.14), transparent)', filter: 'blur(40px)' }}/>
          <div style={{ position: 'relative' }}>
            <div className="t-eyebrow" style={{ color: 'var(--lavender)' }}>اشترِ بيانات جديدة</div>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 700, marginTop: 4, marginBottom: 4 }}>1 بيانات = 1 C Money</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 22 }}>الرصيد الحالي: <span className="font-mono" style={{ color: 'var(--lavender)' }}>2,450 C</span></div>
            <div style={{ padding: 24, borderRadius: 14, background: 'var(--surface-0)', border: '1px solid var(--line)', marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 8 }}>عدد البيانات</div>
              <input type="number" value={count} onChange={e => setCount(Number(e.target.value) || 0)} className="font-num"
                style={{ width: '100%', fontSize: 48, fontWeight: 800, background: 'transparent', border: 0, outline: 'none', color: 'var(--text-1)', textAlign: 'center', letterSpacing: '-0.03em', fontFamily: 'var(--font-num)' }}/>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {[25, 50, 100, 250].map(a => (
                <button key={a} className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setCount(a)}>{a}</button>
              ))}
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: 'var(--info-soft)', border: '1px solid var(--info-edge)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>التكلفة</div>
                <div className="font-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--lavender)' }}>{count} <span style={{ fontSize: 12 }}>C</span></div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>الرصيد بعد</div>
                <div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{(2450 - count).toLocaleString()} C</div>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}><Icon name="leads" size={13}/>شراء من C Money</button>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
            <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>البيانات المشتراة</div>
            <button className="btn btn-sm"><Icon name="download" size={11}/>Export</button>
          </div>
          <table className="tbl">
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>المصدر</th><th>التاريخ</th></tr></thead>
            <tbody>
              {[['سارة عبد الله', '01••••5421', 'Facebook', '01 مايو'], ['عمر كامل', '01••••3382', 'Instagram', '30 أبريل'], ['نور حسن', '01••••1129', 'TikTok', '28 أبريل'], ['محمد رؤوف', '01••••8704', 'Google Ads', '25 أبريل'], ['ياسمين علي', '01••••9320', 'Facebook', '22 أبريل']].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r[0]}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{r[1]}</td>
                  <td><span className="pill" style={{ fontSize: 10 }}>{r[2]}</span></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.ShopPage = ShopPage;
window.AcademyPage = AcademyPage;
window.SupportPage = SupportPage;
window.SettingsPage = SettingsPage;
window.LeadsPage = LeadsPage;

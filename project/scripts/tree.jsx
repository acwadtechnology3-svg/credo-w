/* global React */

/* ============================================================
   PREMIUM BINARY TREE — Cinematic Network Visualization
   "Stripe + Neural Network + Fintech" feel
   ============================================================ */
const TreePage = ({ onNav }) => {
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('placement');
  const [filter, setFilter] = useState('all');
  const [hoverId, setHoverId] = useState(null);

  // Build a balanced 4-level binary tree mock
  const N = (id, name, status='active', cv=0, pack='G', rank=null, joined='14 أبريل', earnings=0) => ({ id, name, status, cv, pack, rank, joined, earnings });
  const tree = {
    n: N('USR-102458', 'أنت · أحمد', 'active', 178, 'E', 'Silver', '14 مارس', 32400),
    L: {
      n: N('USR-103021', 'محمد سامي', 'active', 90, 'G', 'Bronze', '18 مارس', 4200),
      L: {
        n: N('USR-104112', 'يارا كمال', 'active', 45, 'G', null, '22 مارس', 1800),
        L: { n: N('USR-105204', 'كريم فرحات', 'active', 30, 'S', null, '01 أبريل', 750) },
        R: { n: N('USR-105210', 'هدى م.', 'inactive', 0, 'S', null, '03 أبريل', 0) }
      },
      R: {
        n: N('USR-104113', 'سلمى ح.', 'active', 30, 'S', null, '25 مارس', 850),
        L: { n: N('USR-105318', 'بسام د.', 'active', 30, 'S', null, '08 أبريل', 600) },
        R: null
      }
    },
    R: {
      n: N('USR-103022', 'فاطمة عيسى', 'active', 210, 'E', 'Bronze', '20 مارس', 6800),
      L: {
        n: N('USR-104214', 'أنس رؤوف', 'active', 90, 'G', null, '26 مارس', 2400),
        L: { n: N('USR-105420', 'مريم نور', 'active', 45, 'G', null, '02 أبريل', 1100) },
        R: { n: N('USR-105421', 'حازم صالح', 'inactive', 0, 'S', null, '04 أبريل', 0) }
      },
      R: {
        n: N('USR-104215', 'لينة جابر', 'active', 75, 'G', null, '28 مارس', 2200),
        L: { n: N('USR-105530', 'طارق ق.', 'active', 30, 'S', null, '10 أبريل', 700) },
        R: { n: N('USR-105531', 'منى علي', 'active', 45, 'G', null, '12 أبريل', 1300) }
      }
    }
  };

  // Layout
  const W = 1200, H = 620;
  const nodes = []; const lines = [];
  const place = (n, depth, x0, x1, parent = null, side = null) => {
    if (!n) return;
    const x = (x0 + x1) / 2;
    const y = 50 + depth * 130;
    nodes.push({ ...n.n, x, y, depth, side });
    if (parent) lines.push({ x1: parent.x, y1: parent.y + 26, x2: x, y2: y - 26, side, active: n.n.status === 'active' });
    const cur = { x, y };
    place(n.L, depth + 1, x0, x, cur, 'L');
    place(n.R, depth + 1, x, x1, cur, 'R');
  };
  place(tree, 0, 0, W);

  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      <Topbar title="شجرة الشبكة الثنائية" breadcrumbs={['Credo W', 'الشبكة', 'الشجرة الثنائية']} onInvite={() => {}}/>

      <div className="page-enter" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ────────────── STATS STRIP ────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <TreeStat label="عمق الشبكة" value="4" sub="مستويات" icon="layers" color="var(--lavender)"/>
          <TreeStat label="إجمالي الفريق" value="14" sub="11 نشط · 3 غير نشط" icon="team" color="var(--purple-bright)"/>
          <TreeStat label="CV هذه الدورة" value="450" sub="210 A · 240 B" icon="trend-up" color="var(--success)"/>
          <TreeStat label="مواقع شاغرة" value="6" sub="جاهزة للإضافة" icon="plus" color="var(--electric)"/>
        </div>

        {/* ────────────── TOOLBAR ────────────── */}
        <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', padding: 3, background: 'var(--surface-0)', borderRadius: 10, border: '1px solid var(--line)' }}>
            {[['placement', 'Placement Tree', 'tree'], ['enroller', 'Enroller Tree', 'team']].map(([id, l, ic]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', border: 0, borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: tab === id ? 'var(--surface-2)' : 'transparent',
                color: tab === id ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer', boxShadow: tab === id ? 'inset 0 0 0 1px var(--line-purple)' : 'none',
                transition: 'all 150ms', fontFamily: 'var(--font-body)'
              }}>
                <Icon name={ic} size={12}/>{l}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Icon name="search" size={13} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}/>
            <input className="input" style={{ paddingInlineStart: 36, height: 36 }} placeholder="ابحث باسم أو User ID..."/>
          </div>

          <div style={{ display: 'flex', padding: 3, background: 'var(--surface-0)', borderRadius: 10, border: '1px solid var(--line)' }}>
            {[['all', 'الكل'], ['active', 'نشطاء'], ['inactive', 'غير نشطين']].map(([id, l]) => (
              <button key={id} onClick={() => setFilter(id)} style={{
                padding: '7px 12px', border: 0, borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: filter === id ? 'var(--surface-2)' : 'transparent',
                color: filter === id ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer', boxShadow: filter === id ? 'inset 0 0 0 1px var(--line-purple)' : 'none',
                fontFamily: 'var(--font-body)'
              }}>{l}</button>
            ))}
          </div>

          <div style={{ flex: 1 }}/>

          <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface-0)', borderRadius: 10, border: '1px solid var(--line)' }}>
            <button className="btn-icon" style={{ padding: 6, border: 0, background: 'transparent', color: 'var(--text-2)', borderRadius: 6, cursor: 'pointer' }} onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}><Icon name="minus" size={12}/></button>
            <span className="font-mono" style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-2)', minWidth: 50, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn-icon" style={{ padding: 6, border: 0, background: 'transparent', color: 'var(--text-2)', borderRadius: 6, cursor: 'pointer' }} onClick={() => setZoom(Math.min(1.6, zoom + 0.1))}><Icon name="plus" size={12}/></button>
          </div>

          <button className="btn btn-sm"><Icon name="download" size={12}/>تصدير</button>
        </div>

        {/* ────────────── TREE CANVAS + SIDE PANEL ────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 16 }}>
          <div className="card" style={{ padding: 0, position: 'relative', overflow: 'hidden', minHeight: 700, background: 'var(--bg-page-2)' }}>
            {/* Ambient glow blobs */}
            <div className="glow-blob" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(123,108,246,0.25), transparent 70%)', insetInlineStart: '20%', top: '10%', filter: 'blur(60px)' }}/>
            <div className="glow-blob" style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(107,228,255,0.15), transparent 70%)', insetInlineEnd: '15%', bottom: '15%', filter: 'blur(50px)', animationDelay: '-8s' }}/>
            <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}/>

            {/* Minimap (top-right corner) */}
            <div className="glass" style={{ position: 'absolute', top: 14, insetInlineEnd: 14, padding: 10, borderRadius: 10, zIndex: 5, width: 140 }}>
              <div className="t-eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>الخريطة المصغّرة</div>
              <svg viewBox="0 0 140 80" width="120" height="68">
                {nodes.map((n, i) => (
                  <circle key={i} cx={(n.x / W) * 140} cy={(n.y / H) * 80} r="1.5"
                    fill={n.status === 'active' ? 'var(--lavender)' : 'var(--text-4)'}/>
                ))}
                <rect x="0" y="0" width="140" height={80 / zoom} fill="none" stroke="var(--purple)" strokeWidth="1" rx="2"/>
              </svg>
            </div>

            {/* Side labels */}
            <div style={{ position: 'absolute', top: 14, insetInlineStart: 14, display: 'flex', gap: 8, zIndex: 5 }}>
              <div className="glass" style={{ padding: '6px 12px', borderRadius: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--side-left)' }}/>
                <span style={{ fontSize: 11, color: 'var(--side-left)', fontWeight: 600 }}>الجهة A · يمين</span>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>210 CV</span>
              </div>
              <div className="glass" style={{ padding: '6px 12px', borderRadius: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--side-right)' }}/>
                <span style={{ fontSize: 11, color: 'var(--side-right)', fontWeight: 600 }}>الجهة B · يسار</span>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>240 CV</span>
              </div>
            </div>

            {/* Canvas */}
            <div style={{ overflow: 'auto', padding: 50, position: 'relative', height: 700 }}>
              <div style={{ minWidth: W, transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 220ms var(--ease-out)' }}>
                <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="lineA" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#C4B8FF" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#C4B8FF" stopOpacity="0.15"/>
                    </linearGradient>
                    <linearGradient id="lineB" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6BE4FF" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#6BE4FF" stopOpacity="0.15"/>
                    </linearGradient>
                    <linearGradient id="lineInactive" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4A4A6A" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#4A4A6A" stopOpacity="0.1"/>
                    </linearGradient>
                    <radialGradient id="nodePulse">
                      <stop offset="0%" stopColor="#7B6CF6" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="#7B6CF6" stopOpacity="0"/>
                    </radialGradient>
                    <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3"/>
                    </filter>
                  </defs>

                  {/* Connection lines with smooth curves */}
                  {lines.map((l, i) => {
                    const path = `M${l.x1},${l.y1} C${l.x1},${(l.y1 + l.y2) / 2} ${l.x2},${(l.y1 + l.y2) / 2} ${l.x2},${l.y2}`;
                    const grad = !l.active ? 'lineInactive' : (l.side === 'L' ? 'lineA' : 'lineB');
                    return (
                      <g key={i}>
                        <path d={path} stroke={`url(#${grad})`} strokeWidth="1.6" fill="none" opacity="0.85"/>
                        {/* Animated flow particle */}
                        {l.active && (
                          <circle r="2" fill={l.side === 'L' ? '#C4B8FF' : '#6BE4FF'} opacity="0.9">
                            <animateMotion dur={`${3 + (i % 3)}s`} repeatCount="indefinite" path={path} begin={`${i * 0.4}s`}/>
                            <animate attributeName="opacity" values="0;0.9;0.9;0" dur={`${3 + (i % 3)}s`} repeatCount="indefinite" begin={`${i * 0.4}s`}/>
                          </circle>
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((n, i) => {
                    const isYou = n.id === 'USR-102458';
                    const isInactive = n.status === 'inactive';
                    const isHovered = hoverId === n.id;
                    const sideColor = n.side === 'L' ? '#C4B8FF' : n.side === 'R' ? '#6BE4FF' : '#7B6CF6';
                    const matched = filter === 'all' || (filter === 'active' && !isInactive) || (filter === 'inactive' && isInactive);

                    return (
                      <g key={n.id} style={{ cursor: 'pointer', opacity: matched ? 1 : 0.18, transition: 'opacity 220ms' }}
                         onClick={() => setSelected(n)}
                         onMouseEnter={() => setHoverId(n.id)}
                         onMouseLeave={() => setHoverId(null)}>
                        {/* Selection / hover ring */}
                        {(isHovered || selected?.id === n.id) && (
                          <circle cx={n.x} cy={n.y} r="45" fill="url(#nodePulse)"/>
                        )}
                        {isYou && (
                          <>
                            <circle cx={n.x} cy={n.y} r="50" fill="none" stroke="#C4B8FF" strokeWidth="1" opacity="0.6">
                              <animate attributeName="r" values="42;58;42" dur="3s" repeatCount="indefinite"/>
                              <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite"/>
                            </circle>
                            <circle cx={n.x} cy={n.y} r="36" fill="none" stroke="#7B6CF6" strokeWidth="1" opacity="0.4">
                              <animate attributeName="r" values="36;48;36" dur="3s" repeatCount="indefinite" begin="0.5s"/>
                              <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" begin="0.5s"/>
                            </circle>
                          </>
                        )}

                        {/* Node card */}
                        <rect x={n.x - 70} y={n.y - 28} width="140" height="56" rx="12"
                          fill={isYou ? 'url(#youGrad)' : 'var(--surface-2)'}
                          stroke={isYou ? '#C4B8FF' : (selected?.id === n.id ? sideColor : (n.rank ? '#FFB23F' : 'var(--line-strong)'))}
                          strokeWidth={isYou || isHovered ? 1.5 : 1}
                          style={{ transition: 'all 220ms' }}/>
                        <defs>
                          <linearGradient id="youGrad" x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0%" stopColor="#7B6CF6"/>
                            <stop offset="100%" stopColor="#C4B8FF"/>
                          </linearGradient>
                        </defs>

                        {/* Status dot */}
                        {!isYou && (
                          <circle cx={n.x + 58} cy={n.y - 18} r="4"
                            fill={isInactive ? '#4A4A6A' : '#2BD9A0'}
                            style={{ filter: !isInactive ? 'drop-shadow(0 0 4px #2BD9A0)' : 'none' }}>
                            {!isInactive && <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>}
                          </circle>
                        )}

                        {/* Rank star */}
                        {n.rank && !isYou && (
                          <g transform={`translate(${n.x - 58},${n.y - 22})`}>
                            <path d="M0,8 L2.4,2.5 L8,2.3 L3.7,-1.2 L5,-7 L0,-3.5 L-5,-7 L-3.7,-1.2 L-8,2.3 L-2.4,2.5 Z" fill="#FFB23F"/>
                          </g>
                        )}

                        {/* Text */}
                        <text x={n.x} y={n.y - 8} textAnchor="middle" fill={isYou ? '#0A0A0A' : 'var(--text-1)'} fontSize="11.5" fontWeight="700" fontFamily="Inter">{n.name}</text>
                        <text x={n.x} y={n.y + 6} textAnchor="middle" fill={isYou ? 'rgba(10,10,10,0.7)' : 'var(--text-3)'} fontSize="9" fontFamily="JetBrains Mono">{n.id}</text>
                        <text x={n.x} y={n.y + 20} textAnchor="middle" fill={isYou ? 'rgba(10,10,10,0.85)' : sideColor} fontSize="10" fontWeight="700" fontFamily="Inter">
                          {n.cv} CV · {n.pack === 'E' ? 'Elite' : n.pack === 'G' ? 'Growth' : 'Starter'}
                        </text>
                      </g>
                    );
                  })}

                  {/* Empty slots */}
                  {[150, 350, 550, 750, 950, 1100].map((x, i) => (
                    <g key={`ph${i}`} style={{ cursor: 'pointer', opacity: 0.5 }}>
                      <rect x={x - 32} y={H - 35} width="64" height="40" rx="10" fill="none" stroke="var(--line-strong)" strokeDasharray="3 3"/>
                      <text x={x} y={H - 18} textAnchor="middle" fill="var(--text-3)" fontSize="9">+ موقع شاغر</text>
                      <text x={x} y={H - 6} textAnchor="middle" fill="var(--text-4)" fontSize="8" fontFamily="JetBrains Mono">{i % 2 === 0 ? 'A' : 'B'}-side</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Legend (bottom) */}
            <div className="glass" style={{ position: 'absolute', bottom: 14, insetInlineStart: 14, padding: '10px 14px', borderRadius: 10, display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-2)' }}>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: '#2BD9A0', boxShadow: '0 0 6px #2BD9A0' }}/>نشط
              </span>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: '#4A4A6A' }}/>غير نشط
              </span>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, color: '#FFB23F' }}>★</span>صاحب رتبة
              </span>
            </div>
          </div>

          {/* Side panel */}
          {selected && <TreeNodePanel node={selected} onClose={() => setSelected(null)} onNav={onNav}/>}
        </div>
      </div>
    </div>
  );
};

const TreeStat = ({ label, value, sub, icon, color }) => (
  <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, color, display: 'grid', placeItems: 'center', border: `1px solid ${color}30` }}>
      <Icon name={icon} size={16}/>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="t-eyebrow">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
        <span className="font-num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>{value}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{sub}</span>
      </div>
    </div>
  </div>
);

const TreeNodePanel = ({ node, onClose, onNav }) => {
  const isYou = node.id === 'USR-102458';
  const pkg = node.pack === 'E' ? 'Elite' : node.pack === 'G' ? 'Growth' : 'Starter';
  return (
    <div className="card anim-scale-in" style={{ padding: 0, alignSelf: 'start', position: 'sticky', top: 100, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(123,108,246,0.16), transparent)', position: 'relative', borderBottom: '1px solid var(--line)' }}>
        <button onClick={onClose} className="btn btn-sm btn-ghost" style={{ position: 'absolute', top: 12, insetInlineEnd: 12, padding: 4 }}><Icon name="x" size={14}/></button>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: isYou ? 'linear-gradient(135deg, #7B6CF6, #C4B8FF)' : 'var(--surface-2)', display: 'grid', placeItems: 'center', color: isYou ? '#0A0A0A' : 'var(--lavender)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, border: '1px solid var(--line-purple)' }}>{node.name[0]}</div>
            {node.status === 'active' && <span style={{ position: 'absolute', bottom: -2, insetInlineEnd: -2, width: 14, height: 14, borderRadius: 7, background: 'var(--success)', border: '2px solid var(--surface-1)', boxShadow: '0 0 8px var(--success)' }}/>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>{node.name}</div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{node.id}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <span className="pill info" style={{ fontSize: 10 }}><span className="dot"></span>المستوى {node.depth}</span>
              {node.side && <span className="pill" style={{ fontSize: 10, background: node.side === 'L' ? 'var(--side-left-soft)' : 'var(--side-right-soft)', color: node.side === 'L' ? 'var(--side-left)' : 'var(--side-right)', borderColor: node.side === 'L' ? 'rgba(196,184,255,0.32)' : 'rgba(107,228,255,0.32)' }}>{node.side === 'L' ? 'A · يمين' : 'B · يسار'}</span>}
              {node.rank && <span className="pill warn" style={{ fontSize: 10 }}><Icon name="rank" size={9}/>{node.rank}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-0)', border: '1px solid var(--line)' }}>
            <div className="t-eyebrow" style={{ fontSize: 9 }}>CV هذه الدورة</div>
            <div className="font-num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--lavender)', marginTop: 4 }}>{node.cv}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-0)', border: '1px solid var(--line)' }}>
            <div className="t-eyebrow" style={{ fontSize: 9 }}>الأرباح الإجمالية</div>
            <div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>{node.earnings.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>ج.م</span></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
          {[
            ['الباقة', pkg, 'package'],
            ['الحالة', node.status === 'active' ? 'نشط' : 'غير نشط', 'circle'],
            ['تاريخ الانضمام', node.joined, 'calendar'],
            ['الراعي المباشر', 'فاطمة عيسى', 'team']
          ].map(([k, v, ic]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface-1)', fontSize: 13, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}><Icon name={ic} size={12}/>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="message" size={12}/>راسل</button>
          <button className="btn"><Icon name="eye" size={12}/></button>
          <button className="btn"><Icon name="copy" size={12}/></button>
        </div>
      </div>
    </div>
  );
};

window.TreePage = TreePage;

/* global React */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

/* ============================================================
   ICONS — geometric, 2px stroke, rounded (per brand iconography)
   ============================================================ */
const Icon = ({ name, size = 16, className = '', style = {}, strokeWidth = 1.8 }) => {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    className, style
  };
  switch (name) {
    case 'home':       return <svg {...p}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>;
    case 'tree':       return <svg {...p}><circle cx="12" cy="4" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><circle cx="3" cy="20" r="1.5"/><circle cx="9" cy="20" r="1.5"/><circle cx="15" cy="20" r="1.5"/><circle cx="21" cy="20" r="1.5"/><path d="M12 6v3l-5 3M12 9l5 3M6 16v2.5M18 16v2.5"/></svg>;
    case 'team':       return <svg {...p}><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M3 19c.8-3 3.2-5 6-5s5.2 2 6 5"/><path d="M15 19c.5-2 2-3.4 4-3.4s2 .4 2 .4"/></svg>;
    case 'wallet':     return <svg {...p}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12.5h2.5"/><path d="M3 8.5h13a3 3 0 010 6"/></svg>;
    case 'coin':       return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1 1.5-1.5 3-1.5s3 .5 3 1.5-1.5 1.5-3 1.5-3 .5-3 1.5 1.5 1.5 3 1.5 3-.5 3-1.5"/></svg>;
    case 'chart':      return <svg {...p}><path d="M4 19V5M4 19h16M8 16V11M12 16V8M16 16v-3"/></svg>;
    case 'trend-up':   return <svg {...p}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>;
    case 'shop':       return <svg {...p}><path d="M3 7h18l-1.5 11a2 2 0 01-2 2h-11a2 2 0 01-2-2L3 7z"/><path d="M8 7V5a4 4 0 018 0v2"/></svg>;
    case 'rank':       return <svg {...p}><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z"/></svg>;
    case 'academy':    return <svg {...p}><path d="M3 9l9-4 9 4-9 4-9-4z"/><path d="M7 11v4c0 1.7 2.7 3 5 3s5-1.3 5-3v-4"/></svg>;
    case 'leads':      return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h7M7 16h5"/></svg>;
    case 'calendar':   return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'support':    return <svg {...p}><path d="M21 12a9 9 0 10-9 9c2 0 3-1 3-1l3 1-1-3s1-1 1-3"/><path d="M9 13a3 3 0 116 0c0 2-2 2-2 4"/><circle cx="13" cy="19" r="0.6" fill="currentColor"/></svg>;
    case 'settings':   return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8L4.2 8a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V4a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V10a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    case 'logout':     return <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>;
    case 'bell':       return <svg {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></svg>;
    case 'plus':       return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':      return <svg {...p}><path d="M5 12h14"/></svg>;
    case 'search':     return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'arrow-up':   return <svg {...p}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-down': return <svg {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
    case 'arrow-right':return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-left': return <svg {...p}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>;
    case 'corner-up-right': return <svg {...p}><path d="M15 14l5-5-5-5M4 20v-7a4 4 0 014-4h12"/></svg>;
    case 'corner-up-left':  return <svg {...p}><path d="M9 14l-5-5 5-5M20 20v-7a4 4 0 00-4-4H4"/></svg>;
    case 'check':      return <svg {...p}><path d="M5 13l4 4L19 7"/></svg>;
    case 'check-circle': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>;
    case 'x':          return <svg {...p}><path d="M6 6l12 12M6 18L18 6"/></svg>;
    case 'eye':        return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off':    return <svg {...p}><path d="M2 12s3.5-7 10-7c2 0 3.7.7 5.2 1.7M22 12s-3.5 7-10 7c-2 0-3.7-.7-5.2-1.7"/><path d="M3 3l18 18"/></svg>;
    case 'lock':       return <svg {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>;
    case 'play':       return <svg {...p}><path d="M7 5l12 7-12 7V5z"/></svg>;
    case 'gift':       return <svg {...p}><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M8 9a2.5 2.5 0 010-5c2 0 4 5 4 5s2-5 4-5a2.5 2.5 0 010 5"/></svg>;
    case 'flame':      return <svg {...p}><path d="M12 22c4 0 7-3 7-7 0-4-3-5-3-9-2 2-3 4-3 6-1-1-2-2-2-4-3 2-6 4-6 8 0 3.5 3 6 7 6z"/></svg>;
    case 'live':       return <svg {...p}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" strokeOpacity=".5"/><circle cx="12" cy="12" r="11" strokeOpacity=".2"/></svg>;
    case 'menu':       return <svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'shield':     return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'send':       return <svg {...p}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
    case 'download':   return <svg {...p}><path d="M12 3v12M6 11l6 6 6-6"/><path d="M5 21h14"/></svg>;
    case 'upload':     return <svg {...p}><path d="M12 21V9M6 13l6-6 6 6"/><path d="M5 3h14"/></svg>;
    case 'filter':     return <svg {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></svg>;
    case 'circle':     return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
    case 'sparkle':    return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>;
    case 'sparkles':   return <svg {...p}><path d="M9 3l1.5 4L14 8l-3.5 1L9 13l-1.5-4L4 8l3.5-1L9 3z"/><path d="M18 13l1 2.5 2.5 1-2.5 1L18 20l-1-2.5-2.5-1 2.5-1L18 13z"/></svg>;
    case 'admin':      return <svg {...p}><path d="M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6l8-4z"/><path d="M9 11h6M12 8v6"/></svg>;
    case 'voucher':    return <svg {...p}><path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M10 7v10" strokeDasharray="2 2"/></svg>;
    case 'globe':      return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>;
    case 'zap':        return <svg {...p}><path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z"/></svg>;
    case 'cmd':        return <svg {...p}><path d="M9 9V6a3 3 0 113 3v0M15 9v6M15 9h-6M15 9V6a3 3 0 113 3v0M15 15v3a3 3 0 11-3-3v0M9 15v3a3 3 0 11-3-3v0M9 15h6"/></svg>;
    case 'briefcase':  return <svg {...p}><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/></svg>;
    case 'activity':   return <svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'layers':     return <svg {...p}><path d="M12 2l10 6-10 6L2 8l10-6z"/><path d="M2 17l10 6 10-6M2 12l10 6 10-6"/></svg>;
    case 'database':   return <svg {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/></svg>;
    case 'cycle':      return <svg {...p}><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg>;
    case 'flag':       return <svg {...p}><path d="M4 21V4h12l-2 4 2 4H4"/></svg>;
    case 'copy':       return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
    case 'qr':         return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 21h-4M21 17v-3M17 21v-4"/></svg>;
    case 'link':       return <svg {...p}><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>;
    case 'message':    return <svg {...p}><path d="M21 11.5a8.4 8.4 0 01-9 8.4 8.5 8.5 0 01-3.7-.8L3 21l1.9-5.3A8.4 8.4 0 0112 3a8.4 8.4 0 019 8.5z"/></svg>;
    case 'star':       return <svg {...p}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z"/></svg>;
    case 'pulse':      return <svg {...p}><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>;
    case 'package':    return <svg {...p}><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v10"/></svg>;
    case 'wifi':       return <svg {...p}><path d="M5 12a10 10 0 0114 0M8.5 15.5a5 5 0 017 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>;
    case 'cpu':        return <svg {...p}><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/></svg>;
    default: return null;
  }
};

/* ============================================================
   ANIMATED COUNTER — counts up to target on mount
   ============================================================ */
const AnimatedCounter = ({ value, duration = 1100, prefix = '', suffix = '', decimals = 0, style = {} }) => {
  const to = Number(value) || 0;
  const [v, setV] = useState(to);
  const ranRef = useRef(false);
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    // Animation as enhancement: count up from 0. If anything fails, value stays at `to`.
    setV(0);
    let raf, start;
    let done = false;
    const finish = () => { if (!done) { done = true; setV(to); } };
    const tick = (t) => {
      if (done) return;
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(0 + (to - 0) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else done = true;
    };
    raf = requestAnimationFrame(tick);
    const safetyTimer = setTimeout(finish, duration + 400);
    return () => { cancelAnimationFrame(raf); clearTimeout(safetyTimer); done = true; };
  }, []);
  const out = decimals === 0
    ? Math.round(v).toLocaleString('en-US')
    : v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span style={style} className="font-num">{prefix}{out}{suffix}</span>;
};

/* ============================================================
   LOGO
   ============================================================ */
const Logo = ({ size = 'md' }) => {
  const px = size === 'lg' ? 38 : size === 'sm' ? 22 : 30;
  const fs = size === 'lg' ? 20 : size === 'sm' ? 14 : 16;
  return (
    <div className="logo-mark">
      <span className="glyph" style={{ width: px, height: px, fontSize: px * 0.5 }}>W</span>
      <span className="word" style={{ fontSize: fs }}>Credo<small>W</small></span>
    </div>
  );
};

/* ============================================================
   PILLS / STATUS
   ============================================================ */
const StatusPill = ({ kind, label, children }) => (
  <span className={`pill ${kind}`}><span className="dot"></span>{label || children}</span>
);

/* ============================================================
   CHARTS — pure SVG, smooth catmull-rom
   ============================================================ */
const Sparkline = ({ data, width = 120, height = 40, color = 'var(--purple)', fill = true, glow = false }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 6) - 3]);
  // smooth path
  const path = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const prev = pts[i - 1];
    const cx = (prev[0] + p[0]) / 2;
    return acc + ` Q${cx},${prev[1]} ${cx},${(prev[1] + p[1])/2} T${p[0]},${p[1]}`;
  }, '');
  const area = path + ` L${width},${height} L0,${height} Z`;
  const id = 'spk-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
        {glow && <filter id={id+'g'} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2"/>
        </filter>}
      </defs>
      {fill && <path d={area} fill={`url(#${id})`}/>}
      {glow && <path d={path} stroke={color} strokeWidth="2.4" fill="none" filter={`url(#${id}g)`} opacity="0.7"/>}
      <path d={path} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color} opacity="0.4">
        <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
};

const Bars = ({ data, width = 360, height = 160, color = 'var(--purple)', cap = null, capLabel = '', labels = null }) => {
  const max = Math.max(...data, cap || 0) * 1.12 || 1;
  const bw = width / data.length - 8;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="bargrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.25"/>
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const h = (v / max) * (height - 30);
        const x = i * (bw + 8) + 4;
        const y = height - h - 18;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx="4" fill="url(#bargrad)">
              <animate attributeName="height" from="0" to={h} dur="0.6s" begin={`${i*0.04}s`} fill="freeze"/>
              <animate attributeName="y" from={height-18} to={y} dur="0.6s" begin={`${i*0.04}s`} fill="freeze"/>
            </rect>
            <text x={x + bw/2} y={height - 4} textAnchor="middle" fill="var(--text-3)" fontSize="9" fontFamily="var(--font-mono)">{labels ? labels[i] : `W${i+1}`}</text>
          </g>
        );
      })}
      {cap != null && (
        <g>
          <line x1="0" y1={height - 18 - (cap / max) * (height - 30)} x2={width} y2={height - 18 - (cap / max) * (height - 30)} stroke="var(--danger)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6"/>
          <text x={width - 4} y={height - 18 - (cap / max) * (height - 30) - 4} textAnchor="end" fill="var(--danger)" fontSize="9" fontFamily="var(--font-mono)">{capLabel}</text>
        </g>
      )}
    </svg>
  );
};

/* ============================================================
   COMMAND PALETTE — ⌘K / Ctrl+K
   ============================================================ */
const CommandPalette = ({ open, onClose, onNav }) => {
  const [q, setQ] = useState('');
  const inputRef = useRef();
  const items = useMemo(() => ([
    { g: 'صفحات',   id: 'dashboard', label: 'الرئيسية',           icon: 'home',     hint: 'D' },
    { g: 'صفحات',   id: 'tree',      label: 'شجرة الشبكة',         icon: 'tree',     hint: 'T' },
    { g: 'صفحات',   id: 'wallet',    label: 'المحفظة و C Money',  icon: 'wallet',   hint: 'W' },
    { g: 'صفحات',   id: 'earnings',  label: 'الأرباح والعمولات',  icon: 'chart',    hint: 'E' },
    { g: 'صفحات',   id: 'team',      label: 'الفريق والإحالات',    icon: 'team',     hint: 'M' },
    { g: 'صفحات',   id: 'ranks',     label: 'الرتب والمكافآت',     icon: 'rank' },
    { g: 'صفحات',   id: 'shop',      label: 'المتجر',              icon: 'shop' },
    { g: 'صفحات',   id: 'academy',   label: 'الأكاديمية',          icon: 'academy' },
    { g: 'صفحات',   id: 'support',   label: 'الدعم الفني',         icon: 'support' },
    { g: 'إدارة',   id: 'admin',     label: 'لوحة الأدمن',         icon: 'admin' },
    { g: 'إجراءات', id: '__transfer',label: 'تحويل C Money جديد',  icon: 'send', action: () => onNav('wallet') },
    { g: 'إجراءات', id: '__invite',  label: 'دعوة عضو جديد',       icon: 'plus', action: () => onNav('team') },
    { g: 'إجراءات', id: '__ticket',  label: 'إنشاء تذكرة دعم',     icon: 'message', action: () => onNav('support') },
  ]), [onNav]);

  const filtered = q ? items.filter(it => it.label.includes(q) || (it.hint && it.hint.toLowerCase() === q.toLowerCase())) : items;

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
    if (!open) setQ('');
  }, [open]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const groups = {};
  filtered.forEach(it => { (groups[it.g] = groups[it.g] || []).push(it); });

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(5,6,13,0.78)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh',
      animation: 'fade-in 180ms var(--ease-out)'
    }}>
      <div onClick={e => e.stopPropagation()} className="glass-strong anim-scale-in" style={{
        width: 'min(560px, 92vw)', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(196,184,255,0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <Icon name="search" size={16} style={{ color: 'var(--text-3)' }}/>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ابحث عن صفحة، إجراء، أو عضو..."
            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--text-1)', fontSize: 15, fontFamily: 'var(--font-body)' }}
          />
          <span className="kbd">ESC</span>
        </div>
        <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: 8 }}>
          {Object.entries(groups).map(([g, list]) => (
            <div key={g} style={{ marginBottom: 4 }}>
              <div className="t-eyebrow" style={{ padding: '8px 12px 4px' }}>{g}</div>
              {list.map(it => (
                <button key={it.id} onClick={() => { it.action ? it.action() : onNav(it.id); onClose(); }} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 12px', borderRadius: 8, border: 0, background: 'transparent',
                  color: 'var(--text-1)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)',
                  textAlign: 'start', transition: 'background 120ms var(--ease-out)'
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,184,255,0.06)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon name={it.icon} size={16} style={{ color: 'var(--text-2)' }}/>
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.hint && <span className="kbd">{it.hint}</span>}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>لا توجد نتائج</div>}
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '10px 18px', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--text-3)' }}>
          <span><span className="kbd">↑</span> <span className="kbd">↓</span> تنقّل</span>
          <span><span className="kbd">⏎</span> اختيار</span>
          <span style={{ marginInlineStart: 'auto' }}>Credo W · v1.0</span>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   TOPBAR (glass, sticky)
   ============================================================ */
const Topbar = ({ title, subtitle, onInvite, onCmdK, breadcrumbs = [] }) => (
  <div className="glass-strong" style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 28px', borderBottom: '1px solid var(--line)',
    position: 'sticky', top: 0, zIndex: 20,
  }}>
    <div>
      {breadcrumbs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{b}</span>
              {i < breadcrumbs.length - 1 && <Icon name="arrow-left" size={10} style={{ color: 'var(--text-4)' }}/>}
            </React.Fragment>
          ))}
        </div>
      )}
      {!breadcrumbs.length && subtitle && <div className="t-eyebrow" style={{ marginBottom: 4 }}>{subtitle}</div>}
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h2>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={onCmdK} className="btn btn-sm" style={{ background: 'var(--surface-1)', gap: 10, padding: '8px 12px', borderRadius: 10 }}>
        <Icon name="search" size={14} style={{ color: 'var(--text-3)' }}/>
        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>ابحث عن أي شيء...</span>
        <span className="kbd" style={{ marginInlineStart: 18 }}>⌘ K</span>
      </button>
      <div className="pill live"><span className="dot"></span>دورة 18 · 3 أيام متبقية</div>
      <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }} aria-label="notifications">
        <Icon name="bell" size={16}/>
        <span style={{ position: 'absolute', top: 5, insetInlineEnd: 5, width: 8, height: 8, borderRadius: 4, background: 'var(--electric)', boxShadow: '0 0 0 2px var(--bg-page), 0 0 8px var(--electric)' }}/>
      </button>
      {onInvite && (
        <button className="btn btn-primary" onClick={onInvite}>
          <Icon name="plus" size={14}/> دعوة عضو
        </button>
      )}
    </div>
  </div>
);

/* ============================================================
   SIDEBAR
   ============================================================ */
const Sidebar = ({ current, onNav }) => {
  const groups = [
    { title: 'النشاط', items: [
      { id: 'dashboard', label: 'الرئيسية', icon: 'home', hint: 'D' },
      { id: 'tree',      label: 'شجرة الشبكة', icon: 'tree', hint: 'T' },
      { id: 'team',      label: 'الفريق والإحالات', icon: 'team' },
    ]},
    { title: 'المالية', items: [
      { id: 'wallet',   label: 'المحفظة و C Money', icon: 'wallet', hint: 'W', badge: 'New' },
      { id: 'earnings', label: 'الأرباح والعمولات',  icon: 'trend-up', hint: 'E' },
      { id: 'shop',     label: 'المتجر',             icon: 'shop' },
      { id: 'ranks',    label: 'الرتب والمكافآت',    icon: 'rank' },
    ]},
    { title: 'الموارد', items: [
      { id: 'academy',  label: 'الأكاديمية',       icon: 'academy' },
      { id: 'leads',    label: 'شراء البيانات',    icon: 'leads' },
      { id: 'support',  label: 'الدعم الفني',      icon: 'support' },
    ]},
    { title: 'الإدارة', items: [
      { id: 'admin',    label: 'لوحة الأدمن',     icon: 'admin' },
      { id: 'settings', label: 'الإعدادات',       icon: 'settings' },
    ]},
  ];

  return (
    <aside style={{
      width: 264, flexShrink: 0,
      background: 'var(--bg-page-2)',
      borderInlineEnd: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      zIndex: 10
    }}>
      <div style={{ padding: '22px 22px 14px' }}>
        <Logo/>
      </div>

      {/* User chip — premium gradient + animated rank ring */}
      <div style={{ margin: '0 14px 14px', padding: 14, borderRadius: 14, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(140deg, rgba(123,108,246,0.16) 0%, rgba(107,228,255,0.05) 100%)',
        border: '1px solid var(--line-purple)'
      }}>
        <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}/>
        <div style={{ position: 'relative', display: 'flex', gap: 11, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 40, height: 40 }}>
            <svg viewBox="0 0 40 40" width="40" height="40" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="20" cy="20" r="18" fill="none" stroke="var(--surface-2)" strokeWidth="2"/>
              <circle cx="20" cy="20" r="18" fill="none" stroke="url(#rankRing)" strokeWidth="2"
                strokeDasharray={`${68 * 1.13} ${113 - 68*1.13}`} strokeLinecap="round"
                transform="rotate(-90 20 20)"/>
              <defs>
                <linearGradient id="rankRing">
                  <stop offset="0%" stopColor="#7B6CF6"/>
                  <stop offset="100%" stopColor="#C4B8FF"/>
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: 'linear-gradient(135deg, #7B6CF6, #C4B8FF)', display: 'grid', placeItems: 'center', color: '#0A0A0A', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>أم</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>أحمد المنصوري</div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>USR-102458 · Silver</div>
          </div>
          <Icon name="chevron-down" size={14} style={{ color: 'var(--text-3)' }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12, position: 'relative' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>الأرباح هذه الدورة</div>
            <div className="font-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              <AnimatedCounter value={6480}/> <span style={{ fontSize: 10, color: 'var(--text-3)' }}>ج.م</span>
            </div>
          </div>
          <span className="pill ok" style={{ padding: '2px 7px', fontSize: 10 }}><span className="dot"></span>+8%</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 10px 12px', overflowY: 'auto' }}>
        {groups.map(g => (
          <div key={g.title} style={{ marginBottom: 14 }}>
            <div className="t-eyebrow" style={{ padding: '6px 12px' }}>{g.title}</div>
            {g.items.map(it => {
              const active = it.id === current;
              return (
                <button
                  key={it.id}
                  onClick={() => onNav(it.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                    padding: '9px 12px', borderRadius: 10, border: 0, cursor: 'pointer',
                    marginBottom: 2, position: 'relative',
                    background: active ? 'linear-gradient(90deg, rgba(123,108,246,0.18), rgba(123,108,246,0.04))' : 'transparent',
                    color: active ? 'var(--lavender)' : 'var(--text-2)',
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    fontWeight: active ? 600 : 500, textAlign: 'start',
                    transition: 'all var(--d-fast) var(--ease-out)'
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-1)'; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}}
                >
                  {active && <span style={{ position: 'absolute', insetInlineStart: -10, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, var(--purple), var(--lavender))', boxShadow: '0 0 10px var(--purple)' }}/>}
                  <Icon name={it.icon} size={16}/>
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.badge && <span className="pill live" style={{ padding: '1px 6px', fontSize: 9 }}>{it.badge}</span>}
                  {it.hint && !it.badge && <span className="kbd" style={{ opacity: 0.6 }}>{it.hint}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 14, borderTop: '1px solid var(--line)' }}>
        <button onClick={() => onNav('login')} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '8px 10px', borderRadius: 8, border: 0, background: 'transparent',
          color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)',
          transition: 'color 120ms'
        }} onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
           onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
          <Icon name="logout" size={14}/>تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};

/* ============================================================
   SHARED PIECES
   ============================================================ */
// Section header used inside pages
const SectionTitle = ({ eyebrow, title, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
    <div>
      {eyebrow && <div className="t-eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
      <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
    </div>
    {action}
  </div>
);

// Ambient glow blobs container
const GlowBg = () => (
  <>
    <div className="glow-blob" style={{ width: 420, height: 420, background: 'radial-gradient(circle, rgba(123,108,246,0.30), transparent 70%)', top: '-100px', insetInlineEnd: '-100px' }}/>
    <div className="glow-blob" style={{ width: 360, height: 360, background: 'radial-gradient(circle, rgba(107,228,255,0.18), transparent 70%)', bottom: '-100px', insetInlineStart: '-100px', animationDelay: '-6s' }}/>
  </>
);

Object.assign(window, { Icon, AnimatedCounter, Logo, StatusPill, Sparkline, Bars, CommandPalette, Topbar, Sidebar, SectionTitle, GlowBg });

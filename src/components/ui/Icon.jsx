const paths = {
  home: [<path key="1" d="M3 11l9-7 9 7" />, <path key="2" d="M5 10v10h14V10" />],
  tree: [
    <circle key="1" cx="12" cy="4" r="2" />,
    <circle key="2" cx="6" cy="14" r="2" />,
    <circle key="3" cx="18" cy="14" r="2" />,
    <path key="4" d="M12 6v3l-5 3M12 9l5 3" />,
  ],
  team: [
    <circle key="1" cx="9" cy="9" r="3" />,
    <circle key="2" cx="17" cy="10" r="2.4" />,
    <path key="3" d="M3 19c.8-3 3.2-5 6-5s5.2 2 6 5" />,
    <path key="4" d="M15 19c.5-2 2-3.4 4-3.4" />,
  ],
  wallet: [
    <rect key="1" x="3" y="6" width="18" height="13" rx="2" />,
    <path key="2" d="M16 12.5h2.5M3 8.5h13a3 3 0 010 6" />,
  ],
  shop: [
    <path key="1" d="M3 7h18l-1.5 11a2 2 0 01-2 2h-11a2 2 0 01-2-2L3 7z" />,
    <path key="2" d="M8 7V5a4 4 0 018 0v2" />,
  ],
  chart: [<path key="1" d="M4 19V5M4 19h16M8 16V11M12 16V8M16 16v-3" />],
  rank: [<path key="1" d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z" />],
  support: [
    <path key="1" d="M21 12a9 9 0 10-9 9c2 0 3-1 3-1l3 1-1-3s1-1 1-3" />,
    <path key="2" d="M9 13a3 3 0 116 0c0 2-2 2-2 4" />,
  ],
  settings: [
    <circle key="1" cx="12" cy="12" r="3" />,
    <path key="2" d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8L4.2 8a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V4a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V10a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />,
  ],
  logout: [
    <path key="1" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />,
    <path key="2" d="M16 17l5-5-5-5M21 12H9" />,
  ],
  bell: [
    <path key="1" d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />,
    <path key="2" d="M10 21a2 2 0 004 0" />,
  ],
  menu: [<path key="1" d="M4 6h16M4 12h16M4 18h16" />],
  search: [<circle key="1" cx="11" cy="11" r="7" />, <path key="2" d="M21 21l-4.3-4.3" />],
  'arrow-left': [<path key="1" d="M19 12H5M11 5l-7 7 7 7" />],
  'arrow-right': [<path key="1" d="M5 12h14M13 5l7 7-7 7" />],
  'arrow-down': [<path key="1" d="M12 5v14M19 12l-7 7-7-7" />],
  'chevron-down': [<path key="1" d="M6 9l6 6 6-6" />],
  'chevron-up': [<path key="1" d="M6 15l6-6 6 6" />],
  check: [<path key="1" d="M5 13l4 4L19 7" />],
  eye: [
    <path key="1" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />,
    <circle key="2" cx="12" cy="12" r="3" />,
  ],
  'eye-off': [
    <path key="1" d="M2 12s3.5-7 10-7c2 0 3.7.7 5.2 1.7M22 12s-3.5 7-10 7c-2 0-3.7-.7-5.2-1.7" />,
    <path key="2" d="M3 3l18 18" />,
  ],
  lock: [
    <rect key="1" x="4" y="11" width="16" height="10" rx="2" />,
    <path key="2" d="M8 11V7a4 4 0 018 0v4" />,
  ],
  admin: [
    <path key="1" d="M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6l8-4z" />,
    <path key="2" d="M9 11h6M12 8v6" />,
  ],
  gift: [
    <rect key="1" x="3" y="9" width="18" height="12" rx="1" />,
    <path key="2" d="M3 13h18M12 9v12M8 9a2.5 2.5 0 010-5c2 0 4 5 4 5s2-5 4-5a2.5 2.5 0 010 5" />,
  ],
  voucher: [
    <path key="1" d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z" />,
    <path key="2" d="M10 7v10" strokeDasharray="2 2" />,
  ],
  globe: [
    <circle key="1" cx="12" cy="12" r="9" />,
    <path key="2" d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />,
  ],
  package: [
    <path key="1" d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />,
    <path key="2" d="M3 8l9 5 9-5M12 13v10" />,
  ],
  send: [
    <path key="1" d="M22 2L11 13" />,
    <path key="2" d="M22 2l-7 20-4-9-9-4 20-7z" />,
  ],
  link: [
    <path key="1" d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" />,
    <path key="2" d="M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" />,
  ],
  user: [
    <circle key="1" cx="12" cy="8" r="4" />,
    <path key="2" d="M4 20c1.5-4 4-6 8-6s6.5 2 8 6" />,
  ],
  cart: [
    <path key="1" d="M3 7h18l-1.5 11a2 2 0 01-2 2h-11a2 2 0 01-2-2L3 7z" />,
    <path key="2" d="M8 7V5a4 4 0 018 0v2" />,
  ],
  truck: [
    <path key="1" d="M3 7h11v8H3zM14 10h4l3 3v2h-7v-5z" />,
    <circle key="2" cx="7" cy="18" r="2" />,
    <circle key="3" cx="18" cy="18" r="2" />,
  ],
  'trend-up': [
    <path key="1" d="M3 17l6-6 4 4 8-8" />,
    <path key="2" d="M14 7h7v7" />,
  ],
  zap: [<path key="1" d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" />],
  message: [<path key="1" d="M21 11.5a8.4 8.4 0 01-9 8.4 8.5 8.5 0 01-3.7-.8L3 21l1.9-5.3A8.4 8.4 0 0112 3a8.4 8.4 0 019 8.5z" />],
  briefcase: [
    <rect key="1" x="3" y="7" width="18" height="14" rx="2" />,
    <path key="2" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" />,
  ],
  layers: [
    <path key="1" d="M12 2l10 6-10 6L2 8l10-6z" />,
    <path key="2" d="M2 17l10 6 10-6M2 12l10 6 10-6" />,
  ],
  coin: [
    <circle key="1" cx="12" cy="12" r="9" />,
    <path key="2" d="M12 7v10M9 9.5c0-1 1.5-1.5 3-1.5s3 .5 3 1.5-1.5 1.5-3 1.5-3 .5-3 1.5 1.5 1.5 3 1.5 3-.5 3-1.5" />,
  ],
  academy: [
    <path key="1" d="M3 9l9-4 9 4-9 4-9-4z" />,
    <path key="2" d="M7 11v4c0 1.7 2.7 3 5 3s5-1.3 5-3v-4" />,
  ],
  leads: [
    <rect key="1" x="3" y="4" width="18" height="16" rx="2" />,
    <path key="2" d="M7 8h10M7 12h7M7 16h5" />,
  ],
  download: [
    <path key="1" d="M12 3v12M8 11l4 4 4-4" />,
    <path key="2" d="M4 19h16" />,
  ],
  upload: [
    <path key="1" d="M12 21V9M8 13l4-4 4 4" />,
    <path key="2" d="M4 5h16" />,
  ],
  cycle: [
    <path key="1" d="M4 12a8 8 0 0113.5-5.7L20 8" />,
    <path key="2" d="M20 4v4h-4M20 12a8 8 0 01-13.5 5.7L4 16" />,
    <path key="3" d="M4 20v-4h4" />,
  ],
  shield: [
    <path key="1" d="M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6l8-4z" />,
  ],
  x: [<path key="1" d="M6 6l12 12M18 6L6 18" />],
  qr: [
    <rect key="1" x="3" y="3" width="7" height="7" rx="1" />,
    <rect key="2" x="14" y="3" width="7" height="7" rx="1" />,
    <rect key="3" x="3" y="14" width="7" height="7" rx="1" />,
    <path key="4" d="M14 14h3v3h-3zM18 18h3v3h-3zM14 21h3" />,
  ],
  circle: [<circle key="1" cx="12" cy="12" r="9" />],
  sparkles: [
    <path key="1" d="M12 3l1.2 4.2L17 8l-3.8 1.2L12 14l-1.2-4.8L7 8l3.8-.8L12 3z" />,
    <path key="2" d="M5 16l.8 2.8L8 19l-2.2.7L5 22l-.8-2.3L2 19l2.2-.7L5 16z" />,
    <path key="3" d="M18 14l.6 2.1L21 17l-2.4.8L18 20l-.6-2.2L15 17l2.4-.9L18 14z" />,
  ],
  star: [<path key="1" d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z" />],
  flame: [<path key="1" d="M12 3c2 4 5 5 5 9a5 5 0 11-10 0c0-4 3-5 5-9z" />],
  activity: [
    <path key="1" d="M4 14l4-6 4 3 4-7 4 10" />,
    <path key="2" d="M4 19h16" />,
  ],
  play: [
    <circle key="1" cx="12" cy="12" r="9" />,
    <path key="2" d="M10 8l7 4-7 4V8z" fill="currentColor" stroke="none" />,
  ],
  'check-circle': [
    <circle key="1" cx="12" cy="12" r="9" />,
    <path key="2" d="M8 12l3 3 5-6" />,
  ],
  cpu: [
    <rect key="1" x="5" y="5" width="14" height="14" rx="2" />,
    <path key="2" d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />,
  ],
  calendar: [
    <rect key="1" x="3" y="5" width="18" height="16" rx="2" />,
    <path key="2" d="M3 9h18M8 3v4M16 3v4" />,
  ],
  copy: [
    <rect key="1" x="9" y="9" width="12" height="12" rx="2" />,
    <path key="2" d="M5 15H4a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1" />,
  ],
  database: [
    <ellipse key="1" cx="12" cy="6" rx="8" ry="3" />,
    <path key="2" d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />,
  ],
  wifi: [
    <path key="1" d="M5 12.5a14 14 0 0114 0" />,
    <path key="2" d="M8.5 16a9 9 0 017 0" />,
    <path key="3" d="M12 20h.01" />,
    <circle key="4" cx="12" cy="20" r="1" fill="currentColor" stroke="none" />,
  ],
}

export default function Icon({ name, size = 16, className = '', style = {}, strokeWidth = 1.8 }) {
  const children = paths[name]
  if (!children) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  )
}

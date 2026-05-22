export default function Sparkline({
  data,
  width = 120,
  height = 40,
  color = 'var(--purple)',
  fill = true,
  glow = false,
}) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const pts = data.map((v, i) => [
    i * stepX,
    height - ((v - min) / range) * (height - 6) - 3,
  ])
  const path = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`
    const prev = pts[i - 1]
    const cx = (prev[0] + p[0]) / 2
    return `${acc} Q${cx},${prev[1]} ${cx},${(prev[1] + p[1]) / 2} T${p[0]},${p[1]}`
  }, '')
  const area = `${path} L${width},${height} L0,${height} Z`
  const id = `spk-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        {glow && (
          <filter id={`${id}g`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        )}
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      {glow && (
        <path
          d={path}
          stroke={color}
          strokeWidth="2.4"
          fill="none"
          filter={`url(#${id}g)`}
          opacity="0.7"
        />
      )}
      <path
        d={path}
        stroke={color}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} opacity="0.4">
        <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

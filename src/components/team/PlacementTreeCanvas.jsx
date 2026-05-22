import { useMemo, useState, useId } from 'react'
import { layoutPlacementTree } from './placementTreeLayout'
import PlacementTreeMemberPanel from './PlacementTreeMemberPanel'

function bezierPath(l) {
  const mid = (l.y1 + l.y2) / 2
  return `M${l.x1},${l.y1} C${l.x1},${mid} ${l.x2},${mid} ${l.x2},${l.y2}`
}

function TreeConnections({ lines, uid }) {
  return (
    <>
      {lines.map((l, i) => {
        const path = bezierPath(l)
        const grad = !l.active ? `${uid}-lineInactive` : l.side === 'L' ? `${uid}-lineA` : `${uid}-lineB`
        const color = l.side === 'L' ? '#C4B8FF' : '#6BE4FF'
        const dur = `${3 + (i % 3)}s`

        return (
          <g key={i}>
            {l.active && (
              <path
                d={path}
                stroke={color}
                strokeWidth="3"
                fill="none"
                opacity="0.35"
                filter={`url(#${uid}-lineGlow)`}
              />
            )}
            <path d={path} stroke={`url(#${grad})`} strokeWidth="1.6" fill="none" opacity="0.85" />
            {l.active && (
              <circle r="2.5" fill={color} opacity="0.9">
                <animateMotion dur={dur} repeatCount="indefinite" path={path} begin={`${i * 0.4}s`} />
                <animate
                  attributeName="opacity"
                  values="0;0.9;0.9;0"
                  dur={dur}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                />
              </circle>
            )}
          </g>
        )
      })}
    </>
  )
}

function TreeNode({ n, isYou, isSelected, isHovered, filter, onSelect, onHover }) {
  const isInactive = n.status !== 'active'
  const sideColor = n.branchSide === 'L' ? '#C4B8FF' : n.branchSide === 'R' ? '#6BE4FF' : '#7B6CF6'
  const matched =
    filter === 'all' || (filter === 'active' && !isInactive) || (filter === 'inactive' && isInactive)

  return (
    <g
      style={{ cursor: 'pointer', opacity: matched ? 1 : 0.18, transition: 'opacity 220ms' }}
      onClick={() => onSelect(n)}
      onMouseEnter={() => onHover(n.id)}
      onMouseLeave={() => onHover(null)}
    >
      {(isHovered || isSelected) && (
        <circle cx={n.x} cy={n.y} r="45" fill="url(#nodePulse)" />
      )}
      {isYou && (
        <>
          <circle cx={n.x} cy={n.y} r="50" fill="none" stroke="#C4B8FF" strokeWidth="1" opacity="0.6">
            <animate attributeName="r" values="42;58;42" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r="36" fill="none" stroke="#7B6CF6" strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="36;48;36" dur="3s" repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" begin="0.5s" />
          </circle>
        </>
      )}

      <rect
        x={n.x - 70}
        y={n.y - 28}
        width="140"
        height="56"
        rx="12"
        fill={isYou ? 'url(#youGrad)' : 'var(--surface-2)'}
        stroke={
          isYou
            ? '#C4B8FF'
            : isSelected
              ? sideColor
              : n.rank
                ? '#FFB23F'
                : 'var(--line-strong)'
        }
        strokeWidth={isYou || isHovered ? 1.5 : 1}
      />

      {!isYou && (
        <circle
          cx={n.x + 58}
          cy={n.y - 18}
          r="4"
          fill={isInactive ? '#4A4A6A' : '#2BD9A0'}
          style={{ filter: !isInactive ? 'drop-shadow(0 0 4px #2BD9A0)' : 'none' }}
        >
          {!isInactive && (
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          )}
        </circle>
      )}

      {n.rank && !isYou && (
        <g transform={`translate(${n.x - 58},${n.y - 22})`}>
          <path
            d="M0,8 L2.4,2.5 L8,2.3 L3.7,-1.2 L5,-7 L0,-3.5 L-5,-7 L-3.7,-1.2 L-8,2.3 L-2.4,2.5 Z"
            fill="#FFB23F"
          />
        </g>
      )}

      <text
        x={n.x}
        y={n.y - 8}
        textAnchor="middle"
        fill={isYou ? '#0A0A0A' : 'var(--text-1)'}
        fontSize="11.5"
        fontWeight="700"
        fontFamily="var(--font-body)"
      >
        {n.username || '—'}
      </text>
      <text
        x={n.x}
        y={n.y + 6}
        textAnchor="middle"
        fill={isYou ? 'rgba(10,10,10,0.7)' : 'var(--text-3)'}
        fontSize="9"
        fontFamily="var(--font-mono)"
      >
        {n.user_code}
      </text>
      {n.rank && (
        <text
          x={n.x}
          y={n.y + 20}
          textAnchor="middle"
          fill={isYou ? 'rgba(10,10,10,0.85)' : sideColor}
          fontSize="10"
          fontWeight="700"
          fontFamily="var(--font-body)"
        >
          {n.rank}
        </text>
      )}
    </g>
  )
}

export default function PlacementTreeCanvas({ tree }) {
  const uid = useId().replace(/:/g, '')
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState('all')
  const [hoverId, setHoverId] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  const { nodes, lines, width: W, height: H } = useMemo(() => layoutPlacementTree(tree), [tree])
  const selectedId = selectedNode?.id ?? null

  return (
    <div
      className="card"
      style={{
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 700,
        background: 'var(--bg-page-2)',
      }}
    >
      <div
        className="glow-blob"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(123,108,246,0.25), transparent 70%)',
          insetInlineStart: '20%',
          top: '10%',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="glow-blob"
        style={{
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(107,228,255,0.15), transparent 70%)',
          insetInlineEnd: '15%',
          bottom: '15%',
          filter: 'blur(50px)',
          animationDelay: '-8s',
        }}
      />
      <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.2 }} />

      <div
        className="glass"
        style={{
          position: 'absolute',
          top: 14,
          insetInlineEnd: 14,
          padding: 10,
          borderRadius: 10,
          zIndex: 5,
          width: 140,
        }}
      >
        <div className="t-eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>
          الخريطة المصغّرة
        </div>
        <svg viewBox={`0 0 140 80`} width="120" height="68">
          {lines.map((l, i) => {
            const d = bezierPath({
              x1: (l.x1 / W) * 140,
              y1: (l.y1 / H) * 80,
              x2: (l.x2 / W) * 140,
              y2: (l.y2 / H) * 80,
            })
            return (
              <path
                key={i}
                d={d}
                stroke={l.active ? (l.side === 'L' ? '#C4B8FF' : '#6BE4FF') : '#4A4A6A'}
                strokeWidth="0.8"
                fill="none"
                opacity="0.5"
              />
            )
          })}
          {nodes.map((n, i) => (
            <circle
              key={i}
              cx={(n.x / W) * 140}
              cy={(n.y / H) * 80}
              r="1.5"
              fill={n.status === 'active' ? 'var(--lavender)' : 'var(--text-4)'}
            />
          ))}
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 14,
          insetInlineStart: 14,
          display: 'flex',
          gap: 8,
          zIndex: 5,
          flexWrap: 'wrap',
        }}
      >
        <div className="glass" style={{ padding: '6px 12px', borderRadius: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--side-left)' }} />
          <span style={{ fontSize: 11, color: 'var(--side-left)', fontWeight: 600 }}>LEFT · A</span>
        </div>
        <div className="glass" style={{ padding: '6px 12px', borderRadius: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--side-right)' }} />
          <span style={{ fontSize: 11, color: 'var(--side-right)', fontWeight: 600 }}>RIGHT · B</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          display: 'flex',
          gap: 4,
          padding: 3,
          background: 'var(--surface-0)',
          borderRadius: 10,
          border: '1px solid var(--line)',
        }}
      >
        {[
          ['all', 'الكل'],
          ['active', 'نشط'],
          ['inactive', 'غير نشط'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            style={{
              padding: '6px 10px',
              border: 0,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: filter === id ? 'var(--surface-2)' : 'transparent',
              color: filter === id ? 'var(--text-1)' : 'var(--text-3)',
              cursor: 'pointer',
              boxShadow: filter === id ? 'inset 0 0 0 1px var(--line-purple)' : 'none',
              fontFamily: 'var(--font-body)',
            }}
          >
            {label}
          </button>
        ))}
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 2px' }} />
        <button
          type="button"
          aria-label="تصغير"
          style={{
            padding: '4px 10px',
            border: 0,
            background: 'transparent',
            color: 'var(--text-2)',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
        >
          −
        </button>
        <span
          className="font-mono"
          style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-2)', minWidth: 44, textAlign: 'center' }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="تكبير"
          style={{
            padding: '4px 10px',
            border: 0,
            background: 'transparent',
            color: 'var(--text-2)',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
          onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
        >
          +
        </button>
      </div>

      <div style={{ overflow: 'auto', padding: 50, position: 'relative', height: 700 }}>
        <div
          style={{
            minWidth: W,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 220ms var(--ease-out)',
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <linearGradient id={`${uid}-lineA`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#C4B8FF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#C4B8FF" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id={`${uid}-lineB`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#6BE4FF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6BE4FF" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id={`${uid}-lineInactive`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4A4A6A" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4A4A6A" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="nodePulse">
                <stop offset="0%" stopColor="#7B6CF6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7B6CF6" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="youGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#7B6CF6" />
                <stop offset="100%" stopColor="#C4B8FF" />
              </linearGradient>
              <filter id={`${uid}-lineGlow`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <TreeConnections lines={lines} uid={uid} />

            {nodes.map((n) => (
              <TreeNode
                key={n.id}
                n={n}
                isYou={n.depth === 0}
                isSelected={selectedId === n.id}
                isHovered={hoverId === n.id}
                filter={filter}
                onSelect={(node) => setSelectedNode(node)}
                onHover={setHoverId}
              />
            ))}
          </svg>
        </div>
      </div>

      {selectedNode?.user_id && (
        <PlacementTreeMemberPanel
          userId={selectedNode.user_id}
          branchSide={selectedNode.branchSide}
          onClose={() => setSelectedNode(null)}
        />
      )}

      <div
        className="glass"
        style={{
          position: 'absolute',
          bottom: 14,
          insetInlineStart: 14,
          padding: '10px 14px',
          borderRadius: 10,
          display: 'flex',
          gap: 16,
          fontSize: 11,
          color: 'var(--text-2)',
        }}
      >
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#2BD9A0', boxShadow: '0 0 6px #2BD9A0' }} />
          نشط
        </span>
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#4A4A6A' }} />
          غير نشط
        </span>
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: '#FFB23F' }}>★</span>
          صاحب رتبة
        </span>
      </div>
    </div>
  )
}

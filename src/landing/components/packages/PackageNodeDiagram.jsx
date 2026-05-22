import { motion } from 'framer-motion'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

const CONFIG = {
  1: { nodes: [{ x: 50, y: 50, r: 10 }], edges: [] },
  3: {
    nodes: [
      { x: 50, y: 28, r: 8 },
      { x: 28, y: 68, r: 7 },
      { x: 72, y: 68, r: 7 },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  },
  7: {
    nodes: [
      { x: 50, y: 18, r: 9 },
      { x: 22, y: 42, r: 6 },
      { x: 78, y: 42, r: 6 },
      { x: 35, y: 72, r: 5 },
      { x: 65, y: 72, r: 5 },
      { x: 15, y: 78, r: 4 },
      { x: 85, y: 78, r: 4 },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 3],
      [2, 4],
      [3, 4],
      [1, 5],
      [2, 6],
      [3, 5],
      [4, 6],
    ],
  },
}

export default function PackageNodeDiagram({ slots = 1, active = false }) {
  const reduced = usePrefersReducedMotion()
  const key = slots === 7 ? 7 : slots === 3 ? 3 : 1
  const { nodes, edges } = CONFIG[key]

  return (
    <svg className="ld-pkg-node-diagram" viewBox="0 0 100 100" aria-hidden>
      {edges.map(([a, b], i) => {
        const na = nodes[a]
        const nb = nodes[b]
        return (
          <motion.line
            key={`e-${i}`}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke="rgba(196,184,255,0.35)"
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ pathLength: 1, opacity: active ? 0.7 : 0.4 }}
            transition={{ duration: reduced ? 0 : 0.8, delay: i * 0.05 }}
          />
        )
      })}
      {nodes.map((n, i) => (
        <motion.circle
          key={`n-${i}`}
          cx={n.x}
          cy={n.y}
          r={n.r}
          fill={active ? 'url(#pkg-node-fill-active)' : 'url(#pkg-node-fill)'}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.5, delay: 0.1 + i * 0.06 }}
        />
      ))}
      <defs>
        <radialGradient id="pkg-node-fill">
          <stop offset="0%" stopColor="#c4b8ff" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
        <radialGradient id="pkg-node-fill-active">
          <stop offset="0%" stopColor="#f0ebff" />
          <stop offset="100%" stopColor="#a855f7" />
        </radialGradient>
      </defs>
    </svg>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

const GRAPHS = {
  mono: {
    nodes: [{ id: 'c', x: 200, y: 100, r: 14 }],
    edges: [],
    label: 'عقدة واحدة — بداية التوسع',
  },
  triple: {
    nodes: [
      { id: 'c', x: 200, y: 70, r: 11 },
      { id: 'l', x: 120, y: 140, r: 9 },
      { id: 'r', x: 280, y: 140, r: 9 },
    ],
    edges: [
      ['c', 'l'],
      ['c', 'r'],
      ['l', 'r'],
    ],
    label: 'ثلاث عقد — زخم الفريق',
  },
  seven: {
    nodes: [
      { id: 'c', x: 200, y: 50, r: 12 },
      { id: 'a', x: 100, y: 95, r: 8 },
      { id: 'b', x: 300, y: 95, r: 8 },
      { id: 'c2', x: 140, y: 150, r: 7 },
      { id: 'd', x: 260, y: 150, r: 7 },
      { id: 'e', x: 70, y: 165, r: 6 },
      { id: 'f', x: 330, y: 165, r: 6 },
      { id: 'g', x: 200, y: 175, r: 6 },
    ],
    edges: [
      ['c', 'a'],
      ['c', 'b'],
      ['c', 'c2'],
      ['c', 'd'],
      ['a', 'c2'],
      ['b', 'd'],
      ['c2', 'g'],
      ['d', 'g'],
      ['a', 'e'],
      ['b', 'f'],
      ['c2', 'e'],
      ['d', 'f'],
    ],
    label: 'شبكة كاملة — قيادة المنظومة',
  },
}

function GraphSvg({ graphKey }) {
  const reduced = usePrefersReducedMotion()
  const graph = GRAPHS[graphKey] || GRAPHS.mono
  const byId = Object.fromEntries(graph.nodes.map((n) => [n.id, n]))

  return (
    <motion.svg
      key={graphKey}
      className="ld-pkg-graph__svg"
      viewBox="0 0 400 200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.35 }}
    >
      <defs>
        <filter id="pkg-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {graph.edges.map(([from, to], i) => {
        const a = byId[from]
        const b = byId[to]
        if (!a || !b) return null
        return (
          <motion.line
            key={`${from}-${to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(168,85,247,0.5)"
            strokeWidth="1.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0 : 0.6, delay: i * 0.04 }}
          />
        )
      })}
      {graph.nodes.map((n, i) => (
        <motion.g key={n.id} filter="url(#pkg-glow)">
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="rgba(168,85,247,0.85)"
            stroke="rgba(196,184,255,0.9)"
            strokeWidth="1"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={
              reduced
                ? { duration: 0 }
                : { scale: { duration: 2.5, repeat: Infinity, delay: i * 0.2 } }
            }
          />
        </motion.g>
      ))}
    </motion.svg>
  )
}

export default function EcosystemGraph({ activeId = 'mono' }) {
  const graphKey = activeId === 'seven' ? 'seven' : activeId === 'triple' ? 'triple' : 'mono'
  const graph = GRAPHS[graphKey]

  return (
    <div className="ld-pkg-graph">
      <p className="ld-pkg-graph__hint">مرّر على الباقات لرؤية توسّع الشبكة</p>
      <div className="ld-pkg-graph__viewport">
        <AnimatePresence mode="wait">
          <GraphSvg key={graphKey} graphKey={graphKey} />
        </AnimatePresence>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={graph.label}
          className="ld-pkg-graph__label"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
        >
          {graph.label}
        </motion.p>
      </AnimatePresence>
      <div className="ld-pkg-graph__mobile-dots" aria-hidden>
        {['mono', 'triple', 'seven'].map((id) => (
          <span key={id} className={activeId === id ? 'active' : ''} />
        ))}
      </div>
    </div>
  )
}

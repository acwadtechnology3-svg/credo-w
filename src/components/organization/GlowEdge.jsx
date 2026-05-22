import { BaseEdge, getBezierPath } from '@xyflow/react'

export default function GlowEdge({ id, sourceX, sourceY, targetX, targetY, data, selected }) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY })
  const color = data?.side === 'LEFT' ? '#C4B8FF' : data?.side === 'RIGHT' ? '#6BE4FF' : '#7B6CF6'

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          opacity: 0.85,
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="6 8"
        opacity="0.35"
        className="org-edge-flow"
      />
    </>
  )
}

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Crown, Zap } from 'lucide-react'

function MemberTreeNode({ data, selected }) {
  const m = data || {}
  const sideColor = m.branchSide === 'LEFT' ? '#C4B8FF' : m.branchSide === 'RIGHT' ? '#6BE4FF' : '#7B6CF6'
  const frameClass = m.isFounder
    ? 'org-node--founder'
    : m.isEliteRecruiter
      ? 'org-node--elite'
      : m.prestigeTier
        ? `org-node--prestige-${m.prestigeTier}`
        : ''

  const initials = (m.full_name || m.username || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`org-tree-node ${frameClass} ${selected ? 'org-tree-node--selected' : ''} ${m.isYou ? 'org-tree-node--you' : ''}`}
      style={{ '--node-accent': sideColor, borderColor: m.agencyColor || sideColor }}
    >
      <Handle type="target" position={Position.Top} className="org-handle" />
      {m.isOnline && <span className="org-node__online" title="متصل" />}
      {m.isFounder && <Crown size={12} className="org-node__crown" />}
      <div className="org-node__avatar">
        {m.profile_image ? (
          <img src={m.profile_image} alt="" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="org-node__name">{m.full_name || m.username}</div>
      <div className="org-node__meta">{m.rank}</div>
      <div className="org-node__pkg">
        <Zap size={10} /> {m.packageLabel}
      </div>
      <div className="org-node__stats">
        <span>L {Math.round(m.leftBv || 0)}</span>
        <span>R {Math.round(m.rightBv || 0)}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="org-handle" />
    </div>
  )
}

export default memo(MemberTreeNode)

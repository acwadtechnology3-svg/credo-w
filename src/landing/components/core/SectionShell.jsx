import { motion } from 'framer-motion'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

/**
 * Consistent section wrapper: spacing rhythm, optional focal glow, story connector.
 */
export default function SectionShell({
  id,
  children,
  className = '',
  glow = 'none', // none | subtle | focal
  beat,
  compact = false,
  noPaddingTop = false,
}) {
  const reduced = usePrefersReducedMotion()
  const glowClass = glow === 'focal' ? 'ld-section-glow-focal' : glow === 'subtle' ? 'ld-section-glow-subtle' : ''

  return (
    <section
      id={id}
      className={`ld-section ${compact ? 'ld-section--compact' : ''} ${noPaddingTop ? 'ld-section--no-pt' : ''} ${glowClass} ${className}`.trim()}
    >
      {beat && !reduced && (
        <div className="ld-story-connector" aria-hidden>
          <span className="ld-story-beat">{beat}</span>
          <span className="ld-story-line" />
        </div>
      )}
      {children}
    </section>
  )
}

export function SectionDivider() {
  return (
    <div className="ld-container" aria-hidden>
      <div className="ld-section-divider" />
    </div>
  )
}

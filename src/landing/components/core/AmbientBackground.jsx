import { motion } from 'framer-motion'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

/** Subtle ambient only — focal glows live on SectionShell */
export default function AmbientBackground() {
  const reduced = usePrefersReducedMotion()

  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--ld-gradient-mesh)' }} />
      <div className="ld-dot-grid" />
      {!reduced && (
        <motion.div
          className="ld-blob ld-blob-purple"
          style={{ width: 480, height: 480, top: '-15%', right: '-10%' }}
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}

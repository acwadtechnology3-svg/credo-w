import { motion } from 'framer-motion'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

export default function EcosystemLinesBg() {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="ld-pkg-lines" aria-hidden>
      <svg className="ld-pkg-lines__svg" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="pkg-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(168,85,247,0)" />
            <stop offset="50%" stopColor="rgba(168,85,247,0.45)" />
            <stop offset="100%" stopColor="rgba(236,72,153,0)" />
          </linearGradient>
        </defs>
        {[
          'M0,200 Q300,80 600,200 T1200,200',
          'M0,280 Q400,120 800,280 T1200,280',
          'M0,120 Q350,240 700,120 T1200,120',
        ].map((d, i) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke="url(#pkg-line-grad)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              reduced
                ? { pathLength: 1, opacity: 0.25 }
                : { pathLength: 1, opacity: [0.15, 0.4, 0.15] }
            }
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }
            }
          />
        ))}
      </svg>
    </div>
  )
}

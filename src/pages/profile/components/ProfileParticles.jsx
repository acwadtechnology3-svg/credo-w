import { motion } from 'framer-motion'

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 5) % 95}%`,
  top: `${(i * 23 + 10) % 90}%`,
  delay: i * 0.4,
  size: 2 + (i % 3),
}))

export default function ProfileParticles() {
  return (
    <div className="profile-particles" aria-hidden>
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="profile-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
          }}
          animate={{ opacity: [0.15, 0.45, 0.15], y: [0, -20, 0] }}
          transition={{ duration: 6 + (p.id % 4), repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

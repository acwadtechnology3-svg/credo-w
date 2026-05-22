import { motion } from 'framer-motion'

export default function ProfileStatCard({ label, value, accent, delay = 0 }) {
  return (
    <motion.div
      className="pi-glass pi-stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={accent ? { borderColor: accent } : undefined}
    >
      <div className="pi-stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="pi-stat-label">{label}</div>
    </motion.div>
  )
}

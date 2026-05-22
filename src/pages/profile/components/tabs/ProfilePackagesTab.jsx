import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const LEVEL_META = {
  0: { name: 'Free', icon: '○', color: 'var(--text-3)' },
  1: { name: 'Mono', icon: '◇', color: 'var(--lavender)' },
  3: { name: 'Triple', icon: '◆', color: 'var(--purple)' },
  7: { name: 'Septuple', icon: '★', color: 'var(--pi-gold)' },
}

export default function ProfilePackagesTab({ hub }) {
  const navigate = useNavigate()
  const level = hub?.membership?.level ?? 0
  const meta = LEVEL_META[level] || { name: hub?.membership?.label, icon: '◆', color: 'var(--purple)' }

  return (
    <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="pi-glass" style={{ padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8, color: meta.color }}>{meta.icon}</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: meta.color }}>{meta.name} Package</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>
          Upgrade your package to unlock more slots, BV power, and commission tiers.
        </p>
        <button
          type="button"
          className="pi-btn pi-btn-primary"
          style={{ marginTop: 20 }}
          onClick={() => navigate('/packages')}
        >
          View Packages →
        </button>
      </div>
    </motion.div>
  )
}

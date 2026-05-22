import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function ProfileWalletsTab({ hub }) {
  const navigate = useNavigate()
  const w = hub?.wallets || {}

  const cards = [
    { label: 'Earnings Wallet', value: w.earnings, path: '/earnings/wallet', color: 'var(--success)' },
    { label: 'C Money', value: w.cmoney, path: '/earnings/wallet', color: 'var(--purple-bright)' },
    { label: 'Pearls', value: w.pearls, path: '/customer/pearls', color: 'var(--electric)' },
  ]

  return (
    <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="pi-stat-grid">
        {cards.map((c, i) => (
          <motion.button
            key={c.label}
            type="button"
            className="pi-glass pi-stat-card"
            style={{ cursor: 'pointer', textAlign: 'start', border: 'none' }}
            onClick={() => navigate(c.path)}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="pi-stat-value" style={{ color: c.color }}>
              {parseFloat(c.value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="pi-stat-label">{c.label}</div>
            <span style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 6, display: 'block' }}>
              Tap to manage →
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'

export default function ProfileActivityTab({ hub }) {
  const activity = hub?.recentActivity || []

  return (
    <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>
        Recent Wallet Activity
      </h3>
      {activity.length === 0 ? (
        <div className="pi-glass" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
          No recent activity yet. Your commissions and transfers will show here.
        </div>
      ) : (
        activity.map((tx, i) => (
          <motion.div
            key={i}
            className="pi-leaderboard-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.category}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {tx.description || '—'} · {new Date(tx.created_at).toLocaleString()}
              </div>
            </div>
            <span
              style={{
                fontWeight: 700,
                color: parseFloat(tx.amount) >= 0 ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {parseFloat(tx.amount) >= 0 ? '+' : ''}
              {parseFloat(tx.amount).toFixed(2)}
            </span>
          </motion.div>
        ))
      )}
    </motion.div>
  )
}

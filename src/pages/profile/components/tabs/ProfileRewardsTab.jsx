import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function ProfileRewardsTab({ hub }) {
  const navigate = useNavigate()
  const g = hub?.gamification || {}

  const rewards = [
    { title: 'Rank Bonus', desc: 'Unlock rank-based bonuses', path: '/earnings/rank-bonus', icon: '👑' },
    { title: 'Fast Start', desc: 'Direct referral cycles', path: '/earnings/fast-start', icon: '⚡' },
    { title: 'Level Bonus', desc: 'Depth commission rewards', path: '/earnings/level-bonus', icon: '📶' },
    { title: 'Team Commission', desc: 'Matching volume payouts', path: '/earnings/team-commission', icon: '🤝' },
  ]

  return (
    <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="pi-glass" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Daily Streak</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>
              {g.streak_days ?? 0} days
            </div>
          </div>
          <span style={{ fontSize: 40 }}>🔥</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
          Log in daily to build your streak and unlock streak achievements.
        </p>
      </div>

      {rewards.map((r, i) => (
        <motion.button
          key={r.path}
          type="button"
          className="pi-glass pi-leaderboard-row"
          style={{ width: '100%', cursor: 'pointer', border: 'none', marginBottom: 8 }}
          onClick={() => navigate(r.path)}
          whileHover={{ x: 4 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <span style={{ fontSize: 24 }}>{r.icon}</span>
          <div style={{ flex: 1, textAlign: 'start' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.desc}</div>
          </div>
          <span style={{ color: 'var(--purple-bright)' }}>→</span>
        </motion.button>
      ))}
    </motion.div>
  )
}

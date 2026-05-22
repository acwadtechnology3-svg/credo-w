import { motion } from 'framer-motion'

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: 'var(--pi-gold)',
  platinum: '#e5e4e2',
  legendary: 'var(--purple-bright)',
}

export default function ProfileAchievementsTab({ hub }) {
  const achievements = hub?.achievements || []
  const timeline = hub?.rankTimeline || []
  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="pi-stat-grid" style={{ marginBottom: 20 }}>
        <div className="pi-glass pi-stat-card">
          <div className="pi-stat-value" style={{ color: 'var(--pi-gold)' }}>
            {unlocked}/{achievements.length}
          </div>
          <div className="pi-stat-label">Badges Unlocked</div>
        </div>
        <div className="pi-glass pi-stat-card">
          <div className="pi-stat-value">{hub?.gamification?.xp ?? 0}</div>
          <div className="pi-stat-label">Total XP</div>
        </div>
        <div className="pi-glass pi-stat-card">
          <div className="pi-stat-value">{hub?.gamification?.streak_days ?? 0}</div>
          <div className="pi-stat-label">Day Streak</div>
        </div>
        <div className="pi-glass pi-stat-card">
          <div className="pi-stat-value">P{hub?.gamification?.prestige ?? 0}</div>
          <div className="pi-stat-label">Prestige</div>
        </div>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>
        Achievement Badges
      </h3>
      {achievements.map((a, i) => (
        <motion.div
          key={a.id}
          className={`pi-glass pi-achievement ${a.unlocked ? 'unlocked' : ''}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <span className="pi-achievement-icon">{a.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: TIER_COLORS[a.tier] || 'var(--text-1)' }}>
              {a.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{a.description}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
              +{a.xp_reward} XP · {a.tier}
              {a.unlocked_at && ` · ${new Date(a.unlocked_at).toLocaleDateString()}`}
            </div>
          </div>
          {a.unlocked && <span style={{ color: 'var(--success)', fontSize: 18 }}>✓</span>}
        </motion.div>
      ))}

      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '24px 0 10px' }}>
        Rank Evolution
      </h3>
      {timeline.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
          Your rank milestones will appear here as you advance.
        </p>
      ) : (
        timeline.map((m, i) => (
          <div key={i} className="pi-leaderboard-row">
            <span>📈</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{m.rank_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {new Date(m.reached_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))
      )}
    </motion.div>
  )
}

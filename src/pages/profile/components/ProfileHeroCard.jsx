import { motion } from 'framer-motion'
import UserAvatar from '../../../components/ui/UserAvatar'

function countryFlag(country) {
  if (!country) return '🌍'
  const map = {
    Egypt: '🇪🇬',
    'Saudi Arabia': '🇸🇦',
    UAE: '🇦🇪',
    Jordan: '🇯🇴',
    Kuwait: '🇰🇼',
  }
  return map[country] || '🌍'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ProfileHeroCard({
  hub,
  displayAvatar,
  displayInitials,
  uploadingAvatar,
  onAvatarChange,
}) {
  const user = hub?.user || {}
  const g = hub?.gamification || {}
  const team = hub?.team
  const rankName = user.ranks?.name || user.rank?.name || 'BAP'
  const rankPct = hub?.rankProgress?.pct ?? 0
  const xpPct = g.progress?.pct ?? 0

  return (
    <motion.section
      className="pi-glass pi-hero"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {g.profile_banner_url && (
        <div
          className="pi-hero-banner"
          style={{ backgroundImage: `url(${g.profile_banner_url})` }}
        />
      )}
      <div
        className="pi-hero-banner"
        style={{
          background:
            'linear-gradient(135deg, rgba(123,108,246,0.25), rgba(107,228,255,0.12))',
        }}
      />

      <div className="pi-hero-inner">
        <div className="pi-avatar-wrap">
          <div className="pi-avatar-ring" />
          <div className="pi-avatar-core">
            <UserAvatar
              src={displayAvatar}
              initials={displayInitials}
              size={120}
              fontSize={36}
            />
          </div>
          <span className="pi-rank-badge">{rankName}</span>
          <label
            style={{
              position: 'absolute',
              top: 4,
              insetInlineEnd: 4,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--purple)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: uploadingAvatar ? 'wait' : 'pointer',
              zIndex: 4,
              fontSize: 14,
              border: '2px solid var(--surface-1)',
            }}
            title="Change avatar"
          >
            {uploadingAvatar ? '…' : '📷'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onAvatarChange}
              disabled={uploadingAvatar}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div>
          <div className="pi-meta-row" style={{ marginBottom: 8 }}>
            {user.is_online ? (
              <span className="pi-online">
                <span className="pi-online-dot" />
                Online
              </span>
            ) : (
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Offline</span>
            )}
            <span className="pi-chip">{user.user_code}</span>
            <span className="pi-chip">
              {countryFlag(user.country)} {user.country || 'Global'}
            </span>
          </div>

          <h1 className="pi-username">{user.full_name || user.username}</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>@{user.username}</p>

          <div className="pi-meta-row" style={{ marginTop: 12 }}>
            <span className="pi-chip pi-chip-gold">Lv {g.level ?? 1}</span>
            <span className="pi-chip">Prestige {g.prestige ?? 0}</span>
            <span className="pi-chip">{hub?.membership?.label || 'Free'} Member</span>
            {team && (
              <span className="pi-chip" style={{ borderColor: team.team_color }}>
                🏰 {team.name}
              </span>
            )}
          </div>

          {team && (
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>
              Team Power <strong style={{ color: 'var(--electric)' }}>{team.power_score}</strong>
              {team.leaderboard_position != null && (
                <>
                  {' '}
                  · Rank <strong>#{team.leaderboard_position}</strong>
                </>
              )}
            </p>
          )}

          <div className="pi-progress-wrap">
            <div className="pi-progress-label">
              <span>Rank → {hub?.nextRank?.name || 'Max'}</span>
              <span>{Math.round(rankPct)}%</span>
            </div>
            <div className="pi-progress-bar">
              <motion.div
                className="pi-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${rankPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="pi-progress-wrap">
            <div className="pi-progress-label">
              <span>
                XP {g.xp ?? 0} → Level {(g.level ?? 1) + 1}
              </span>
              <span>{Math.round(xpPct)}%</span>
            </div>
            <div className="pi-progress-bar">
              <motion.div
                className="pi-progress-fill"
                style={{
                  background: 'linear-gradient(90deg, var(--pi-gold), #e8a820)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 10 }}>
            Joined {formatDate(user.created_at)}
            {user.active_date && ` · Active ${formatDate(user.active_date)}`}
            {g.streak_days > 0 && (
              <span style={{ color: 'var(--warning)', marginInlineStart: 8 }}>
                🔥 {g.streak_days}d streak
              </span>
            )}
          </p>
        </div>
      </div>
    </motion.section>
  )
}

import { motion } from 'framer-motion'

const SIDE_LABELS = { LEFT: 'Left Legion', RIGHT: 'Right Legion', AUTO: 'Auto Balance' }

export default function InvitePremiumCard({ card, compact = false }) {
  if (!card?.inviter) return null

  const { inviter, invitation, urls } = card
  const theme = invitation?.invite_theme || 'valorant'
  const style = invitation?.card_style || 'holographic'
  const emoji = invitation?.invite_emoji || '🔥'
  const sideLabel = SIDE_LABELS[invitation?.resolved_side || invitation?.placement_side] || 'Auto'

  const initials = (inviter.full_name || inviter.username || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`invite-card-wrap${compact ? ' invite-card-compact' : ''}`}>
      <motion.div
        className={`invite-premium-card theme-${theme}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className={`invite-card-inner style-${style}`}>
          <div className="invite-card-glow top" />
          <div className="invite-card-glow bottom" />

          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-3)', marginBottom: 8 }}>
            EXCLUSIVE ACCESS {emoji}
          </div>

          <div className="invite-card-header">
            {inviter.profile_image ? (
              <img src={inviter.profile_image} alt="" className="invite-card-avatar" />
            ) : (
              <div className="invite-card-avatar-fallback">{initials}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-1)' }}>
                {inviter.full_name || inviter.username}
              </div>
              <div className="invite-card-rank">{inviter.rank}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {inviter.team_name} · {inviter.package_label}
              </div>
            </div>
          </div>

          <p className="invite-card-msg">
            {invitation?.invitation_message ||
              "You've been selected for elite network placement. Accept before this invite expires."}
          </p>

          <div className="invite-card-meta">
            <span className="invite-card-chip">📍 {sideLabel}</span>
            <span className="invite-card-chip">🎖 {inviter.rank}</span>
            <span className="invite-card-chip">📦 {inviter.package_label}</span>
          </div>

          {!compact && urls?.qrUrl && (
            <div className="invite-card-qr">
              <img src={urls.qrUrl} width={120} height={120} alt="Invite QR" />
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                {invitation?.invite_code}
              </span>
            </div>
          )}

          <span className="invite-card-cta">Join My Team</span>
        </div>
      </motion.div>
    </div>
  )
}

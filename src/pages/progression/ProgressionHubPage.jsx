import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getProgressionHub,
  getLeaderboards,
  getLeaderboard,
  equipCosmetic,
  equipTitle,
  triggerProgressionAction,
} from '../../api/gamification.api'
import { useSocket } from '../../hooks/useSocket'
import { toast } from '../../components/shared/Toast'
import '../../styles/progression-hub.css'

const RARITY_GLOW = {
  common: '#a0a0b0',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#c9a84c',
  mythic: '#ec4899',
}

function CelebrationOverlay({ event, onClose }) {
  if (!event) return null
  const label =
    event.type === 'level_up'
      ? `Level ${event.level}`
      : event.type === 'prestige'
        ? event.prestige?.replace(/_/g, ' ')
        : event.type === 'mission_complete'
          ? event.mission
          : event.title || 'Achievement Unlocked'

  return (
    <motion.div
      className="progression-celebration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="pc-inner"
        initial={{ scale: 0.6, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="pc-icon"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.2, repeat: 2 }}
        >
          {event.icon || (event.type === 'level_up' ? '⬆️' : event.type === 'prestige' ? '👑' : '🏆')}
        </motion.div>
        <div className="pc-title">{label}</div>
        <p style={{ color: '#a0a0b0', marginTop: 8, fontSize: 14 }}>
          {event.type === 'level_up' ? event.title : 'Keep building your empire'}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 24 }}
          onClick={onClose}
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  )
}

function XpBar({ pct, label }) {
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a0a0b0' }}>
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="ph-xp-bar">
        <motion.div
          className="ph-xp-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function ProgressionHubPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')
  const [lbKey, setLbKey] = useState('global_xp')
  const [celebration, setCelebration] = useState(null)
  const socket = useSocket()

  const { data: hub, isLoading } = useQuery({
    queryKey: ['progression-hub'],
    queryFn: getProgressionHub,
    refetchInterval: 60000,
  })

  const { data: lbDefs } = useQuery({
    queryKey: ['progression-lb-defs'],
    queryFn: getLeaderboards,
  })

  const { data: lbData } = useQuery({
    queryKey: ['progression-lb', lbKey],
    queryFn: () => getLeaderboard(lbKey),
    enabled: tab === 'leaderboards',
  })

  useEffect(() => {
    if (!socket) return
    const onCelebration = (payload) => {
      setCelebration(payload)
      qc.invalidateQueries({ queryKey: ['progression-hub'] })
    }
    socket.on('progression:celebration', onCelebration)
    return () => socket.off('progression:celebration', onCelebration)
  }, [socket, qc])

  const equipCosmeticMut = useMutation({
    mutationFn: equipCosmetic,
    onSuccess: () => {
      toast.success('Cosmetic equipped')
      qc.invalidateQueries({ queryKey: ['progression-hub'] })
    },
  })

  const equipTitleMut = useMutation({
    mutationFn: equipTitle,
    onSuccess: () => {
      toast.success('Title equipped')
      qc.invalidateQueries({ queryKey: ['progression-hub'] })
    },
  })

  const shareMut = useMutation({
    mutationFn: () => triggerProgressionAction('referral_share'),
    onSuccess: (data) => {
      if (data.completed?.length) toast.success('Mission progress updated')
    },
  })

  if (isLoading) {
    return (
      <div className="progression-hub" style={{ padding: 32 }}>
        <p style={{ color: 'var(--text-2)' }}>Loading progression engine…</p>
      </div>
    )
  }

  const p = hub?.progress || {}
  const level = hub?.level || {}
  const prestige = hub?.prestige?.current

  return (
    <div className="progression-hub" style={{ padding: '24px 28px 48px' }}>
      <AnimatePresence>
        {celebration && (
          <CelebrationOverlay event={celebration} onClose={() => setCelebration(null)} />
        )}
      </AnimatePresence>

      {(hub?.active_events || []).length > 0 && (
        <div className="ph-event-banner">
          🔥 Live: {hub.active_events.map((e) => e.name).join(' · ')} — limited-time multipliers active
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <Link
          to="/progression/career"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 999,
            border: '1px solid rgba(201,168,76,0.4)',
            color: '#e8c96a',
            textDecoration: 'none',
            fontSize: 13,
            background: 'rgba(201,168,76,0.08)',
          }}
        >
          👑 Career Path & Rank Ladder →
        </Link>
      </div>

      <motion.div
        className="ph-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#a0a0b0', textTransform: 'uppercase', letterSpacing: 2 }}>
              Progression Engine
            </span>
            {prestige && p.prestige_tier !== 'none' && (
              <span className="ph-prestige-ring">{prestige.title_en}</span>
            )}
            {hub?.season && (
              <span className="ph-prestige-ring" style={{ borderColor: '#7b6cf6' }}>
                {hub.season.name}
              </span>
            )}
          </div>
          <h1 style={{ margin: '8px 0 4px', fontSize: 32, fontWeight: 800 }}>
            Level {p.level}{' '}
            <span style={{ color: '#7b6cf6', fontWeight: 600, fontSize: 20 }}>
              {level.current?.title_en}
            </span>
          </h1>
          <p style={{ margin: 0, color: '#a0a0b0', fontSize: 14 }}>
            {p.xp_global?.toLocaleString()} Global XP · {p.xp_seasonal?.toLocaleString()} Seasonal ·{' '}
            {hub?.pearls?.available_balance ?? 0} Pearls
          </p>
          <XpBar pct={level.pct ?? 0} label={`${level.xpToNext?.toLocaleString() ?? 0} XP to next level`} />
          <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: 13 }}>
            <span>🔥 {p.streak_days} day streak</span>
            <span>⚡ {p.xp_team} team XP</span>
            <span>👑 {p.xp_leadership} leadership XP</span>
          </div>
        </div>
      </motion.div>

      <div className="ph-tabs">
        {['overview', 'missions', 'achievements', 'cosmetics', 'leaderboards'].map((t) => (
          <button
            key={t}
            type="button"
            className={`ph-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="ph-grid">
          <div className="ph-card">
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Prestige Path</h3>
            {hub?.prestige_catalog?.map((tier) => {
              const unlocked =
                (p.prestige_tier || 'none') !== 'none' &&
                (hub.prestige_catalog.find((x) => x.tier_key === p.prestige_tier)?.sort_order ?? 0) >=
                  tier.sort_order
              return (
                <div
                  key={tier.tier_key}
                  style={{
                    padding: '8px 0',
                    opacity: unlocked ? 1 : 0.45,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {unlocked ? '✓' : '○'} {tier.title_en} — L{tier.min_level}+ · {tier.min_xp_global} XP
                </div>
              )
            })}
          </div>
          <div className="ph-card">
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Active Boosters</h3>
            {(hub?.boosters || []).length === 0 ? (
              <p style={{ color: '#a0a0b0', fontSize: 13 }}>No active boosters — complete missions!</p>
            ) : (
              hub.boosters.map((b) => (
                <div key={b.id} style={{ fontSize: 13, marginBottom: 8 }}>
                  {b.game_booster_definitions?.label} · {b.multiplier}x until{' '}
                  {new Date(b.expires_at).toLocaleDateString()}
                </div>
              ))
            )}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 12, fontSize: 12 }}
              onClick={() => shareMut.mutate()}
            >
              Share invite (mission)
            </button>
          </div>
          <div className="ph-card">
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Streaks</h3>
            {(hub?.streaks || []).map((s) => (
              <div key={s.streak_key} style={{ marginBottom: 8, fontSize: 13 }}>
                {s.game_streak_definitions?.label || s.streak_key}: {s.current_days} days (best{' '}
                {s.longest_days})
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'missions' && (
        <div className="ph-card" style={{ maxWidth: 640 }}>
          <h3 style={{ margin: '0 0 16px' }}>Missions</h3>
          {(hub?.missions || []).map((m) => {
            const pct = Math.min(100, ((m.current_count || 0) / m.target_count) * 100)
            return (
              <div
                key={m.id}
                className={`ph-mission rarity-${m.rarity} ${m.is_completed ? 'done' : ''}`}
              >
                <span style={{ fontSize: 24 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: '#a0a0b0' }}>{m.description}</div>
                  <XpBar pct={pct} />
                </div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>
                  +{m.xp_reward} XP
                  <br />+{m.pearl_reward} ⬡
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'achievements' && (
        <div className="ph-grid">
          {(hub?.achievements || []).map((a) => (
            <motion.div
              key={a.key}
              className={`ph-card rarity-${a.rarity}`}
              style={{
                opacity: a.unlocked ? 1 : 0.55,
                borderColor: a.unlocked ? RARITY_GLOW[a.rarity] : undefined,
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div style={{ fontSize: 32 }}>{a.icon}</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#a0a0b0', marginTop: 4 }}>{a.description}</div>
              <div style={{ fontSize: 11, marginTop: 8, textTransform: 'capitalize', color: RARITY_GLOW[a.rarity] }}>
                {a.rarity} · {a.category}
              </div>
              {a.unlocked && (
                <div style={{ fontSize: 11, color: '#22c55e', marginTop: 6 }}>Unlocked</div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'cosmetics' && (
        <div className="ph-grid">
          {(hub?.cosmetics || []).map((c) => (
            <div key={c.id} className={`ph-card rarity-${c.game_cosmetic_definitions?.rarity || 'common'}`}>
              <div style={{ fontWeight: 600 }}>{c.game_cosmetic_definitions?.name}</div>
              <div style={{ fontSize: 12, color: '#a0a0b0' }}>
                {c.game_cosmetic_definitions?.cosmetic_type}
              </div>
              {c.is_equipped && (
                <span style={{ fontSize: 11, color: '#22c55e' }}>Equipped</span>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginTop: 8, fontSize: 12 }}
                onClick={() => equipCosmeticMut.mutate(c.cosmetic_key)}
              >
                Equip
              </button>
            </div>
          ))}
          {(hub?.titles || []).map((t) => (
            <div key={t.id} className="ph-card rarity-rare">
              <div style={{ fontWeight: 600 }}>{t.game_title_definitions?.title_en}</div>
              <div style={{ fontSize: 12, color: '#a0a0b0' }}>Title</div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginTop: 8, fontSize: 12 }}
                onClick={() => equipTitleMut.mutate(t.title_key)}
              >
                Equip title
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboards' && (
        <div className="ph-card">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {(lbDefs || []).map((d) => (
              <button
                key={d.key}
                type="button"
                className={`ph-tab ${lbKey === d.key ? 'active' : ''}`}
                onClick={() => setLbKey(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
          {(lbData?.entries || []).map((row) => {
            const name =
              row.meta?.user?.full_name ||
              row.meta?.user?.user_code ||
              row.meta?.team?.name ||
              '—'
            return (
              <div key={row.id} className="ph-lb-row">
                <span className="ph-lb-rank">#{row.rank_position}</span>
                <span style={{ flex: 1 }}>{name}</span>
                <span style={{ fontWeight: 700, color: '#c9a84c' }}>
                  {Number(row.score).toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

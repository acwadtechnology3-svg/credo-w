import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  getCareerHub,
  getProgressionLeaderboard,
  refreshMyRank,
} from '../../api/progression.api'
import { useSocket } from '../../hooks/useSocket'
import { toast } from '../../components/shared/Toast'
import PageLoader from '../../components/shared/PageLoader'
import '../../styles/career-path.css'

const RARITY_GLOW = {
  common: '#a0a0b0',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#c9a84c',
  mythic: '#ec4899',
}

function RankUnlockCelebration({ event, onClose }) {
  if (!event) return null
  const color = event.color || RARITY_GLOW[event.rarity] || '#c9a84c'
  return (
    <motion.div
      className="cp-celebration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="cp-celebration-inner"
        initial={{ scale: 0.5, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: color, boxShadow: `0 0 80px ${color}55` }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: 2 }}
          style={{ fontSize: 64 }}
        >
          👑
        </motion.div>
        <h2 style={{ marginTop: 16, color: color, fontSize: 28 }}>Rank Unlocked!</h2>
        <p style={{ fontSize: 20, marginTop: 8 }}>{event.rank}</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 28 }} onClick={onClose}>
          Continue Climbing
        </button>
      </motion.div>
    </motion.div>
  )
}

function RequirementRow({ req }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: req.met ? '#22c55e' : '#f0f0f5' }}>{req.label}</span>
        <span style={{ color: '#a0a0b0' }}>
          {req.actual?.toLocaleString?.() ?? req.actual} / {req.required?.toLocaleString?.() ?? req.required}
        </span>
      </div>
      <div className="cp-progress-mini">
        <motion.div
          className="cp-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${req.pct}%` }}
          style={{ background: req.met ? '#22c55e' : undefined }}
        />
      </div>
    </div>
  )
}

export default function CareerPathPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('ladder')
  const [lbKey, setLbKey] = useState('global_xp')
  const [celebration, setCelebration] = useState(null)
  const socket = useSocket()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['career-hub'],
    queryFn: getCareerHub,
  })

  const { data: lbData } = useQuery({
    queryKey: ['career-lb', lbKey],
    queryFn: () => getProgressionLeaderboard(lbKey),
    enabled: tab === 'leaderboards',
  })

  const refreshRank = useMutation({
    mutationFn: refreshMyRank,
    onSuccess: (res) => {
      if (res?.result?.promoted) {
        setCelebration({
          rank: res.result.rank?.name,
          rarity: res.result.rank?.rarity,
          color: res.result.rank?.color_hex,
        })
      } else {
        toast.info('Rank checked — keep building momentum!')
      }
      qc.invalidateQueries({ queryKey: ['career-hub'] })
    },
  })

  useEffect(() => {
    if (!socket) return
    const onCelebration = (ev) => {
      if (ev?.type === 'rank_unlock') setCelebration(ev)
      qc.invalidateQueries({ queryKey: ['career-hub'] })
    }
    socket.on('progression:celebration', onCelebration)
    socket.on('mlm:rank_promoted', (ev) => {
      if (ev?.rank) setCelebration({ rank: ev.rank, type: 'rank_unlock' })
    })
    return () => {
      socket.off('progression:celebration', onCelebration)
      socket.off('mlm:rank_promoted')
    }
  }, [socket, qc])

  if (isLoading) return <PageLoader />

  const career = data?.career || {}
  const gam = data?.gamification || {}
  const achievements = data?.achievements || {}
  const campaigns = data?.campaigns || []

  const currentRank = career.currentRank
  const glow = currentRank?.color_hex || RARITY_GLOW[currentRank?.rarity] || '#c9a84c'

  return (
    <div className="career-path">
      <AnimatePresence>
        {celebration && (
          <RankUnlockCelebration event={celebration} onClose={() => setCelebration(null)} />
        )}
      </AnimatePresence>

      <div className="cp-hero" style={{ '--rank-glow': `${glow}66` }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="cp-rank-badge" style={{ borderColor: glow, boxShadow: `0 0 24px ${glow}55` }}>
            {currentRank?.icon_key ? '⭐' : '👑'}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: '#a0a0b0', textTransform: 'uppercase', letterSpacing: 1 }}>
              Current Rank
            </div>
            <h1 style={{ fontSize: 32, margin: '4px 0', color: glow }}>{currentRank?.name || 'Beginner'}</h1>
            <p style={{ color: '#a0a0b0', fontSize: 14 }}>
              Level {gam.level?.level ?? gam.currentLevel?.level ?? 1} ·{' '}
              {(gam.xpGlobal ?? gam.xp ?? 0).toLocaleString()} XP
            </p>
            {career.nextRank && (
              <p style={{ marginTop: 8, fontSize: 14 }}>
                Next: <strong style={{ color: '#e8c96a' }}>{career.nextRank.name}</strong> —{' '}
                {career.progressToNext}% complete
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={refreshRank.isPending}
              onClick={() => refreshRank.mutate()}
            >
              Check Rank
            </button>
            <Link to="/progression" className="btn" style={{ border: '1px solid #534AB7' }}>
              XP Hub
            </Link>
          </div>
        </div>
      </div>

      {career.coaching?.length > 0 && (
        <div className="cp-coach">
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#7b6cf6' }}>🤖 Credo AI Coach</div>
          <ul>
            {career.coaching.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="cp-tabs">
        {['ladder', 'requirements', 'achievements', 'bonuses', 'leaderboards'].map((t) => (
          <button
            key={t}
            type="button"
            className={`cp-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'ladder' && (
        <div className="cp-ladder">
          {(career.ladder || []).map((step, i) => (
            <motion.div
              key={step.id}
              className={`cp-ladder-step ${step.isCurrent ? 'current' : step.unlocked ? 'unlocked' : 'locked'}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: step.color_hex || '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {step.sort_order}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{step.name}</div>
                <div style={{ fontSize: 12, color: '#888', textTransform: 'capitalize' }}>
                  {step.rarity || 'common'} · {step.category || 'leadership'}
                </div>
                {!step.unlocked && step.progress > 0 && (
                  <div className="cp-progress-mini">
                    <div className="cp-progress-fill" style={{ width: `${step.progress}%` }} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: step.isCurrent ? '#c9a84c' : step.unlocked ? '#22c55e' : '#666' }}>
                {step.isCurrent ? 'CURRENT' : step.unlocked ? '✓' : `${step.progress}%`}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'requirements' && (
        <div className="cp-grid">
          <div className="cp-card">
            <h3 style={{ marginBottom: 16 }}>Next Rank Requirements</h3>
            {(career.nextRequirements || []).length ? (
              career.nextRequirements.map((req) => <RequirementRow key={req.key} req={req} />)
            ) : (
              <p style={{ color: '#888' }}>You&apos;ve reached the top of the ladder — legendary status!</p>
            )}
          </div>
          {career.prediction && (
            <div className="cp-card">
              <h3>Growth Prediction</h3>
              <p style={{ marginTop: 12, color: '#a0a0b0' }}>
                Estimated <strong>{career.prediction.estimatedDays} days</strong> to reach{' '}
                <strong style={{ color: '#c9a84c' }}>{career.prediction.rankName}</strong> at current pace.
              </p>
            </div>
          )}
          {campaigns.length > 0 && (
            <div className="cp-card">
              <h3>Active Campaigns</h3>
              {campaigns.map((c) => (
                <div key={c.id} style={{ marginTop: 12, padding: 12, background: 'rgba(123,108,246,0.1)', borderRadius: 10 }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{c.campaign_type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'achievements' && (
        <div>
          {Object.entries(achievements.categories || {}).map(([cat, items]) => (
            <div key={cat} className="cp-card" style={{ marginBottom: 16 }}>
              <h3 style={{ textTransform: 'capitalize', marginBottom: 12 }}>{cat}</h3>
              {items.map((a) => (
                <div
                  key={a.achievement_key}
                  className={`cp-achievement ${a.unlocked ? 'unlocked' : ''}`}
                >
                  <span style={{ fontSize: 24 }}>{a.icon_key ? '🏆' : '⭐'}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.title_en}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{a.description_en}</div>
                    {a.unlocked && (
                      <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4 }}>Unlocked</div>
                    )}
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#c9a84c', fontSize: 12 }}>+{a.xp_reward} XP</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'bonuses' && (
        <div className="cp-card">
          <h3>Recent Bonuses</h3>
          {(data?.bonuses || []).length ? (
            <table style={{ width: '100%', marginTop: 12, fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#888', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.bonuses.map((b) => (
                  <tr key={b.id}>
                    <td style={{ padding: 8 }}>{b.bonuses?.name || b.bonus_key}</td>
                    <td style={{ color: '#22c55e' }}>EGP {Number(b.amount_egp).toLocaleString()}</td>
                    <td style={{ color: '#888' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#888', marginTop: 12 }}>No bonuses yet — grow your team to unlock rewards.</p>
          )}
        </div>
      )}

      {tab === 'leaderboards' && (
        <div>
          <div className="cp-tabs" style={{ marginBottom: 12 }}>
            {['global_xp', 'global_recruiters', 'global_earnings', 'global_ranks'].map((k) => (
              <button
                key={k}
                type="button"
                className={`cp-tab ${lbKey === k ? 'active' : ''}`}
                onClick={() => setLbKey(k)}
              >
                {k.replace('global_', '').replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="cp-card">
            {(lbData?.entries || []).map((e, i) => (
              <div
                key={e.user_id || i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span>
                  #{e.rank_position || i + 1}{' '}
                  {e.users?.full_name || e.users?.username || 'Member'}
                </span>
                <span style={{ color: '#c9a84c' }}>{Number(e.score || 0).toLocaleString()}</span>
              </div>
            ))}
            {!(lbData?.entries?.length) && (
              <p style={{ color: '#888' }}>Leaderboard refreshing — check back shortly.</p>
            )}
          </div>
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: '#666' }}>
        <button type="button" style={{ background: 'none', border: 'none', color: '#7b6cf6', cursor: 'pointer' }} onClick={() => refetch()}>
          Refresh
        </button>
      </p>
    </div>
  )
}

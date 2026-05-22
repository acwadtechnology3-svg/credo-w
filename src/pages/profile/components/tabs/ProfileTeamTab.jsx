import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { browseTeams, createTeam, joinTeam, leaveTeam } from '../../../../api/teams.api'
import { useAuthStore } from '../../../../store/authStore'

export default function ProfileTeamTab({ hub, onRefresh }) {
  const qc = useQueryClient()
  const authUser = useAuthStore((s) => s.user)
  const canCreate = ['admin', 'super_admin', 'franchise'].includes(authUser?.role)
  const team = hub?.team
  const leaderboard = hub?.teamLeaderboard || []
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', motto: '', team_color: '#7B6CF6' })
  const [browseList, setBrowseList] = useState(null)
  const [err, setErr] = useState('')

  const createMut = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-hub'] })
      onRefresh?.()
      setCreateOpen(false)
      setErr('')
    },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  })

  const joinMut = useMutation({
    mutationFn: joinTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-hub'] })
      onRefresh?.()
      setErr('')
    },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  })

  const leaveMut = useMutation({
    mutationFn: leaveTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-hub'] })
      onRefresh?.()
    },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  })

  const loadBrowse = async () => {
    const data = await browseTeams()
    setBrowseList(data.teams || [])
  }

  if (team) {
    return (
      <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {err && <div className="pi-msg err">{err}</div>}
        <div className="pi-glass" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div
            className="pi-team-banner"
            style={{
              background: team.banner_url
                ? `url(${team.banner_url}) center/cover`
                : `linear-gradient(135deg, ${team.team_color}, var(--purple-dim))`,
            }}
          />
          <div style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>{team.name}</h2>
            {team.motto && (
              <p style={{ fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic', marginTop: 4 }}>
                "{team.motto}"
              </p>
            )}
            <div className="pi-meta-row" style={{ marginTop: 12 }}>
              <span className="pi-chip">Lv {team.level}</span>
              <span className="pi-chip">{team.total_members} members</span>
              <span className="pi-chip pi-chip-gold">#{team.leaderboard_position || '—'} global</span>
            </div>
            <div className="pi-stat-grid" style={{ marginTop: 16 }}>
              <div className="pi-stat-card pi-glass">
                <div className="pi-stat-value">{Math.round(team.total_bv || 0)}</div>
                <div className="pi-stat-label">Total BV</div>
              </div>
              <div className="pi-stat-card pi-glass">
                <div className="pi-stat-value">{team.power_score}</div>
                <div className="pi-stat-label">Team Power</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
              Your role: <strong>{team.my_role}</strong> · Contribution{' '}
              {Math.round(team.my_contribution_bv || 0)} BV
            </p>
            <button
              type="button"
              className="pi-btn pi-btn-ghost"
              style={{ marginTop: 16 }}
              onClick={() => leaveMut.mutate()}
              disabled={leaveMut.isPending}
            >
              Leave Team
            </button>
          </div>
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-2)' }}>
          Squad Roster
        </h3>
        {(team.members || []).map((m) => (
          <div key={m.id} className="pi-leaderboard-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{m.full_name || m.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {m.user_code} · {m.rank || 'BAP'} · {m.role}
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--electric)' }}>
              {Math.round(m.contribution_bv || 0)} BV
            </span>
          </div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {err && <div className="pi-msg err">{err}</div>}
      <div className="pi-glass" style={{ padding: 24, textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏰</div>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Join a Clan</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, maxWidth: 320, margin: '8px auto 16px' }}>
          Compete on the global leaderboard, earn team bonuses, and build prestige with your squad.
        </p>
        <button type="button" className="pi-btn pi-btn-primary" onClick={loadBrowse}>
          Browse Teams
        </button>
        {canCreate && (
          <button
            type="button"
            className="pi-btn pi-btn-ghost"
            style={{ marginInlineStart: 8 }}
            onClick={() => setCreateOpen(!createOpen)}
          >
            Create Team
          </button>
        )}
      </div>

      {createOpen && canCreate && (
        <div className="pi-glass" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Found New Clan</h3>
          <input
            className="pi-form-input"
            placeholder="Team name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            style={{ marginBottom: 8 }}
          />
          <input
            className="pi-form-input"
            placeholder="Motto"
            value={form.motto}
            onChange={(e) => setForm((p) => ({ ...p, motto: e.target.value }))}
            style={{ marginBottom: 8 }}
          />
          <input
            className="pi-form-input"
            type="color"
            value={form.team_color}
            onChange={(e) => setForm((p) => ({ ...p, team_color: e.target.value }))}
            style={{ marginBottom: 12, height: 40 }}
          />
          <button
            type="button"
            className="pi-btn pi-btn-primary"
            onClick={() => createMut.mutate(form)}
            disabled={!form.name.trim() || createMut.isPending}
          >
            {createMut.isPending ? 'Creating…' : 'Launch Clan'}
          </button>
        </div>
      )}

      {browseList?.map((t) => (
        <div key={t.id} className="pi-leaderboard-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{t.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {t.total_members} members · Power {t.power_score}
            </div>
          </div>
          <button
            type="button"
            className="pi-btn pi-btn-primary"
            style={{ padding: '6px 12px', fontSize: 11 }}
            onClick={() => joinMut.mutate(t.id)}
            disabled={joinMut.isPending}
          >
            Join
          </button>
        </div>
      ))}

      <h3 style={{ fontSize: 13, fontWeight: 600, margin: '20px 0 10px', color: 'var(--text-2)' }}>
        Global Leaderboard
      </h3>
      {leaderboard.map((t) => (
        <div key={t.id} className="pi-leaderboard-row">
          <span className="pi-rank-num">#{t.rank_position}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {t.total_members} · {Math.round(t.total_bv)} BV
            </div>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--purple-bright)' }}>{t.power_score}</span>
        </div>
      ))}
    </motion.div>
  )
}

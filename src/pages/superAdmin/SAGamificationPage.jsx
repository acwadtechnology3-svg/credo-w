import { useQuery } from '@tanstack/react-query'
import {
  getGamificationOverview,
  listGamificationXpRules,
  listGamificationMissions,
  listGamificationAchievements,
  listGamificationEvents,
} from '../../api/gamificationAdmin.api'
import AdminPanel from '../../components/admin/AdminPanel'
import PageLoader from '../../components/shared/PageLoader'

export default function SAGamificationPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['sa-gamification-overview'],
    queryFn: getGamificationOverview,
  })

  const { data: xpRules } = useQuery({
    queryKey: ['sa-gamification-xp'],
    queryFn: listGamificationXpRules,
  })

  const { data: missions } = useQuery({
    queryKey: ['sa-gamification-missions'],
    queryFn: listGamificationMissions,
  })

  const { data: achievements } = useQuery({
    queryKey: ['sa-gamification-achievements'],
    queryFn: listGamificationAchievements,
  })

  const { data: events } = useQuery({
    queryKey: ['sa-gamification-events'],
    queryFn: listGamificationEvents,
  })

  if (isLoading) return <PageLoader />

  return (
    <AdminPanel
      title="Gamification Engine"
      subtitle="Phase P5 — XP formulas, missions, achievements, seasons (no hardcoded rules)"
    >
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        {Object.entries(overview?.counts || {}).map(([k, v]) => (
          <div key={k} className="admin-stat">
            <div className="admin-stat__label">{k.replace('game_', '')}</div>
            <div className="admin-stat__value">{v}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
        Run <code>phase-p5-gamification.sql</code> in Supabase. Edit rules via API{' '}
        <code>POST /api/super-admin/gamification/xp-rules</code> — cosmetics never affect MLM
        compensation.
      </p>

      <h3 style={{ fontSize: 15, marginBottom: 8 }}>XP rules ({xpRules?.length ?? 0})</h3>
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table className="admin-table" style={{ width: '100%', fontSize: 12 }}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Global</th>
              <th>Seasonal</th>
              <th>Pearls</th>
              <th>Max/hr</th>
            </tr>
          </thead>
          <tbody>
            {(xpRules || []).map((r) => (
              <tr key={r.event_key}>
                <td>{r.event_key}</td>
                <td>{r.xp_global}</td>
                <td>{r.xp_seasonal}</td>
                <td>{r.pearl_bonus}</td>
                <td>{r.max_per_hour}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 8 }}>Missions ({missions?.length ?? 0})</h3>
      <ul style={{ fontSize: 13, marginBottom: 24 }}>
        {(missions || []).slice(0, 12).map((m) => (
          <li key={m.key}>
            {m.icon} {m.title} — {m.mission_type} · +{m.xp_reward} XP
          </li>
        ))}
      </ul>

      <h3 style={{ fontSize: 15, marginBottom: 8 }}>Achievements ({achievements?.length ?? 0})</h3>
      <ul style={{ fontSize: 13, marginBottom: 24 }}>
        {(achievements || []).map((a) => (
          <li key={a.key}>
            {a.icon} {a.title} ({a.rarity}) — {a.condition_type} ≥ {a.condition_value}
          </li>
        ))}
      </ul>

      <h3 style={{ fontSize: 15, marginBottom: 8 }}>Live events</h3>
      <ul style={{ fontSize: 13 }}>
        {(events || []).map((e) => (
          <li key={e.key}>
            {e.name} — {e.multiplier}x until {new Date(e.ends_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </AdminPanel>
  )
}

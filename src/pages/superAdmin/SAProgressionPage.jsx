import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSAProgressionOverview,
  forcePromotion,
  simulateBonus,
  refreshProgressionLeaderboard,
} from '../../api/progression.api'
import AdminPanel from '../../components/admin/AdminPanel'
import PageLoader from '../../components/shared/PageLoader'
import { toast } from '../../components/shared/Toast'

export default function SAProgressionPage() {
  const qc = useQueryClient()
  const [userId, setUserId] = useState('')
  const [rankId, setRankId] = useState('')
  const [simKey, setSimKey] = useState('binary_matching')
  const [simResult, setSimResult] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sa-progression-overview'],
    queryFn: getSAProgressionOverview,
  })

  const promoteMut = useMutation({
    mutationFn: forcePromotion,
    onSuccess: () => {
      toast.success('Promotion applied')
      qc.invalidateQueries({ queryKey: ['sa-progression-overview'] })
    },
  })

  const simMut = useMutation({
    mutationFn: simulateBonus,
    onSuccess: (res) => setSimResult(res),
  })

  const refreshLb = useMutation({
    mutationFn: refreshProgressionLeaderboard,
    onSuccess: () => toast.success('Leaderboard refreshed'),
  })

  if (isLoading) return <PageLoader />

  return (
    <AdminPanel
      title="Phase P8 — Rank & Progression Control"
      subtitle="Ranks, bonuses, achievements, campaigns, fraud monitoring"
    >
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat">
          <div className="admin-stat__label">Ranks</div>
          <div className="admin-stat__value">{data?.ranks?.length ?? 0}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__label">Bonus types</div>
          <div className="admin-stat__value">{data?.bonuses?.length ?? 0}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__label">Campaigns</div>
          <div className="admin-stat__value">{data?.campaigns?.length ?? 0}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__label">Achievements</div>
          <div className="admin-stat__value">{data?.achievements?.length ?? 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: 12, fontSize: 14 }}>Force promotion</h3>
          <input
            placeholder="User UUID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <select
            value={rankId}
            onChange={(e) => setRankId(e.target.value)}
            style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8 }}
          >
            <option value="">Select rank</option>
            {(data?.ranks || []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (#{r.sort_order})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!userId || !rankId || promoteMut.isPending}
            onClick={() => promoteMut.mutate({ userId, rankId })}
          >
            Force promote
          </button>
        </div>

        <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: 12, fontSize: 14 }}>Simulate bonus payout</h3>
          <select
            value={simKey}
            onChange={(e) => setSimKey(e.target.value)}
            style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8 }}
          >
            {(data?.bonuses || []).map((b) => (
              <option key={b.id} value={b.bonus_key}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              simMut.mutate({
                bonusKey: simKey,
                sampleMetrics: { weak_leg: 15000, bv_matching: 12000, base_amount: 1000 },
              })
            }
          >
            Simulate
          </button>
          {simResult && (
            <pre style={{ marginTop: 12, fontSize: 11, overflow: 'auto', maxHeight: 120 }}>
              {JSON.stringify({ estimate: simResult.estimate }, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="btn"
          onClick={() => refreshLb.mutate('global_xp')}
          disabled={refreshLb.isPending}
        >
          Refresh global XP leaderboard
        </button>
        <Link
          to="/super-admin/ranks"
          style={{ marginLeft: 12, fontSize: 13, color: 'var(--accent)' }}
        >
          Edit rank requirements →
        </Link>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
        Run <code>phase-p8-rank-progression.sql</code> in Supabase SQL Editor before using P8 APIs.
      </p>
    </AdminPanel>
  )
}

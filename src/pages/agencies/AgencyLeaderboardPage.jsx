import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getAgencyLeaderboard } from '../../api/agencies.api'
import PageLoader from '../../components/shared/PageLoader'
import '../../styles/team-guild.css'

const METRICS = [
  { id: 'power_score', label: 'القوة' },
  { id: 'total_bv', label: 'أعلى BV' },
  { id: 'total_members', label: 'الأعضاء' },
  { id: 'reputation_score', label: 'السمعة' },
]

export default function AgencyLeaderboardPage() {
  const navigate = useNavigate()
  const [metric, setMetric] = useState('power_score')

  const { data, isLoading } = useQuery({
    queryKey: ['agency-leaderboard', metric],
    queryFn: () => getAgencyLeaderboard(30, metric),
  })

  const agencies = data?.agencies || []

  return (
    <div className="guild-wizard" dir="rtl" style={{ paddingBottom: 48 }}>
      <div className="guild-wizard__hero">
        <h1 className="guild-wizard__title">تصنيف الوكالات</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>منظمات تتنافس على القمة</p>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`guild-type-btn ${metric === m.id ? 'selected' : ''}`}
            onClick={() => setMetric(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <ol style={{ maxWidth: 560, margin: '0 auto', listStyle: 'none', padding: 0 }}>
          {agencies.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                marginBottom: 8,
                background: i < 3 ? 'rgba(123,108,246,0.12)' : 'var(--surface-2)',
                borderRadius: 12,
                cursor: 'pointer',
                border: i === 0 ? '1px solid rgba(232,201,106,0.4)' : '1px solid transparent',
              }}
              onClick={() => navigate(`/agencies/profile/${a.slug}`)}
            >
              <span style={{ fontWeight: 700, width: 28, color: i < 3 ? '#e8c96a' : 'var(--text-3)' }}>
                #{a.rank_position || i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {a.total_members} عضو · BV {Math.round(a.total_bv || 0)}
                </div>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                {metric === 'total_bv'
                  ? Math.round(a.total_bv || 0)
                  : metric === 'total_members'
                    ? a.total_members
                    : metric === 'reputation_score'
                      ? a.reputation_score
                      : a.power_score}
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  )
}

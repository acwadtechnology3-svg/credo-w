import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { discoverTeams, getFoundationStatus } from '../../api/teams.api'
import PageLoader from '../../components/shared/PageLoader'
import '../../styles/team-guild.css'

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'elite', label: 'نخبة' },
  { id: 'competitive', label: 'تنافسي' },
  { id: 'leadership', label: 'قيادة' },
  { id: 'regional', label: 'إقليمي' },
]

export default function TeamDiscoveryPage() {
  const navigate = useNavigate()
  const [type, setType] = useState('all')

  const { data: foundation } = useQuery({
    queryKey: ['foundation-status'],
    queryFn: getFoundationStatus,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['discover-teams', type],
    queryFn: () => discoverTeams({ type: type === 'all' ? undefined : type, limit: 24 }),
  })

  const teams = data?.teams || data || []

  return (
    <div className="guild-wizard" dir="rtl" style={{ minHeight: 'auto', paddingBottom: 40 }}>
      <div className="guild-wizard__hero">
        <h1 className="guild-wizard__title">اكتشف الإمبراطوريات</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
          فرق عامة مرتبة حسب القوة والسمعة
        </p>
        {(foundation?.eligible_to_establish || foundation?.team_foundation_status === 'pending') && (
          <motion.button
            type="button"
            className="guild-btn-primary"
            style={{ maxWidth: 320, margin: '12px auto' }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/teams/found')}
          >
            🔥 أسّس فريقك الآن
          </motion.button>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`guild-type-btn ${type === f.id ? 'selected' : ''}`}
            onClick={() => setType(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="guild-discover-grid" style={{ maxWidth: 900, margin: '20px auto' }}>
          {teams.map((t, i) => (
            <motion.div
              key={t.id}
              className="guild-discover-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/teams/profile/${t.slug}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/teams/profile/${t.slug}`)}
              role="button"
              tabIndex={0}
            >
              <div
                style={{
                  height: 56,
                  borderRadius: 10,
                  marginBottom: 10,
                  background: t.banner_url
                    ? `url(${t.banner_url}) center/cover`
                    : `linear-gradient(135deg, ${t.team_color || '#7B6CF6'}, #534AB7)`,
                }}
              />
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              {t.motto && (
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{t.motto}</div>
              )}
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)' }}>
                مستوى {t.level} · {t.total_members || 0} عضو · قوة {t.power_score || 0}
              </div>
              {t.prestige_tier && (
                <span className="guild-badge" style={{ marginTop: 8 }}>
                  {t.prestige_tier}
                </span>
              )}
            </motion.div>
          ))}
          {!teams.length && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-3)' }}>
              لا توجد فرق عامة بعد — كن أول مؤسس!
            </p>
          )}
        </div>
      )}
    </div>
  )
}

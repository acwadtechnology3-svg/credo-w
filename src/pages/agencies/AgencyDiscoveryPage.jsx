import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { discoverAgencies } from '../../api/agencies.api'
import PageLoader from '../../components/shared/PageLoader'
import '../../styles/team-guild.css'

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'official', label: 'رسمية' },
  { id: 'elite', label: 'نخبة' },
  { id: 'regional', label: 'إقليمية' },
]

const RANK_LABELS = {
  rising: 'صاعدة',
  growth: 'نمو',
  elite: 'نخبة',
  diamond: 'ماسية',
  royal: 'ملكية',
  legendary: 'أسطورية',
}

export default function AgencyDiscoveryPage() {
  const navigate = useNavigate()
  const [type, setType] = useState('all')
  const [featured, setFeatured] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['discover-agencies', type, featured],
    queryFn: () =>
      discoverAgencies({
        category: type === 'all' ? undefined : type,
        featured: featured || undefined,
        limit: 24,
      }),
  })

  const agencies = data?.agencies || data || []

  return (
    <div className="guild-wizard" dir="rtl" style={{ minHeight: 'auto', paddingBottom: 40 }}>
      <div className="guild-wizard__hero">
        <div className="guild-wizard__flame">🏛️</div>
        <h1 className="guild-wizard__title">الوكالات الرسمية</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
          منظمات مُدارة — انضم عبر دعوة المجند أو رابط الوكالة
        </p>
        <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 8 }}>
          لا يمكن للمستخدمين إنشاء وكالات. الإنشاء للإدارة فقط.
        </p>
      </div>

      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
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
        <button
          type="button"
          className={`guild-type-btn ${featured ? 'selected' : ''}`}
          onClick={() => setFeatured((v) => !v)}
        >
          ✓ موثّقة
        </button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="guild-discover-grid" style={{ maxWidth: 900, margin: '20px auto' }}>
          {agencies.map((a, i) => (
            <motion.div
              key={a.id}
              className="guild-discover-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/agencies/profile/${a.slug}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/agencies/profile/${a.slug}`)}
              role="button"
              tabIndex={0}
            >
              <div
                style={{
                  height: 56,
                  borderRadius: 10,
                  marginBottom: 10,
                  background: a.banner_url
                    ? `url(${a.banner_url}) center/cover`
                    : `linear-gradient(135deg, ${a.primary_color || '#7B6CF6'}, #534AB7)`,
                }}
              />
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {a.name}
                {a.is_verified && <span title="موثّقة">✓</span>}
              </div>
              {a.motto && (
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{a.motto}</div>
              )}
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)' }}>
                {RANK_LABELS[a.agency_rank] || a.agency_rank} · {a.total_members || 0} عضو · قوة{' '}
                {a.power_score || 0}
              </div>
              {a.region && (
                <span className="guild-badge" style={{ marginTop: 8 }}>
                  {a.region}
                </span>
              )}
            </motion.div>
          ))}
          {!agencies.length && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-3)' }}>
              لا توجد وكالات عامة بعد — تواصل مع الإدارة للانضمام
            </p>
          )}
        </div>
      )}
    </div>
  )
}

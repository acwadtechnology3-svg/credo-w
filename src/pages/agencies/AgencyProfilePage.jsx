import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getAgencyProfile, getMyAgency, getAgencyAnalytics } from '../../api/agencies.api'
import PageLoader from '../../components/shared/PageLoader'
import { asArray } from '../../lib/safeData.js'
import '../../styles/team-guild.css'

export default function AgencyProfilePage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['agency-profile', slug],
    queryFn: () => getAgencyProfile(slug),
    enabled: !!slug,
  })

  const { data: mine } = useQuery({
    queryKey: ['my-agency'],
    queryFn: getMyAgency,
  })

  const agency = profile?.agency || profile
  const my = mine?.agency || mine
  const isMyAgency = my?.slug === agency?.slug || my?.id === agency?.id

  const { data: analytics } = useQuery({
    queryKey: ['agency-analytics', agency?.id],
    queryFn: () => getAgencyAnalytics(agency.id),
    enabled: !!agency?.id && isMyAgency,
  })

  if (isLoading) return <PageLoader />
  if (isError || !agency) {
    return (
      <div className="guild-profile" dir="rtl" style={{ padding: 40, textAlign: 'center' }}>
        <p>الوكالة غير موجودة</p>
        <Link to="/agencies/discover">اكتشف الوكالات</Link>
      </div>
    )
  }

  const primary = agency.primary_color || agency.team_color || '#7B6CF6'
  const secondary = agency.secondary_color || '#534AB7'
  const joinUrl = `${window.location.origin}/register?agency=${agency.id}`

  return (
    <div className="guild-profile" dir="rtl">
      <div
        className="guild-profile__banner"
        style={{
          background: agency.banner_url
            ? `url(${agency.banner_url}) center/cover`
            : `linear-gradient(135deg, ${primary}, ${secondary})`,
        }}
      >
        <div className="guild-profile__banner-overlay" />
      </div>

      <div className="guild-profile__body">
        <motion.div
          className="guild-profile__header"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {agency.logo_url ? (
            <img src={agency.logo_url} alt="" className="guild-profile__logo" />
          ) : (
            <div
              className="guild-profile__logo"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                background: `linear-gradient(135deg, ${primary}44, ${secondary}44)`,
              }}
            >
              🏛️
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{agency.name}</h1>
            {agency.motto && (
              <p style={{ margin: '4px 0', color: 'var(--text-2)', fontSize: 14 }}>{agency.motto}</p>
            )}
            <div style={{ marginTop: 8 }}>
              <span className="guild-badge">رتبة {agency.agency_rank || 'rising'}</span>
              {agency.is_verified && <span className="guild-badge">موثّقة</span>}
              {agency.prestige_tier && <span className="guild-badge">{agency.prestige_tier}</span>}
            </div>
          </div>
        </motion.div>

        {agency.mission && (
          <section style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-3)' }}>المهمة</h3>
            <p>{agency.mission}</p>
          </section>
        )}

        <div className="guild-stats-row" style={{ marginTop: 24 }}>
          <div className="guild-stat">
            <span className="guild-stat__val">{agency.total_members || 0}</span>
            <span className="guild-stat__lbl">أعضاء</span>
          </div>
          <div className="guild-stat">
            <span className="guild-stat__val">{Math.round(agency.total_bv || 0)}</span>
            <span className="guild-stat__lbl">BV</span>
          </div>
          <div className="guild-stat">
            <span className="guild-stat__val">{agency.power_score || 0}</span>
            <span className="guild-stat__lbl">قوة</span>
          </div>
          <div className="guild-stat">
            <span className="guild-stat__val">{agency.reputation_score || 50}</span>
            <span className="guild-stat__lbl">سمعة</span>
          </div>
        </div>

        {agency.owner && (
          <section style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-3)' }}>قائد الوكالة</h3>
            <p>
              {agency.owner.full_name || agency.owner.username} (@{agency.owner.username})
            </p>
          </section>
        )}

        {asArray(agency?.achievements).length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-3)' }}>إنجازات الوكالة</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {asArray(agency.achievements)
                .filter((a) => a.is_unlocked)
                .map((a) => (
                  <span key={a.key} className="guild-badge" title={a.description}>
                    {a.icon} {a.title}
                  </span>
                ))}
            </div>
          </section>
        )}

        {isMyAgency && analytics && (
          <section style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-3)' }}>لوحة القيادة (7 أيام)</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              نمو: {(analytics.stats?.growth_rate || 0) * 100}% · احتفاظ:{' '}
              {(analytics.stats?.retention_rate || 0) * 100}%
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {analytics.activity?.length || 0} نشاط · {analytics.members?.length || 0} عضو نشط
            </p>
          </section>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!isMyAgency && (
            <button
              type="button"
              className="guild-btn-primary"
              onClick={() => navigate(`/register?agency=${agency.id}`)}
            >
              انضم للوكالة
            </button>
          )}
          {isMyAgency && (
            <button
              type="button"
              className="guild-btn-primary"
              onClick={() => navigate('/agencies/onboarding')}
            >
              إكمال الانضمام
            </button>
          )}
          <button
            type="button"
            className="guild-btn-secondary"
            onClick={() => navigator.clipboard?.writeText(joinUrl)}
          >
            نسخ رابط الانضمام
          </button>
          <button type="button" className="guild-btn-secondary" onClick={() => navigate('/agencies/discover')}>
            وكالات أخرى
          </button>
        </div>
      </div>
    </div>
  )
}

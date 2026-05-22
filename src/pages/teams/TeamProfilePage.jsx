import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getTeamProfile, getMyTeam, getTeamAnalytics } from '../../api/teams.api'
import PageLoader from '../../components/shared/PageLoader'
import '../../styles/team-guild.css'

const TYPE_LABELS = {
  competitive: 'تنافسي',
  leadership: 'قيادة',
  trading: 'تداول',
  entrepreneurship: 'ريادة',
  elite: 'نخبة',
  regional: 'إقليمي',
  vip: 'VIP',
}

export default function TeamProfilePage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['team-profile', slug],
    queryFn: () => getTeamProfile(slug),
    enabled: !!slug,
  })

  const { data: mine } = useQuery({
    queryKey: ['my-team'],
    queryFn: getMyTeam,
  })

  const team = profile?.team || profile
  const my = mine?.team || mine
  const isMyTeam = my?.slug === team?.slug || my?.id === team?.id

  const { data: analytics } = useQuery({
    queryKey: ['team-analytics', team?.id],
    queryFn: () => getTeamAnalytics(team.id),
    enabled: !!team?.id && isMyTeam,
  })

  if (isLoading) return <PageLoader />
  if (isError || !team) {
    return (
      <div className="guild-profile" dir="rtl" style={{ padding: 40, textAlign: 'center' }}>
        <p>الفريق غير موجود</p>
        <Link to="/teams/discover">اكتشف الفرق</Link>
      </div>
    )
  }

  const primary = team.team_color || '#7B6CF6'
  const secondary = team.secondary_color || '#534AB7'

  return (
    <div className="guild-profile" dir="rtl">
      <div
        className="guild-profile__banner"
        style={{
          background: team.banner_url
            ? `url(${team.banner_url}) center/cover`
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
          {team.logo_url ? (
            <img src={team.logo_url} alt="" className="guild-profile__logo" />
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
              ⬡
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{team.name}</h1>
            {team.motto && (
              <p style={{ margin: '4px 0', color: 'var(--text-2)', fontSize: 14 }}>{team.motto}</p>
            )}
            <div style={{ marginTop: 8 }}>
              <span className="guild-badge">المستوى {team.level || 1}</span>
              {team.prestige_tier && (
                <span className="guild-badge">{team.prestige_tier}</span>
              )}
              {team.is_verified && <span className="guild-badge">✓ موثّق</span>}
              {team.team_type && (
                <span className="guild-badge">{TYPE_LABELS[team.team_type] || team.team_type}</span>
              )}
            </div>
          </div>
        </motion.div>

        {team.founder && (
          <div className="card" style={{ marginTop: 16, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>المؤسس</div>
            <div style={{ fontWeight: 600 }}>{team.founder.full_name || team.founder.username}</div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
            marginTop: 16,
          }}
        >
          {[
            { label: 'الأعضاء', value: team.total_members || 0 },
            { label: 'BV', value: (team.total_bv || 0).toLocaleString() },
            { label: 'القوة', value: team.power_score || 0 },
            { label: 'السمعة', value: team.reputation_score || 0 },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: primary }}>{s.value}</div>
            </div>
          ))}
        </div>

        {team.mission && (
          <div className="card" style={{ marginTop: 14, padding: 14 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>المهمة</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>{team.mission}</p>
          </div>
        )}
        {team.bio && (
          <div className="card" style={{ marginTop: 10, padding: 14 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>عن الفريق</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>{team.bio}</p>
          </div>
        )}

        {(team.achievements || []).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>الإنجازات</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {team.achievements.map((a) => (
                <span key={a.id || a.code} className="guild-badge">
                  {a.name_ar || a.name || a.code}
                </span>
              ))}
            </div>
          </div>
        )}

        {(team.recruit_links || []).length > 0 && isMyTeam && (
          <div className="card" style={{ marginTop: 16, padding: 14 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>روابط التجنيد</h3>
            {team.recruit_links.map((l) => (
              <div key={l.code} className="guild-success-invite" style={{ marginBottom: 8 }}>
                <strong>{l.code}</strong>
                <div style={{ color: 'var(--text-3)', marginTop: 4 }}>
                  فتح: {l.open_count || 0} · نقر: {l.click_count || 0} · تحويل:{' '}
                  {l.conversion_count || 0}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="guild-btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => navigate('/team/new-referral')}
            >
              إرسال دعوة
            </button>
          </div>
        )}

        {analytics && (
          <div className="card" style={{ marginTop: 16, padding: 14 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>تحليلات القيادة (7 أيام)</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              نشاط: {analytics.activity?.length || 0} حدث · أعضاء:{' '}
              {analytics.members?.length || 0}
            </p>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button type="button" className="guild-btn-secondary" onClick={() => navigate('/teams/discover')}>
            اكتشف فرقاً أخرى
          </button>
          {!isMyTeam && team.is_public && (
            <button type="button" className="guild-btn-primary" style={{ flex: 1 }} disabled>
              طلب الانضمام (قريباً)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

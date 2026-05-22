import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getOrganizationHub } from '../../api/organization.api'
import { useOrganizationRealtime } from '../../hooks/useOrganizationRealtime'
import OrganizationActivityFeed from '../../components/organization/OrganizationActivityFeed'
import TreeNetworkFlow from '../../components/organization/TreeNetworkFlow'

export default function OrganizationHubPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['organization-hub'],
    queryFn: getOrganizationHub,
  })

  const { liveFeed } = useOrganizationRealtime(data?.agency?.id)

  const xp = data?.profile?.agencyXp
  const prestige = data?.profile?.prestige?.tier

  return (
    <div className="org-hub module-page page-enter" dir="rtl">
      <header className="org-hub__header">
        <div>
          <h1 className="font-display org-hub__title">⚡ مركز المنظمة الحية</h1>
          <p className="org-hub__sub">
            {data?.agency?.name ? `وكالة ${data.agency.name}` : 'شبكتك · تقدم · منافسة'}
          </p>
        </div>
        <div className="org-hub__stats">
          <div className="org-hub__stat">
            <span>المستوى</span>
            <strong>{xp?.level ?? 1}</strong>
          </div>
          <div className="org-hub__stat">
            <span>XP</span>
            <strong>{(xp?.xp_total ?? 0).toLocaleString('ar-EG')}</strong>
          </div>
          <div className="org-hub__stat">
            <span>Prestige</span>
            <strong>{prestige?.title_ar || prestige?.title_en || 'Bronze'}</strong>
          </div>
          <Link to="/progression" className="tree-locked__btn tree-locked__btn--secondary">
            مركز التقدم
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '2rem' }}>جاري التحميل...</p>
      ) : (
        <div className="org-hub__grid">
          <section className="org-hub__tree">
            <TreeNetworkFlow />
          </section>
          <aside className="org-hub__sidebar">
            <OrganizationActivityFeed agencyId={data?.agency?.id} liveItems={liveFeed} />
            <div className="org-hub__lb module-card module-card-body">
              <h4>🏆 أفضل المجندين</h4>
              <ul>
                {(data?.leaderboards?.recruiters?.entries || []).slice(0, 5).map((e, i) => (
                  <li key={e.user_id}>
                    <span>{i + 1}</span> {e.users?.full_name || e.users?.username}
                    <em>{e.score}</em>
                  </li>
                ))}
              </ul>
            </div>
            <div className="org-hub__missions module-card module-card-body">
              <h4>🎯 مهام نشطة</h4>
              <ul>
                {(data?.profile?.missions || [])
                  .filter((m) => !m.is_completed)
                  .slice(0, 4)
                  .map((m) => (
                    <li key={m.id}>
                      {m.icon} {m.title}{' '}
                      <span>
                        {m.current_count}/{m.target_count}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

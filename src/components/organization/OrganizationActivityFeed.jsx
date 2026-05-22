import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getActivityFeed } from '../../api/organization.api'

const SEVERITY_CLASS = {
  info: '',
  success: 'org-feed__item--success',
  warning: 'org-feed__item--warning',
  epic: 'org-feed__item--epic',
  legendary: 'org-feed__item--legendary',
}

export default function OrganizationActivityFeed({ agencyId, liveItems = [], filter = null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['org-activity', agencyId, filter],
    queryFn: () => getActivityFeed({ agencyId, types: filter, limit: 30 }),
    refetchInterval: 60_000,
  })

  const merged = [...liveItems, ...(data?.items || [])]
  const seen = new Set()
  const items = merged.filter((item) => {
    const key = item.id || `${item.eventType}-${item.at}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className="org-feed" dir="rtl">
      <h3 className="org-feed__title">النشاط المباشر</h3>
      {isLoading && !items.length ? (
        <p className="org-feed__empty">جاري التحميل...</p>
      ) : !items.length ? (
        <p className="org-feed__empty">لا نشاط بعد — كن أول من يحرك الشبكة</p>
      ) : (
        <ul className="org-feed__list">
          <AnimatePresence initial={false}>
            {items.slice(0, 25).map((item) => (
              <motion.li
                key={item.id || item.at}
                className={`org-feed__item ${SEVERITY_CLASS[item.severity] || ''}`}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0 }}
                layout
              >
                <span className="org-feed__icon">{item.icon || '⚡'}</span>
                <div>
                  <strong>{item.title}</strong>
                  {item.body && <p>{item.body}</p>}
                  <time>
                    {new Date(item.created_at || item.at).toLocaleString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

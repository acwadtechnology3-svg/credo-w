import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { getNetworkActivity } from '../../api/tree.api'

export default function NetworkActivityTicker({ liveItems = [] }) {
  const { data } = useQuery({
    queryKey: ['network-activity'],
    queryFn: () => getNetworkActivity(25),
    refetchInterval: 30_000,
  })

  const [items, setItems] = useState([])

  useEffect(() => {
    const base = data?.feed || []
    const merged = [...liveItems, ...base].slice(0, 20)
    setItems(merged)
  }, [data, liveItems])

  if (!items.length) {
    return (
      <div className="network-ticker network-ticker--empty" dir="rtl">
        <span>⚡ نشاط الشبكة سيظهر هنا فور الانضمام</span>
      </div>
    )
  }

  return (
    <div className="network-ticker" dir="rtl">
      <div className="network-ticker__label">بث حي</div>
      <div className="network-ticker__track">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.div
              key={item.id || `${item.title}-${i}`}
              className={`network-ticker__item severity-${item.severity || 'info'}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              layout
            >
              <span className="network-ticker__icon">{item.icon || '⚡'}</span>
              <span className="network-ticker__title">{item.title}</span>
              {item.body && <span className="network-ticker__body">{item.body}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

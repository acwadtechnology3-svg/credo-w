import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react'
import { getTreeAnalytics } from '../../api/tree.api'

export default function TeamAnalyticsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['tree-analytics'],
    queryFn: getTreeAnalytics,
    refetchInterval: 60_000,
  })

  const a = data?.analytics
  if (isLoading) {
    return (
      <aside className="tree-analytics-panel" dir="rtl">
        <p style={{ color: 'var(--text-3)', padding: 16 }}>جاري تحميل التحليلات...</p>
      </aside>
    )
  }
  if (!a) return null

  const metrics = [
    { label: 'PV', value: a.pv, icon: Zap },
    { label: 'GV', value: a.gv, icon: TrendingUp },
    { label: 'TV', value: a.tv, icon: BarChart3 },
    { label: 'BV', value: a.bv, icon: BarChart3 },
    { label: 'CV', value: a.cv, icon: Zap },
  ]

  return (
    <aside className="tree-analytics-panel" dir="rtl">
      <h3 className="font-display">
        <Users size={18} /> تحليلات الفريق
      </h3>

      <div className="tree-analytics-panel__grid">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="tree-analytics-metric"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <m.icon size={14} />
            <span>{m.label}</span>
            <strong>{Number(m.value || 0).toLocaleString('ar-EG')}</strong>
          </motion.div>
        ))}
      </div>

      <div className="tree-analytics-panel__row">
        <span>المباشرون</span>
        <strong>{a.directRecruits}</strong>
      </div>
      <div className="tree-analytics-panel__row">
        <span>حجم الشبكة</span>
        <strong>{a.totalNetworkSize}</strong>
      </div>
      <div className="tree-analytics-panel__row">
        <span>نشط / غير نشط</span>
        <strong>
          {a.activeMembers} / {a.inactiveMembers}
        </strong>
      </div>

      <div className="tree-analytics-panel__legs">
        <div className="leg left">
          <span>يسار</span>
          <strong>{Number(a.leftVolume).toLocaleString('ar-EG')}</strong>
        </div>
        <div className="leg right">
          <span>يمين</span>
          <strong>{Number(a.rightVolume).toLocaleString('ar-EG')}</strong>
        </div>
      </div>

      {a.weakLeg && (
        <p className="tree-analytics-panel__weak">
          الرجل الأضعف: <strong>{a.weakLeg}</strong>
          {a.carryOver > 0 && ` · ترحيل ${a.carryOver}`}
        </p>
      )}

      <div className="tree-analytics-panel__energy">
        <span>طاقة التوسع</span>
        <div className="tree-analytics-panel__energy-bar">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${a.expansionEnergyPct || 0}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <small>سلسلة {a.growthStreakDays || 0} يوم</small>
      </div>

      <div className="tree-analytics-panel__packages">
        <span>توزيع الباقات</span>
        {[1, 3, 7].map((lvl) => (
          <div key={lvl} className="pkg-bar">
            <span>{lvl === 1 ? 'أحادي' : lvl === 3 ? 'ثلاثي' : 'سباعي'}</span>
            <div style={{ width: `${Math.min(100, (a.packageDistribution?.[lvl] || 0) * 8)}%` }} />
            <em>{a.packageDistribution?.[lvl] || 0}</em>
          </div>
        ))}
      </div>
    </aside>
  )
}

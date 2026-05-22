import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock, Network, TrendingUp, Zap } from 'lucide-react'

export default function LockedTreeExperience({ growthPreview, onJoinNetwork }) {
  const preview = growthPreview || {
    potentialMatchingBv: 2400,
    leftLegBv: 1200,
    rightLegBv: 800,
    estimatedCommissionEgp: 480,
    rankProgressPct: 34,
  }

  return (
    <div className="tree-locked" dir="rtl">
      <motion.div
        className="tree-locked__hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="tree-locked__glow" aria-hidden />
        <Lock size={28} className="tree-locked__lock-icon" />
        <h1 className="tree-locked__title font-display">
          المنظومة التنظيمية
        </h1>
        <p className="tree-locked__subtitle">
          يجب تفعيل باقة أولاً للانضمام إلى المنظومة.
        </p>
      </motion.div>

      <div className="tree-locked__preview-grid">
        <motion.div
          className="tree-locked__viz"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <svg viewBox="0 0 400 280" className="tree-locked__svg" aria-hidden>
            <defs>
              <linearGradient id="treeLockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B6CF6" />
                <stop offset="100%" stopColor="#6BE4FF" />
              </linearGradient>
              <filter id="treeBlur">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            {[
              [200, 40, 120, 100],
              [120, 100, 80, 180],
              [280, 100, 320, 180],
              [80, 180, 50, 250],
              [200, 180, 200, 250],
              [320, 180, 350, 250],
            ].map(([x1, y1, x2, y2], i) => (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#treeLockGrad)"
                strokeWidth="1.5"
                opacity="0.35"
                filter="url(#treeBlur)"
              />
            ))}
            {[200, 120, 280, 80, 200, 320].map((cx, i) => (
              <circle
                key={i}
                cx={cx}
                cy={[40, 100, 100, 180, 180, 180][i]}
                r="18"
                fill="#1a1530"
                stroke="#7B6CF6"
                strokeWidth="1"
                opacity="0.7"
              />
            ))}
            <circle cx="200" cy="40" r="22" fill="#7B6CF6" opacity="0.25">
              <animate attributeName="r" values="20;28;20" dur="3s" repeatCount="indefinite" />
            </circle>
          </svg>
          <div className="tree-locked__blur-overlay">
            <span>شبكة مقفلة — معاينة النمو</span>
          </div>
        </motion.div>

        <motion.div
          className="tree-locked__stats"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3>
            <TrendingUp size={18} /> محاكاة النمو المحتمل
          </h3>
          <div className="tree-locked__stat-row">
            <span>الرجل الأيسر (BV)</span>
            <strong>{preview.leftLegBv?.toLocaleString('ar-EG')}</strong>
          </div>
          <div className="tree-locked__stat-row">
            <span>الرجل الأيمن (BV)</span>
            <strong>{preview.rightLegBv?.toLocaleString('ar-EG')}</strong>
          </div>
          <div className="tree-locked__stat-row highlight">
            <span>مطابقة محتملة</span>
            <strong>{preview.potentialMatchingBv?.toLocaleString('ar-EG')} BV</strong>
          </div>
          <div className="tree-locked__stat-row">
            <span>عمولة تقديرية</span>
            <strong>{preview.estimatedCommissionEgp} EGP</strong>
          </div>
          <div className="tree-locked__progress">
            <span>تقدم الرتبة</span>
            <div className="tree-locked__progress-bar">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${preview.rankProgressPct}%` }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <p className="tree-locked__explain">
        <Network size={16} />
        شبكة ثنائية/تسلسلية هجينة — راعٍ، موضع، أرجل، ومكافآت حية.
      </p>

      <div className="tree-locked__actions">
        <Link to="/packages" className="tree-locked__btn tree-locked__btn--primary">
          <Zap size={18} />
          شراء باقة
        </Link>
        <Link to="/team/placement-tree?guide=1" className="tree-locked__btn tree-locked__btn--secondary" style={{ textDecoration: 'none' }}>
          <Network size={18} />
          مشاهدة شرح النظام
        </Link>
      </div>
    </div>
  )
}

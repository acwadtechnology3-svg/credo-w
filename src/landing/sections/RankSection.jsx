import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '../components/core/SectionHeader'
import { RANKS } from '../data/content'

export default function RankSection() {
  const [active, setActive] = useState(2)

  return (
    <section id="ranks" className="ld-section">
      <SectionHeader
        eyebrow="مسار الرتب"
        title="من المبتدئ إلى الأسطورة"
        titleEn="Rank Progression"
        subtitle="كل رتبة تفتح طبقة جديدة من المكافآت والمكانة — بتصميم يشبه لوحات الألعاب AAA."
        align="center"
      />
      <div className="ld-container">
        <div className="ld-rank-track">
          {RANKS.map((rank, i) => (
            <motion.button
              key={rank.id}
              type="button"
              className={`ld-rank-node ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: 'pointer', border: '1px solid var(--ld-border)', background: 'var(--ld-surface)' }}
            >
              <div className="ld-gradient-text" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' }}>
                {rank.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>{rank.ar}</div>
              <div style={{ fontSize: 11, color: 'var(--ld-text-dim)', marginTop: 6 }}>XP {rank.xp}</div>
            </motion.button>
          ))}
        </div>
        <motion.p
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginTop: 28, color: 'var(--ld-text-muted)', fontSize: 15 }}
        >
          الرتبة الحالية: <strong style={{ color: 'var(--ld-lavender)' }}>{RANKS[active].ar}</strong> — استمر في بناء
          الفريق لفتح المستوى التالي.
        </motion.p>
      </div>
    </section>
  )
}

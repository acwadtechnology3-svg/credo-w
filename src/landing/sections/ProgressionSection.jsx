import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { RANKS, PROGRESSION_STATS } from '../data/content'

export default function ProgressionSection() {
  const [active, setActive] = useState(2)

  return (
    <SectionShell id="progression" beat="اشعر بالتقدّم">
      <SectionHeader
        eyebrow="هيبة التقدّم"
        title="مسار prestige — من البداية إلى الأسطورة"
        titleEn="Prestige Progression"
        subtitle="رتب وإنجازات بتصميم AAA يلتقي بفينتك — محرّك طموح، لا زينة."
        align="center"
      />

      <div className="ld-container">
        <div className="ld-glass" style={{ padding: 32, marginBottom: 32 }}>
          <div className="ld-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {PROGRESSION_STATS.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.06}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{item.label}</span>
                    <span style={{ color: 'var(--ld-text-dim)' }}>{item.locked ? 'مقفل' : `${item.value}%`}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.08 }}
                      style={{
                        height: '100%',
                        borderRadius: 99,
                        background: item.locked ? 'rgba(255,255,255,0.12)' : 'var(--ld-gradient-primary)',
                      }}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="ld-rank-track">
          {RANKS.map((rank, i) => (
            <button
              key={rank.id}
              type="button"
              className={`ld-rank-node ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              <div className="ld-gradient-text" style={{ fontSize: 10, fontWeight: 800 }}>
                {rank.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{rank.ar}</div>
              <div style={{ fontSize: 10, color: 'var(--ld-text-dim)', marginTop: 4 }}>
                Tier {rank.tier}
              </div>
            </button>
          ))}
        </div>
        <motion.p
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ld-text-muted)' }}
        >
          مستوى <strong style={{ color: 'var(--ld-lavender)' }}>{RANKS[active].ar}</strong> — استمر في التوسع لفتح
          الطبقة التالية.
        </motion.p>
      </div>
    </SectionShell>
  )
}

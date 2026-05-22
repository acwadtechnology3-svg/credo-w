import { motion } from 'framer-motion'
import { Lock, Unlock, Award, Target } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import Reveal from '../components/core/Reveal'

const PROGRESSION = [
  { label: 'إنجازات', value: 84, icon: Award, locked: false },
  { label: 'فتح مزايا', value: 62, icon: Unlock, locked: false },
  { label: 'تحديات أسبوعية', value: 45, icon: Target, locked: false },
  { label: 'رتبة النخبة', value: 12, icon: Lock, locked: true },
]

export default function GamificationSection() {
  return (
    <section className="ld-section">
      <SectionHeader
        eyebrow="التقدّم والرتب"
        title="تقدّم بذكاء — بدون طفولة بصرية"
        titleEn="Gamified Progression · Enterprise Grade"
        subtitle="رتب، إنجازات، ومكافآت بتصميم AAA يلتقي بفينتك المؤسسي."
        align="center"
      />
      <div className="ld-container">
        <div className="ld-glass" style={{ padding: 40, borderRadius: 'var(--ld-r-xl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 28 }}>
            {PROGRESSION.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.08}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <item.icon size={18} color={item.locked ? 'var(--ld-text-dim)' : '#a855f7'} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{item.label}</span>
                    <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--ld-text-dim)' }}>
                      {item.locked ? 'مقفل' : `${item.value}%`}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 99,
                      background: 'rgba(255,255,255,0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: '100%',
                        borderRadius: 99,
                        background: item.locked
                          ? 'rgba(255,255,255,0.15)'
                          : 'var(--ld-gradient-primary)',
                        boxShadow: item.locked ? 'none' : '0 0 20px rgba(168,85,247,0.5)',
                      }}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

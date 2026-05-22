import { motion } from 'framer-motion'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { LIVE_METRICS } from '../data/content'

export default function GrowthMetricsSection() {
  return (
    <SectionShell compact>
      <SectionHeader
        eyebrow="نمو حي"
        title="منظومة تتوسع كل يوم"
        titleEn="Live Growth Metrics"
        subtitle="مؤشرات حقيقية تعكس حجم المجتمع الرقمي — ثقة بصرية وليس أرقامًا فارغة."
        align="center"
        size="md"
      />
      <div className="ld-container ld-grid-4">
        {LIVE_METRICS.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.06}>
            <motion.article
              className="ld-card ld-metric-card"
              whileInView={{ opacity: [0.6, 1] }}
              viewport={{ once: true }}
            >
              <div className="ld-metric-value">{m.value}</div>
              <p className="ld-metric-label">{m.label}</p>
              <p className="ld-metric-en">{m.en}</p>
            </motion.article>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

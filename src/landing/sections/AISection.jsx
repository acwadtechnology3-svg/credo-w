import { motion } from 'framer-motion'
import { Bot, Workflow, LineChart } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import Reveal from '../components/core/Reveal'

const AI_FEATURES = [
  { icon: Bot, title: 'ذكاء تشغيلي', desc: 'تحليلات MLM، كشف احتيال، وتوصيات رتب آلية.' },
  { icon: Workflow, title: 'أتمتة العمليات', desc: 'عمولات، ترقيات، وإشعارات — بدون تدخل يدوي.' },
  { icon: LineChart, title: 'رؤى لحظية', desc: 'لوحات بيانات بمستوى مؤسسي لكل وكالة وقائد.' },
]

export default function AISection() {
  return (
    <section className="ld-section">
      <div className="ld-container ld-split ld-glass" style={{ overflow: 'hidden' }}>
        <div className="ld-split-content" style={{ order: 1 }}>
          <SectionHeader
            eyebrow="الذكاء الاصطناعي"
            title="منصة تفكر معك"
            titleEn="AI + Automation"
            subtitle="محركات تحليل، أتمتة، وقرارات مدعومة بالبيانات — ليست شعارًا."
            align="start"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {AI_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div className="ld-icon-ring" style={{ flexShrink: 0 }}>
                    <f.icon size={20} color="#c4b8ff" />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 800, marginBottom: 6 }}>{f.title}</h4>
                    <p style={{ fontSize: 14, color: 'var(--ld-text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="ld-split-visual" style={{ order: 0, minHeight: 360 }}>
          <motion.div
            style={{
              width: '80%',
              maxWidth: 320,
              padding: 24,
              borderRadius: 16,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--ld-border)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 12,
              color: 'var(--ld-lavender)',
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div style={{ color: '#22c55e', marginBottom: 8 }}>▸ credo-intelligence</div>
            <div>rank_engine.evaluate(user) → Elite</div>
            <div>commission.propagate(bv: 12400)</div>
            <div>fraud.score: 0.02 ✓</div>
            <div style={{ marginTop: 12, color: 'var(--ld-purple)' }}>automation.queue: idle</div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

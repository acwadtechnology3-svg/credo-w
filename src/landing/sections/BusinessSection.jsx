import SectionHeader from '../components/core/SectionHeader'
import Reveal from '../components/core/Reveal'
import { BUSINESS_STEPS } from '../data/content'

export default function BusinessSection() {
  return (
    <section className="ld-section">
      <SectionHeader
        eyebrow="نظام الأعمال"
        title="من التسجيل إلى العمولة — مسار واحد"
        titleEn="Business System Explained"
        subtitle="أربع خطوات واضحة تربط الانضمام بالنمو المالي."
        align="center"
      />
      <div className="ld-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {BUSINESS_STEPS.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.1}>
              <article
                className="ld-glass"
                style={{
                  padding: 28,
                  borderRadius: 'var(--ld-r-lg)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span
                  className="ld-gradient-text"
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    opacity: 0.25,
                    position: 'absolute',
                    top: 12,
                    left: 16,
                    fontFamily: 'var(--ld-font-display)',
                  }}
                >
                  {step.step}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginTop: 40, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ld-text-muted)', lineHeight: 1.65 }}>{step.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

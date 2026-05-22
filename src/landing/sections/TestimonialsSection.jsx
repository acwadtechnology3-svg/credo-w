import { motion } from 'framer-motion'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import { TESTIMONIALS } from '../data/content'
import { staggerContainer, fadeUp } from '../motion/variants'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

function TestimonialCard({ t, index }) {
  const reduced = usePrefersReducedMotion()

  return (
    <motion.article
      className={`ld-testimonial-card ${t.featured ? 'ld-testimonial-card--featured' : ''}`}
      variants={reduced ? {} : fadeUp}
      custom={index * 0.12}
      whileHover={reduced ? {} : { y: t.featured ? -14 : -8 }}
      layout
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span className="ld-country-badge">{t.countryCode}</span>
        <span className={`ld-pill-tag ld-pill-tag--prestige`}>{t.rank}</span>
      </div>

      <blockquote className="ld-testimonial-quote">{t.quote}</blockquote>

      <footer className="ld-testimonial-profile">
        <div className="ld-avatar" aria-hidden>
          {t.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ld-text-dim)', marginTop: 2 }}>
            {t.role} · {t.agency}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ld-purple)', marginTop: 4 }}>{t.country}</div>
        </div>
      </footer>
    </motion.article>
  )
}

export default function TestimonialsSection() {
  const reduced = usePrefersReducedMotion()

  return (
    <SectionShell id="testimonials" glow="subtle" beat="ثقة حية">
      <SectionHeader
        eyebrow="قادة يثقون"
        title="منظومة حية — أصوات حقيقية"
        titleEn="Trusted Across the Ecosystem"
        subtitle="قادة وكالات رقمية يشاركون تجربة التوسع والقيادة داخل Credo W."
        align="center"
      />

      <motion.div
        className="ld-container ld-testimonials-grid"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={t.name} t={t} index={i} />
        ))}
      </motion.div>
    </SectionShell>
  )
}

import { motion } from 'framer-motion'
import { Diamond, Crown, Rocket } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import Reveal from '../components/core/Reveal'
import { FEATURE_CARDS } from '../data/content'

const ICONS = { diamond: Diamond, crown: Crown, rocket: Rocket }

export default function AboutSection() {
  return (
    <section id="about" className="ld-section">
      <SectionHeader
        eyebrow="من نحن"
        title="ليست منصة عادية — حركة رقمية"
        titleEn="Not a platform. A digital movement."
        subtitle="Credo W تجمع بين التسويق الشبكي الاحترافي، الوكالات الحية، والذكاء الاصطناعي في تجربة واحدة فاخرة."
        align="center"
      />
      <div className="ld-container ld-feature-row">
        {FEATURE_CARDS.map((card, i) => {
          const Icon = ICONS[card.icon] || Diamond
          return (
            <Reveal key={card.title} delay={i * 0.1}>
              <motion.article
                className="ld-feature-card ld-glass"
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                <div className="ld-icon-ring">
                  <Icon size={22} color="#c4b8ff" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{card.title}</h3>
                <p className="ld-en-sub" style={{ textAlign: 'start', marginBottom: 12 }}>
                  {card.en}
                </p>
                <p style={{ fontSize: 14, color: 'var(--ld-text-muted)', lineHeight: 1.7 }}>{card.desc}</p>
              </motion.article>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

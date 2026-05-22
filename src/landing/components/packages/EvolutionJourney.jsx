import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Reveal from '../core/Reveal'
import { JOURNEY_STEPS } from '../../data/packagesContent'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

export default function EvolutionJourney() {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="ld-pkg-journey">
      <Reveal>
        <h3 className="ld-heading-md ld-pkg-journey__title">رحلة التطور داخل Credo W</h3>
        <p className="ld-body ld-pkg-journey__sub">تبدأ · تتوسع · تقود — مسار واحد، ثلاث مراحل هوية</p>
      </Reveal>

      <div className="ld-pkg-journey__track" aria-hidden>
        <motion.div
          className="ld-pkg-journey__beam"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="ld-pkg-journey__steps">
        {JOURNEY_STEPS.map((step, i) => (
          <Reveal key={step.level} delay={i * 0.12}>
            <motion.article
              className={`ld-pkg-journey__step ld-pkg-journey__step--${i + 1}`}
              whileInView={reduced ? {} : { opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 24 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              <div className="ld-pkg-journey__node">
                <span className="ld-pkg-journey__phase">{step.phase}</span>
              </div>
              <h4 className="ld-gradient-text ld-pkg-journey__level">{step.level}</h4>
              <p className="ld-pkg-journey__desc">{step.desc}</p>
              {i < JOURNEY_STEPS.length - 1 && (
                <ArrowLeft className="ld-pkg-journey__arrow" size={18} aria-hidden />
              )}
            </motion.article>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import useCardTilt from '../../hooks/useCardTilt'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'
import PackageParticles from './PackageParticles'
import PackageNodeDiagram from './PackageNodeDiagram'
import Reveal from '../core/Reveal'

export default function PackageLevelCard({ pkg, index, isActive, onHover, onLeave, onSelect }) {
  const reduced = usePrefersReducedMotion()
  const tiltIntensity = pkg.power === 1 ? 5 : pkg.power === 2 ? 8 : 11
  const { ref, onMove, onLeave: tiltLeave } = useCardTilt(tiltIntensity)

  const handleMove = (e) => {
    onMove(e)
    onHover?.()
  }

  const handleLeave = () => {
    tiltLeave()
    onLeave?.()
  }

  return (
    <Reveal delay={index * 0.1}>
      <motion.article
        ref={ref}
        className={[
          'ld-pkg-card',
          `ld-pkg-card--power-${pkg.power}`,
          pkg.featured && 'ld-pkg-card--featured',
          isActive && 'ld-pkg-card--active',
        ]
          .filter(Boolean)
          .join(' ')}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onTouchStart={() => onSelect?.()}
        whileHover={reduced ? {} : { y: -6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          transform: reduced
            ? undefined
            : 'perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
        }}
      >
        <PackageParticles power={pkg.power} />
        <div className="ld-pkg-card__aura" aria-hidden />
        <div className="ld-pkg-card__inner">
          <div className="ld-pkg-card__top">
            <span className="ld-pkg-card__codename">{pkg.codename}</span>
            {pkg.badge && (
              <span className={`ld-pkg-card__badge ${pkg.power === 3 ? 'ld-pkg-card__badge--legacy' : ''}`}>
                {pkg.badge}
              </span>
            )}
          </div>

          <div className="ld-pkg-card__viz">
            <PackageNodeDiagram slots={pkg.slots} active={isActive} />
          </div>

          <h3 className="ld-pkg-card__title">{pkg.title}</h3>
          <p className="ld-pkg-card__subtitle">{pkg.subtitle}</p>

          <ul className="ld-pkg-card__features">
            {pkg.features.map((f) => (
              <li key={f}>
                <span className="ld-pkg-card__dot" aria-hidden />
                {f}
              </li>
            ))}
          </ul>

          <div className="ld-pkg-card__slots">
            <span className="ld-pkg-card__slots-label">Expansion Slots</span>
            <div className="ld-pkg-card__slots-bar">
              {Array.from({ length: pkg.slots }).map((_, i) => (
                <motion.span
                  key={i}
                  className="ld-pkg-card__slot"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                />
              ))}
            </div>
          </div>

          <Link to={pkg.href} className={`ld-pkg-card__cta ${pkg.featured ? 'ld-btn-primary' : 'ld-pkg-card__cta--ghost'}`}>
            {pkg.cta}
            <ArrowLeft size={14} style={{ transform: 'scaleX(-1)' }} />
          </Link>
        </div>
      </motion.article>
    </Reveal>
  )
}

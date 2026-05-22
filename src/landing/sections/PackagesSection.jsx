import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import EcosystemLinesBg from '../components/packages/EcosystemLinesBg'
import PackageLevelCard from '../components/packages/PackageLevelCard'
import EcosystemGraph from '../components/packages/EcosystemGraph'
import PackageComparison from '../components/packages/PackageComparison'
import EvolutionJourney from '../components/packages/EvolutionJourney'
import { PACKAGE_LEVELS } from '../data/packagesContent'

export default function PackagesSection() {
  const [activeId, setActiveId] = useState('triple')
  const sectionRef = useRef(null)

  const onPointerMove = useCallback((e) => {
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--mouse-x', `${x}%`)
    el.style.setProperty('--mouse-y', `${y}%`)
  }, [])

  return (
    <SectionShell id="packages" glow="focal" beat="اختر مستواك">
      <div
        ref={sectionRef}
        className="ld-pkg-section"
        onPointerMove={onPointerMove}
      >
        <EcosystemLinesBg />

        <header className="ld-section-header ld-section-header--center ld-pkg-header">
          <Reveal delay={0}>
            <p className="ld-eyebrow">مستويات التوسع</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="ld-heading-lg">
              ابدأ رحلتك داخل <span className="ld-gradient-text">منظومة Credo W</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="ld-body ld-section-header__subtitle">
              كل مستوى يفتح لك قدرات جديدة داخل منظومة التوسع والقيادة الرقمية
            </p>
          </Reveal>
        </header>

        <div className="ld-container">
          <div
            className="ld-pkg-cards"
            onMouseLeave={() => setActiveId('triple')}
          >
            {PACKAGE_LEVELS.map((pkg, i) => (
              <PackageLevelCard
                key={pkg.id}
                pkg={pkg}
                index={i}
                isActive={activeId === pkg.id}
                onHover={() => setActiveId(pkg.id)}
                onSelect={() => setActiveId(pkg.id)}
                onLeave={() => {}}
              />
            ))}
          </div>

          <Reveal delay={0.1}>
            <EcosystemGraph activeId={activeId} />
          </Reveal>

          <PackageComparison />

          <EvolutionJourney />
        </div>

        <motion.div
          className="ld-pkg-mouse-glow"
          aria-hidden
          animate={{
            opacity: [0.4, 0.65, 0.4],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </SectionShell>
  )
}

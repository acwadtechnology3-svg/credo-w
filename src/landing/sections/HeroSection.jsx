import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { MagneticLink, MagneticButton } from '../components/core/MagneticButton'
import { useLandingCopy } from '../../i18n/hooks/useLandingCopy'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import SceneErrorBoundary from '../../components/shared/SceneErrorBoundary'
import { asArray } from '../../lib/safeData.js'

const HeroLogoScene = lazy(() => import('../components/three/HeroLogoScene'))

export default function HeroSection() {
  const { hero, heroStats, storyBeats } = useLandingCopy()
  const { t } = useTranslation('landing')
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <SectionShell className="ld-hero" glow="focal" noPaddingTop beat={storyBeats[0]}>
      <div className="ld-container ld-hero-grid">
        <div>
          <Reveal delay={0}>
            <span className="ld-pill-tag">
              <Sparkles size={12} />
              {hero.eyebrow}
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="ld-heading-xl" style={{ marginTop: 20 }}>
              <span className="ld-gradient-text">{hero.title}</span>
            </h1>
            <p className="ld-en-sub">{hero.titleEn}</p>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="ld-lead" style={{ marginTop: 20 }}>
              {hero.lead}
            </p>
            <p className="ld-body">{hero.sub}</p>
          </Reveal>

          <Reveal delay={0.24}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
              {isAuthenticated ? (
                <MagneticLink to="/dashboard">{t('hero.ctaDashboard')}</MagneticLink>
              ) : (
                <>
                  <MagneticLink to="/register">{t('hero.ctaStart')}</MagneticLink>
                  <MagneticButton
                    className="ld-btn-ghost"
                    onClick={() => document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    {t('hero.ctaExplore')}
                  </MagneticButton>
                </>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="ld-hero-stats">
              {asArray(heroStats).map((s) => (
                <div key={s.num} className="ld-hero-stat">
                  <span className="ld-eyebrow" style={{ margin: 0, fontSize: 9 }}>
                    {s.num}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--ld-text-dim)' }}>{s.en}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="ld-hero-visual">
          <div className="ld-glass" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            <SceneErrorBoundary>
              <Suspense
                fallback={
                  <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--ld-text-dim)' }}>
                    …
                  </div>
                }
              >
                <HeroLogoScene />
              </Suspense>
            </SceneErrorBoundary>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

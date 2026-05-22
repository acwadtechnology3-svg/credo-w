import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { MagneticLink } from '../components/core/MagneticButton'
import { useAuthStore } from '../../store/authStore'
import { useLandingCopy } from '../../i18n/hooks/useLandingCopy'
import { useTranslation } from 'react-i18next'

export default function CTASection() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { cta, storyBeats } = useLandingCopy()
  const { t } = useTranslation('landing')
  const sec = t('sections.cta', { returnObjects: true })

  return (
    <SectionShell id="cta" glow="focal" beat={storyBeats[7] || sec.beat}>
      <div className="ld-container">
        <Reveal>
          <div className="ld-cta-panel">
            <SectionHeader
              title={sec.title || cta.title}
              titleEn={sec.titleEn}
              subtitle={sec.subtitle || cta.subtitle}
              align="center"
              size="md"
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <MagneticLink to="/dashboard">{t('hero.ctaDashboard')}</MagneticLink>
              ) : (
                <>
                  <MagneticLink to="/register">{cta.primary}</MagneticLink>
                  <MagneticLink to="/login" className="ld-btn-ghost">
                    {sec.login}
                  </MagneticLink>
                </>
              )}
            </div>
            <p style={{ marginTop: 20, fontSize: 11, color: 'var(--ld-text-dim)' }}>
              {sec.footnote}
            </p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  )
}

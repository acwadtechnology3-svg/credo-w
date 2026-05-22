import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SmoothScrollProvider from './providers/SmoothScrollProvider'
import AmbientBackground from './components/core/AmbientBackground'
import GlowCursor from './components/core/GlowCursor'
import ScrollProgress from './components/core/ScrollProgress'
import LandingNav from './sections/LandingNav'
import HeroSection from './sections/HeroSection'
import EcosystemSection from './sections/EcosystemSection'
import VisionSection from './sections/VisionSection'
import LeadershipSection from './sections/LeadershipSection'
import OrganizationSection from './sections/OrganizationSection'
import AgencySection from './sections/AgencySection'
import ProgressionSection from './sections/ProgressionSection'
import PackagesSection from './sections/PackagesSection'
import RewardsSection from './sections/RewardsSection'
import GrowthMetricsSection from './sections/GrowthMetricsSection'
import VoiceAISection from './sections/VoiceAISection'
import SupportSection from './sections/SupportSection'
import FloatingSupportButton from '../components/support/FloatingSupportButton'
import TestimonialsSection from './sections/TestimonialsSection'
import CTASection from './sections/CTASection'
import LandingFooter from './sections/LandingFooter'
import { LandingLocaleProvider, useLandingLocale } from './i18n/landingLocale'
import './styles/landing.css'

gsap.registerPlugin(ScrollTrigger)

function LandingShell() {
  const { dir, locale } = useLandingLocale()

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'auto'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  return (
    <div className="landing-root" dir={dir} lang={locale}>
        <AmbientBackground />
        <GlowCursor />
        <ScrollProgress />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <LandingNav />
          <main>
            <HeroSection />
            <EcosystemSection />
            <VisionSection />
            <LeadershipSection />
            <OrganizationSection />
            <AgencySection />
            <ProgressionSection />
            <PackagesSection />
            <RewardsSection />
            <GrowthMetricsSection />
            <VoiceAISection />
            <SupportSection />
            <TestimonialsSection />
            <CTASection />
          </main>
          <LandingFooter />
        </div>
        <FloatingSupportButton />
    </div>
  )
}

/** Cinematic story: enter → discover → vision → system → progression → rewards → AI → trust → join */
export default function LandingExperience() {
  return (
    <LandingLocaleProvider>
      <SmoothScrollProvider>
        <LandingShell />
      </SmoothScrollProvider>
    </LandingLocaleProvider>
  )
}

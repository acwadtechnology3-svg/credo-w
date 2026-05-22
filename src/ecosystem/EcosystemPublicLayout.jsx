import { Outlet } from 'react-router-dom'
import { LandingLocaleProvider, useLandingLocale } from '../landing/i18n/landingLocale'
import AmbientBackground from '../landing/components/core/AmbientBackground'
import LandingNav from '../landing/sections/LandingNav'
import LandingFooter from '../landing/sections/LandingFooter'
import '../landing/styles/landing.css'
import './styles/ecosystem-pages.css'

export function EcoShell({ children }) {
  const { dir, locale } = useLandingLocale()
  return (
    <div className="landing-root eco-root" dir={dir} lang={locale}>
      <AmbientBackground />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <LandingNav />
        {children}
        <LandingFooter />
      </div>
    </div>
  )
}

function Shell() {
  return (
    <EcoShell>
      <Outlet />
    </EcoShell>
  )
}

export default function EcosystemPublicLayout() {
  return (
    <LandingLocaleProvider>
      <Shell />
    </LandingLocaleProvider>
  )
}

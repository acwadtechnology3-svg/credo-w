import { LandingLocaleProvider } from '../../landing/i18n/landingLocale'
import { EcoShell } from '../../ecosystem/EcosystemPublicLayout'
import EcosystemPageView from '../../ecosystem/EcosystemPageView'
import AppLayoutFrame from '../../components/layout/AppLayoutFrame'
import PageLoader from '../../components/shared/PageLoader'
import PackagesPage from '../packages/PackagesPage'
import { useAuthStore } from '../../store/authStore'
import '../../landing/styles/landing.css'
import '../../ecosystem/styles/ecosystem-pages.css'

export default function PackagesRoute() {
  const { isAuthenticated, authReady } = useAuthStore()

  if (!authReady) return <PageLoader />

  if (isAuthenticated) {
    return (
      <AppLayoutFrame>
        <PackagesPage />
      </AppLayoutFrame>
    )
  }

  return (
    <LandingLocaleProvider>
      <EcoShell>
        <EcosystemPageView pageId="packages" />
      </EcoShell>
    </LandingLocaleProvider>
  )
}

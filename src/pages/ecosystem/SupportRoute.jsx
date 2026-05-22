import { LandingLocaleProvider } from '../../landing/i18n/landingLocale'
import { EcoShell } from '../../ecosystem/EcosystemPublicLayout'
import AppLayoutFrame from '../../components/layout/AppLayoutFrame'
import PageLoader from '../../components/shared/PageLoader'
import SupportCenterPage from '../support/SupportCenterPage'
import { useAuthStore } from '../../store/authStore'
import '../../landing/styles/landing.css'
import '../../ecosystem/styles/ecosystem-pages.css'
import '../../support/styles/support.css'

export default function SupportRoute() {
  const { isAuthenticated, authReady } = useAuthStore()

  if (!authReady) return <PageLoader />

  if (isAuthenticated) {
    return (
      <AppLayoutFrame>
        <SupportCenterPage />
      </AppLayoutFrame>
    )
  }

  return (
    <LandingLocaleProvider>
      <EcoShell>
        <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }}>
          <SupportCenterPage previewMode />
        </div>
      </EcoShell>
    </LandingLocaleProvider>
  )
}

import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSocket } from '../../hooks/useSocket'
import { useLocale } from '../../i18n/hooks/useLocale.js'
import FloatingSupportButton from '../support/FloatingSupportButton'
import ErrorBoundary from '../shared/ErrorBoundary'

export default function AppLayout() {
  useSocket()
  const { dir } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="app-shell franchise-shell">
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="app-main">
        <Topbar
          onMenuClick={() => setMobileOpen((open) => !open)}
          onOpenSearch={() => {}}
        />
        <main className="app-content franchise-content" dir={dir}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <FloatingSupportButton />
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSocket } from '../../hooks/useSocket'
import FloatingSupportButton from '../support/FloatingSupportButton'

/** App chrome with explicit page content (for dual public/member routes). */
export default function AppLayoutFrame({ children }) {
  useSocket()
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
        <main className="app-content franchise-content" dir="rtl">
          {children}
        </main>
        <FloatingSupportButton />
      </div>
    </div>
  )
}

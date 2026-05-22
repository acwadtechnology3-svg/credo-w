import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavMenus } from '../hooks/useNavMenus'
import { useLandingLocale } from '../i18n/landingLocale'
import { useAuthStore } from '../../store/authStore'
import { MagneticLink } from '../components/core/MagneticButton'
import Logo from '../../components/ui/Logo'
import LanguageSwitcher from '../components/nav/LanguageSwitcher'
import NavDropdown from '../components/nav/NavDropdown'
import MobileNavDrawer from '../components/nav/MobileNavDrawer'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { locale, dir } = useLandingLocale()
  const { copy, menus } = useNavMenus()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <div className="ld-nav-wrap">
        <motion.header
          className={`ld-nav ${scrolled ? 'scrolled' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
        >
          <Link to="/" className="ld-nav-brand" aria-label="Credo W">
            <Logo size="xs" height={38} className="ld-nav-brand-logo" alt="" />
            <span className="ld-nav-brand-text">Credo W</span>
          </Link>

          <div className="ld-nav-center ld-nav-desktop">
            <div className="ld-nav-menus">
              {menus.map((menu) => (
                <NavDropdown key={menu.id} menu={menu} copy={copy} badgeLabel={copy.new} />
              ))}
            </div>
          </div>

          <div className="ld-nav-actions">
            <LanguageSwitcher className="ld-nav-desktop" />
            {isAuthenticated ? (
              <MagneticLink to="/dashboard" className="ld-btn-primary ld-nav-cta">
                {copy.dashboard}
              </MagneticLink>
            ) : (
              <MagneticLink to="/start" className="ld-btn-primary ld-nav-cta">
                {copy.start}
              </MagneticLink>
            )}
            <button type="button" className="ld-nav-mobile-btn" aria-label="Menu" onClick={() => setMobileOpen(true)}>
              ☰
            </button>
          </div>
        </motion.header>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <MobileNavDrawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            menus={menus}
            copy={copy}
            isAuthenticated={isAuthenticated}
            locale={locale}
            dir={dir}
          />
        )}
      </AnimatePresence>
    </>
  )
}

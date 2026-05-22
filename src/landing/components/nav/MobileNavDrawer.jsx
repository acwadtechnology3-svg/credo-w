import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { MagneticLink } from '../core/MagneticButton'

export default function MobileNavDrawer({
  open,
  onClose,
  menus,
  copy,
  isAuthenticated,
  locale,
  dir,
}) {
  const [expanded, setExpanded] = useState('ecosystem')

  if (!open) return null

  return (
    <motion.div
      className="ld-nav-drawer"
      dir={dir}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="ld-nav-drawer-top">
        <span className="ld-nav-drawer-title">{copy.menuTitle}</span>
        <button type="button" className="ld-nav-drawer-close" onClick={onClose}>
          {locale === 'en' ? 'Close' : 'إغلاق'}
        </button>
      </div>

      <div className="ld-nav-drawer-lang">
        <LanguageSwitcher />
      </div>

      <div className="ld-nav-drawer-scroll">
        {menus.map((menu) => {
          const isOpen = expanded === menu.id
          const allItems = [
            ...(menu.items || []),
            ...(menu.groups?.flatMap((g) => g.items) || []),
          ]
          return (
            <div key={menu.id} className="ld-nav-drawer-section">
              <button
                type="button"
                className={`ld-nav-drawer-section-btn ${isOpen ? 'is-open' : ''}`}
                onClick={() => setExpanded(isOpen ? null : menu.id)}
              >
                <span>
                  {menu.label}
                  {menu.badge && <span className="ld-nav-badge">{copy.new}</span>}
                </span>
                <ChevronDown size={16} className="ld-nav-drawer-chevron" />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ld-nav-drawer-section-body"
                  >
                    {menu.hubIntro && (
                      <p className="ld-nav-drawer-section-desc">{menu.hubIntro.subtitle}</p>
                    )}
                    {allItems.map((item, idx) => (
                      <Link
                        key={`${item.title}-${idx}`}
                        to={item.href}
                        className="ld-nav-drawer-link-sm"
                        onClick={onClose}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.subtitle}</span>
                      </Link>
                    ))}
                    {menu.aiPanel?.href && (
                      <Link to={menu.aiPanel.href} className="ld-nav-drawer-ai-hint" onClick={onClose}>
                        {menu.aiPanel.cta}
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <div className="ld-nav-drawer-ctas">
        {isAuthenticated ? (
          <MagneticLink to="/dashboard" className="ld-btn-primary ld-nav-cta" onClick={onClose}>
            {copy.dashboard}
          </MagneticLink>
        ) : (
          <>
            <MagneticLink to="/start" className="ld-btn-primary ld-nav-cta" onClick={onClose}>
              {copy.start}
            </MagneticLink>
            <Link to="/login" className="ld-nav-drawer-login-link" onClick={onClose}>
              {copy.loginHint} {copy.login}
            </Link>
          </>
        )}
      </div>
    </motion.div>
  )
}

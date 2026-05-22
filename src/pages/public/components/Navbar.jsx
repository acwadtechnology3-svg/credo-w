import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../../components/ui/Logo'
import Icon from '../../../components/ui/Icon'
import { useAuthStore } from '../../../store/authStore'

const NAV_LINKS = [
  { id: 'how-it-works', label: 'كيف يشتغل' },
  { id: 'packages', label: 'الباقات' },
  { id: 'testimonials', label: 'آراء العملاء' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const scrollTo = (id) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <header
        className={scrolled ? 'glass-strong' : ''}
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 100,
          background: scrolled ? 'var(--bg-page-2)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--line)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Logo to="/" />
            <nav className="landing-nav-desktop" style={{ display: 'flex', gap: 8 }}>
              {NAV_LINKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  style={{
                    color: 'var(--text-2)',
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 8,
                    transition: 'color 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-2)'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="landing-nav-desktop" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary">
                  لوحة التحكم
                  <Icon name="arrow-left" size={12} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost">
                    تسجيل دخول
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    انضم الآن
                    <Icon name="arrow-left" size={12} />
                  </Link>
                </>
              )}
            </div>
            <button
              type="button"
              className="landing-nav-mobile-toggle btn btn-ghost"
              aria-label="القائمة"
              onClick={() => setMobileOpen(true)}
              style={{ padding: 10 }}
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="landing-mobile-overlay"
          role="presentation"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 6, 13, 0.72)',
            backdropFilter: 'blur(4px)',
            zIndex: 110,
          }}
        />
      )}

      <aside
        className="landing-mobile-drawer"
        style={{
          position: 'fixed',
          top: 0,
          insetInlineEnd: 0,
          width: 'min(320px, 88vw)',
          height: '100%',
          background: 'var(--bg-page-2)',
          borderInlineStart: '1px solid var(--line)',
          zIndex: 120,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        aria-hidden={!mobileOpen}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Logo to="/" size="sm" />
          <button type="button" className="btn btn-ghost" onClick={() => setMobileOpen(false)} aria-label="إغلاق">
            <Icon name="x" size={18} />
          </button>
        </div>
        {NAV_LINKS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            style={{
              textAlign: 'start',
              padding: '12px 14px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--surface-1)',
              color: 'var(--text-1)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
              لوحة التحكم
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn" style={{ justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                تسجيل دخول
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                انضم الآن
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Logo from '../ui/Logo'
import Icon from '../ui/Icon'
import UserAvatar from '../ui/UserAvatar'
import AnimatedCounter from '../ui/AnimatedCounter'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { useProfileAvatar } from '../../hooks/useProfileAvatar'
import {
  NAV_ROUTE_MAP,
  getNavIdFromPath,
  isShopPath,
} from '../../config/franchiseNav'
import { useNavLabels } from '../../i18n/hooks/useNavLabels.js'
import { useTranslation } from 'react-i18next'

function ShopNavSection({ current, pathname, onNavigate, shopNav }) {
  const [expanded, setExpanded] = useState(() => isShopPath(pathname))
  const shopChildActive = shopNav.children.some((c) => c.id === current)
  const subscriptionsActive = shopNav.subscriptions.id === current
  const sectionActive = shopChildActive || subscriptionsActive

  useEffect(() => {
    if (isShopPath(pathname)) setExpanded(true)
  }, [pathname])

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        type="button"
        className="nav-section-btn"
        onClick={() => setExpanded((e) => !e)}
        style={{
          color: sectionActive ? 'var(--lavender)' : undefined,
          fontWeight: sectionActive ? 600 : 500,
        }}
      >
        <Icon name={shopNav.icon} size={16} />
        <span style={{ flex: 1 }}>{shopNav.label}</span>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} style={{ opacity: 0.55 }} />
      </button>

      <div
        className="nav-children"
        style={{ maxHeight: expanded ? 200 : 0 }}
        aria-hidden={!expanded}
      >
        {shopNav.children.map((child) => {
          const active = child.id === current
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => onNavigate(child.id)}
              className={`nav-link nav-sublink${active ? ' active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                border: 0,
                cursor: 'pointer',
                marginBottom: 2,
                position: 'relative',
              }}
            >
              {active && <span className="nav-active-bar" aria-hidden="true" />}
              <span>{child.label}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onNavigate(shopNav.subscriptions.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          marginTop: 6,
          padding: '10px 12px',
          borderRadius: 10,
          border: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          background: subscriptionsActive
            ? 'linear-gradient(90deg, var(--credo-purple-dark) 0%, var(--credo-purple) 55%, var(--credo-purple-light) 100%)'
            : 'linear-gradient(90deg, #3D3580 0%, var(--credo-purple) 50%, var(--purple-bright) 100%)',
          boxShadow: subscriptionsActive
            ? '0 0 0 1px rgba(196,184,255,0.35), 0 4px 14px rgba(99,102,241,0.35)'
            : '0 2px 8px rgba(99,102,241,0.2)',
          transition: 'all var(--d-fast) var(--ease-out)',
        }}
        onMouseEnter={(e) => {
          if (!subscriptionsActive) {
            e.currentTarget.style.filter = 'brightness(1.08)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = ''
        }}
      >
        {shopNav.subscriptions.label}
      </button>
    </div>
  )
}

function NavButton({ item, active, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        padding: '9px 12px',
        borderRadius: 10,
        border: 0,
        cursor: 'pointer',
        marginBottom: 2,
        position: 'relative',
        background: active
          ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))'
          : 'transparent',
        color: active ? 'var(--lavender)' : 'var(--text-2)',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        textAlign: 'start',
        transition: 'all var(--d-fast) var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.color = 'var(--text-1)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-2)'
        }
      }}
    >
      {active && <span className="nav-active-bar" aria-hidden="true" />}
      <Icon name={item.icon} size={16} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span className="pill live" style={{ padding: '1px 6px', fontSize: 9 }}>
          {item.badge}
        </span>
      )}
      {item.hint && !item.badge && (
        <span className="kbd" style={{ opacity: 0.6 }}>
          {item.hint}
        </span>
      )}
    </button>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const profileAvatar = useProfileAvatar()
  const { t } = useTranslation('common')
  const {
    navGroups: NAV_GROUPS,
    shopNav: SHOP_NAV,
    customerNav: CUSTOMER_NAV,
    franchiseNav: FRANCHISE_NAV,
    adminNav: ADMIN_NAV,
    superAdminNav: SUPER_ADMIN_NAV,
    superAdminCourseNav: SUPER_ADMIN_COURSE_NAV,
  } = useNavLabels()
  const current = getNavIdFromPath(location.pathname)

  const onNavigate = (id) => {
    const to = NAV_ROUTE_MAP[id]
    if (to) navigate(to)
    onClose?.()
  }

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout')
    } catch {
      /* ignore */
    }
    logout()
    navigate('/login')
    onClose?.()
  }

  const earnings = user?.cycleEarnings ?? 0
  const initials = user?.initials || 'أم'
  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin'
  const isFranchise = ['franchise', 'admin', 'super_admin'].includes(user?.role)

  return (
    <aside
      className={`franchise-sidebar${mobileOpen ? ' is-open' : ''}`}
      aria-label={t('openMenu')}
    >
      <div style={{ padding: '18px 18px 12px' }}>
        <Logo to="/dashboard" size="md" />
      </div>

      <div
        style={{
          margin: '0 14px 14px',
          padding: 14,
          borderRadius: 14,
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(140deg, rgba(99,102,241,0.16) 0%, rgba(107,228,255,0.05) 100%)',
          border: '1px solid var(--line-purple)',
        }}
      >
        <div className="dot-grid-dense" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
        <div style={{ position: 'relative', display: 'flex', gap: 11, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
            <svg viewBox="0 0 40 40" width="40" height="40" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="20" cy="20" r="18" fill="none" stroke="var(--surface-2)" strokeWidth="2" />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="url(#rankRingSidebar)"
                strokeWidth="2"
                strokeDasharray={`${68 * 1.13} ${113 - 68 * 1.13}`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
              <defs>
                <linearGradient id="rankRingSidebar" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7B6CF6" />
                  <stop offset="100%" stopColor="#C4B8FF" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 4 }}>
              <UserAvatar
                src={profileAvatar}
                initials={initials}
                size={32}
                fontSize={12}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
              {user?.name || 'مسوّق'}
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {user?.id || '—'} · {user?.rank || 'Member'}
            </div>
          </div>
          <Icon name="chevron-down" size={14} style={{ color: 'var(--text-3)' }} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: 12,
            position: 'relative',
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>الأرباح هذه الدورة</div>
            <div
              className="font-num"
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
            >
              <AnimatedCounter value={earnings} />{' '}
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>ج.م</span>
            </div>
          </div>
          <span className="pill ok" style={{ padding: '2px 7px', fontSize: 10 }}>
            <span className="dot" />
            +8%
          </span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 10px 12px', overflowY: 'auto' }}>
        {NAV_GROUPS.map((g) => (
          <div key={g.title} style={{ marginBottom: 14 }}>
            <div className="t-eyebrow" style={{ padding: '6px 12px' }}>
              {g.title}
            </div>
            {g.items.map((it) => (
              <span key={it.id} style={{ display: 'contents' }}>
                <NavButton item={it} active={it.id === current} onNavigate={onNavigate} />
                {it.id === 'earnings' && (
                  <ShopNavSection
                    current={current}
                    pathname={location.pathname}
                    onNavigate={onNavigate}
                    shopNav={SHOP_NAV}
                  />
                )}
              </span>
            ))}
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <div className="t-eyebrow" style={{ padding: '6px 12px' }}>
            العملاء
          </div>
          {CUSTOMER_NAV.map((it) => (
            <NavButton key={it.id} item={it} active={it.id === current} onNavigate={onNavigate} />
          ))}
        </div>
        {isFranchise && (
          <div style={{ marginBottom: 14 }}>
            <div className="t-eyebrow" style={{ padding: '6px 12px' }}>
              Franchise
            </div>
            {FRANCHISE_NAV.map((it) => (
              <NavButton key={it.id} item={it} active={it.id === current} onNavigate={onNavigate} />
            ))}
          </div>
        )}
        {isSuperAdmin && (
          <div style={{ marginBottom: 14, padding: '0 8px' }}>
            <a
              href="/super-admin"
              target="_blank"
              rel="noopener noreferrer"
              className="sa-portal-btn"
              title="فتح لوحة Super Admin في تاب جديد"
            >
              <span>Super Admin</span>
              <span className="sa-nav-badge">SA</span>
            </a>
          </div>
        )}
        {isAdmin && (
          <div style={{ marginBottom: 14, padding: '0 8px' }}>
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="sa-portal-btn"
              style={{
                borderColor: 'rgba(123, 108, 246, 0.35)',
                background: 'linear-gradient(135deg, rgba(123, 108, 246, 0.08), rgba(83, 74, 183, 0.06))',
              }}
              title="فتح لوحة الأدمن في تاب جديد"
            >
              <span>Admin Panel</span>
            </a>
          </div>
        )}
      </nav>

      <div style={{ padding: 14, borderTop: '1px solid var(--line)' }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: 0,
            background: 'transparent',
            color: 'var(--text-3)',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            transition: 'color 120ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--danger)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-3)'
          }}
        >
          <Icon name="logout" size={14} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  )
}

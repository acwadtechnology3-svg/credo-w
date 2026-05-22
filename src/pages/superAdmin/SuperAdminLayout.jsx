import { Outlet, NavLink, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  SUPER_ADMIN_NAV,
  ADMIN_NAV,
  SUPER_ADMIN_COURSE_NAV,
  NAV_ROUTE_MAP,
} from '../../config/franchiseNav'
import Icon from '../../components/ui/Icon'
import Logo from '../../components/ui/Logo'
import client from '../../api/client'

const navLinkStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 12px',
  borderRadius: 8,
  fontSize: 12,
  textDecoration: 'none',
  marginBottom: 2,
  background: isActive ? 'var(--credo-purple)' : 'transparent',
  color: isActive ? '#EEEDFE' : '#888',
  fontWeight: isActive ? 600 : 400,
})

function NavSection({ title, items }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          padding: '4px 12px 8px',
          fontSize: 10,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {items.map((item) => {
        const to = NAV_ROUTE_MAP[item.id]
        return (
          <NavLink
            key={item.id}
            to={to}
            end={to === '/super-admin' || to === '/admin'}
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            <Icon name={item.icon} size={14} />
            {item.label}
          </NavLink>
        )
      })}
    </div>
  )
}

export default function SuperAdminLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  if (user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout')
    } catch {
      /* ignore */
    }
    logout()
    window.location.href = '/login'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f1a' }}>
      <aside
        style={{
          width: 240,
          background: '#1a1a2e',
          padding: '20px 0',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderInlineEnd: '1px solid #2a2a3e',
        }}
      >
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #2a2a3e' }}>
          <Logo to="/super-admin" size="sm" />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              Super Admin
            </span>
            <span className="sa-nav-badge">SA</span>
          </div>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          <NavSection title="المنصة" items={SUPER_ADMIN_NAV} />
          <div style={{ height: 1, background: '#2a2a3e', margin: '4px 8px 12px' }} />
          <NavSection title="الموديولات" items={[...SUPER_ADMIN_COURSE_NAV, ...ADMIN_NAV]} />
        </nav>

        <div style={{ padding: 8, borderTop: '1px solid #2a2a3e' }}>
          <a
            href="/dashboard"
            style={{
              display: 'block',
              padding: '8px 12px',
              fontSize: 12,
              color: '#888',
              textDecoration: 'none',
              marginBottom: 4,
            }}
          >
            ← لوحة المسوّق
          </a>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: 0,
              background: 'transparent',
              color: '#888',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
            }}
          >
            <Icon name="logout" size={14} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, background: '#0f0f1a', overflowY: 'auto' }} dir="rtl">
        <div style={{ padding: 24, maxWidth: 1400 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

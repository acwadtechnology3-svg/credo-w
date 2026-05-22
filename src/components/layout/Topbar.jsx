import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCart } from '../../api/shop.api'
import { getNotifications, markNotificationsRead } from '../../api/notification.api'
import { useNavLabels } from '../../i18n/hooks/useNavLabels.js'
import { useLocale } from '../../i18n/hooks/useLocale.js'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../i18n/LanguageSwitcher'
import { useAuthStore } from '../../store/authStore'
import { useProfileAvatar } from '../../hooks/useProfileAvatar'
import Icon from '../ui/Icon'
import UserAvatar from '../ui/UserAvatar'
import NotificationPanel from '../notifications/NotificationPanel'
import NotificationDetailModal from '../notifications/NotificationDetailModal'

export default function Topbar({ onMenuClick, onOpenSearch }) {
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const profileAvatar = useProfileAvatar()
  const { dir } = useLocale()
  const { t } = useTranslation(['dashboard', 'common'])
  const { getHeaderForPath } = useNavLabels()
  const { title, breadcrumbs = [] } = getHeaderForPath(location.pathname, user)
  const [showNotif, setShowNotif] = useState(false)
  const [selectedNotifId, setSelectedNotifId] = useState(null)
  const notifRef = useRef(null)

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    staleTime: 30_000,
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (ids) => markNotificationsRead(ids ?? []),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const cartCount = (cartData?.items || []).reduce((n, item) => n + (item.quantity || 0), 0)
  const unread = notifData?.unreadCount || 0
  const notifications = notifData?.notifications || []

  useEffect(() => {
    const onDocClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false)
      }
    }
    if (showNotif) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showNotif])

  const handleSelectNotification = (n) => {
    if (!n.is_read) {
      markReadMutation.mutate([n.id])
    }
    setShowNotif(false)
    setSelectedNotifId(n.id)
  }

  return (
    <header className="glass-strong franchise-topbar">
      <div className="topbar-start">
        <button
          type="button"
          className="btn btn-ghost btn-icon topbar-menu-btn"
          onClick={onMenuClick}
          aria-label={t('dashboard:topbar.openMenu')}
        >
          <Icon name="menu" size={18} />
        </button>
        <div className="topbar-titles" dir={dir}>
          {breadcrumbs.length > 0 && (
            <nav className="topbar-breadcrumbs" aria-label={t('dashboard:topbar.breadcrumbLabel')}>
              {breadcrumbs.map((b, i) => (
                <span key={b} className="topbar-crumb">
                  <span>{b}</span>
                  {i < breadcrumbs.length - 1 && (
                    <Icon name="arrow-left" size={10} className="topbar-crumb-sep" />
                  )}
                </span>
              ))}
            </nav>
          )}
          <h2 className="topbar-title font-display">{title}</h2>
        </div>
      </div>

      <div className="topbar-actions" dir={dir}>
        <LanguageSwitcher className="topbar-lang" variant="app" />
        <button
          type="button"
          className="btn btn-sm topbar-search"
          onClick={onOpenSearch}
          aria-label="بحث"
        >
          <Icon name="search" size={14} />
          <span className="topbar-search-text">ابحث عن أي شيء...</span>
          <span className="kbd topbar-search-kbd">⌘ K</span>
        </button>
        <div className="pill live topbar-cycle">
          <span className="dot" />
          <span className="topbar-cycle-text">دورة 18 · 3 أيام متبقية</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon topbar-cart"
          onClick={() => navigate('/shop/cart')}
          aria-label={cartCount > 0 ? `السلة، ${cartCount} منتج` : 'السلة'}
        >
          <Icon name="cart" size={16} />
          {cartCount > 0 && (
            <span className="topbar-cart-badge" aria-hidden="true">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        <div className="topbar-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="btn btn-ghost btn-icon topbar-bell"
            onClick={() => setShowNotif((v) => !v)}
            aria-label={unread > 0 ? `الإشعارات، ${unread} غير مقروء` : 'الإشعارات'}
            aria-expanded={showNotif}
          >
            <Icon name="bell" size={16} />
            {unread > 0 && (
              <span className="topbar-bell-badge" aria-hidden="true">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotif && (
            <NotificationPanel
              notifications={notifications}
              unread={unread}
              onMarkAllRead={() => markReadMutation.mutate([])}
              onSelect={handleSelectNotification}
              onClose={() => setShowNotif(false)}
            />
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-icon topbar-profile"
          onClick={() => navigate('/profile')}
          aria-label="الملف الشخصي"
          title={user?.name || user?.username}
        >
          <UserAvatar
            src={profileAvatar}
            initials={user?.initials || 'U'}
            size={28}
            fontSize={10}
          />
        </button>

        <button
          type="button"
          className="btn btn-primary topbar-invite"
          onClick={() => navigate('/team/new-referral')}
        >
          <Icon name="plus" size={14} />
          <span className="topbar-invite-text">دعوة عضو</span>
        </button>
      </div>

      {selectedNotifId && (
        <NotificationDetailModal
          notificationId={selectedNotifId}
          onClose={() => setSelectedNotifId(null)}
        />
      )}
    </header>
  )
}

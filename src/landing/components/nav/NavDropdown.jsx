import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useLenis } from '../../providers/SmoothScrollProvider'
import useDropdownPanelPosition from '../../hooks/useDropdownPanelPosition'
import NavAiPanel from './NavAiPanel'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
}

const itemMotion = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
}

function NavItemRow({ item, onNavigate, index = 0 }) {
  const Icon = item.icon
  const content = (
    <motion.span
      className="ld-nav-drop-item-inner"
      variants={itemMotion}
      whileHover={{ x: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <span className="ld-nav-drop-icon">
        <Icon size={18} />
      </span>
      <span className="ld-nav-drop-text">
        <span className="ld-nav-drop-title">
          {item.title}
          {item.badge && <span className="ld-nav-badge">{item.badge}</span>}
        </span>
        <span className="ld-nav-drop-sub">{item.subtitle}</span>
      </span>
    </motion.span>
  )

  if (item.href) {
    return (
      <Link to={item.href} className="ld-nav-drop-item" onClick={onNavigate}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className="ld-nav-drop-item" onClick={() => onNavigate(item.to)}>
      {content}
    </button>
  )
}

function PackageTiers({ tiers }) {
  if (!tiers?.length) return null
  return (
    <div className="ld-nav-tiers">
      {tiers.map((tier) => (
        <div key={tier.num} className="ld-nav-tier">
          <span className="ld-nav-tier-num">{tier.num}</span>
          <span className="ld-nav-tier-label">{tier.label}</span>
          <span className="ld-nav-tier-en">{tier.en}</span>
        </div>
      ))}
    </div>
  )
}

function HubMenu({ menu, onClose, scrollTo, badgeLabel }) {
  const navigate = (target) => {
    onClose()
    if (!target) return
    if (scrollTo) scrollTo(target)
    else document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="ld-nav-hub">
      <div className="ld-nav-hub-main">
        {menu.hubIntro && (
          <header className="ld-nav-hub-intro">
            <h3>{menu.hubIntro.title}</h3>
            <p>{menu.hubIntro.subtitle}</p>
          </header>
        )}
        <PackageTiers tiers={menu.tiers} />
        <motion.div className="ld-nav-hub-groups" variants={stagger} initial="hidden" animate="show">
          {menu.groups?.map((group) => (
            <section key={group.label} className="ld-nav-hub-group" variants={itemMotion}>
              <h4 className="ld-nav-hub-group-label">{group.label}</h4>
              <div className="ld-nav-hub-items">
                {group.items.map((it, i) => (
                  <NavItemRow
                    key={it.title + i}
                    item={{ ...it, badge: it.badge === 'new' ? badgeLabel : it.badge }}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      </div>
      <NavAiPanel panel={menu.aiPanel} onNavigate={navigate} onClose={onClose} />
    </div>
  )
}

function ListMenu({ menu, onClose, handleNav, badgeLabel }) {
  return (
    <div className={menu.aiPanel ? 'ld-nav-list-with-ai' : ''}>
      <div className="ld-nav-list-main">
        {menu.hubIntro && (
          <header className="ld-nav-hub-intro ld-nav-hub-intro--compact">
            <h3>{menu.hubIntro.title}</h3>
            <p>{menu.hubIntro.subtitle}</p>
          </header>
        )}
        <motion.div className="ld-nav-drop-list" variants={stagger} initial="hidden" animate="show">
          {menu.items?.map((item, i) => (
            <motion.div key={item.title + i} variants={itemMotion}>
              <NavItemRow
                item={{
                  ...item,
                  badge: item.badge === 'new' ? badgeLabel : item.badge,
                }}
                onNavigate={() => (item.href ? onClose() : handleNav(item.to))}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
      {menu.aiPanel && (
        <NavAiPanel
          panel={menu.aiPanel}
          onNavigate={(t) => handleNav(t)}
          onClose={onClose}
        />
      )}
    </div>
  )
}

export default function NavDropdown({ menu, badgeLabel, copy }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const { scrollTo } = useLenis() || {}

  const panelVariant =
    menu.variant === 'hub' ? 'hub' : menu.variant === 'list' && menu.aiPanel ? 'hub' : menu.variant === 'list' ? 'list' : 'grid'

  const panelStyle = useDropdownPanelPosition(triggerRef, open, panelVariant)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      const panel = document.getElementById(`ld-panel-${menu.id}`)
      if (panel?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open, menu.id])

  const close = () => setOpen(false)

  const handleNav = (target) => {
    close()
    if (!target) return
    if (scrollTo) scrollTo(target)
    else document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const panelClass = `ld-nav-panel ld-nav-panel--${menu.variant === 'hub' || menu.aiPanel ? 'hub' : menu.variant}`

  const panelContent = (
    <AnimatePresence>
      {open && panelStyle && (
        <motion.div
          id={`ld-panel-${menu.id}`}
          className={panelClass}
          style={panelStyle}
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {menu.variant === 'hub' && (
            <HubMenu menu={menu} badgeLabel={badgeLabel} onClose={close} scrollTo={scrollTo} />
          )}
          {menu.variant === 'list' && (
            <ListMenu menu={menu} onClose={close} handleNav={handleNav} badgeLabel={badgeLabel} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className={`ld-nav-dropdown ${open ? 'ld-nav-dropdown--open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="ld-nav-link ld-nav-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`ld-panel-${menu.id}`}
      >
        {menu.label}
        {menu.badge && <span className="ld-nav-badge">{badgeLabel || copy?.new}</span>}
        <ChevronDown size={14} className="ld-nav-chevron" />
      </button>
      {typeof document !== 'undefined' && createPortal(panelContent, document.body)}
    </div>
  )
}

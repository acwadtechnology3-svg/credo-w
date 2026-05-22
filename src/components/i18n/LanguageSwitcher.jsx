import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { LANGUAGES, useLocale } from '../../i18n/hooks/useLocale.js'

export default function LanguageSwitcher({ className = '', variant = 'landing' }) {
  const { locale, setLocale, lang } = useLocale()
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const [focusIndex, setFocusIndex] = useState(-1)
  const triggerRef = useRef(null)
  const listId = 'credo-lang-menu-portal'

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null)
      return
    }
    const update = () => {
      const rect = triggerRef.current.getBoundingClientRect()
      const pad = 12
      const w = 220
      const isRtl = document.documentElement.dir === 'rtl'
      let left = isRtl ? rect.left : rect.right - w
      left = Math.max(pad, Math.min(left, window.innerWidth - w - pad))
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width: w,
        zIndex: 10000,
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      const menu = document.getElementById(listId)
      if (triggerRef.current?.contains(e.target) || menu?.contains(e.target)) return
      setOpen(false)
      setFocusIndex(-1)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const onKeyDown = useCallback(
    (e) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen(true)
          setFocusIndex(0)
        }
        return
      }
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIndex((i) => (i + 1) % LANGUAGES.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIndex((i) => (i <= 0 ? LANGUAGES.length - 1 : i - 1))
      } else if (e.key === 'Enter' && focusIndex >= 0) {
        e.preventDefault()
        setLocale(LANGUAGES[focusIndex].code)
        setOpen(false)
      }
    },
    [open, focusIndex, setLocale]
  )

  const menu = (
    <AnimatePresence>
      {open && menuStyle && (
        <motion.ul
          id={listId}
          className={`ld-lang-menu ld-lang-menu--portal ${variant === 'app' ? 'ld-lang-menu--app' : ''}`}
          role="listbox"
          aria-label="Language"
          style={menuStyle}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
        >
          {LANGUAGES.map((item, idx) => (
            <li key={item.code} role="option" aria-selected={locale === item.code}>
              <button
                type="button"
                className={`ld-lang-option ${locale === item.code ? 'ld-lang-option--active' : ''}`}
                tabIndex={focusIndex === idx ? 0 : -1}
                onClick={() => {
                  setLocale(item.code)
                  setOpen(false)
                }}
              >
                <span className="ld-lang-flag">{item.flag}</span>
                <span className="ld-lang-option-label">{item.label}</span>
                <span className="ld-lang-option-name">{item.name}</span>
              </button>
            </li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  )

  return (
    <div className={`ld-lang-switch ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`ld-lang-trigger ${open ? 'ld-lang-trigger--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span className="ld-lang-flag" aria-hidden>
          {lang.flag}
        </span>
        <span className="ld-lang-code">{lang.label}</span>
        <ChevronDown size={14} className="ld-lang-chevron" />
      </button>
      {typeof document !== 'undefined' && createPortal(menu, document.body)}
    </div>
  )
}

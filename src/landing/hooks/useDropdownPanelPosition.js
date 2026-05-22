import { useLayoutEffect, useState } from 'react'

const WIDTHS = { list: 360, grid: 520, mega: 680, hub: 920 }

export default function useDropdownPanelPosition(triggerRef, open, variant = 'list') {
  const [style, setStyle] = useState(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setStyle(null)
      return
    }

    const update = () => {
      const el = triggerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const pad = 12
      const vw = window.innerWidth
      const vh = window.innerHeight
      const maxW = Math.min(WIDTHS[variant] || 320, vw - pad * 2)

      let left = rect.left + rect.width / 2 - maxW / 2
      left = Math.max(pad, Math.min(left, vw - maxW - pad))

      const top = rect.bottom + 8
      const maxH = Math.min(vh * 0.75, vh - top - pad)

      setStyle({
        position: 'fixed',
        top,
        left,
        width: maxW,
        maxHeight: maxH,
        overflowY: 'auto',
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
  }, [open, variant, triggerRef])

  return style
}

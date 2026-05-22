import { useEffect, useRef } from 'react'
import usePrefersReducedMotion from './usePrefersReducedMotion'

export default function useMouseGlow(enabled = true) {
  const ref = useRef(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!enabled || reduced) return
    const el = ref.current
    if (!el) return

    let raf = 0
    let x = 0
    let y = 0
    let tx = 0
    let ty = 0

    const onMove = (e) => {
      tx = e.clientX
      ty = e.clientY
      if (!raf) {
        raf = requestAnimationFrame(() => {
          x += (tx - x) * 0.12
          y += (ty - y) * 0.12
          el.style.transform = `translate(${x - 200}px, ${y - 200}px)`
          raf = 0
        })
      }
    }

    const onLeave = () => {
      el.style.opacity = '0'
    }
    const onEnter = () => {
      el.style.opacity = '1'
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [enabled, reduced])

  return ref
}

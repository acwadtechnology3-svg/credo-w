import { useCallback, useRef } from 'react'
import usePrefersReducedMotion from './usePrefersReducedMotion'

export default function useMagnetic(strength = 0.35) {
  const ref = useRef(null)
  const reduced = usePrefersReducedMotion()

  const onMouseMove = useCallback(
    (e) => {
      if (reduced || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) * strength
      const dy = (e.clientY - cy) * strength
      ref.current.style.transform = `translate(${dx}px, ${dy}px)`
    },
    [strength, reduced]
  )

  const onMouseLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)'
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}

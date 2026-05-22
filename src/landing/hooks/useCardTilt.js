import { useCallback, useRef } from 'react'

/** Subtle 3D tilt from pointer position (respects reduced motion via caller). */
export default function useCardTilt(intensity = 8) {
  const ref = useRef(null)

  const onMove = useCallback(
    (e) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el.style.setProperty('--tilt-x', `${-y * intensity}deg`)
      el.style.setProperty('--tilt-y', `${x * intensity}deg`)
    },
    [intensity]
  )

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }, [])

  return { ref, onMove, onLeave }
}

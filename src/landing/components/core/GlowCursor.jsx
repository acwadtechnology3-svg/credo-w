import useMouseGlow from '../../hooks/useMouseGlow'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

export default function GlowCursor() {
  const reduced = usePrefersReducedMotion()
  const ref = useMouseGlow(!reduced)

  if (reduced) return null

  return <div ref={ref} className="ld-glow-cursor" aria-hidden />
}

import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

/** Lightweight CSS particles — scales with tier power (1–3). */
export default function PackageParticles({ power = 1 }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return null

  const count = power === 1 ? 6 : power === 2 ? 14 : 24

  return (
    <div className={`ld-pkg-particles ld-pkg-particles--p${power}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="ld-pkg-particle"
          style={{
            '--i': i,
            '--x': `${(i * 17 + 11) % 100}%`,
            '--y': `${(i * 23 + 7) % 100}%`,
            '--d': `${2 + (i % 5) * 0.4}s`,
            '--delay': `${(i % 8) * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}

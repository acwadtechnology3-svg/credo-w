import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SectionHeader from '../components/core/SectionHeader'
import Reveal from '../components/core/Reveal'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

const NODES = [
  { x: 50, y: 15, r: 8 },
  { x: 25, y: 35, r: 6 },
  { x: 75, y: 35, r: 6 },
  { x: 15, y: 60, r: 5 },
  { x: 50, y: 55, r: 10 },
  { x: 85, y: 60, r: 5 },
  { x: 35, y: 82, r: 5 },
  { x: 65, y: 82, r: 5 },
]

const EDGES = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7],
]

export default function NetworkSection() {
  const svgRef = useRef(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced || !svgRef.current) return
    const lines = svgRef.current.querySelectorAll('.net-line')
    const st = gsap.fromTo(
      lines,
      { strokeDashoffset: 200 },
      {
        strokeDashoffset: 0,
        duration: 1.5,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: svgRef.current,
          start: 'top 75%',
          id: 'network-lines',
        },
      }
    )
    return () => st.scrollTrigger?.kill()
  }, [reduced])

  return (
    <section className="ld-section">
      <SectionHeader
        eyebrow="الشبكة"
        title="شجرة ثنائية — مرئية وحية"
        titleEn="Tree & Network Visualization"
        subtitle="تتبع placement، enroller tree، وحجم الأعمال في واجهة تنظيم حية."
        align="center"
      />
      <div className="ld-container">
        <Reveal>
          <div className="ld-network-wrap ld-glass">
            <svg
              ref={svgRef}
              viewBox="0 0 100 100"
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              aria-hidden
            >
              <defs>
                <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              {EDGES.map(([a, b], i) => {
                const n1 = NODES[a]
                const n2 = NODES[b]
                return (
                  <line
                    key={i}
                    className="net-line"
                    x1={n1.x}
                    y1={n1.y}
                    x2={n2.x}
                    y2={n2.y}
                    stroke="url(#netGrad)"
                    strokeWidth="0.4"
                    strokeDasharray="200"
                    opacity="0.5"
                  />
                )
              })}
              {NODES.map((n, i) => (
                <circle
                  key={i}
                  cx={n.x}
                  cy={n.y}
                  r={n.r / 10}
                  fill={i === 4 ? '#a855f7' : 'rgba(196,184,255,0.6)'}
                  style={{ filter: i === 4 ? 'drop-shadow(0 0 8px #a855f7)' : undefined }}
                />
              ))}
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: 24,
                right: 24,
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {['Placement Tree', 'Enroller Tree', 'Live Organization'].map((label) => (
                <span key={label} className="ld-tag">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

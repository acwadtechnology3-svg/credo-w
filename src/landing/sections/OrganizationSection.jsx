import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { ORG_FEATURES, GROWTH_STEPS } from '../data/content'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

const NODES = [
  { x: 50, y: 12, r: 9 },
  { x: 28, y: 32, r: 6 },
  { x: 72, y: 32, r: 6 },
  { x: 18, y: 58, r: 5 },
  { x: 50, y: 52, r: 10 },
  { x: 82, y: 58, r: 5 },
  { x: 36, y: 82, r: 5 },
  { x: 64, y: 82, r: 5 },
]
const EDGES = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7]]

export default function OrganizationSection() {
  const svgRef = useRef(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced || !svgRef.current) return
    const lines = svgRef.current.querySelectorAll('.net-line')
    const st = gsap.fromTo(
      lines,
      { strokeDashoffset: 180 },
      {
        strokeDashoffset: 0,
        duration: 1.2,
        stagger: 0.06,
        ease: 'power2.out',
        scrollTrigger: { trigger: svgRef.current, start: 'top 78%', id: 'org-net' },
      }
    )
    return () => st.scrollTrigger?.kill()
  }, [reduced])

  return (
    <SectionShell id="organization" glow="subtle" beat="شاهد النظام">
      <SectionHeader
        eyebrow="التنظيم الرقمي"
        title="منظمة متصلة — مرئية لحظيًا"
        titleEn="Connected Organization System"
        subtitle="فرق، وكالات، ومؤشرات نمو في طبقة تنظيم واحدة — بدون تعقيد تشغيلي."
        align="center"
      />

      <div className="ld-container">
        <Reveal>
          <div
            className="ld-glass"
            style={{
              position: 'relative',
              height: 320,
              marginBottom: 40,
              overflow: 'hidden',
            }}
          >
            <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden>
              <defs>
                <linearGradient id="orgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                    stroke="url(#orgGrad)"
                    strokeWidth="0.35"
                    strokeDasharray="180"
                    opacity="0.45"
                  />
                )
              })}
              {NODES.map((n, i) => (
                <circle
                  key={i}
                  cx={n.x}
                  cy={n.y}
                  r={n.r / 10}
                  fill={i === 4 ? '#a855f7' : 'rgba(196,184,255,0.55)'}
                />
              ))}
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                insetInline: 16,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
              }}
            >
              {ORG_FEATURES.map((f) => (
                <span key={f.label} className="ld-pill-tag">
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="ld-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {GROWTH_STEPS.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.08}>
              <article className="ld-card ld-card--dense">
                <span className="ld-gradient-text" style={{ fontSize: 28, fontWeight: 900, opacity: 0.4 }}>
                  {step.step}
                </span>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: '8px 0' }}>{step.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--ld-text-muted)', lineHeight: 1.65, margin: 0 }}>
                  {step.desc}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

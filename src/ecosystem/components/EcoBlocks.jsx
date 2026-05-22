import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock } from 'lucide-react'
import SectionShell from '../../landing/components/core/SectionShell'
import SectionHeader from '../../landing/components/core/SectionHeader'
import Reveal from '../../landing/components/core/Reveal'
import useGateAction from '../hooks/useGateAction'
import { EcoExtendedRenderer } from './EcoExtendedBlocks'
import EcoWhyCredoSection from './EcoWhyCredoSection'

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export function EcoPageHero({ hero, dir }) {
  if (!hero) return null
  return (
    <section className="eco-hero">
      <div className="eco-hero-bg" aria-hidden />
      <motion.div className="eco-hero-inner" dir={dir} initial="hidden" animate="show" variants={fade}>
        {hero.eyebrow && <p className="eco-eyebrow">{hero.eyebrow}</p>}
        <h1 className="eco-hero-title">{hero.title}</h1>
        <p className="eco-hero-sub">{hero.subtitle}</p>
        {hero.actions?.length > 0 && (
          <div className="eco-hero-actions">
            {hero.actions.map((a) => (
              <EcoCta key={a.label} action={a} size="lg" />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  )
}

export function EcoCta({ action, size = 'md' }) {
  const { gate } = useGateAction()
  const cls = size === 'lg' ? 'ld-btn-primary' : 'ld-btn-ghost eco-cta-sm'

  if (action.href && !action.requiresAuth) {
    return (
      <Link to={action.href} className={cls}>
        {action.label}
        <ArrowLeft size={14} />
      </Link>
    )
  }

  const onClick = () => gate(action.href || '/start', { requiresAuth: action.requiresAuth, message: action.gateMessage })

  return (
    <button type="button" className={cls} onClick={onClick}>
      {action.requiresAuth && <Lock size={14} />}
      {action.label}
      <ArrowLeft size={14} />
    </button>
  )
}

export function EcoFlowSection({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <ol className="eco-flow">
          {section.steps.map((step, i) => (
            <li key={step.title} className="eco-flow-step">
              <span className="eco-flow-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </SectionShell>
  )
}

export function EcoGridSection({ section, id }) {
  return (
    <SectionShell id={id} glow={section.glow}>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className={`eco-grid eco-grid--${section.columns || 3}`}>
          {section.items.map((item) => (
            <article key={item.title} className="eco-card">
              {item.tag && <span className="eco-card-tag">{item.tag}</span>}
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              {item.bullets?.length > 0 && (
                <ul>
                  {item.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoPhilosophySection({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <div className="eco-philosophy">
          <SectionHeader title={section.title} subtitle={section.subtitle} align="center" />
          <p className="eco-philosophy-lead">{section.lead}</p>
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoCtaBand({ section, id }) {
  return (
    <SectionShell id={id}>
      <Reveal>
        <div className="eco-cta-band">
          <h2>{section.title}</h2>
          <p>{section.subtitle}</p>
          <div className="eco-cta-band-actions">
            {section.actions.map((a) => (
              <EcoCta key={a.label} action={a} size="lg" />
            ))}
          </div>
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoFaqSection({ section, id, search }) {
  const q = (search || '').trim().toLowerCase()
  const items = section.items.filter(
    (item) =>
      !q ||
      item.q.toLowerCase().includes(q) ||
      item.a.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
  )

  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-faq-list">
          {items.map((item) => (
            <details key={item.q} className="eco-faq-item">
              <summary>
                {item.category && <span className="eco-faq-cat">{item.category}</span>}
                {item.q}
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoTiersStrip({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <div className="eco-tiers-strip">
          {section.tiers.map((tier) => (
            <div key={tier.num} className="eco-tier-pill">
              <span className="eco-tier-num">{tier.num}</span>
              <strong>{tier.label}</strong>
              <span>{tier.hint}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoNextChapter({ section }) {
  if (!section?.links?.length) return null
  return (
    <SectionShell compact>
      <Reveal>
        <div className="eco-next">
          <p className="eco-next-label">{section.label}</p>
          <div className="eco-next-links">
            {section.links.map((link) => (
              <Link key={link.href} to={link.href} className="eco-next-link">
                <span>{link.title}</span>
                <small>{link.subtitle}</small>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </SectionShell>
  )
}

const EXTENDED_TYPES = new Set([
  'visual-map', 'split', 'package-cards', 'compare-table', 'journey-visual',
  'join-methods', 'featured-agencies', 'timeline', 'founder', 'voice-demo',
  'stats', 'activity-feed', 'leaderboard', 'calculator', 'tutorials',
  'support-channels', 'faq-groups', 'academy-tracks', 'rich',
])

export function EcoSectionRenderer({ section, search }) {
  const id = section.id
  if (EXTENDED_TYPES.has(section.type)) {
    return <EcoExtendedRenderer section={section} search={search} />
  }
  switch (section.type) {
    case 'flow':
      return <EcoFlowSection section={section} id={id} />
    case 'grid':
      return <EcoGridSection section={section} id={id} />
    case 'why-credo':
      return <EcoWhyCredoSection section={section} id={id} />
    case 'philosophy':
      return <EcoPhilosophySection section={section} id={id} />
    case 'cta':
      return <EcoCtaBand section={section} id={id} />
    case 'faq':
      return <EcoFaqSection section={section} id={id} search={search} />
    case 'tiers':
      return <EcoTiersStrip section={section} id={id} />
    case 'next':
      return <EcoNextChapter section={section} />
    default:
      return null
  }
}

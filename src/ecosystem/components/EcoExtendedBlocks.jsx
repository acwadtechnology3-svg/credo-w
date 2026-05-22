import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bot,
  Building2,
  Gem,
  GraduationCap,
  Users,
  Package,
  Wallet,
  Mic,
  Play,
  QrCode,
  UserPlus,
  GitBranch,
  Shield,
  MessageCircle,
  Ticket,
  Video,
  Headphones,
} from 'lucide-react'
import SectionShell from '../../landing/components/core/SectionShell'
import SectionHeader from '../../landing/components/core/SectionHeader'
import Reveal from '../../landing/components/core/Reveal'
import { EcoCta } from './EcoBlocks'

const ICONS = {
  ai: Bot,
  agencies: Building2,
  rewards: Gem,
  academy: GraduationCap,
  community: Users,
  packages: Package,
  wallet: Wallet,
  onboarding: UserPlus,
}

export function EcoVisualMap({ section, id }) {
  const nodes = section.nodes || []
  return (
    <SectionShell id={id} glow="focal">
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-visual-map">
          <div className="eco-visual-map-core">
            <span className="eco-visual-map-core-label">Credo W</span>
            <span className="eco-visual-map-core-sub">منظومة متصلة</span>
          </div>
          {nodes.map((node, i) => {
            const Icon = ICONS[node.icon] || Bot
            return (
              <motion.div
                key={node.id}
                className={`eco-visual-node eco-visual-node--${i + 1}`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="eco-visual-node-icon">
                  <Icon size={20} />
                </span>
                <strong>{node.title}</strong>
                <small>{node.text}</small>
              </motion.div>
            )
          })}
          <svg className="eco-visual-lines" aria-hidden viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth="1" />
          </svg>
        </div>
        {section.note && <p className="eco-section-note">{section.note}</p>}
      </Reveal>
    </SectionShell>
  )
}

export function EcoSplitSection({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <div className={`eco-split ${section.reverse ? 'eco-split--reverse' : ''}`}>
          <div className="eco-split-content">
            <SectionHeader title={section.title} subtitle={section.subtitle} align="start" size="md" />
            {section.paragraphs?.map((p) => (
              <p key={p.slice(0, 24)} className="eco-split-p">
                {p}
              </p>
            ))}
            {section.bullets?.length > 0 && (
              <ul className="eco-split-bullets">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {section.actions?.map((a) => (
              <EcoCta key={a.label} action={a} />
            ))}
          </div>
          <div className="eco-split-panel">
            {section.panelTitle && <h3>{section.panelTitle}</h3>}
            {section.panelItems?.map((item) => (
              <div key={item.label} className="eco-split-panel-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
            {section.panelQuote && <blockquote className="eco-split-quote">{section.panelQuote}</blockquote>}
          </div>
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoPackageCards({ section, id }) {
  return (
    <SectionShell id={id}>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-package-cards">
          {section.packages.map((pkg) => (
            <article key={pkg.tier} className={`eco-package-card eco-package-card--${pkg.tier}`}>
              <div className="eco-package-card-head">
                <span className="eco-package-card-tier">{pkg.tier}</span>
                <h3>{pkg.name}</h3>
                <p>{pkg.tagline}</p>
              </div>
              <ul className="eco-package-card-specs">
                {pkg.specs.map((s) => (
                  <li key={s.label}>
                    <span>{s.label}</span>
                    <strong>{s.value}</strong>
                  </li>
                ))}
              </ul>
              <div className="eco-package-card-unlocks">
                <span className="eco-package-card-unlocks-label">ما يُفتح</span>
                <div className="eco-package-card-tags">
                  {pkg.unlocks.map((u) => (
                    <span key={u}>{u}</span>
                  ))}
                </div>
              </div>
              <EcoCta action={pkg.cta} size="md" />
            </article>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoCompareTable({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-table-wrap">
          <table className="eco-table">
            <thead>
              <tr>
                {section.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  {row.values.map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoJourneyVisual({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-journey-visual">
          {section.stages.map((stage, i) => (
            <div key={stage.tier} className="eco-journey-stage">
              <span className="eco-journey-tier">{stage.tier}</span>
              <h4>{stage.title}</h4>
              <p>{stage.text}</p>
              {i < section.stages.length - 1 && <span className="eco-journey-arrow">→</span>}
            </div>
          ))}
        </div>
        {section.note && <p className="eco-section-note">{section.note}</p>}
      </Reveal>
    </SectionShell>
  )
}

export function EcoJoinMethods({ section, id }) {
  const icons = { code: QrCode, sponsor: UserPlus, id: Building2, qr: QrCode }
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-join-methods">
          {section.methods.map((m) => {
            const Icon = icons[m.icon] || UserPlus
            return (
              <div key={m.title} className="eco-join-method">
                <Icon size={22} />
                <h4>{m.title}</h4>
                <p>{m.text}</p>
                {m.example && <code className="eco-join-example">{m.example}</code>}
              </div>
            )
          })}
        </div>
        {section.note && <p className="eco-section-note">{section.note}</p>}
      </Reveal>
    </SectionShell>
  )
}

export function EcoFeaturedAgencies({ section, id }) {
  return (
    <SectionShell id={id}>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-agency-cards">
          {section.agencies.map((a) => (
            <article key={a.name} className="eco-agency-card">
              <div className="eco-agency-card-logo">{a.initials}</div>
              <h3>{a.name}</h3>
              <p className="eco-agency-founder">المؤسس: {a.founder}</p>
              <div className="eco-agency-stats">
                <div>
                  <span>النمو</span>
                  <strong>{a.growth}</strong>
                </div>
                <div>
                  <span>الإنجازات</span>
                  <strong>{a.achievements}</strong>
                </div>
                <div>
                  <span>النشاط</span>
                  <strong className="eco-live-dot">{a.activity}</strong>
                </div>
              </div>
              <p className="eco-agency-card-desc">{a.desc}</p>
            </article>
          ))}
        </div>
        <p className="eco-section-note">{section.previewNote}</p>
      </Reveal>
    </SectionShell>
  )
}

export function EcoTimeline({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <ol className="eco-timeline">
          {section.events.map((ev) => (
            <li key={ev.year} className="eco-timeline-item">
              <span className="eco-timeline-year">{ev.year}</span>
              <div>
                <h4>{ev.title}</h4>
                <p>{ev.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </SectionShell>
  )
}

export function EcoFounderMessage({ section, id }) {
  return (
    <SectionShell id={id} glow="subtle">
      <Reveal>
        <div className="eco-founder">
          <div className="eco-founder-avatar">{section.initials}</div>
          <div>
            <p className="eco-eyebrow">{section.role}</p>
            <h3 className="eco-founder-name">{section.name}</h3>
            <p className="eco-founder-quote">"{section.message}"</p>
            <p className="eco-founder-sign">{section.signature}</p>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoVoiceDemo({ section, id }) {
  const [active, setActive] = useState(false)
  return (
    <SectionShell id={id} glow="focal">
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-voice-demo">
          <button
            type="button"
            className={`eco-voice-orb-btn ${active ? 'is-active' : ''}`}
            onClick={() => setActive((v) => !v)}
            aria-label="تجربة صوتية"
          >
            <Mic size={28} />
            <span className="eco-voice-orb-ring" />
          </button>
          <div className="eco-voice-demo-text">
            <p>{active ? section.activeText : section.idleText}</p>
            <ul>
              {section.prompts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="eco-section-note">{section.note}</p>
            <Link to="/ai" className="ld-btn-ghost eco-cta-sm">
              المزيد عن Credo AI
            </Link>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoStatsStrip({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <div className="eco-stats">
          {section.stats.map((s) => (
            <div key={s.label} className="eco-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
              {s.hint && <small>{s.hint}</small>}
            </div>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoActivityFeed({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <ul className="eco-activity-feed">
          {section.items.map((item) => (
            <li key={item.text} className="eco-activity-item">
              <span className="eco-activity-type">{item.type}</span>
              <p>{item.text}</p>
              <time>{item.time}</time>
            </li>
          ))}
        </ul>
        <p className="eco-section-note">{section.note}</p>
      </Reveal>
    </SectionShell>
  )
}

export function EcoLeaderboard({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <ol className="eco-leaderboard">
          {section.entries.map((e, i) => (
            <li key={e.name} className="eco-leaderboard-row">
              <span className="eco-leaderboard-rank">{i + 1}</span>
              <span className="eco-leaderboard-name">{e.name}</span>
              <span className="eco-leaderboard-metric">{e.metric}</span>
            </li>
          ))}
        </ol>
      </Reveal>
    </SectionShell>
  )
}

export function EcoRewardCalculator({ section, id }) {
  const [tier, setTier] = useState('3')
  const [team, setTeam] = useState(5)
  const estimate = useMemo(() => {
    const base = { 1: 120, 3: 450, 7: 1200 }[tier] || 0
    return Math.round(base + team * (tier === '7' ? 85 : tier === '3' ? 40 : 15))
  }, [tier, team])

  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-calculator">
          <label>
            طبقة الباقة
            <select value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="1">أحادي (1)</option>
              <option value="3">ثلاثي (3)</option>
              <option value="7">سباعي (7)</option>
            </select>
          </label>
          <label>
            حجم الفريق النشط (تقديري)
            <input type="range" min={0} max={50} value={team} onChange={(e) => setTeam(Number(e.target.value))} />
            <span>{team} عضو</span>
          </label>
          <div className="eco-calculator-result">
            <span>تقدير شهري للمكافآت (معاينة تعليمية)</span>
            <strong>{estimate.toLocaleString('ar-EG')} C Money</strong>
          </div>
          <p className="eco-section-note">{section.disclaimer}</p>
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoTutorialsGrid({ section, id }) {
  const icons = { video: Video, voice: Headphones, chat: MessageCircle }
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-tutorials">
          {section.items.map((item) => {
            const Icon = icons[item.type] || Play
            return (
              <article key={item.title} className="eco-tutorial-card">
                <Icon size={22} />
                <h4>{item.title}</h4>
                <p>{item.text}</p>
                <span className="eco-tutorial-duration">{item.duration}</span>
              </article>
            )
          })}
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoSupportChannels({ section, id }) {
  const icons = { ticket: Ticket, chat: MessageCircle, voice: Mic, mail: MessageCircle }
  return (
    <SectionShell id={id}>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-support-grid">
          {section.channels.map((ch) => {
            const Icon = icons[ch.icon] || MessageCircle
            return (
              <div key={ch.title} className="eco-support-channel">
                <Icon size={22} />
                <h4>{ch.title}</h4>
                <p>{ch.text}</p>
                {ch.availability && <span className="eco-support-avail">{ch.availability}</span>}
              </div>
            )
          })}
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoFaqGroups({ section, id, search }) {
  const q = (search || '').trim().toLowerCase()
  return (
    <SectionShell id={id} compact>
      <Reveal>
        {section.groups.map((group) => {
          const items = group.items.filter(
            (item) =>
              !q ||
              item.q.toLowerCase().includes(q) ||
              item.a.toLowerCase().includes(q) ||
              group.title.toLowerCase().includes(q)
          )
          if (!items.length) return null
          return (
            <div key={group.title} className="eco-faq-group">
              <h3 className="eco-faq-group-title">{group.title}</h3>
              <div className="eco-faq-list">
                {items.map((item) => (
                  <details key={item.q} className="eco-faq-item">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )
        })}
      </Reveal>
    </SectionShell>
  )
}

export function EcoAcademyTracks({ section, id }) {
  return (
    <SectionShell id={id}>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-academy-tracks">
          {section.tracks.map((track) => (
            <article key={track.title} className="eco-academy-track">
              <div className="eco-academy-track-head">
                <h3>{track.title}</h3>
                <span>{track.levels} مستويات</span>
              </div>
              <p>{track.desc}</p>
              <div className="eco-academy-progress">
                <span style={{ width: `${track.progressPreview}%` }} />
              </div>
              <ul>
                {track.modules.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              {track.certificate && <span className="eco-academy-cert">🎓 {track.certificate}</span>}
            </article>
          ))}
        </div>
        {section.gamificationNote && <p className="eco-section-note">{section.gamificationNote}</p>}
      </Reveal>
    </SectionShell>
  )
}

export function EcoRichSection({ section, id }) {
  return (
    <SectionShell id={id} compact>
      <Reveal>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="eco-rich">
          {section.blocks.map((block) => (
            <div key={block.heading} className="eco-rich-block">
              <h3>{block.heading}</h3>
              {block.paragraphs?.map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
              {block.list?.length > 0 && (
                <ul>
                  {block.list.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  )
}

export function EcoExtendedRenderer({ section, search }) {
  const id = section.id
  const props = { section, id, search }
  switch (section.type) {
    case 'visual-map':
      return <EcoVisualMap {...props} />
    case 'split':
      return <EcoSplitSection {...props} />
    case 'package-cards':
      return <EcoPackageCards {...props} />
    case 'compare-table':
      return <EcoCompareTable {...props} />
    case 'journey-visual':
      return <EcoJourneyVisual {...props} />
    case 'join-methods':
      return <EcoJoinMethods {...props} />
    case 'featured-agencies':
      return <EcoFeaturedAgencies {...props} />
    case 'timeline':
      return <EcoTimeline {...props} />
    case 'founder':
      return <EcoFounderMessage {...props} />
    case 'voice-demo':
      return <EcoVoiceDemo {...props} />
    case 'stats':
      return <EcoStatsStrip {...props} />
    case 'activity-feed':
      return <EcoActivityFeed {...props} />
    case 'leaderboard':
      return <EcoLeaderboard {...props} />
    case 'calculator':
      return <EcoRewardCalculator {...props} />
    case 'tutorials':
      return <EcoTutorialsGrid {...props} />
    case 'support-channels':
      return <EcoSupportChannels {...props} />
    case 'faq-groups':
      return <EcoFaqGroups {...props} />
    case 'academy-tracks':
      return <EcoAcademyTracks {...props} />
    case 'rich':
      return <EcoRichSection {...props} />
    default:
      return null
  }
}

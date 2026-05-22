import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'

export default function NavAiPanel({ panel, onNavigate, onClose }) {
  if (!panel) return null

  const handleCta = () => {
    onClose?.()
    if (panel.href) return
    onNavigate?.(panel.to)
  }

  const CtaWrap = panel.href ? Link : 'button'
  const ctaProps = panel.href
    ? { to: panel.href, className: 'ld-btn-primary ld-nav-cta ld-nav-ai-cta', onClick: onClose }
    : { type: 'button', className: 'ld-btn-primary ld-nav-cta ld-nav-ai-cta', onClick: handleCta }

  return (
    <motion.aside
      className="ld-nav-ai-panel"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
    >
      <div className="ld-nav-ai-orb" aria-hidden>
        <Bot size={22} />
        <span className="ld-nav-ai-orb-ring" />
      </div>
      <span className="ld-nav-ai-tag">
        <Sparkles size={12} />
        {panel.tag}
      </span>
      <h4 className="ld-nav-ai-title">{panel.title}</h4>
      <p className="ld-nav-ai-desc">{panel.desc}</p>
      <ul className="ld-nav-ai-prompts">
        {panel.prompts?.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <CtaWrap {...ctaProps}>{panel.cta}</CtaWrap>
    </motion.aside>
  )
}

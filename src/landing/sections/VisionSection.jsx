import { motion } from 'framer-motion'
import { Zap, Users, Shield, TrendingUp, Sparkles, Globe } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell, { SectionDivider } from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { useLandingCopy } from '../../i18n/hooks/useLandingCopy'

const ICON_MAP = { zap: Zap, users: Users, shield: Shield, trending: TrendingUp, sparkles: Sparkles, globe: Globe }

export default function VisionSection() {
  const { vision } = useLandingCopy()
  return (
    <SectionShell id="vision" beat="افهم الرؤية">
      <SectionHeader
        eyebrow="الرؤية"
        title={vision.title}
        titleEn={vision.titleEn}
        subtitle={vision.subtitle}
        align="center"
      />
      <div className="ld-container">
        <div className="ld-split">
          <div className="ld-split-visual">
            <motion.div
              style={{
                width: 96,
                height: 96,
                borderRadius: 20,
                background: 'var(--ld-gradient-primary)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 40,
                fontWeight: 900,
                boxShadow: '0 0 48px rgba(168,85,247,0.35)',
              }}
              animate={{ boxShadow: ['0 0 40px rgba(168,85,247,0.3)', '0 0 64px rgba(236,72,153,0.35)', '0 0 40px rgba(168,85,247,0.3)'] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              W
            </motion.div>
          </div>
          <div className="ld-split-content">
            <Reveal>
              <span className="ld-pill-tag">CREDO VISION</span>
              <h3 className="ld-heading-md" style={{ marginTop: 16, marginBottom: 12 }}>
                طبقة واحدة. <span className="ld-gradient-text">منظومة كاملة.</span>
              </h3>
              <p className="ld-body" style={{ marginBottom: 20, maxWidth: 'none' }}>
                كل أداة مصممة لتعمل مع الأخرى — قيادة، توسع، ومكافآت في تجربة متصلة.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {vision.tags.map((tag) => {
                  const Icon = ICON_MAP[tag.icon] || Zap
                  return (
                    <span key={tag.label} className="ld-pill-tag" style={{ textTransform: 'none', letterSpacing: 0 }}>
                      <Icon size={12} />
                      {tag.label}
                    </span>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
      <SectionDivider />
    </SectionShell>
  )
}

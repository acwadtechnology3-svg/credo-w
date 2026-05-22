import { Wallet, Gem, ArrowDownToLine, Percent } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { useLandingCopy } from '../../i18n/hooks/useLandingCopy'

const ICONS = [Wallet, Gem, ArrowDownToLine, Percent]

export default function RewardsSection() {
  const { rewards } = useLandingCopy()
  return (
    <SectionShell id="rewards" beat="افهم المكافآت" compact>
      <SectionHeader
        eyebrow="منظومة المكافآت"
        title="بنية مالية فاخرة"
        titleEn="Rewards & Finance Infrastructure"
        subtitle="محفظة، ولاء، سحب، ومكافآت توسع — شفافية بمستوى مؤسسي."
        align="center"
      />
      <div className="ld-container ld-grid-4">
        {rewards.map((w, i) => {
          const Icon = ICONS[i]
          return (
            <Reveal key={w.label} delay={i * 0.08}>
              <article className="ld-card ld-metric-card">
                <div className="ld-icon-ring" style={{ margin: '0 auto 12px' }}>
                  <Icon size={20} color="#c4b8ff" />
                </div>
                <div className="ld-metric-value" style={{ fontSize: '1.25rem' }}>
                  {w.label}
                </div>
                <p className="ld-metric-label">{w.value}</p>
              </article>
            </Reveal>
          )
        })}
      </div>
    </SectionShell>
  )
}

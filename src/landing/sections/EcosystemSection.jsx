import { Layers, Building2, Brain } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell, { SectionDivider } from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { useLandingCopy } from '../../i18n/hooks/useLandingCopy'
import { useTranslation } from 'react-i18next'

const ICONS = { layers: Layers, building: Building2, brain: Brain }
const LAYER_ICONS = [Layers, Building2, Brain]

export default function EcosystemSection() {
  const { ecosystemLayers, storyBeats } = useLandingCopy()
  const { t } = useTranslation('landing')
  const sec = t('sections.ecosystem', { returnObjects: true })

  return (
    <SectionShell id="ecosystem" beat={storyBeats[1] || sec.beat}>
      <SectionHeader
        eyebrow={sec.eyebrow}
        title={sec.title}
        titleEn={sec.titleEn}
        subtitle={sec.subtitle}
        align="center"
      />
      <div className="ld-container ld-grid-3">
        {ecosystemLayers.map((card, i) => {
          const Icon = (card.icon && ICONS[card.icon]) || LAYER_ICONS[i] || Layers
          return (
            <Reveal key={card.title} delay={i * 0.1}>
              <article className="ld-card ld-card--dense">
                <div className="ld-icon-ring">
                  <Icon size={20} color="#c4b8ff" />
                </div>
                <h3 className="ld-heading-md" style={{ fontSize: 17, marginBottom: 6 }}>
                  {card.title}
                </h3>
                <p className="ld-en-sub" style={{ textAlign: 'start', marginBottom: 10 }}>
                  {card.en}
                </p>
                <p className="ld-body" style={{ maxWidth: 'none', fontSize: 14 }}>
                  {card.desc}
                </p>
              </article>
            </Reveal>
          )
        })}
      </div>
      <SectionDivider />
    </SectionShell>
  )
}

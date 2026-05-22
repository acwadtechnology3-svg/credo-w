import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { useLandingCopy } from '../../i18n/hooks/useLandingCopy'

export default function LeadershipSection() {
  const { leadershipPillars } = useLandingCopy()
  return (
    <SectionShell id="leadership" compact>
      <SectionHeader
        eyebrow="نظام القيادة"
        title="بنية قيادة ذكية"
        titleEn="Smart Leadership Infrastructure"
        subtitle="أدوات قرار، فرق متصلة، ونجاح جماعي — للمؤسسين الرقميين الطموحين."
        align="center"
      />
      <div className="ld-container ld-grid-3">
        {leadershipPillars.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <article className="ld-card">
              <span className="ld-eyebrow" style={{ marginBottom: 12 }}>
                0{i + 1}
              </span>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{p.title}</h3>
              <p className="ld-body" style={{ maxWidth: 'none', fontSize: 14 }}>
                {p.desc}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

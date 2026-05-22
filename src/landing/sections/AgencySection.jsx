import { Building2, Trophy, Users } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import Reveal from '../components/core/Reveal'
import { MagneticLink } from '../components/core/MagneticButton'

const ITEMS = [
  { icon: Building2, title: 'وكالات رقمية', desc: 'اكتشف أو أطلق وكالة بملف احترافي ولوحة قيادة.' },
  { icon: Users, title: 'فرق متصلة', desc: 'تنظيم حي، طلبات انضمام، ومؤشرات فريق.' },
  { icon: Trophy, title: 'توسع تنافسي', desc: 'لوحة متصدرين شفافة بين الوكالات.' },
]

export default function AgencySection() {
  return (
    <SectionShell id="agencies" compact>
      <SectionHeader
        eyebrow="الوكالات"
        title="طبقة وكالات للنمو الجماعي"
        titleEn="Digital Agency Layer"
        subtitle="بنية تحتية للقيادة الجماعية — من الاكتشاف إلى onboarding كامل."
        align="center"
        size="md"
      />
      <div className="ld-container ld-grid-3">
        {ITEMS.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <article className="ld-card ld-card--dense">
              <div className="ld-icon-ring">
                <f.icon size={20} color="#c4b8ff" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--ld-text-muted)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <MagneticLink to="/agencies/discover">استكشف الوكالات</MagneticLink>
        </div>
      </Reveal>
    </SectionShell>
  )
}
